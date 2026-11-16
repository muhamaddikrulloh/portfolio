import type { Locale } from "./intro-content";

export const projectsCopy = {
  en: { work: "Work", title: "Selected Projects", intro: "An evolving collection of work, exploring ideas and turning them into digital experiences.", scroll: "Scroll", view: "View", details: "View details", all: "All projects", count: "Project count", close: "Close", back: "Back to home", colProject: "Project", colCategory: "Category", colStack: "Stack", colYear: "Year", stack: "Technologies", artwork: "Original interface illustration; not a product screenshot.", note: "Project overview based on documented work. Screenshots and full case studies are not available here yet." },
  id: { work: "Karya", title: "Proyek Pilihan", intro: "Kumpulan karya yang terus berkembang, mengeksplorasi ide dan menghadirkannya menjadi pengalaman digital.", scroll: "Gulir", view: "Lihat", details: "Lihat detail", all: "Semua proyek", count: "Jumlah proyek", close: "Tutup", back: "Kembali", colProject: "Proyek", colCategory: "Kategori", colStack: "Stack", colYear: "Tahun", stack: "Teknologi", artwork: "Ilustrasi antarmuka orisinal; bukan screenshot produk.", note: "Ringkasan berdasarkan proyek terdokumentasi. Screenshot dan studi kasus lengkap belum tersedia di sini." },
} satisfies Record<Locale, Record<string, string>>;

export const selectedProjects = [
  { slug: "food-court", title: "Food Court Web App", year: "2025", kind: { en: "Web application", id: "Aplikasi web" }, summary: { en: "A multi-role food ordering application built with native PHP and a MySQL / MariaDB database.", id: "Aplikasi pemesanan makanan dengan beberapa peran pengguna, dibangun memakai PHP native dan database MySQL / MariaDB." }, technologies: ["PHP", "MySQL", "MariaDB"], visual: "orders" },
  { slug: "diary", title: "Diary App", year: "2026", kind: { en: "Mobile exercises", id: "Latihan mobile" }, summary: { en: "React Native and Expo course exercises, explored through a diary application.", id: "Latihan perkuliahan React Native dan Expo melalui aplikasi buku harian." }, technologies: ["React Native", "Expo"], visual: "diary" },
  { slug: "bandung", title: "Bandung City Profile", year: "2024", kind: { en: "Website", id: "Website" }, summary: { en: "A website introducing Bandung through a city profile.", id: "Website yang memperkenalkan Bandung melalui profil kota." }, technologies: ["HTML", "CSS", "JavaScript"], visual: "city" },
] as const;

export const allProjectsArchive = [
  selectedProjects[1],
  selectedProjects[0],
  { slug: "tasktrack", title: "TaskTrack", year: "2025", kind: { en: "Web application", id: "Aplikasi web" }, summary: { en: "A collaborative task and workflow tracker organizing project milestones and team responsibilities.", id: "Aplikasi pelacak tugas dan alur kerja kolaboratif untuk mengatur milestone proyek serta tanggung jawab tim." }, technologies: ["TypeScript", "React", "Next.js"], visual: "orders" },
  selectedProjects[2],
  { slug: "biolink", title: "Microsite BioLink", year: "2024", kind: { en: "Microsite", id: "Microsite" }, summary: { en: "A compact profile and link hub built with responsive layout and lightweight interactive states.", id: "Halaman profil dan kumpulan tautan ringkas dengan tata letak responsif serta interaksi ringan." }, technologies: ["HTML", "CSS", "JavaScript"], visual: "city" },
] as const;
