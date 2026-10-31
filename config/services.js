// Konfigurasi semua layanan UNPAM
export const SERVICES = {
  satu: {
    key: 'satu',
    url: 'https://satu.unpam.ac.id',
    title: 'SATU UNPAM',
    subtitle: 'Portal Utama',
    icon: 'globe-outline',
    color: '#1a237e',
    gradient: ['#1a237e', '#283593'],
  },
  myunpam: {
    key: 'myunpam',
    url: 'https://my.unpam.ac.id',
    title: 'MyUNPAM',
    subtitle: 'Akademik & KRS',
    icon: 'school-outline',
    color: '#0d47a1',
    gradient: ['#0d47a1', '#1565c0'],
  },
  mentari: {
    key: 'mentari',
    url: 'https://mentari.unpam.ac.id',
    title: 'Mentari',
    subtitle: 'E-Learning',
    icon: 'book-outline',
    color: '#1b5e20',
    gradient: ['#1b5e20', '#2e7d32'],
  },
  event: {
    key: 'event',
    url: 'https://event.unpam.ac.id',
    title: 'Event',
    subtitle: 'Kegiatan Kampus',
    icon: 'calendar-outline',
    color: '#e65100',
    gradient: ['#e65100', '#ef6c00'],
  },
  presensi: {
    key: 'presensi',
    url: 'https://my.unpam.ac.id/presensi',
    title: 'Presensi',
    subtitle: 'Kehadiran Kuliah',
    icon: 'qr-code-outline',
    color: '#00838f',
    gradient: ['#00838f', '#0097a7'],
  },
  linksi: {
    key: 'linksi',
    url: 'https://link.si-unpam.my.id/auth/login',
    title: 'LINK-SI',
    subtitle: 'Sistem Informasi',
    icon: 'link-outline',
    color: '#6a1b9a',
    gradient: ['#6a1b9a', '#7b1fa2'],
  },
  mentari_dosen: {
    key: 'mentari_dosen',
    url: 'https://dosen.unpam.ac.id/login',
    title: 'Portal Dosen',
    subtitle: 'Khusus Dosen',
    icon: 'person-outline',
    color: '#00695c',
    gradient: ['#00695c', '#00897b'],
  },
  perpus: {
    key: 'perpus',
    url: 'https://perpustakaan.unpam.ac.id',
    title: 'Perpustakaan',
    subtitle: 'Katalog & E-Book',
    icon: 'library-outline',
    color: '#4e342e',
    gradient: ['#4e342e', '#5d4037'],
  },
  pmb: {
    key: 'pmb',
    url: 'https://pmb.unpam.ac.id',
    title: 'PMB',
    subtitle: 'Pendaftaran Maba',
    icon: 'people-outline',
    color: '#37474f',
    gradient: ['#37474f', '#455a64'],
  },
  tugas: {
    key: 'tugas',
    url: 'https://mentari.unpam.ac.id',
    title: 'Tugas',
    subtitle: 'Cek E-Learning',
    icon: 'clipboard-outline',
    color: '#1b5e20',
    gradient: ['#1b5e20', '#388e3c'],
  },
};

// Menu utama yang tampil di dashboard
export const MAIN_MENU = ['satu', 'myunpam', 'mentari', 'event', 'linksi'];

// Menu tambahan
export const MORE_MENU = ['perpus', 'pmb'];

// Quick links yang tampil di atas
export const QUICK_LINKS = ['myunpam', 'mentari', 'event'];
