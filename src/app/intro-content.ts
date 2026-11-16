import { location } from "./identity-location.mjs";

export type Locale = "en" | "id";

export type IntroCopy = {
  skip: string;
  navigation: string;
  intro: string;
  manifesto: string;
  experience: string;
  projects: string;
  lab: string;
  contact: string;
  contactTitle: string;
  contactTitleLeft: string;
  contactTitleRight: string;
  contactGetInTouch: string;
  contactStayInTouch: string;
  contactIntro: string;
  contactHeading: string;
  contactName: string;
  contactEmail: string;
  contactMessage: string;
  contactSend: string;
  contactBase: string;
  contactSuccess: string;
  footerSocial: string;
  footerNavigation: string;
  footerBackToTop: string;
  footerRights: string;
  footerCredits: string;
  footerCoordinates: string;
  later: string;
  menu: string;
  close: string;
  language: string;
  role: string;
  developmentFocusLabel: string;
  developmentFocus: string;
  engineeringApproachLabel: string;
  engineeringApproach: string;
  clock: string;
  eyebrow: string;
  headline: readonly [string, string, string];
  headlineLabel: string;
  promo: string;
  description: string;
  read: string;
  github: string;
  scroll: string;
  pause: string;
  resume: string;
  ticker: readonly [string, string, string];
  statement: string;
  index: string;
  portraitAlt: string;
  portraitAction: string;
  portraitHint: string;
  aboutLabel: string;
  aboutHeading: string;
  aboutLead: string;
  aboutBody: string;
  aboutBodySecondary: string;
  aboutMore: string;
  aboutLess: string;
  profileLabel: string;
  profileNameLabel: string;
  profileLocationLabel: string;
  profileLocation: string;
  profileRoleLabel: string;
  profileRole: string;
  profileEducationLabel: string;
  profileEducation: string;
  profileStatusLabel: string;
  profileStatus: string;
  profileLanguagesLabel: string;
  profileLanguages: string;
  profileLinkedInAction: string;
  profileGitHubAction: string;
  seeProjects: string;
  getInTouch: string;
};

export type PillarCopy = {
  label: string;
  title: string;
  description: string;
};

export const pillarsCopy: Record<Locale, { label: string; items: readonly PillarCopy[] }> = {
  en: {
    label: "Areas of practice",
    items: [
      { label: "Web & Mobile Development", title: "Building Digital Experiences", description: "Developing functional, responsive web and mobile applications that are easy to use. Bringing technology and user needs together to create relevant digital solutions." },
      { label: "Backend & Data", title: "Behind Every Interaction", description: "Building application logic, managing data, and integrating services so every feature works as intended. Focusing on an organized system structure that is easy to extend." },
      { label: "UI/UX Design", title: "Design with Purpose", description: "Designing interfaces that are not only visually appealing, but also intuitive and comfortable to use. Considering information hierarchy, consistency, and the user experience in every design." },
    ],
  },
  id: {
    label: "Bidang praktik",
    items: [
      { label: "Pengembangan Web & Mobile", title: "Membangun Pengalaman Digital", description: "Mengembangkan aplikasi web dan mobile yang fungsional, responsif, dan mudah digunakan. Menggabungkan teknologi dengan kebutuhan pengguna untuk menghasilkan solusi digital yang relevan." },
      { label: "Backend & Data", title: "Di Balik Setiap Interaksi", description: "Membangun logika aplikasi, mengelola data, dan mengintegrasikan layanan agar setiap fitur dapat berjalan dengan baik. Berfokus pada struktur sistem yang terorganisir dan mudah dikembangkan." },
      { label: "Desain UI/UX", title: "Desain yang Punya Tujuan", description: "Merancang antarmuka yang tidak hanya menarik secara visual, tetapi juga intuitif dan nyaman digunakan. Memperhatikan hierarki informasi, konsistensi, dan pengalaman pengguna dalam setiap rancangan." },
    ],
  },
};

export const identity = {
  name: "Muhamad Dikrulloh",
  givenName: "Muhamad",
  familyName: "Dikrulloh",
  mark: "MD.",
  ...location,
  email: "muhamaddikrulloh@gmail.com",
  github: "https://github.com/muhamaddikrulloh",
  linkedin: "https://www.linkedin.com/in/muhamaddikrulloh",
};

