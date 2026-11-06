import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../config/ThemeContext';

const { width } = Dimensions.get('window');

const UA = Platform.OS === 'android'
  ? 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'
  : 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.0.0 Mobile/15E148 Safari/604.1';

const CACHE_KEY = 'myunpam-cache';

// Menu items for MyUNPAM sub-features
const MENU_ITEMS = [
  { key: 'krs', icon: 'document-text', label: 'KRS', color: '#0d47a1', path: '/data-akademik/krs' },
  { key: 'khs', icon: 'stats-chart', label: 'KHS', color: '#1b5e20', path: '/data-akademik/khs' },
  { key: 'jadwal', icon: 'calendar', label: 'Jadwal', color: '#e65100', path: '/jadwal-kuliah' },
  { key: 'presensi', icon: 'qr-code', label: 'Presensi', color: '#00838f', path: '/presensi' },
  { key: 'pembayaran', icon: 'card', label: 'Pembayaran', color: '#6a1b9a', path: '/pembayaran' },
  { key: 'transkrip', icon: 'ribbon', label: 'Transkrip', color: '#c62828', path: '/data-akademik/transkrip' },
];

// JS to extract profile data from MyUNPAM dashboard
const EXTRACT_PROFILE_JS = `
(function(){
  try {
    var url = window.location.href;
    if (url.indexOf('login') !== -1 || url.indexOf('sso') !== -1 || url.indexOf('domain-confirm') !== -1) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'NOT_LOGGED_IN' }));
      return true;
    }
    var data = {};
    // Try to get profile info from page
    var allText = document.body.innerText || '';
    
    // Extract NIM
    var nimMatch = allText.match(/NIM[\\s:]*([0-9]{10,})/i);
    if (nimMatch) data.nim = nimMatch[1];
    
    // Extract name - try various patterns
    var nameEl = document.querySelector('h5, h4, .name, .user-name, [class*="name"]');
    if (nameEl) data.nama = nameEl.textContent.trim();
    
    // Try meta or specific selectors
    var headerText = document.querySelector('.header-text, .profile-name, .user-info');
    if (headerText) data.nama = headerText.textContent.trim();
    
    // Extract program studi
    var prodiMatch = allText.match(/Program Studi[\\s:]*([^\\n]+)/i);
    if (prodiMatch) data.prodi = prodiMatch[1].trim();
    
    // Extract semester
    var semMatch = allText.match(/Semester[\\s:]*([0-9]+)/i);
    if (semMatch) data.semester = semMatch[1];
    
    // Extract IPK
    var ipkMatch = allText.match(/IPK[\\s:]*([0-9]+[.,][0-9]+)/i);
    if (ipkMatch) data.ipk = ipkMatch[1].replace(',', '.');
    
    // Extract SKS
    var sksMatch = allText.match(/SKS[\\s:]+Lulus[\\s:]*([0-9]+)/i) || allText.match(/Total SKS[\\s:]*([0-9]+)/i);
    if (sksMatch) data.sksLulus = sksMatch[1];

    // Extract all visible info cards/stats
    var stats = [];
    var cards = document.querySelectorAll('.card, .stat, .info-box, [class*="card"], [class*="stat"]');
    cards.forEach(function(c) {
      var text = c.innerText.trim();
      if (text.length > 2 && text.length < 200) stats.push(text);
    });
    data.stats = stats.slice(0, 20);
    
    // Get page HTML structure for analysis
    data.bodyPreview = document.body.innerHTML.substring(0, 3000);
    data.bodyText = allText.substring(0, 2000);
    
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PROFILE', data: data }));
  } catch(e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PROFILE', data: {}, error: e.message }));
  }
  true;
})();
`;

