import React, { useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  BackHandler,
  Platform,
  Text,
  TouchableOpacity,
} from 'react-native';
import { WebView } from 'react-native-webview';

const SERVICES = {
  home: {
    url: 'https://satu.unpam.ac.id',
    title: 'SATU UNPAM',
    color: '#1a237e',
  },
  myunpam: {
    url: 'https://my.unpam.ac.id',
    title: 'MyUNPAM',
    color: '#0d47a1',
  },
  mentari: {
    url: 'https://mentari.unpam.ac.id',
    title: 'Mentari',
    color: '#1b5e20',
  },
  event: {
    url: 'https://event.unpam.ac.id',
    title: 'Event',
    color: '#e65100',
  },
  linksi: {
    url: 'https://link.si-unpam.my.id/auth/login',
    title: 'LINK-SI',
    color: '#6a1b9a',
  },
};

// Inject JS to help Cloudflare pass verification
// - Removes WebView-specific properties that Cloudflare checks
// - Makes the environment look like a real Chrome mobile browser
const CLOUDFLARE_BYPASS_JS = `
(function() {
  // 1. Override webdriver detection
  Object.defineProperty(navigator, 'webdriver', {
    get: () => false,
    configurable: true
  });

  // 1b. Clean User-Agent from WebView markers at JS level too
  // (belt-and-suspenders — UA header sudah di-set di native,
  //  ini untuk navigator.userAgent yang dicek via JS)
  var originalUA = navigator.userAgent;
  if (originalUA.includes('wv') || originalUA.includes('Version/4.0')) {
    var cleanUA = originalUA
      .replace(/\s*wv\s*/, ' ')
      .replace(/Version\/4\.0\s*/, '')
      .replace(/\s+/g, ' ')
      .trim();
    Object.defineProperty(navigator, 'userAgent', {
      get: () => cleanUA,
      configurable: true
    });
  }

  // 2. Fix plugins (real Chrome has plugins, WebView doesn't)
  Object.defineProperty(navigator, 'plugins', {
    get: () => [1, 2, 3, 4, 5],
    configurable: true
  });

  // 3. Fix languages
  Object.defineProperty(navigator, 'languages', {
    get: () => ['id-ID', 'id', 'en-US', 'en'],
    configurable: true
  });

  // 4. Fix platform for consistency
  if (!navigator.platform) {
    Object.defineProperty(navigator, 'platform', {
      get: () => 'Linux armv8l',
      configurable: true
    });
  }

  // 5. Chrome runtime stub (signals real Chrome)
  if (!window.chrome) {
    window.chrome = {
      runtime: {},
      loadTimes: function() {},
      csi: function() {},
      app: {}
    };
  }

  // 6. Remove automation indicators
  delete window.__webdriver_evaluate;
  delete window.__selenium_evaluate;
  delete window.__webdriver_script_function;
  delete window.__webdriver_script_func;
  delete window.__webdriver_script_fn;
  delete window.__fxdriver_evaluate;
  delete window.__driver_unwrapped;
  delete window.__webdriver_unwrapped;
  delete window.__driver_evaluate;
  delete window.__selenium_unwrapped;
  delete window.__fxdriver_unwrapped;

  // 7. Fix permissions API
  if (navigator.permissions) {
    const originalQuery = navigator.permissions.query;
    navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );
  }

  // 8. WebGL vendor/renderer (real device fingerprint)
  const getParameter = WebGLRenderingContext.prototype.getParameter;
  WebGLRenderingContext.prototype.getParameter = function(parameter) {
    if (parameter === 37445) return 'Google Inc. (Qualcomm)';
    if (parameter === 37446) return 'ANGLE (Qualcomm, Adreno (TM) 750, OpenGL ES 3.2)';
    return getParameter.apply(this, arguments);
  };

  true;
})();
`;

export function ServiceWebView({ serviceKey, isActive }) {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(SERVICES[serviceKey].url);

  const service = SERVICES[serviceKey];

  // Handle Android back button
  React.useEffect(() => {
    if (Platform.OS !== 'android' || !isActive) return;

    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });

    return () => handler.remove();
  }, [canGoBack, isActive]);

  const handleError = () => {
    setError(true);
    setLoading(false);
  };

  const handleRetry = () => {
    setError(false);
    setLoading(true);
    webViewRef.current?.reload();
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>📡</Text>
        <Text style={styles.errorTitle}>Tidak Dapat Terhubung</Text>
        <Text style={styles.errorMessage}>
          Periksa koneksi internet Anda dan coba lagi
        </Text>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: service.color }]} onPress={handleRetry}>
          <Text style={styles.retryText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={service.color} />
          <Text style={styles.loadingText}>Memuat {service.title}...</Text>
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ uri: service.url }}
        style={styles.webView}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => {
          setLoading(false);
        }}
        onError={handleError}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          if (nativeEvent.statusCode >= 500) {
            handleError();
          }
        }}
        onNavigationStateChange={(navState) => {
          setCanGoBack(navState.canGoBack);
          setCurrentUrl(navState.url);
        }}

        // === CLOUDFLARE + BROWSER DETECTION FIX ===
        // Inject anti-detection JS BEFORE page loads
        injectedJavaScriptBeforeContentLoaded={CLOUDFLARE_BYPASS_JS}

        // User-Agent: HARUS terlihat seperti Chrome biasa
        // WebView default UA mengandung "wv" dan "Version/4.0" yang
        // membuat situs UNPAM menolak karena "browser tidak support"
        // Solusi: set UA persis Chrome mobile (tanpa marker WebView)
        userAgent={
          Platform.OS === 'android'
            ? 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'
            : 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.0.0 Mobile/15E148 Safari/604.1'
        }

        // Allow ALL origins for Cloudflare redirects
        originWhitelist={['*']}

        // Cloudflare challenge butuh bisa buka popup/iframe
        javaScriptCanOpenWindowsAutomatically={true}
        setSupportMultipleWindows={false}

        // Shared cookies for SSO across unpam subdomains
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}

        // JavaScript & storage (wajib untuk Cloudflare)
        javaScriptEnabled={true}
        domStorageEnabled={true}

        // Cache
        cacheEnabled={true}
        cacheMode="LOAD_DEFAULT"

        // UX
        startInLoadingState={false}
        allowsBackForwardNavigationGestures={true}
        pullToRefreshEnabled={true}

        // Media
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}

        // Mixed content
        mixedContentMode="compatibility"

        // Android: use Chrome custom tabs engine
        androidLayerType="hardware"

        // Cloudflare needs these headers
        onShouldStartLoadWithRequest={(request) => {
          // Allow all unpam.ac.id domains and Cloudflare challenge URLs
          if (
            request.url.includes('unpam.ac.id') ||
            request.url.includes('cloudflare') ||
            request.url.includes('challenges.cloudflare.com') ||
            request.url.includes('cdn-cgi')
          ) {
            return true;
          }
          return true; // allow all for now
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f5f5f5',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export { SERVICES };
