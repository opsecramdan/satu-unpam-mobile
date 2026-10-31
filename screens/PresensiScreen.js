import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  ScrollView,
  RefreshControl,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import * as SecureStore from 'expo-secure-store';

import { useTheme } from '../config/ThemeContext';

const COLORS = [
  '#0d47a1', '#1b5e20', '#e65100', '#6a1b9a', '#00695c',
  '#c62828', '#283593', '#4e342e', '#37474f', '#ad1457',
];

const UA = Platform.OS === 'android'
  ? 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'
  : 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.0.0 Mobile/15E148 Safari/604.1';

const EXTRACT_JS = `
(function(){
  try {
    var url = window.location.href;
    if (url.indexOf('login') !== -1 || url.indexOf('sso') !== -1) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'NOT_LOGGED_IN' }));
      return true;
    }
    var d = [];
    var rows = document.querySelectorAll('tr');
    for (var i = 0; i < rows.length; i++) {
      var c = rows[i].querySelectorAll('td');
      if (c.length >= 3) {
        var k = c[0].textContent.trim();
        var n = c[1].textContent.trim();
        var l = c[2].textContent.trim();
        // Kode matkul: 2 digit + huruf (misal 22SIF0273)
        if (k.length >= 6 && k.charAt(0) >= '0' && k.charAt(0) <= '9' && k.charAt(1) >= '0' && k.charAt(1) <= '9' && n.length > 3) {
          d.push({ kode: k, nama: n, kelas: l });
        }
      }
    }
    // Ambil info semester
    var semLabel = '';
    var semCode = '';
    var bodyText = document.body.innerText || '';
    var idx = bodyText.indexOf('Tahun Ajaran');
    if (idx !== -1) {
      var chunk = bodyText.substring(idx, idx + 40);
      var parts = chunk.split(/\\s+/);
      // "Tahun Ajaran GANJIL 2026/2027"
      if (parts.length >= 4) {
        semLabel = parts[2] + ' ' + parts[3];
        var year = parts[3] ? parts[3].split('/')[0] : '';
        var sem = parts[2] && parts[2].toUpperCase() === 'GANJIL' ? '1' : '2';
        if (year) semCode = year + sem;
      }
    }
    // Cari semCode dari link detail jika masih kosong
    if (!semCode) {
      var links = document.querySelectorAll('a');
      for (var j = 0; j < links.length; j++) {
        var href = links[j].getAttribute('href') || '';
        if (href.indexOf('pertemuan') !== -1) {
          var match = href.match(/(\\d{5})$/);
          if (match) { semCode = match[1]; break; }
        }
      }
    }
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ML', data: d, semLabel: semLabel, semCode: semCode }));
  } catch(e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ML', data: [], error: e.message }));
  }
  true;
})();
`;

const CACHE_KEY = 'presensi-cache';

