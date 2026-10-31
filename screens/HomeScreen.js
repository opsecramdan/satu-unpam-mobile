import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
  Alert,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../config/ThemeContext';
import { SERVICES, MAIN_MENU, MORE_MENU } from '../config/services';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const GRID_COLS = 4;
const CARD_SIZE = (width - 48 - (CARD_MARGIN * 2 * GRID_COLS)) / GRID_COLS;

// Waktu greeting
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat Pagi';
  if (hour < 15) return 'Selamat Siang';
  if (hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

// Format tanggal Indonesia
function getDateString() {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const now = new Date();
  return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

// Dark mode color helpers
function getColors(isDark) {
  return {
    background: isDark ? '#121212' : '#f0f2f5',
    card: isDark ? '#1e1e1e' : '#fff',
    text: isDark ? '#e0e0e0' : '#1a1a2e',
    textSecondary: isDark ? '#aaa' : '#444',
    textMuted: isDark ? '#888' : '#888',
    textFaint: isDark ? '#666' : '#999',
    searchBg: isDark ? '#2a2a2a' : '#fff',
    searchText: isDark ? '#aaa' : '#888',
    sectionTitle: isDark ? '#e0e0e0' : '#1a1a2e',
    cardShadow: isDark ? 'transparent' : '#000',
    infoValue: isDark ? '#e0e0e0' : '#333',
    menuLabel: isDark ? '#ccc' : '#444',
    footerText: isDark ? '#666' : '#999',
    footerSub: isDark ? '#555' : '#bbb',
    statusBar: isDark ? 'light-content' : 'light-content',
  };
}

// Komponen: Menu Grid Item
function MenuCard({ service, onPress, size, colors }) {
  return (
    <TouchableOpacity
      style={[styles.menuCard, { width: size, height: size + 20 }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconBox, { backgroundColor: service.color + '15' }]}>
        <Ionicons name={service.icon} size={28} color={service.color} />
      </View>
      <Text style={[styles.menuLabel, { color: colors.menuLabel }]} numberOfLines={2}>{service.title}</Text>
    </TouchableOpacity>
  );
}

// Komponen: Quick Access Card
function QuickCard({ service, onPress }) {
  return (
    <TouchableOpacity
      style={styles.quickCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={service.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.quickGradient}
      >
        <Ionicons name={service.icon} size={24} color="#fff" />
        <View style={styles.quickTextBox}>
          <Text style={styles.quickTitle}>{service.title}</Text>
          <Text style={styles.quickSubtitle}>{service.subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
      </LinearGradient>
    </TouchableOpacity>
  );
}

// Komponen: Info Card
function InfoCard({ icon, title, value, color, colors }) {
  return (
    <View style={[styles.infoCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}>
      <View style={[styles.infoIconBox, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.infoValue, { color: colors.infoValue }]}>{value}</Text>
      <Text style={[styles.infoTitle, { color: colors.textMuted }]}>{title}</Text>
    </View>
  );
}

// Animated Jasa Akademik Banner
function JasaBanner({ onPress, isDark }) {
  const shimmer = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Shimmer loop
    Animated.loop(Animated.timing(shimmer, {
      toValue: 1, duration: 2000, useNativeDriver: true,
    })).start();
    // Bounce loop
    Animated.loop(Animated.sequence([
      Animated.timing(bounce, { toValue: 1.03, duration: 800, useNativeDriver: true }),
      Animated.timing(bounce, { toValue: 1, duration: 800, useNativeDriver: true }),
    ])).start();
  }, []);

  const shimmerTranslate = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <Animated.View style={{ transform: [{ scale: bounce }] }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <LinearGradient
          colors={isDark ? ['#4a148c', '#7b1fa2', '#e91e63'] : ['#6a1b9a', '#8e24aa', '#e91e63']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ borderRadius: 16, padding: 18, overflow: 'hidden' }}
        >
          {/* Shimmer overlay */}
          <Animated.View style={{
            position: 'absolute', top: 0, bottom: 0, width: 80,
            backgroundColor: 'rgba(255,255,255,0.15)',
            transform: [{ translateX: shimmerTranslate }, { skewX: '-20deg' }],
          }} />

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
              <Text style={{ fontSize: 22 }}>🎯</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>Jasa Bantuan Akademik</Text>
                <View style={{ backgroundColor: '#ffeb3b', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: '#4a148c' }}>MURAH!</Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 3 }}>
                E-Learning, Tugas, Makalah, PPT & lainnya →
              </Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={24} color="rgba(255,255,255,0.8)" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen({ navigation }) {
  const { isDark, toggle } = useTheme();
  const colors = getColors(isDark);

  const [greeting, setGreeting] = useState(getGreeting());
  const [dateStr, setDateStr] = useState(getDateString());
  const [userName, setUserName] = useState('Mahasiswa UNPAM');

  useEffect(() => {
    const interval = setInterval(() => {
      setGreeting(getGreeting());
      setDateStr(getDateString());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Load user name from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const name = await SecureStore.getItemAsync('user_name');
        if (name) setUserName(name);
      } catch {}
    })();
  }, []);

  // Draggable theme toggle bubble
  const { height: screenH } = Dimensions.get('window');
  const bubblePos = useRef(new Animated.ValueXY({
    x: width - 60,
    y: screenH * 0.45,
  })).current;

  // Ref untuk toggle supaya PanResponder selalu akses versi terbaru
  const toggleRef = useRef(toggle);
  toggleRef.current = toggle;

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3,
    onPanResponderGrant: () => {
      bubblePos.setOffset({ x: bubblePos.x._value, y: bubblePos.y._value });
      bubblePos.setValue({ x: 0, y: 0 });
    },
    onPanResponderMove: Animated.event(
      [null, { dx: bubblePos.x, dy: bubblePos.y }],
      { useNativeDriver: false }
    ),
    onPanResponderRelease: (_, g) => {
      bubblePos.flattenOffset();
      const snapX = (bubblePos.x._value + 22) > width / 2 ? width - 54 : 10;
      const clampY = Math.max(60, Math.min(bubblePos.y._value, screenH - 100));
      Animated.spring(bubblePos, {
        toValue: { x: snapX, y: clampY },
        friction: 7,
        useNativeDriver: false,
      }).start();
      if (Math.abs(g.dx) < 5 && Math.abs(g.dy) < 5) {
        toggleRef.current(); // Pakai ref, bukan closure langsung
      }
    },
  })).current;

  const openService = (key) => {
    if (key === 'presensi') { navigation.navigate('Presensi'); return; }
    const service = SERVICES[key];
    navigation.navigate('Service', {
      serviceKey: key,
      title: service.title,
    });
  };

  const handleLogout = () => {
    Alert.alert(
      'Keluar',
      'Yakin ingin keluar dari akun?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            await SecureStore.deleteItemAsync('user_logged_in');
            await SecureStore.deleteItemAsync('user_name');
            try { await SecureStore.deleteItemAsync('presensi-cache'); } catch {}
            navigation.reset({
              index: 0,
              routes: [{ name: 'Welcome' }],
            });
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor="#1a237e" />

      {/* Header — keep gradient as-is */}
      <LinearGradient
        colors={['#1a237e', '#283593', '#303f9f']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{greeting} 👋</Text>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.dateText}>{dateStr}</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarBox}
            onPress={() => openService('satu')}
          >
            <Ionicons name="person-circle" size={50} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
        </View>

        {/* Search-like bar (menuju SATU portal) */}
        <TouchableOpacity
          style={[styles.searchBar, { backgroundColor: colors.searchBg }]}
          onPress={() => openService('satu')}
          activeOpacity={0.8}
        >
          <Ionicons name="search-outline" size={18} color={colors.searchText} />
          <Text style={[styles.searchText, { color: colors.searchText }]}>Buka Portal SATU UNPAM...</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <InfoCard
            icon="school"
            title="Semester"
            value="Aktif"
            color="#1a237e"
            colors={colors}
          />
          <InfoCard
            icon="calendar"
            title="Perkuliahan"
            value="Berjalan"
            color="#e65100"
            colors={colors}
          />
          <InfoCard
            icon="book"
            title="E-Learning"
            value="Online"
            color="#1b5e20"
            colors={colors}
          />
        </View>

        {/* Quick Access */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.sectionTitle }]}>Akses Cepat</Text>
          {['myunpam', 'mentari', 'event', 'presensi'].map((key) => (
            <QuickCard
              key={key}
              service={SERVICES[key]}
              onPress={() => openService(key)}
            />
          ))}
        </View>

        {/* Menu Layanan */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.sectionTitle }]}>Layanan Kampus</Text>
          <View style={styles.menuGrid}>
            {MAIN_MENU.map((key) => (
              <MenuCard
                key={key}
                service={SERVICES[key]}
                onPress={() => openService(key)}
                size={CARD_SIZE}
                colors={colors}
              />
            ))}
            {MORE_MENU.map((key) => (
              <MenuCard
                key={key}
                service={SERVICES[key]}
                onPress={() => openService(key)}
                size={CARD_SIZE}
                colors={colors}
              />
            ))}
          </View>
        </View>

        {/* Info Banner */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.banner}
            onPress={() => openService('event')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#ff6f00', '#ff8f00', '#ffa000']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bannerGradient}
            >
              <View style={styles.bannerContent}>
                <Ionicons name="megaphone-outline" size={28} color="#fff" />
                <View style={styles.bannerTextBox}>
                  <Text style={styles.bannerTitle}>Event & Kegiatan Kampus</Text>
                  <Text style={styles.bannerSubtitle}>
                    Lihat seminar, workshop, dan kegiatan terbaru →
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Jasa Akademik Banner — animated */}
        <View style={styles.section}>
          <JasaBanner onPress={() => navigation.navigate('Jasa')} isDark={isDark} />
        </View>

        {/* Logout button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: colors.card }]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color="#d32f2f" />
            <Text style={styles.logoutText}>Keluar dari Akun</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.footerText }]}>SATU UNPAM Mobile v1.0</Text>
          <Text style={[styles.footerSubtext, { color: colors.footerSub }]}>Unofficial • Personal Use Only</Text>
        </View>
      </ScrollView>

      {/* Draggable theme bubble — bisa ditarik kemana-mana */}
      <Animated.View
        style={[styles.themeToggle, { left: bubblePos.x, top: bubblePos.y, backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.25)' }]}
        {...panResponder.panHandlers}
      >
        <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color="#fff" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: { flex: 1 },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  avatarBox: {
    marginLeft: 12,
  },
  themeToggle: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 9999,
  },
  // Search bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchText: {
    marginLeft: 10,
    fontSize: 14,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: -1,
    paddingTop: 16,
  },
  infoCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoTitle: {
    fontSize: 10,
    marginTop: 2,
  },
  // Scroll
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 30 },
  // Sections
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  // Quick Cards
  quickCard: {
    marginBottom: 10,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  quickGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  quickTextBox: {
    flex: 1,
    marginLeft: 14,
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  quickSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  // Menu Grid
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  menuCard: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: CARD_MARGIN,
    marginBottom: 16,
  },
  menuIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  menuLabel: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
  },
  // Banner
  banner: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  bannerGradient: {
    padding: 18,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerTextBox: {
    flex: 1,
    marginLeft: 14,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  bannerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 3,
  },
  // Logout button
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#d32f2f',
  },
  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footerSubtext: {
    fontSize: 10,
    marginTop: 2,
  },
});
