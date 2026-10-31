import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Animated,
  TouchableOpacity,
  Dimensions,
  useColorScheme,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../config/ThemeContext';

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const { isDark } = useTheme();
  const bg = isDark ? '#0a0e1a' : '#1a237e';

  // Tidak perlu lagi ring

  // Animations
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(20)).current;
  const subOpacity = useRef(new Animated.Value(0)).current;
  const featOpacity = useRef(new Animated.Value(0)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(0.8)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. Logo zoom + rotate
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(logoRotate, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
      // 2. Title slide up
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(titleY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      // 3. Subtitle
      Animated.timing(subOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      // 4. Features
      Animated.timing(featOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      // 5. Button bounce in
      Animated.parallel([
        Animated.spring(btnScale, { toValue: 1, friction: 5, tension: 50, useNativeDriver: true }),
        Animated.timing(btnOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      // 6. Footer
      Animated.timing(footerOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const spin = logoRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const btnBg = isDark ? '#e0e0e0' : '#fff';
  const btnTxt = isDark ? '#0d1117' : '#1a237e';

  const enterApp = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={isDark ? '#0a0e1a' : '#1a237e'} />

      {/* Decorative shapes — warna UNPAM */}
      {/* Merah */}
      <View style={[s.deco, { width: 300, height: 300, borderRadius: 150, top: -80, right: -60, backgroundColor: isDark ? 'rgba(198,40,40,0.15)' : 'rgba(211,47,47,0.12)' }]} />
      {/* Biru */}
      <View style={[s.deco, { width: 250, height: 250, borderRadius: 125, top: '30%', left: -100, backgroundColor: isDark ? 'rgba(13,71,161,0.2)' : 'rgba(21,101,192,0.15)' }]} />
      {/* Kuning */}
      <View style={[s.deco, { width: 200, height: 200, borderRadius: 100, bottom: 80, right: -40, backgroundColor: isDark ? 'rgba(245,200,0,0.08)' : 'rgba(255,214,0,0.1)' }]} />
      {/* Hijau kecil */}
      <View style={[s.deco, { width: 120, height: 120, borderRadius: 60, bottom: '35%', left: 30, backgroundColor: isDark ? 'rgba(27,94,32,0.12)' : 'rgba(46,125,50,0.08)' }]} />
      {/* Merah kecil */}
      <View style={[s.deco, { width: 80, height: 80, borderRadius: 40, top: '20%', right: 40, backgroundColor: isDark ? 'rgba(198,40,40,0.1)' : 'rgba(211,47,47,0.07)' }]} />

      {/* Garis diagonal accent */}
      <View style={[s.deco, { width: 2, height: 200, top: 60, left: '25%', backgroundColor: isDark ? 'rgba(255,214,0,0.06)' : 'rgba(255,214,0,0.08)', transform: [{ rotate: '30deg' }] }]} />
      <View style={[s.deco, { width: 2, height: 160, bottom: 120, right: '20%', backgroundColor: isDark ? 'rgba(211,47,47,0.06)' : 'rgba(211,47,47,0.08)', transform: [{ rotate: '-25deg' }] }]} />

      {/* Logo */}
      <Animated.View style={{
        opacity: logoOpacity,
        transform: [{ scale: logoScale }, { rotate: spin }],
      }}>
        <View style={s.logoShadow}>
          <Image source={require('../assets/unpam-logo.png')} style={s.logo} resizeMode="contain" />
        </View>
      </Animated.View>

      {/* Title */}
      <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleY }], marginTop: 28 }}>
        <Text style={s.title}>SATU UNPAM</Text>
        <Text style={s.titleSub}>Mobile</Text>
      </Animated.View>

      {/* Subtitle */}
      <Animated.Text style={[s.subtitle, { opacity: subOpacity }]}>
        Portal Mahasiswa Terintegrasi
      </Animated.Text>

      {/* Features */}
      <Animated.View style={[s.featRow, { opacity: featOpacity }]}>
        {[['school-outline', 'Akademik'], ['qr-code-outline', 'Presensi'], ['book-outline', 'E-Learning']].map(([icon, label]) => (
          <React.Fragment key={label}>
            <View style={s.featItem}>
              <Ionicons name={icon} size={18} color="rgba(255,255,255,0.8)" />
              <Text style={s.featText}>{label}</Text>
            </View>
            {label !== 'E-Learning' && <View style={s.featDot} />}
          </React.Fragment>
        ))}
      </Animated.View>

      {/* Masuk button */}
      <Animated.View style={{ opacity: btnOpacity, transform: [{ scale: btnScale }] }}>
        <TouchableOpacity style={[s.btn, { backgroundColor: btnBg }]} onPress={enterApp} activeOpacity={0.85}>
          <Ionicons name="arrow-forward-circle" size={22} color={btnTxt} />
          <Text style={[s.btnText, { color: btnTxt }]}>Masuk</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Footer */}
      <Animated.View style={[s.footer, { opacity: footerOpacity }]}>
        <Text style={s.footerText}>Universitas Pamulang</Text>
        <Text style={s.footerVersion}>v1.0</Text>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 20,
    paddingBottom: 40,
    overflow: 'hidden',
  },
  deco: { position: 'absolute' },
  logoShadow: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 12,
  },
  logo: { width: 130, height: 130, borderRadius: 65 },
  title: { fontSize: 32, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: 3 },
  titleSub: { fontSize: 16, fontWeight: '300', color: 'rgba(255,255,255,0.6)', textAlign: 'center', letterSpacing: 8, marginTop: 4 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 12 },
  featRow: { flexDirection: 'row', alignItems: 'center', marginTop: 32, marginBottom: 40 },
  featItem: { alignItems: 'center', gap: 5 },
  featText: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  featDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 18 },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16, gap: 12,
    width: width - 64,
    elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12,
  },
  btnText: { fontSize: 18, fontWeight: '800' },
  footer: { position: 'absolute', bottom: 50, alignItems: 'center' },
  footerText: { fontSize: 12, color: 'rgba(255,255,255,0.25)', letterSpacing: 1 },
  footerVersion: { fontSize: 10, color: 'rgba(255,255,255,0.15)', marginTop: 3 },
});
