import React, { useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  BackHandler,
  Platform,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { File as ExpoFile, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { SERVICES } from '../config/services';
import { SERVICE_INJECTIONS } from '../config/injections';

// Anti-detection JS — runs on EVERY page load (termasuk halaman cetak)
const BYPASS_JS = `
(function() {
  Object.defineProperty(navigator, 'webdriver', {
    get: () => false, configurable: true
  });
  var ua = navigator.userAgent;
  if (ua.includes('wv') || ua.includes('Version/4.0')) {
    Object.defineProperty(navigator, 'userAgent', {
      get: () => ua.replace(/\\s*wv\\s*/, ' ').replace(/Version\\/4\\.0\\s*/, '').replace(/\\s+/g, ' ').trim(),
      configurable: true
    });
  }
  Object.defineProperty(navigator, 'plugins', {
    get: () => [1,2,3,4,5], configurable: true
  });
  Object.defineProperty(navigator, 'languages', {
    get: () => ['id-ID','id','en-US','en'], configurable: true
  });
  if (!window.chrome) {
    window.chrome = { runtime: {}, loadTimes: function(){}, csi: function(){}, app: {} };
  }
  delete window.__webdriver_evaluate;
  delete window.__selenium_evaluate;
  delete window.__webdriver_script_function;
  var gp = WebGLRenderingContext.prototype.getParameter;
  WebGLRenderingContext.prototype.getParameter = function(p) {
    if (p === 37445) return 'Google Inc. (Qualcomm)';
    if (p === 37446) return 'ANGLE (Qualcomm, Adreno (TM) 750, OpenGL ES 3.2)';
    return gp.apply(this, arguments);
  };
  true;
})();
`;

// Download intercept — tangkap cetak/print/download klik DAN form submit
const DOWNLOAD_HELPER_JS = `
(function() {
  // 1. Intercept link/button clicks
  document.addEventListener('click', function(e) {
    var el = e.target.closest('a, button, input[type="submit"], input[type="button"]');
    if (!el) return;

    var href = '';
    if (el.tagName === 'A') {
      href = el.href || '';
    } else {
      // Button/input di dalam form → ambil form action
      var form = el.closest('form');
      if (form) href = form.action || window.location.href;
      // Atau parent <a>
      var parentA = el.closest('a');
      if (parentA) href = parentA.href || '';
    }

    var text = (el.textContent || el.value || '').toLowerCase().trim();
    var onclick = (el.getAttribute('onclick') || '').toLowerCase();

    // Deteksi cetak/download
    var isCetak = /cetak|print|unduh|download/i.test(text);
    var isCetakOnclick = /cetak|print|window\\.open/i.test(onclick);
    var isCetakUrl = href && /cetak|print|export/i.test(href);
    var isFileUrl = href && /\\\\.(pdf|xlsx?|docx?|csv|zip|rar)(\\\\?|$|#)/i.test(href);
    var hasDownloadAttr = el.hasAttribute && el.hasAttribute('download');

    if (isCetak || isCetakOnclick || isCetakUrl || isFileUrl || hasDownloadAttr) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      // Kalau ada form, submit via fetch untuk dapat blob
      var form = el.closest('form');
      if (form && !href.match(/\\\\.(pdf|xlsx?|docx?)/i)) {
        // Form-based cetak → submit via fetch
        var formData = new FormData(form);
        fetch(form.action || window.location.href, {
          method: form.method || 'POST',
          body: formData,
          credentials: 'same-origin'
        }).then(function(resp) { return resp.blob(); })
        .then(function(blob) {
          var reader = new FileReader();
          reader.onloadend = function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'BLOB_DOWNLOAD',
              data: reader.result,
              title: document.title || 'dokumen',
              mimeType: blob.type
            }));
          };
          reader.readAsDataURL(blob);
        }).catch(function() {
          // Fallback: kirim URL biasa
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'DIRECT_DOWNLOAD',
            url: form.action || window.location.href,
            cookies: document.cookie,
            title: document.title || 'dokumen'
          }));
        });
      } else if (href) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'DIRECT_DOWNLOAD',
          url: href,
          cookies: document.cookie,
          title: document.title || 'dokumen',
          filename: (el.getAttribute && el.getAttribute('download')) || ''
        }));
      }
      return false;
    }
  }, true);

  // 2. Intercept form submit dengan action cetak
  document.addEventListener('submit', function(e) {
    var form = e.target;
    if (!form || !form.action) return;
    if (/cetak|print|export/i.test(form.action)) {
      e.preventDefault();
      var formData = new FormData(form);
      fetch(form.action, {
        method: form.method || 'POST',
        body: formData,
        credentials: 'same-origin'
      }).then(function(resp) { return resp.blob(); })
      .then(function(blob) {
        var reader = new FileReader();
        reader.onloadend = function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'BLOB_DOWNLOAD',
            data: reader.result,
            title: document.title || 'dokumen',
            mimeType: blob.type
          }));
        };
        reader.readAsDataURL(blob);
      });
    }
  }, true);

  true;
})();
`;

// Quick menu items untuk MyUNPAM
const MYUNPAM_QUICK_MENU = [
  { label: 'KRS', icon: 'document-text-outline', color: '#0d47a1' },
  { label: 'KHS', icon: 'stats-chart-outline', color: '#1565c0' },
  { label: 'Jadwal', icon: 'time-outline', color: '#1976d2' },
  { label: 'Keuangan', icon: 'wallet-outline', color: '#1e88e5' },
  { label: 'Dokumen', icon: 'folder-outline', color: '#2196f3' },
  { label: 'Nilai', icon: 'ribbon-outline', color: '#42a5f5' },
];

function QuickMenuBar({ serviceKey, webViewRef }) {
  if (serviceKey !== 'myunpam') return null;

  const navigateTo = (label) => {
    const jsCode = `
      (function() {
        var links = document.querySelectorAll('a, .nav-link, .list-group-item, .menu-item');
        for (var i = 0; i < links.length; i++) {
          var text = links[i].textContent.trim().toLowerCase();
          if (text.includes('${label.toLowerCase()}')) {
            links[i].click();
            break;
          }
        }
        true;
      })();
    `;
    webViewRef.current?.injectJavaScript(jsCode);
  };

  return (
    <View style={qStyles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={qStyles.scroll}
      >
        {MYUNPAM_QUICK_MENU.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={qStyles.chip}
            onPress={() => navigateTo(item.label)}
            activeOpacity={0.7}
          >
            <Ionicons name={item.icon} size={16} color={item.color} />
            <Text style={[qStyles.chipText, { color: item.color }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const qStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#e8e8e8',
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2,
  },
  scroll: { paddingHorizontal: 12, paddingVertical: 10 },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, marginRight: 8, gap: 6,
  },
  chipText: { fontSize: 13, fontWeight: '600' },
});

// Download handler untuk file statis saja
async function handleFileDownload(url) {
  try {
    const urlPath = url.split('?')[0].split('/').pop();
    let filename = urlPath || 'dokumen';
    if (!/\.\w{2,5}$/.test(filename)) filename += '.pdf';

    const file = new ExpoFile(Paths.cache, filename);
    const downloaded = await ExpoFile.downloadFileAsync(url, file);

    if (downloaded.exists && await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(downloaded.uri, { dialogTitle: 'Simpan Dokumen' });
    } else {
      Linking.openURL(url);
    }
  } catch {
    Linking.openURL(url);
  }
}

// ============================================================
// Main Screen
// ============================================================
export default function ServiceScreen({ route, navigation }) {
  const { serviceKey } = route.params;
  const service = SERVICES[serviceKey];
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // CSS injection + download helper (ringan)
  const cssInjection = SERVICE_INJECTIONS[serviceKey] || '';
  const postLoadJS = cssInjection + '\n' + DOWNLOAD_HELPER_JS + `\n
    // Fallback: deteksi raw PDF text → re-fetch sebagai blob dalam WebView
    (function() {
      setTimeout(function() {
        var body = document.body;
        if (body && body.innerText && body.innerText.substring(0, 20).indexOf('%PDF') !== -1) {
          // Halaman ini menampilkan raw PDF
          // Re-fetch URL ini dalam context WebView (termasuk HttpOnly cookies)
          fetch(window.location.href, { credentials: 'same-origin' })
          .then(function(r) { return r.blob(); })
          .then(function(blob) {
            var reader = new FileReader();
            reader.onloadend = function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'BLOB_DOWNLOAD',
                data: reader.result,
                title: document.title || 'dokumen',
                mimeType: blob.type || 'application/pdf'
              }));
              // Navigasi back setelah download
              setTimeout(function() { window.history.back(); }, 300);
            };
            reader.readAsDataURL(blob);
          });
        }
      }, 500);
      true;
    })();
  `;




  // Handle messages dari WebView
  const onMessage = useCallback(async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'DIRECT_DOWNLOAD' && data.url) {
        setDownloading(true);
        try {
          const timestamp = Date.now();
          const cleanTitle = (data.title || data.filename || 'dokumen')
            .replace(/[^a-zA-Z0-9_\-\s]/g, '')
            .trim()
            .replace(/\s+/g, '_')
            .substring(0, 40) || 'dokumen';

          // Tentukan ekstensi dari URL
          let ext = '.pdf';
          const urlLower = data.url.toLowerCase();
          if (/\.xlsx/.test(urlLower)) ext = '.xlsx';
          else if (/\.xls/.test(urlLower)) ext = '.xls';
          else if (/\.docx/.test(urlLower)) ext = '.docx';
          else if (/\.doc/.test(urlLower)) ext = '.doc';
          else if (/\.csv/.test(urlLower)) ext = '.csv';
          else if (/\.zip/.test(urlLower)) ext = '.zip';

          const filename = `${cleanTitle}_${timestamp}${ext}`;
          const file = new ExpoFile(Paths.cache, filename);
          const downloaded = await ExpoFile.downloadFileAsync(data.url, file);

          if (downloaded.exists && await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(downloaded.uri, {
              mimeType: ext === '.pdf' ? 'application/pdf' : 'application/octet-stream',
              dialogTitle: 'Simpan Dokumen',
            });
          } else {
            // Fallback: buka di browser
            Linking.openURL(data.url);
          }
        } catch (err) {
          console.log('Download error:', err);
          Linking.openURL(data.url);
        }
        setDownloading(false);
      }

      if (data.type === 'FILE_DOWNLOAD' && data.url) {
        handleFileDownload(data.url);
      }

      // Handle blob download (dari form fetch atau URL fetch)
      if (data.type === 'BLOB_DOWNLOAD' && data.data) {
        setDownloading(true);
        pendingDownloadRef.current = false;
        try {
          const timestamp = Date.now();
          const ext = data.mimeType === 'application/pdf' ? '.pdf'
            : data.mimeType?.includes('spreadsheet') ? '.xlsx'
            : data.mimeType?.includes('word') ? '.docx' : '.pdf';
          const filename = `dokumen_${timestamp}${ext}`;

          // data is base64 data URL: "data:application/pdf;base64,..."
          const base64Data = data.data.split(',')[1];
          if (base64Data) {
            // Decode base64 ke Uint8Array
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }

            const file = new ExpoFile(Paths.cache, filename);
            file.create();
            file.write(bytes);

            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(file.uri, {
                mimeType: data.mimeType || 'application/pdf',
                dialogTitle: 'Simpan Dokumen',
              });
            }
          }
        } catch (err) {
          console.log('Blob download error:', err);
        }
        setDownloading(false);
      }

      // Handle download gagal → fallback buka browser
      if (data.type === 'DOWNLOAD_FAILED' && data.url) {
        pendingDownloadRef.current = false;
        setDownloading(false);
        Linking.openURL(data.url);
      }
    } catch {}
  }, [service]);

  // Android back button
  React.useEffect(() => {
    if (Platform.OS !== 'android') return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      navigation.goBack();
      return true;
    });
    return () => handler.remove();
  }, [canGoBack, navigation]);

  // Handle URL navigation — tangkap cetak URL SEBELUM navigasi
  const pendingDownloadRef = useRef(false);
  const onShouldStartLoad = useCallback((request) => {
    const url = request.url || '';

    // Jangan intercept jika sedang download
    if (pendingDownloadRef.current) return true;

    // Deteksi URL cetak/print/export atau file langsung
    const isCetakUrl = /cetak|print|export/i.test(url);
    const isFileUrl = /\.(pdf|xlsx?|docx?|csv|zip|rar)(\?|$|#)/i.test(url);

    // Jangan intercept URL login, auth, atau halaman biasa
    const isExcluded = /login|auth|sso|oauth/i.test(url);

    if ((isCetakUrl || isFileUrl) && !isExcluded) {
      // BLOCK navigasi — fetch blob dari WebView context
      pendingDownloadRef.current = true;
      setDownloading(true);

      // Inject fetch ke halaman SAAT INI (yang masih punya cookies)
      const fetchJS = `
        (function() {
          fetch('${url.replace(/'/g, "\\'")}', {
            credentials: 'same-origin',
            headers: { 'Accept': 'application/pdf,*/*' }
          })
          .then(function(r) { return r.blob(); })
          .then(function(blob) {
            var reader = new FileReader();
            reader.onloadend = function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'BLOB_DOWNLOAD',
                data: reader.result,
                title: document.title || 'dokumen',
                mimeType: blob.type || 'application/pdf'
              }));
            };
            reader.readAsDataURL(blob);
          })
          .catch(function(err) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'DOWNLOAD_FAILED',
              url: '${url.replace(/'/g, "\\'")}'
            }));
          });
          true;
        })();
      `;
      webViewRef.current?.injectJavaScript(fetchJS);
      return false; // BLOCK navigasi ke PDF
    }

    return true;
  }, []);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>📡</Text>
        <Text style={styles.errorTitle}>Tidak Dapat Terhubung</Text>
        <Text style={styles.errorMessage}>Periksa koneksi internet Anda</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: service.color }]}
          onPress={() => { setError(false); setLoading(true); webViewRef.current?.reload(); }}
        >
          <Text style={styles.retryText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <QuickMenuBar serviceKey={serviceKey} webViewRef={webViewRef} />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={service.color} />
          <Text style={styles.loadingText}>Memuat {service.title}...</Text>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ uri: route.params?.overrideUrl || service.url }}
        style={styles.webView}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => {
          setLoading(false);
          // Setelah halaman load, cek apakah ini raw PDF
          // WebView render raw PDF sebagai <pre>%PDF...</pre>
          // Inject JS via ref (bukan prop) — ini PASTI jalan
          setTimeout(() => {
            webViewRef.current?.injectJavaScript(`
              (function() {
                var pre = document.querySelector('pre');
                var body = document.body;
                var text = (pre ? pre.textContent : (body ? body.innerText : '')).substring(0, 10);
                if (text.indexOf('%PDF') !== -1) {
                  // Ini raw PDF! Re-fetch sebagai blob
                  fetch(window.location.href, { credentials: 'same-origin' })
                  .then(function(r) { return r.blob(); })
                  .then(function(blob) {
                    var reader = new FileReader();
                    reader.onloadend = function() {
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'BLOB_DOWNLOAD',
                        data: reader.result,
                        title: 'dokumen',
                        mimeType: blob.type || 'application/pdf'
                      }));
                      // Kembali ke halaman sebelumnya
                      setTimeout(function() { window.history.back(); }, 200);
                    };
                    reader.readAsDataURL(blob);
                  });
                }
                true;
              })();
            `);
          }, 300);
        }}
        onError={() => { setError(true); setLoading(false); }}
        onNavigationStateChange={(navState) => {
          setCanGoBack(navState.canGoBack);
        }}
        onMessage={onMessage}
        // BYPASS_JS → runs on EVERY page (termasuk cetak)
        injectedJavaScriptBeforeContentLoaded={BYPASS_JS}
        // CSS + minimal download helper
        injectedJavaScript={postLoadJS}
        // Hanya block file non-web, biarkan cetak/print lewat
        onShouldStartLoadWithRequest={onShouldStartLoad}
        // User-Agent Chrome — applies to ALL navigations
        userAgent={
          Platform.OS === 'android'
            ? 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'
            : 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.0.0 Mobile/15E148 Safari/604.1'
        }
        originWhitelist={['*']}
        javaScriptCanOpenWindowsAutomatically={true}
        setSupportMultipleWindows={false}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        cacheEnabled={true}
        allowsBackForwardNavigationGestures={true}
        pullToRefreshEnabled={true}
        mixedContentMode="compatibility"
        androidLayerType="hardware"
        allowFileAccess={true}
      />

      {/* Download indicator */}
      {downloading && (
        <View style={styles.pdfBar}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.pdfBarText}>Mengunduh dokumen...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  webView: { flex: 1 },
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)', zIndex: 10,
  },
  loadingText: { marginTop: 12, fontSize: 14, color: '#666' },
  errorContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: 32, backgroundColor: '#f5f5f5',
  },
  errorIcon: { fontSize: 64, marginBottom: 16 },
  errorTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  errorMessage: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 },
  retryButton: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8 },
  retryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  pdfBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d47a1',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  pdfBarText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  pdfDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  pdfDownloadText: {
    color: '#0d47a1',
    fontSize: 13,
    fontWeight: '700',
  },
});
