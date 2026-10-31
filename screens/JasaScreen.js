import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
  Animated,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../config/ThemeContext';

const { width } = Dimensions.get('window');
const WA_NUMBER = '6281245505784'; // Ganti nomor asli nanti

const SERVICES_LIST = [
  {
    icon: 'laptop-outline',
    title: 'Joki E-Learning',
    desc: 'Pretest, Posttest, Forum Diskusi, Kuesioner — semua pertemuan',
    price: 'Mulai 15rb/pertemuan',
    color: '#1b5e20',
    gradient: ['#1b5e20', '#388e3c'],
    popular: true,
  },
  {
    icon: 'document-text-outline',
    title: 'Tugas Kuliah',
    desc: 'Essay, studi kasus, laporan, review jurnal — semua mata kuliah',
    price: 'Mulai 25rb/tugas',
    color: '#0d47a1',
    gradient: ['#0d47a1', '#1976d2'],
  },
  {
    icon: 'book-outline',
    title: 'Makalah & Paper',
    desc: 'Makalah ilmiah, literature review, paper penelitian lengkap',
    price: 'Mulai 50rb/makalah',
    color: '#6a1b9a',
    gradient: ['#6a1b9a', '#8e24aa'],
  },
  {
    icon: 'easel-outline',
    title: 'Presentasi PPT',
    desc: 'Slide PowerPoint profesional, desain modern, animasi menarik',
    price: 'Mulai 30rb/PPT',
    color: '#e65100',
    gradient: ['#e65100', '#f57c00'],
  },
  {
    icon: 'code-slash-outline',
    title: 'Tugas Programming',
    desc: 'Java, Python, C++, Web, Database — debug & bikin dari nol',
    price: 'Mulai 50rb/project',
    color: '#00695c',
    gradient: ['#00695c', '#00897b'],
  },
  {
    icon: 'bar-chart-outline',
    title: 'Olah Data & Statistik',
    desc: 'SPSS, Excel, analisis data, tabel, grafik untuk skripsi/tugas',
    price: 'Mulai 40rb',
    color: '#c62828',
    gradient: ['#c62828', '#e53935'],
  },
];

