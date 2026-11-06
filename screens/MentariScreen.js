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

const CACHE_KEY = 'mentari-cache';

const COLORS = [
  '#1b5e20', '#0d47a1', '#e65100', '#6a1b9a', '#00695c',
  '#c62828', '#283593', '#4e342e',
];

// Extract course list from Mentari dashboard
const EXTRACT_COURSES_JS = `
(function(){
  try {
    var url = window.location.href;
    if (url.indexOf('login') !== -1 || url.indexOf('sso') !== -1 || url.indexOf('domain-confirm') !== -1) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'NOT_LOGGED_IN' }));
      return true;
    }

    // Try API approach first
    var token = '';
    try {
      var accessData = localStorage.getItem('access');
      if (accessData) {
        var parsed = JSON.parse(accessData);
        if (Array.isArray(parsed) && parsed[0] && parsed[0].token) {
          token = parsed[0].token;
        }
      }
    } catch(e) {}

    if (token) {
      fetch('/api/user-course?page=1&limit=50', {
        headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' }
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var courses = [];
        if (data && data.data) {
          var items = Array.isArray(data.data) ? data.data : (data.data.data || []);
          items.forEach(function(c) {
            courses.push({
              kode: c.kode_course || c.kode || '',
              nama: c.coursename || c.nama || c.name || '',
              dosen: c.dosen || c.lecturer || '',
              progress: c.progress || 0,
              totalSections: c.total_section || c.totalSections || 0,
              completedSections: c.completed_section || c.completedSections || 0,
            });
          });
        }
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'COURSES', data: courses, source: 'api' }));
      })
      .catch(function(e) {
        // Fallback to DOM scraping
        scrapeCourses();
      });
    } else {
      scrapeCourses();
    }

    function scrapeCourses() {
      var courses = [];
      // Try cards/links that look like courses
      var links = document.querySelectorAll('a[href*="u-courses"]');
      links.forEach(function(a) {
        var href = a.getAttribute('href') || '';
        var kode = href.split('/').pop() || '';
        var text = a.innerText.trim();
        if (kode && text) {
          courses.push({ kode: kode, nama: text.split('\\n')[0].trim(), dosen: '', progress: 0 });
        }
      });
      // Deduplicate
      var seen = {};
      courses = courses.filter(function(c) {
        if (seen[c.kode]) return false;
        seen[c.kode] = true;
        return true;
      });
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'COURSES', data: courses, source: 'dom' }));
    }
  } catch(e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'COURSES', data: [], error: e.message }));
  }
  true;
})();
`;

// Extract course detail (sections/pertemuan)
const EXTRACT_DETAIL_JS = `
(function(){
  try {
    var token = '';
    try {
      var accessData = localStorage.getItem('access');
      if (accessData) {
        var parsed = JSON.parse(accessData);
        if (Array.isArray(parsed) && parsed[0]) token = parsed[0].token;
      }
    } catch(e) {}

    var kode = window._currentCourseKode || '';
    if (!kode || !token) {
      // Fallback: scrape from page
      var sections = [];
      var accordions = document.querySelectorAll('[class*="accordion"], [class*="section"], [class*="pertemuan"]');
      accordions.forEach(function(acc, i) {
        var title = acc.querySelector('h3, h4, h5, [class*="title"]');
        var items = acc.querySelectorAll('[class*="sub"], [class*="item"], li');
        var subItems = [];
        items.forEach(function(item) {
          var name = item.innerText.trim().split('\\n')[0];
          var done = item.querySelector('[class*="check"], [class*="done"], .completed') !== null;
          if (name) subItems.push({ nama: name, completed: done });
        });
        sections.push({
          nama: title ? title.innerText.trim() : 'Pertemuan ' + (i+1),
          items: subItems,
        });
      });
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'DETAIL', sections: sections, source: 'dom' }));
      return true;
    }

    fetch('/api/user-course/' + kode, {
      headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' }
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var sections = [];
      var courseData = data.data || data;
      var secs = courseData.sections || courseData.data?.sections || [];
      secs.forEach(function(sec) {
        var items = [];
        (sec.sub_section || sec.sub_sections || []).forEach(function(sub) {
          items.push({
            id: sub.id || '',
            nama: sub.judul || sub.title || '',
            type: sub.kode_template || sub.type || '',
            completed: sub.completion === true || sub.completion === 1,
            hasWarning: !!sub.warningAlert,
          });
        });
        sections.push({
          nama: sec.nama_section || sec.name || '',
          kode: sec.kode_section || '',
          items: items,
        });
      });
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'DETAIL', sections: sections, source: 'api' }));
    })
    .catch(function(e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'DETAIL', sections: [], error: e.message }));
    });
  } catch(e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'DETAIL', sections: [], error: e.message }));
  }
  true;
})();
`;

