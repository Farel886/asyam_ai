// src/data/asyam.js
// Semua data Asyam. Edit di sini kalau ada update.
// File ini di-import oleh route.js dan disisipkan ke system prompt.

export const ASYAM_DATA = {
  name: "Asyam Farrel Dzakwan",
  nickname: "Asyam",
  role: "Student developer & AI enthusiast",
  location: "Indonesia",
  timezone: "Asia/Jakarta",
  school: "SMP Negeri 3 Cepu",
  bio: "Student developer from Indonesia interested in how technology can solve problems and make complex ideas easier to understand. Learns by building experiments and improving them step by step.",

  // ↓ Field baru
  hobbies: ["Coding", "Reading", "Gaming"],
  achievements: [
    "Built Asyam AI Portfolio with Gemini API",
    "Learning Python and computer vision",
  ],
  education: [
    {
      school: "SMP Negeri 3 Cepu",
      year: "2023 — now",
      desc: "Currently studying",
    },
  ],

  skills: [
    "JavaScript",
    "React",
    "Next.js",
    "Node.js",
    "Python",
    "OpenCV",
    "Gemini API",
  ],
  learning: ["Python", "Computer Vision", "AI"],
  projects: [
    {
      name: "Asyam AI Portfolio",
      desc: "A personal portfolio with a Gemini-powered AI assistant. Built with Next.js, React, and API integration.",
      stack: "Next.js, React, Gemini API",
      status: "Live",
    },
    {
      name: "Experiment Project",
      desc: "Small experiments around web development and computer vision using Python and OpenCV.",
      stack: "Python, OpenCV",
      status: "In progress",
    },
  ],
  contact: {
    email: "farrelanakpintar@gmail.com",
    github: "https://github.com/Farel886",
    tiktok: "https://tiktok.com/@oscarlevha",
  },
  principles: [
    "Stay curious",
    "Build to learn",
    "Keep it useful",
    "Improve steadily",
  ],
  languages: ["Indonesian", "English"],
};

// Ubah object di atas menjadi teks yang rapi untuk system prompt
export function formatAsyamDataForPrompt() {
  const d = ASYAM_DATA;
  return [
    `- Nama lengkap: ${d.name}`,
    `- Nama panggilan: ${d.nickname}`,
    `- Role: ${d.role}`,
    `- Lokasi: ${d.location} (timezone ${d.timezone})`,
    `- Sekolah: ${d.school}`,
    `- Bio: ${d.bio}`,
    `- Hobi: ${d.hobbies.join(", ")}`,
    `- Pencapaian:`,
    ...d.achievements.map((a) => `  - ${a}`),
    `- Pendidikan:`,
    ...d.education.map((e) => `  - ${e.school} (${e.year}): ${e.desc}`),
    `- Skill: ${d.skills.join(", ")}`,
    `- Sedang belajar: ${d.learning.join(", ")}`,
    `- Project:`,
    ...d.projects.map(
      (p) => `  - ${p.name} (${p.status}): ${p.desc} [Stack: ${p.stack}]`
    ),
    `- Prinsip: ${d.principles.join(", ")}`,
    `- Bahasa: ${d.languages.join(", ")}`,
    `- Email: ${d.contact.email}`,
    `- GitHub: ${d.contact.github}`,
    `- TikTok: ${d.contact.tiktok}`,
  ].join("\n");
}
