const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwT4-QXYmbGEtvidcViP91sfGSiptSNWQ1iQfISbOLVVm39B4-1l9Kzef6zAnnvVg/exec";

// =========================================
// DAFTAR JURUSAN
// =========================================
const MAJORS = [
  "Food & Baverage Service",
  "Bar & Mixology",
  "Culinary",
  "Pastry & Bakery",
  "Room Division",
  "Front Office",
  "Hotel Digital Marketing"
];

// =========================================
// RELASI JURUSAN -> GROUP INSTRUKTUR
// =========================================
//
// Nilai Group yang dipakai di sheet "Instruktur":
// - fnb_bar
// - culinary_pastry
// - room_division
// - fo_digmar
// - GLOBAL
//
// GLOBAL dipakai untuk Instruktur IT, Business, dan English
// yang tampil di semua jurusan.
const MAJOR_TO_POOL = {
  "Food & Baverage Service": "fnb_bar",
  "Bar & Mixology": "fnb_bar",

  "Culinary": "culinary_pastry",
  "Pastry & Bakery": "culinary_pastry",

  "Room Division": "room_division",

  "Front Office": "fo_digmar",
  "Hotel Digital Marketing": "fo_digmar"
};

// =========================================
// PERTANYAAN KUISIONER
// =========================================
//
// Data instruktur sekarang dibaca dari tab "Instruktur"
// di Google Sheets, bukan dari config.js.
const QUESTIONS = [
  {
    title: "Penguasaan Materi",
    description: "Instruktur menguasai materi dan mampu memberikan penjelasan serta contoh yang relevan dengan topik pembelajaran."
  },
  {
    title: "Kejelasan Penyampaian Materi",
    description: "Instruktur menyampaikan materi secara sistematis, jelas, komunikatif, dan mudah dipahami mahasiswa."
  },
  {
    title: "Metode & Media Pembelajaran",
    description: "Metode dan media yang digunakan sesuai dengan materi, menarik, interaktif, dan mendukung proses pembelajaran."
  },
  {
    title: "Keterlibatan & Interaksi dengan Mahasiswa",
    description: "Instruktur mendorong mahasiswa untuk aktif bertanya, berdiskusi, berpendapat, dan berpartisipasi dalam pembelajaran."
  },
  {
    title: "Relevansi dengan Dunia Industri",
    description: "Materi, contoh, praktik, dan pengalaman yang diberikan memiliki keterkaitan dengan kebutuhan industri dan dunia kerja."
  },
  {
    title: "Pengelolaan Kelas & Waktu",
    description: "Instruktur mampu mengelola kelas, mengatur waktu pembelajaran, serta menciptakan suasana belajar yang kondusif."
  },
  {
    title: "Profesionalisme & Kedisiplinan",
    description: "Instruktur hadir dan memulai pembelajaran sesuai jadwal, bertanggung jawab, berpenampilan serta bersikap profesional."
  },
  {
    title: "Respons & Feedback kepada Mahasiswa",
    description: "Instruktur responsif terhadap pertanyaan atau kesulitan mahasiswa serta memberikan feedback yang membantu perkembangan mahasiswa."
  },
  {
    title: "Evaluasi & Dukungan terhadap Perkembangan Mahasiswa",
    description: "Penugasan dan penilaian sesuai dengan pembelajaran serta membantu meningkatkan pengetahuan, keterampilan, dan kesiapan mahasiswa menghadapi dunia kerja."
  }
];