export default function PresensiScreen({ navigation }) {
  const { isDark } = useTheme();
  const bg = isDark ? '#121212' : '#f0f2f5';
  const cardBg = isDark ? '#1e1e1e' : '#fff';
  const textColor = isDark ? '#e0e0e0' : '#1a1a2e';
  const subColor = isDark ? '#888' : '#999';
  const borderColor = isDark ? '#333' : '#f5f5f5';

  const webViewRef = useRef(null);
  const [matkuls, setMatkuls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(null);
  const [semesterLabel, setSemesterLabel] = useState('');
  const [semesterCode, setSemesterCode] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [usingCache, setUsingCache] = useState(false);
  const retryCount = useRef(0);

  // Load cached data on mount
  useEffect(() => {
    (async () => {
      try {
        const cached = await SecureStore.getItemAsync(CACHE_KEY);
        if (cached) {
          const data = JSON.parse(cached);
          if (data.matkuls && data.matkuls.length > 0) {
            setMatkuls(data.matkuls);
            if (data.semLabel) setSemesterLabel(data.semLabel);
            if (data.semCode) setSemesterCode(data.semCode);
            setLoggedIn(true);
            setUsingCache(true);
            setLoading(false); // Langsung tampilkan dari cache
          }
        }
      } catch {}
    })();
  }, []);

  // Save data to cache
  const saveToCache = useCallback(async (data, semLabel, semCode) => {
    try {
      await SecureStore.setItemAsync(CACHE_KEY, JSON.stringify({
        matkuls: data,
        semLabel,
        semCode,
        timestamp: Date.now(),
      }));
    } catch {}
  }, []);

  const onMsg = useCallback((e) => {
    try {
      const m = JSON.parse(e.nativeEvent.data);
      if (m.type === 'NOT_LOGGED_IN') {
        setLoggedIn(false);
        setLoading(false);
        setRefreshing(false);
      }
      if (m.type === 'ML') {
        if (m.data && m.data.length > 0) {
          setLoggedIn(true);
          setMatkuls(m.data);
          if (m.semLabel) setSemesterLabel(m.semLabel);
          if (m.semCode) setSemesterCode(m.semCode);
          setLoading(false);
          setRefreshing(false);
          setUsingCache(false);
          // Save to cache
          saveToCache(m.data, m.semLabel || '', m.semCode || '');
        } else if (retryCount.current < 3) {
          retryCount.current++;
          setTimeout(() => webViewRef.current?.injectJavaScript(EXTRACT_JS), 2000);
        } else {
          setLoading(false);
          setRefreshing(false);
        }
      }
    } catch {}
  }, [saveToCache]);

  const onLoad = useCallback(() => {
    setTimeout(() => webViewRef.current?.injectJavaScript(EXTRACT_JS), 3000);
    // Fallback: stop loading setelah 15 detik kalau masih loading
    setTimeout(() => {
      setLoading(prev => {
        if (prev) return false;
        return prev;
      });
    }, 15000);
  }, []);

  const openDetail = (mk) => {
    navigation.navigate('Service', {
      serviceKey: 'myunpam',
      title: mk.nama,
      overrideUrl: `https://my.unpam.ac.id/presensi/pertemuan/${mk.kode}/${mk.kelas}/${semesterCode}`,
    });
  };

  const refresh = () => {
    setRefreshing(true);
    setLoading(matkuls.length === 0); // Only show full loading if no cached data
    retryCount.current = 0;
    webViewRef.current?.reload();
  };

  const onPullRefresh = useCallback(() => {
    setRefreshing(true);
    retryCount.current = 0;
    webViewRef.current?.reload();
  }, []);

  const hiddenWebView = (
    <WebView ref={webViewRef} source={{ uri: 'https://my.unpam.ac.id/presensi' }}
      style={s.hidden} onLoadEnd={onLoad} onMessage={onMsg}
      sharedCookiesEnabled thirdPartyCookiesEnabled javaScriptEnabled domStorageEnabled
      originWhitelist={['*']} userAgent={UA} />
  );

  // Not logged in
  if (loggedIn === false) {
    return (
      <View style={[s.container, { backgroundColor: bg }]}>
        <View style={s.centerBox}>
          <Ionicons name="log-in-outline" size={48} color="#00838f" />
          <Text style={s.centerTitle}>Login Diperlukan</Text>
          <Text style={s.centerSub}>Login ke MyUNPAM terlebih dahulu untuk melihat data presensi</Text>
          <TouchableOpacity style={s.actionBtn}
            onPress={() => navigation.navigate('Service', { serviceKey: 'myunpam', title: 'MyUNPAM' })}>
            <Text style={s.actionBtnText}>Buka MyUNPAM</Text>
          </TouchableOpacity>
        </View>
        {hiddenWebView}
      </View>
    );
  }

  // Loading (no cached data)
  if (loading && matkuls.length === 0) {
    return (
      <View style={[s.container, { backgroundColor: bg }]}>
        <View style={s.centerBox}>
          <ActivityIndicator size="large" color="#00838f" />
          <Text style={[s.centerSub, { marginTop: 16 }]}>Memuat data presensi...</Text>
        </View>
        {hiddenWebView}
      </View>
    );
  }

  // Empty
  if (!matkuls.length) {
    return (
      <View style={[s.container, { backgroundColor: bg }]}>
        <View style={s.centerBox}>
          <Ionicons name="school-outline" size={48} color="#ccc" />
          <Text style={s.centerTitle}>Belum Ada Data</Text>
          <TouchableOpacity style={s.actionBtn} onPress={refresh}>
            <Text style={s.actionBtnText}>Refresh</Text>
          </TouchableOpacity>
        </View>
        {hiddenWebView}
      </View>
    );
  }

  // Matkul list
  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onPullRefresh}
            colors={['#00838f']}
            tintColor="#00838f"
          />
        }
      >
        <LinearGradient colors={isDark ? ['#004d40', '#00695c'] : ['#00838f', '#0097a7']} style={s.infoCard}>
          <Ionicons name="qr-code-outline" size={24} color="#fff" />
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text style={s.infoTitle}>Semester {semesterLabel || 'Aktif'}</Text>
            <Text style={s.infoSub}>
              {matkuls.length} mata kuliah • {usingCache ? 'Data cache' : 'Tap untuk lihat detail'}
            </Text>
          </View>
          <TouchableOpacity onPress={refresh}>
            <Ionicons name="refresh" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </LinearGradient>

        {usingCache && (
          <View style={[s.cacheBanner, { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }]}>
            <Ionicons name="time-outline" size={14} color={subColor} />
            <Text style={[s.cacheBannerText, { color: subColor }]}>Data tersimpan • Memperbarui di latar belakang...</Text>
          </View>
        )}

        {matkuls.map((mk, i) => {
          const color = COLORS[i % COLORS.length];
          return (
            <TouchableOpacity key={i} style={[s.card, { backgroundColor: cardBg }]} onPress={() => openDetail(mk)} activeOpacity={0.7}>
              <View style={[s.cardStripe, { backgroundColor: color }]} />
              <View style={s.cardContent}>
                <Text style={[s.cardNama, { color: textColor }]} numberOfLines={2}>{mk.nama}</Text>
                <Text style={[s.cardKode, { color: subColor }]}>{mk.kode} • Kelas {mk.kelas}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={isDark ? '#555' : '#ccc'} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {hiddenWebView}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  hidden: { height: 0, width: 0, opacity: 0, position: 'absolute' },
  scroll: { padding: 16, paddingBottom: 30 },
  // Center box (loading, empty, login)
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  centerTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginTop: 16 },
  centerSub: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 6, lineHeight: 20 },
  actionBtn: { backgroundColor: '#00838f', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10, marginTop: 20 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  // Info card
  infoCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, marginBottom: 8 },
  infoTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  infoSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  // Cache banner
  cacheBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    gap: 6,
  },
  cacheBannerText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  // Matkul card
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, marginBottom: 8, padding: 16,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 2,
  },
  cardStripe: { width: 4, height: 36, borderRadius: 2, marginRight: 14 },
  cardContent: { flex: 1 },
  cardNama: { fontSize: 14, fontWeight: '700', color: '#1a1a2e', lineHeight: 20 },
  cardKode: { fontSize: 12, color: '#999', marginTop: 3 },
});