// JS to extract KRS data
const EXTRACT_KRS_JS = `
(function(){
  try {
    var url = window.location.href;
    if (url.indexOf('login') !== -1 || url.indexOf('sso') !== -1) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'NOT_LOGGED_IN' }));
      return true;
    }
    var courses = [];
    var rows = document.querySelectorAll('tr');
    for (var i = 0; i < rows.length; i++) {
      var cells = rows[i].querySelectorAll('td');
      if (cells.length >= 3) {
        var kode = cells[0].textContent.trim();
        // Check if it looks like a course code
        if (kode.length >= 6 && kode.charAt(0) >= '0' && kode.charAt(0) <= '9') {
          var course = { kode: kode };
          if (cells[1]) course.nama = cells[1].textContent.trim();
          if (cells[2]) course.sks = cells[2].textContent.trim();
          if (cells[3]) course.kelas = cells[3].textContent.trim();
          if (cells[4]) course.jadwal = cells[4].textContent.trim();
          if (cells[5]) course.dosen = cells[5].textContent.trim();
          courses.push(course);
        }
      }
    }
    // Also capture page text for semester info
    var bodyText = document.body.innerText || '';
    var semMatch = bodyText.match(/Tahun Ajaran[\\s:]*(\\S+\\s+\\S+)/i) || bodyText.match(/Semester[\\s:]*(\\S+\\s+\\S+)/i);
    var semester = semMatch ? semMatch[1] : '';
    
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'KRS', data: courses, semester: semester, bodyText: bodyText.substring(0, 1000) }));
  } catch(e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'KRS', data: [], error: e.message }));
  }
  true;
})();
`;

