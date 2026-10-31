# SATU UNPAM Mobile

Aplikasi mobile unofficial untuk mengakses layanan SATU UNPAM (Universitas Pamulang) dalam satu genggaman.

## Fitur

- 🏠 **SATU UNPAM Portal** — Akses portal utama satu.unpam.ac.id
- 🎓 **MyUNPAM** — Sistem Informasi Akademik (KRS, KHS, jadwal kuliah)
- 📚 **Mentari** — E-Learning / Manajemen Terpadu Pembelajaran Daring
- 📅 **Event** — Daftar event dan kegiatan kampus

## Keunggulan

- ✅ SSO terintegrasi — login sekali, akses semua layanan
- ✅ Pull-to-refresh untuk memperbarui halaman
- ✅ Navigasi tab untuk berpindah cepat antar layanan
- ✅ Tombol back Android untuk navigasi di dalam halaman
- ✅ Offline detection dengan halaman error yang user-friendly
- ✅ Berjalan di Android dan iOS

## Cara Menjalankan

### Development
```bash
npm install
npx expo start
```

### Build APK (Android)
```bash
# Dengan EAS Build (cloud)
npx eas-cli build --platform android --profile preview

# Atau local build
npx expo run:android
```

### Build iOS
```bash
npx expo run:ios
```

## Teknologi

- React Native (Expo SDK 58)
- React Navigation (Bottom Tabs)
- React Native WebView
- Shared Cookies untuk SSO

## Catatan

Aplikasi ini dibuat untuk penggunaan pribadi mahasiswa UNPAM. Bukan aplikasi resmi dari Universitas Pamulang. Login menggunakan akun mahasiswa MyUNPAM.

## Cara Kerja SSO

Aplikasi menggunakan `sharedCookiesEnabled` pada WebView, sehingga cookie session dari login di satu layanan (misal satu.unpam.ac.id) akan otomatis tersedia di layanan lain (my.unpam.ac.id, mentari.unpam.ac.id, event.unpam.ac.id).

Alur login:
1. Buka tab **SATU UNPAM** → Login dengan akun mahasiswa
2. Setelah berhasil login, pindah ke tab lain
3. Semua layanan sudah ter-autentikasi otomatis