const TEMPLATE_ICONS = {
  PRE_TEST: { icon: 'help-circle', color: '#e65100', label: 'Pre-Test' },
  POST_TEST: { icon: 'checkmark-circle', color: '#1b5e20', label: 'Post-Test' },
  FORUM_DISKUSI: { icon: 'chatbubbles', color: '#0d47a1', label: 'Forum' },
  KUESIONER: { icon: 'clipboard', color: '#6a1b9a', label: 'Kuesioner' },
  VIDEO_AJAR: { icon: 'videocam', color: '#c62828', label: 'Video' },
  POWER_POINT: { icon: 'easel', color: '#e65100', label: 'PPT' },
  BUKU_ISBN: { icon: 'book', color: '#4e342e', label: 'Buku' },
  ARTIKEL_RISET: { icon: 'document-text', color: '#283593', label: 'Artikel' },
  TUGAS: { icon: 'create', color: '#00695c', label: 'Tugas' },
};

export default function MentariScreen({ navigation }) {
  const { isDark } = useTheme();
  const bg = isDark ? '#121212' : '#f0f2f5';
  const cardBg = isDark ? '#1e1e1e' : '#fff';
  const textColor = isDark ? '#e0e0e0' : '#1a1a2e';
  const subColor = isDark ? '#aaa' : '#666';

  const webViewRef = useRef(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const retryCount = useRef(0);

  // Load cache
  useEffect(() => {
    (async () => {
      try {
        const cached = await SecureStore.getItemAsync(CACHE_KEY);
        if (cached) {
          const data = JSON.parse(cached);
          if (data.courses) { setCourses(data.courses); setLoggedIn(true); setLoading(false); }
        }
      } catch {}
    })();
  }, []);

  const onMsg = useCallback((e) => {
    try {
      const m = JSON.parse(e.nativeEvent.data);
      if (m.type === 'NOT_LOGGED_IN') {
        setLoggedIn(false);
        setLoading(false);
        setRefreshing(false);
      }
      if (m.type === 'COURSES') {
        setLoggedIn(true);
        if (m.data && m.data.length > 0) {
          setCourses(m.data);
          SecureStore.setItemAsync(CACHE_KEY, JSON.stringify({ courses: m.data, ts: Date.now() })).catch(() => {});
        } else if (retryCount.current < 3) {
          retryCount.current++;
          setTimeout(() => webViewRef.current?.injectJavaScript(EXTRACT_COURSES_JS), 2000);
          return;
        }
        setLoading(false);
        setRefreshing(false);
      }
      if (m.type === 'DETAIL') {
        setSections(m.sections || []);
        setLoadingDetail(false);
      }
    } catch {}
  }, []);

  const onLoad = useCallback(() => {
    setTimeout(() => webViewRef.current?.injectJavaScript(EXTRACT_COURSES_JS), 3000);
    setTimeout(() => setLoading(prev => prev ? false : prev), 15000);
  }, []);

  const refresh = () => {
    setRefreshing(true);
    retryCount.current = 0;
    webViewRef.current?.reload();
  };

  const openCourse = (course) => {
    setSelectedCourse(course);
    setLoadingDetail(true);
    setSections([]);
    webViewRef.current?.injectJavaScript(`
      window._currentCourseKode = '${course.kode}';
      ${EXTRACT_DETAIL_JS}
    `);
  };

  const openInWebView = (course) => {
    navigation.navigate('Service', {
      serviceKey: 'mentari',
      title: course.nama,
      overrideUrl: `https://mentari.unpam.ac.id/u-courses/${course.kode}`,
    });
  };

  const hiddenWebView = (
    <WebView ref={webViewRef} source={{ uri: 'https://mentari.unpam.ac.id/u-dashboard' }}
      style={s.hidden} onLoadEnd={onLoad} onMessage={onMsg}
      sharedCookiesEnabled thirdPartyCookiesEnabled javaScriptEnabled domStorageEnabled
      originWhitelist={['*']} userAgent={UA} />
  );

  // Not logged in
  if (loggedIn === false) {
    return (
      <View style={[s.container, { backgroundColor: bg }]}>
        <View style={s.centerBox}>
          <Ionicons name="log-in-outline" size={48} color="#1b5e20" />
          <Text style={[s.centerTitle, { color: textColor }]}>Login Diperlukan</Text>
          <Text style={[s.centerSub, { color: subColor }]}>Login ke Mentari untuk melihat mata kuliah</Text>
          <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#1b5e20' }]}
            onPress={() => navigation.navigate('Service', { serviceKey: 'mentari', title: 'Mentari' })}>
            <Text style={s.actionBtnText}>Login Mentari</Text>
          </TouchableOpacity>
        </View>
        {hiddenWebView}
      </View>
    );
  }

  // Loading
  if (loading && courses.length === 0) {
    return (
      <View style={[s.container, { backgroundColor: bg }]}>
        <View style={s.centerBox}>
          <ActivityIndicator size="large" color="#1b5e20" />
          <Text style={[s.centerSub, { color: subColor, marginTop: 16 }]}>Memuat data Mentari...</Text>
        </View>
        {hiddenWebView}
      </View>
    );
  }

  // Course detail view
  if (selectedCourse) {
    return (
      <View style={[s.container, { backgroundColor: bg }]}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {/* Detail header */}
          <LinearGradient colors={isDark ? ['#1b3a1b', '#2e7d32'] : ['#1b5e20', '#2e7d32', '#43a047']} style={s.detailHeader}>
            <TouchableOpacity onPress={() => { setSelectedCourse(null); setSections([]); }} style={s.backBtn}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={s.detailTitle} numberOfLines={2}>{selectedCourse.nama}</Text>
            <Text style={s.detailKode}>{selectedCourse.kode}</Text>
            <TouchableOpacity style={s.openWebBtn} onPress={() => openInWebView(selectedCourse)}>
              <Ionicons name="open-outline" size={14} color="#fff" />
              <Text style={s.openWebText}>Buka di Mentari</Text>
            </TouchableOpacity>
          </LinearGradient>

          {loadingDetail ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#1b5e20" />
              <Text style={[s.centerSub, { color: subColor, marginTop: 12 }]}>Memuat pertemuan...</Text>
            </View>
          ) : sections.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Ionicons name="document-text-outline" size={40} color={subColor} />
              <Text style={[s.centerSub, { color: subColor, marginTop: 8 }]}>Belum ada data pertemuan</Text>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#1b5e20', marginTop: 16 }]}
                onPress={() => openInWebView(selectedCourse)}>
                <Text style={s.actionBtnText}>Buka di Mentari</Text>
              </TouchableOpacity>
            </View>
          ) : (
            sections.map((sec, si) => (
              <View key={si} style={[s.sectionCard, { backgroundColor: cardBg }]}>
                <View style={s.sectionHeaderRow}>
                  <View style={[s.sectionDot, { backgroundColor: COLORS[si % COLORS.length] }]} />
                  <Text style={[s.sectionName, { color: textColor }]}>{sec.nama}</Text>
                </View>
                {sec.items.map((item, ii) => {
                  const tmpl = TEMPLATE_ICONS[item.type] || { icon: 'ellipse', color: '#888', label: item.type || '' };
                  return (
                    <View key={ii} style={[s.subItem, { borderTopColor: isDark ? '#333' : '#f0f0f0' }]}>
                      <Ionicons name={item.completed ? 'checkmark-circle' : tmpl.icon} size={18}
                        color={item.completed ? '#4caf50' : tmpl.color} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[s.subItemName, { color: textColor }]} numberOfLines={2}>{item.nama}</Text>
                        {tmpl.label ? <Text style={[s.subItemType, { color: subColor }]}>{tmpl.label}</Text> : null}
                      </View>
                      {item.completed && <Text style={s.doneText}>✓</Text>}
                      {item.hasWarning && <Ionicons name="warning" size={14} color="#e65100" />}
                    </View>
                  );
                })}
              </View>
            ))
          )}
        </ScrollView>
        {hiddenWebView}
      </View>
    );
  }

  // Course list
  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={['#1b5e20']} tintColor="#1b5e20" />}>

        <LinearGradient colors={isDark ? ['#1b3a1b', '#2e7d32'] : ['#1b5e20', '#2e7d32']} style={s.listHeader}>
          <Ionicons name="book" size={24} color="#fff" />
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text style={s.listHeaderTitle}>E-Learning Mentari</Text>
            <Text style={s.listHeaderSub}>{courses.length} mata kuliah aktif</Text>
          </View>
        </LinearGradient>

        {courses.map((course, i) => {
          const color = COLORS[i % COLORS.length];
          return (
            <TouchableOpacity key={i} style={[s.courseCard, { backgroundColor: cardBg }]}
              onPress={() => openCourse(course)} activeOpacity={0.7}>
              <View style={[s.courseStripe, { backgroundColor: color }]} />
              <View style={s.courseContent}>
                <Text style={[s.courseName, { color: textColor }]} numberOfLines={2}>{course.nama}</Text>
                <Text style={[s.courseKode, { color: subColor }]}>{course.kode}</Text>
                {course.dosen ? <Text style={[s.courseDosen, { color: subColor }]} numberOfLines={1}>👨‍🏫 {course.dosen}</Text> : null}
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
  container: { flex: 1 },
  hidden: { height: 0, width: 0, opacity: 0, position: 'absolute' },
  scroll: { paddingBottom: 30 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  centerTitle: { fontSize: 18, fontWeight: '700', marginTop: 16 },
  centerSub: { fontSize: 14, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  actionBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10, marginTop: 20 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  // List header
  listHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, marginBottom: 8 },
  listHeaderTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  listHeaderSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  // Course card
  courseCard: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8,
    borderRadius: 12, padding: 14, elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2,
  },
  courseStripe: { width: 4, height: 40, borderRadius: 2, marginRight: 12 },
  courseContent: { flex: 1 },
  courseName: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
  courseKode: { fontSize: 12, marginTop: 3 },
  courseDosen: { fontSize: 12, marginTop: 2 },
  // Detail header
  detailHeader: { padding: 20, paddingTop: 16, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  backBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  detailTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  detailKode: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  openWebBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start', marginTop: 12 },
  openWebText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  // Section card
  sectionCard: { marginHorizontal: 16, marginTop: 12, borderRadius: 14, padding: 16, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sectionDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  sectionName: { fontSize: 15, fontWeight: '700', flex: 1 },
  subItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1 },
  subItemName: { fontSize: 13, lineHeight: 18 },
  subItemType: { fontSize: 11, marginTop: 2 },
  doneText: { fontSize: 14, color: '#4caf50', fontWeight: '700', marginLeft: 6 },
});