export default function MyUnpamScreen({ navigation }) {
  const { isDark } = useTheme();
  const bg = isDark ? '#121212' : '#f0f2f5';
  const cardBg = isDark ? '#1e1e1e' : '#fff';
  const textColor = isDark ? '#e0e0e0' : '#1a1a2e';
  const subColor = isDark ? '#aaa' : '#666';

  const webViewRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [krsList, setKrsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard'); // dashboard, krs
  const [semester, setSemester] = useState('');
  const retryCount = useRef(0);

  // Load cache
  useEffect(() => {
    (async () => {
      try {
        const cached = await SecureStore.getItemAsync(CACHE_KEY);
        if (cached) {
          const data = JSON.parse(cached);
          if (data.profile) setProfile(data.profile);
          if (data.krs) setKrsList(data.krs);
          if (data.semester) setSemester(data.semester);
          setLoggedIn(true);
          setLoading(false);
        }
      } catch {}
    })();
  }, []);

  const saveCache = useCallback(async (p, krs, sem) => {
    try {
      await SecureStore.setItemAsync(CACHE_KEY, JSON.stringify({
        profile: p || profile, krs: krs || krsList, semester: sem || semester, ts: Date.now(),
      }));
    } catch {}
  }, [profile, krsList, semester]);

  const onMsg = useCallback((e) => {
    try {
      const m = JSON.parse(e.nativeEvent.data);
      if (m.type === 'NOT_LOGGED_IN') {
        setLoggedIn(false);
        setLoading(false);
        setRefreshing(false);
      }
      if (m.type === 'PROFILE') {
        setLoggedIn(true);
        if (m.data) {
          setProfile(m.data);
          setLoading(false);
          setRefreshing(false);
          // Now load KRS
          setTimeout(() => {
            webViewRef.current?.injectJavaScript(`window.location.href = '/data-akademik/krs'; true;`);
          }, 1000);
        }
      }
      if (m.type === 'KRS') {
        if (m.data && m.data.length > 0) {
          setKrsList(m.data);
          if (m.semester) setSemester(m.semester);
          saveCache(profile, m.data, m.semester);
        } else if (retryCount.current < 3) {
          retryCount.current++;
          setTimeout(() => webViewRef.current?.injectJavaScript(EXTRACT_KRS_JS), 2000);
        }
        setLoading(false);
        setRefreshing(false);
      }
    } catch {}
  }, [profile, saveCache]);

  const onLoad = useCallback(() => {
    const url = webViewRef.current?._url || '';
    if (url.includes('/krs') || url.includes('/data-akademik')) {
      setTimeout(() => webViewRef.current?.injectJavaScript(EXTRACT_KRS_JS), 3000);
    } else {
      setTimeout(() => webViewRef.current?.injectJavaScript(EXTRACT_PROFILE_JS), 3000);
    }
    setTimeout(() => setLoading(prev => prev ? false : prev), 15000);
  }, []);

  const refresh = () => {
    setRefreshing(true);
    retryCount.current = 0;
    webViewRef.current?.injectJavaScript(`window.location.href = '/'; true;`);
    setTimeout(() => webViewRef.current?.injectJavaScript(EXTRACT_PROFILE_JS), 4000);
  };

  const openSubPage = (item) => {
    if (item.key === 'presensi') {
      navigation.navigate('Presensi');
      return;
    }
    navigation.navigate('Service', {
      serviceKey: 'myunpam',
      title: item.label,
      overrideUrl: `https://my.unpam.ac.id${item.path}`,
    });
  };

  const hiddenWebView = (
    <WebView ref={webViewRef} source={{ uri: 'https://my.unpam.ac.id' }}
      style={s.hidden} onLoadEnd={onLoad} onMessage={onMsg}
      sharedCookiesEnabled thirdPartyCookiesEnabled javaScriptEnabled domStorageEnabled
      originWhitelist={['*']} userAgent={UA} />
  );

  // Not logged in
  if (loggedIn === false) {
    return (
      <View style={[s.container, { backgroundColor: bg }]}>
        <View style={s.centerBox}>
          <Ionicons name="log-in-outline" size={48} color="#0d47a1" />
          <Text style={[s.centerTitle, { color: textColor }]}>Login Diperlukan</Text>
          <Text style={[s.centerSub, { color: subColor }]}>Login ke MyUNPAM untuk melihat data akademik</Text>
          <TouchableOpacity style={s.actionBtn}
            onPress={() => navigation.navigate('Service', { serviceKey: 'myunpam', title: 'MyUNPAM' })}>
            <Text style={s.actionBtnText}>Login MyUNPAM</Text>
          </TouchableOpacity>
        </View>
        {hiddenWebView}
      </View>
    );
  }

  // Loading
  if (loading && !profile) {
    return (
      <View style={[s.container, { backgroundColor: bg }]}>
        <View style={s.centerBox}>
          <ActivityIndicator size="large" color="#0d47a1" />
          <Text style={[s.centerSub, { color: subColor, marginTop: 16 }]}>Memuat data akademik...</Text>
        </View>
        {hiddenWebView}
      </View>
    );
  }

  const totalSKS = krsList.reduce((sum, c) => sum + (parseInt(c.sks) || 0), 0);

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={['#0d47a1']} tintColor="#0d47a1" />}>

        {/* Profile Header */}
        <LinearGradient colors={isDark ? ['#0d2137', '#0d47a1'] : ['#0d47a1', '#1565c0', '#1976d2']} style={s.profileHeader}>
          <View style={s.avatarCircle}>
            <Ionicons name="person" size={32} color="#0d47a1" />
          </View>
          <Text style={s.profileName}>{profile?.nama || 'Mahasiswa UNPAM'}</Text>
          <Text style={s.profileNim}>NIM: {profile?.nim || '-'}</Text>
          {profile?.prodi && <Text style={s.profileProdi}>{profile.prodi}</Text>}

          {/* Stats row */}
          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Text style={s.statValue}>{profile?.semester || '-'}</Text>
              <Text style={s.statLabel}>Semester</Text>
            </View>
            <View style={[s.statDivider]} />
            <View style={s.statBox}>
              <Text style={s.statValue}>{profile?.ipk || '-'}</Text>
              <Text style={s.statLabel}>IPK</Text>
            </View>
            <View style={[s.statDivider]} />
            <View style={s.statBox}>
              <Text style={s.statValue}>{profile?.sksLulus || totalSKS || '-'}</Text>
              <Text style={s.statLabel}>SKS</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Menu */}
        <Text style={[s.sectionTitle, { color: textColor }]}>Menu Akademik</Text>
        <View style={s.menuGrid}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity key={item.key} style={[s.menuCard, { backgroundColor: cardBg }]}
              onPress={() => openSubPage(item)} activeOpacity={0.7}>
              <View style={[s.menuIcon, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>
              <Text style={[s.menuLabel, { color: textColor }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* KRS Section */}
        {krsList.length > 0 && (
          <>
            <View style={s.sectionHeader}>
              <Text style={[s.sectionTitle, { color: textColor }]}>KRS Semester Ini</Text>
              <View style={s.sksBadge}>
                <Text style={s.sksBadgeText}>{totalSKS} SKS</Text>
              </View>
            </View>
            {semester ? <Text style={[s.semesterText, { color: subColor }]}>{semester}</Text> : null}

            {krsList.map((course, i) => (
              <TouchableOpacity key={i} style={[s.krsCard, { backgroundColor: cardBg }]}
                onPress={() => openSubPage({ key: 'krs', path: '/data-akademik/krs', label: 'KRS' })} activeOpacity={0.7}>
                <View style={[s.krsStripe, { backgroundColor: MENU_ITEMS[i % MENU_ITEMS.length].color }]} />
                <View style={s.krsContent}>
                  <Text style={[s.krsNama, { color: textColor }]} numberOfLines={2}>{course.nama}</Text>
                  <View style={s.krsInfo}>
                    <View style={s.krsChip}>
                      <Text style={s.krsChipText}>{course.sks} SKS</Text>
                    </View>
                    <Text style={[s.krsKode, { color: subColor }]}>{course.kode}</Text>
                    {course.kelas && <Text style={[s.krsKode, { color: subColor }]}>• {course.kelas}</Text>}
                  </View>
                  {course.dosen && <Text style={[s.krsDosen, { color: subColor }]} numberOfLines={1}>👨‍🏫 {course.dosen}</Text>}
                  {course.jadwal && <Text style={[s.krsJadwal, { color: subColor }]} numberOfLines={1}>🕐 {course.jadwal}</Text>}
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

      </ScrollView>
      {hiddenWebView}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  hidden: { height: 0, width: 0, opacity: 0, position: 'absolute' },
  scroll: { paddingBottom: 30 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  centerTitle: { fontSize: 18, fontWeight: '700', marginTop: 16 },
  centerSub: { fontSize: 14, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  actionBtn: { backgroundColor: '#0d47a1', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10, marginTop: 20 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  // Profile header
  profileHeader: { padding: 24, paddingTop: 16, alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  avatarCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  profileName: { fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center' },
  profileNim: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  profileProdi: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20 },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },
  // Menu grid
  sectionTitle: { fontSize: 17, fontWeight: '800', marginTop: 20, marginBottom: 12, paddingHorizontal: 16 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  menuCard: {
    width: (width - 48) / 3, alignItems: 'center', paddingVertical: 16, borderRadius: 14,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2,
  },
  menuIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  menuLabel: { fontSize: 12, fontWeight: '600' },
  // KRS
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 16, marginTop: 20 },
  sksBadge: { backgroundColor: '#0d47a1', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  sksBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  semesterText: { fontSize: 13, paddingHorizontal: 16, marginBottom: 8 },
  krsCard: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 14,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2,
  },
  krsStripe: { width: 4, borderRadius: 2, marginRight: 12 },
  krsContent: { flex: 1 },
  krsNama: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
  krsInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 },
  krsChip: { backgroundColor: '#e3f2fd', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  krsChipText: { fontSize: 11, fontWeight: '700', color: '#0d47a1' },
  krsKode: { fontSize: 12 },
  krsDosen: { fontSize: 12, marginTop: 4 },
  krsJadwal: { fontSize: 12, marginTop: 2 },
});