export default function JasaScreen() {
  const { isDark } = useTheme();
  const bg = isDark ? '#121212' : '#f0f2f5';
  const cardBg = isDark ? '#1e1e1e' : '#fff';
  const textColor = isDark ? '#e0e0e0' : '#1a1a2e';
  const subColor = isDark ? '#aaa' : '#666';

  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
    ])).start();
  }, []);

  const openWA = (title) => {
    const msg = title
      ? `Halo, saya tertarik dengan layanan *${title}*. Bisa info lebih lanjut?`
      : 'Halo, saya tertarik dengan jasa akademik. Bisa info lebih lanjut?';
    Linking.openURL(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`);
  };

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <LinearGradient colors={isDark ? ['#1a237e', '#0d47a1'] : ['#1a237e', '#283593', '#303f9f']} style={s.hero}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Text style={{ fontSize: 48 }}>🎓</Text>
          </Animated.View>
          <Text style={s.heroTitle}>Jasa Bantuan Akademik</Text>
          <Text style={s.heroSub}>Nilai bagus tanpa ribet — harga mahasiswa!</Text>

          <View style={s.badgeRow}>
            {[['⚡', 'Cepat'], ['💰', 'Murah'], ['✅', 'Terpercaya'], ['🔒', 'Rahasia']].map(([e, l]) => (
              <View key={l} style={s.heroBadge}>
                <Text style={{ fontSize: 16 }}>{e}</Text>
                <Text style={s.heroBadgeText}>{l}</Text>
              </View>
            ))}
          </View>

          <View style={s.promo}>
            <Ionicons name="megaphone" size={16} color="#e65100" />
            <Text style={s.promoText}>🔥 PROMO: Diskon 20% paket semester!</Text>
          </View>
        </LinearGradient>

        {/* Services */}
        <Text style={[s.secTitle, { color: textColor }]}>Pilih Layanan</Text>

        {SERVICES_LIST.map((svc, i) => (
          <TouchableOpacity key={i} style={[s.card, { backgroundColor: cardBg }]} onPress={() => openWA(svc.title)} activeOpacity={0.8}>
            {svc.popular && (
              <View style={s.popBadge}>
                <Ionicons name="flame" size={11} color="#fff" />
                <Text style={s.popText}>POPULER</Text>
              </View>
            )}
            <View style={s.cardRow}>
              <LinearGradient colors={svc.gradient} style={s.cardIcon}>
                <Ionicons name={svc.icon} size={24} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[s.cardTitle, { color: textColor }]}>{svc.title}</Text>
                <Text style={[s.cardDesc, { color: subColor }]}>{svc.desc}</Text>
                <View style={s.priceTag}>
                  <Ionicons name="pricetag" size={12} color="#e65100" />
                  <Text style={s.priceText}>{svc.price}</Text>
                </View>
              </View>
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            </View>
          </TouchableOpacity>
        ))}

        {/* Testimoni */}
        <View style={[s.testiCard, { backgroundColor: isDark ? '#1a237e' : '#e8eaf6' }]}>
          <Text style={[s.testiTitle, { color: isDark ? '#fff' : '#1a237e' }]}>💬 Kata Mereka</Text>
          {[
            ['"E-learning 1 semester selesai dalam 2 jam!"', '— Mahasiswa SI'],
            ['"PPT nya keren, dosen sampai muji."', '— Mahasiswa Manajemen'],
            ['"Tugas programming deadline besok, selesai malam ini."', '— Mahasiswa TI'],
          ].map(([t, b], i) => (
            <View key={i} style={{ marginBottom: 10 }}>
              <Text style={[s.testiText, { color: isDark ? '#e0e0e0' : '#333' }]}>{t}</Text>
              <Text style={[s.testiBy, { color: isDark ? '#aaa' : '#888' }]}>{b}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity style={s.cta} onPress={() => openWA()} activeOpacity={0.85}>
          <LinearGradient colors={['#25D366', '#128C7E']} style={s.ctaGrad}>
            <Ionicons name="logo-whatsapp" size={24} color="#fff" />
            <View>
              <Text style={s.ctaTitle}>Chat WhatsApp Sekarang</Text>
              <Text style={s.ctaSub}>Fast response • Konsultasi gratis</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={[s.disc, { color: isDark ? '#555' : '#bbb' }]}>
          * Harga tergantung tingkat kesulitan. Konsultasi dulu gratis!
        </Text>
      </ScrollView>

      {/* Floating WA */}
      <TouchableOpacity style={s.fab} onPress={() => openWA()} activeOpacity={0.85}>
        <Ionicons name="logo-whatsapp" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 100 },
  hero: { padding: 24, paddingTop: 16, alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center', marginTop: 8 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 6 },
  badgeRow: { flexDirection: 'row', marginTop: 18, gap: 10 },
  heroBadge: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  heroBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700', marginTop: 3 },
  promo: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff3e0', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginTop: 16, width: '100%' },
  promoText: { fontSize: 13, fontWeight: '700', color: '#e65100', flex: 1 },
  secTitle: { fontSize: 18, fontWeight: '800', marginTop: 24, marginBottom: 12, paddingHorizontal: 20 },
  card: { marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, overflow: 'hidden' },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardDesc: { fontSize: 12, marginTop: 3, lineHeight: 17 },
  priceTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, backgroundColor: '#fff3e0', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  priceText: { fontSize: 12, fontWeight: '800', color: '#e65100' },
  popBadge: { position: 'absolute', top: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#c62828', paddingHorizontal: 10, paddingVertical: 4, borderBottomLeftRadius: 12, borderTopRightRadius: 16, zIndex: 1 },
  popText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  testiCard: { marginHorizontal: 16, marginTop: 24, borderRadius: 16, padding: 20 },
  testiTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  testiText: { fontSize: 13, fontStyle: 'italic', lineHeight: 19 },
  testiBy: { fontSize: 11, marginTop: 3 },
  cta: { marginHorizontal: 16, marginTop: 24, borderRadius: 16, overflow: 'hidden', elevation: 6, shadowColor: '#25D366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
  ctaGrad: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  ctaTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  ctaSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  disc: { fontSize: 11, textAlign: 'center', marginTop: 16, paddingHorizontal: 32, lineHeight: 16 },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#25D366', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#25D366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
});