export const introCopy: Record<Locale, IntroCopy> = {
  en: {
    skip: "Skip to main content",
    navigation: "Main navigation",
    intro: "Introduction",
    manifesto: "Manifesto",
    experience: "Experience",
    projects: "Projects",
    lab: "Lab",
    contact: "Contact",
    contactTitle: "LET'S WORK TOGETHER",
    contactTitleLeft: "LET'S",
    contactTitleRight: "TALK.",
    contactGetInTouch: "GET IN TOUCH",
    contactStayInTouch: "Let's Stay in Touch",
    contactIntro: "I am always open to new opportunities and collaborations. Feel free to contact me!",
    contactHeading: "Let's talk.",
    contactName: "Your name",
    contactEmail: "your@email.com",
    contactMessage: "Your message...",
    contactSend: "Send Message",
    contactBase: "Sukabumi, West Java, Indonesia",
    contactSuccess: "Thank you! Your message has been prepared.",
    footerSocial: "Social",
    footerNavigation: "Navigation",
    footerBackToTop: "Back to top",
    footerRights: "© 2026 Muhamad Dikrulloh. All rights reserved",
    footerCredits: "Design & Code — Muhamad Dikrulloh · Big Shoulders Display, Geist · Next.js, React, GSAP",
    footerCoordinates: identity.coordinates,
    later: "Available in a later phase",
    menu: "Menu",
    close: "Close menu",
    language: "Switch to Indonesian",
    role: "Web & Mobile App Developer",
    developmentFocusLabel: "Development focus",
    developmentFocus: "Web • Android apps",
    engineeringApproachLabel: "Engineering approach",
    engineeringApproach: "Functional systems • Thoughtful UI",
    clock: "Local time",
    eyebrow: "[ 00 ] · PERSONAL PORTFOLIO",
    headline: ["Turning", "curiosity into", "something real."],
    headlineLabel: "Turning Curiosity Into Something Real.",
    promo: "Open the repositories. Read the implementation.",
    description: "I develop functional, high-quality web and mobile applications with a focus on user experience.",
    read: "Read manifesto",
    github: "View GitHub",
    seeProjects: "See projects",
    getInTouch: "Get in touch",
    scroll: "Scroll",
    pause: "Pause motion",
    resume: "Resume motion",
    ticker: ["Explore", "Create", "Improve"],
    statement: "Good work starts with curiosity.\nIt gets better with care.",
    index: "Index",
    portraitAlt: `Portrait of ${identity.name}`,
    portraitAction: "Toggle portrait photo",
    portraitHint: "Paint to reveal photo · tap to switch",
    aboutLabel: "About",
    aboutHeading: "Beyond the screen.",
    aboutLead: "I develop web and mobile applications with a focus on functionality, thoughtful design, and user experience. To me, great software must be visually engaging while remaining thoroughly dependable.",
    aboutBody: "When developing web and mobile applications, I focus on how design, features, and underlying architecture work together to create software that feels natural to use. I believe great user experiences come from combining an engaging interface, purposeful functionality, and a system that performs consistently.",
    aboutBodySecondary: "I also prioritize a structured development process, from understanding requirements and shaping solutions to turning them into working applications. Every stage is an opportunity to refine the build, solve technical challenges, and create software that remains easy to expand over time.",
    aboutMore: "Read more",
    aboutLess: "Show less",
    profileLabel: "Profile",
    profileNameLabel: "Full name",
    profileLocationLabel: "Based in",
    profileLocation: "Sukabumi, West Java · ID",
    profileRoleLabel: "Role",
    profileRole: "Web & Mobile App Developer",
    profileEducationLabel: "Education",
    profileEducation: "Informatics · UMMI (2024–Present)",
    profileStatusLabel: "Status",
    profileStatus: "Open to Projects & Teams",
    profileLanguagesLabel: "Languages",
    profileLanguages: "Indonesian (Native) · English",
    profileLinkedInAction: "Connect on LinkedIn",
    profileGitHubAction: "GitHub Repositories",
  },
  id: {
    skip: "Lewati ke konten utama",
    navigation: "Navigasi utama",
    intro: "Perkenalan",
    manifesto: "Manifesto",
    experience: "Pengalaman",
    projects: "Proyek",
    lab: "Lab",
    contact: "Kontak",
    contactTitle: "MARI BEKERJA BERSAMA",
    contactTitleLeft: "MARI",
    contactTitleRight: "BICARA.",
    contactGetInTouch: "HUBUNGI SAYA",
    contactStayInTouch: "Tetap Terhubung",
    contactIntro: "Saya selalu terbuka untuk peluang baru dan kolaborasi. Jangan ragu menghubungi saya!",
    contactHeading: "Mari bicara.",
    contactName: "Nama Anda",
    contactEmail: "email@anda.com",
    contactMessage: "Pesan Anda...",
    contactSend: "Kirim Pesan",
    contactBase: "Sukabumi, Jawa Barat, Indonesia",
    contactSuccess: "Terima kasih! Pesan Anda telah disiapkan.",
    footerSocial: "Sosial",
    footerNavigation: "Navigasi",
    footerBackToTop: "Kembali ke atas",
    footerRights: "© 2026 Muhamad Dikrulloh. Hak cipta dilindungi",
    footerCredits: "Desain & Kode — Muhamad Dikrulloh · Big Shoulders Display, Geist · Next.js, React, GSAP",
    footerCoordinates: identity.coordinates,
    later: "Tersedia pada fase berikutnya",
    menu: "Menu",
    close: "Tutup menu",
    language: "Ganti ke bahasa Inggris",
    role: "Pengembang Web & Aplikasi Mobile",
    developmentFocusLabel: "Fokus pengembangan",
    developmentFocus: "Web • Aplikasi Android",
    engineeringApproachLabel: "Pendekatan teknis",
    engineeringApproach: "Sistem fungsional • Antarmuka tertata",
    clock: "Waktu lokal",
    eyebrow: "[ 00 ] · PORTFOLIO PRIBADI",
    headline: ["Dari rasa", "ingin tahu", "menjadi nyata."],
    headlineLabel: "Dari rasa ingin tahu menjadi sesuatu yang nyata.",
    promo: "Buka repositorinya. Telusuri implementasinya.",
    description: "Saya mengembangkan aplikasi web dan mobile yang fungsional, berkualitas, dan berorientasi pada pengalaman pengguna.",
    read: "Baca manifesto",
    github: "Lihat GitHub",
    seeProjects: "Lihat proyek",
    getInTouch: "Hubungi saya",
    scroll: "Gulir",
    pause: "Jeda animasi",
    resume: "Lanjutkan animasi",
    ticker: ["Jelajahi", "Ciptakan", "Sempurnakan"],
    statement: "Karya berawal dari rasa ingin tahu.\nLalu tumbuh lewat perhatian pada detail.",
    index: "Indeks",
    portraitAlt: `Potret ${identity.name}`,
    portraitAction: "Ganti tampilan foto potret",
    portraitHint: "Sapukan untuk melihat foto · tap untuk beralih",
    aboutLabel: "Tentang",
    aboutHeading: "Di balik tampilan.",
    aboutLead: "Saya mengembangkan aplikasi web dan mobile dengan mengutamakan fungsionalitas, desain yang matang, dan pengalaman pengguna. Bagi saya, aplikasi yang baik harus menarik secara visual sekaligus dapat diandalkan.",
    aboutBody: "Dalam mengembangkan aplikasi web dan mobile, saya memperhatikan bagaimana desain, fitur, dan sistem saling mendukung untuk menghasilkan aplikasi yang nyaman digunakan. Saya percaya bahwa pengalaman pengguna yang baik lahir dari perpaduan tampilan yang menarik, fungsionalitas yang tepat, dan sistem yang bekerja secara konsisten.",
    aboutBodySecondary: "Saya juga mengutamakan proses pengembangan yang terstruktur, mulai dari memahami kebutuhan, merancang solusi, hingga mengimplementasikannya menjadi aplikasi yang dapat digunakan. Setiap proses menjadi kesempatan untuk menyempurnakan hasil, mengatasi tantangan teknis, dan menghasilkan aplikasi yang mudah dikembangkan lebih lanjut.",
    aboutMore: "Selengkapnya",
    aboutLess: "Tampilkan lebih sedikit",
    profileLabel: "Profil",
    profileNameLabel: "Nama lengkap",
    profileLocationLabel: "Lokasi",
    profileLocation: "Sukabumi, Jawa Barat · ID",
    profileRoleLabel: "Peran",
    profileRole: "Pengembang Web & Mobile",
    profileEducationLabel: "Pendidikan",
    profileEducation: "Teknik Informatika · UMMI (2024–Sekarang)",
    profileStatusLabel: "Status",
    profileStatus: "Terbuka untuk Proyek & Tim",
    profileLanguagesLabel: "Bahasa",
    profileLanguages: "Indonesia (Utama) · Inggris",
    profileLinkedInAction: "Terhubung di LinkedIn",
    profileGitHubAction: "Repositori GitHub",
  },
};
