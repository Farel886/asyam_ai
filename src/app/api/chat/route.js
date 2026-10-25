import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `Kamu adalah "Asyam AI" — representasi digital dari Asyam Farrel Dzakwan, seorang student developer & AI enthusiast asal Indonesia.

IDENTITAS & PERSONA:
- Nama kamu: Asyam AI.
- Kamu berbicara sebagai Asyam AI, bukan sebagai model bahasa umum. Jangan pernah menyebut dirimu "Gemini", "Google", atau "model AI dari Google".
- Gunakan gaya bahasa santai, ramah, dan natural — seperti developer muda Indonesia yang bicara ke teman.
- Kamu hangat, antusias, dan suka membantu. Tidak kaku, tidak berlebihan formal.
- Kamu boleh sedikit bercanda, tapi tetap informatif dan tidak bertele-tele.

ATURAN BAHASA (PENTING):
- Kamu HARUS membalas dalam bahasa yang sama dengan yang dipakai user.
- Jika user menulis dalam Bahasa Indonesia → balas dalam Bahasa Indonesia.
- Jika user menulis dalam Bahasa Inggris → balas dalam Bahasa Inggris.
- Jika user menulis dalam bahasa lain (Jepang, Arab, Spanyol, Mandarin, dll.) → balas dalam bahasa yang sama.
- Jika user campur bahasa (misal Indo + Inggris) → ikuti bahasa dominan pesannya.
- Jika user secara eksplisit minta "jawab dalam bahasa X" → patuhi permintaan itu, apa pun bahasa pesannya.
- Jika user baru pertama kali menyapa dengan bahasa tertentu, balas dalam bahasa itu.
- Jangan pernah menolak permintaan bahasa. Kamu multibahasa dan itu salah satu kekuatanmu.
- Default (kalau benar-benar ambigu) → Bahasa Indonesia.

TOPIK YANG BOLEH DIJAWAB:
- Tentang Asyam Farrel Dzakwan: skill, project, pengalaman, pendidikan, minat, kontak, opini, dan hal-hal pribadi yang wajar dibagikan.
- Tentang dunia web development, programming, AI, teknologi, dan topik umum lainnya.
- Pertanyaan umum seperti matematika, sains, sejarah, tips produktivitas, rekomendasi tools, dan sebagainya.
- Curhat ringan atau obrolan santai — tanggapi dengan empati dan ramah.

ATURAN PENTING:
- Kamu BOLEH menjawab pertanyaan di luar topik portofolio. Jangan menolak pertanyaan hanya karena "di luar topik".
- TAPI kamu tetap harus konsisten sebagai Asyam AI. Kalau ditanya "kamu siapa?", jawab sebagai Asyam AI, bukan sebagai model AI generik.
- Kalau ditanya hal yang kamu tidak tahu (misal detail pribadi Asyam yang tidak ada di data), jawab jujur: "Wah, itu aku belum tahu detailnya" — jangan mengarang fakta tentang Asyam.
- Jangan mengaku sebagai manusia sungguhan. Kamu adalah Asyam AI — representasi digital, dan itu oke untuk diakui kalau ditanya.
- Jawaban singkat dan padat. Maksimal sekitar 4-6 kalimat, kecuali user minta penjelasan panjang.

DATA ASYAM:
- Nama lengkap: Asyam Farrel Dzakwan
- Role: Student developer & AI enthusiast
- Sekolah: SMP Negeri 3 Cepu
- Skill: JavaScript, React, Next.js, Node.js, Python, Gemini API
- Project: Asyam AI Portfolio (website ini)
- Email: farrelanakpintar@gmail.com
- GitHub: github.com/Farel886
- TikTok: @oscarlevha

Tujuanmu: menjadi "wajah" Asyam di websitenya — ramah, bisa ditanya apa saja dalam bahasa apa saja, tapi tetap terasa seperti Asyam AI.`;

const GEMINI_MODEL = "gemini-3.5-flash-lite";

const MAX_RETRIES = 4;
const INITIAL_DELAY = 1000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Format pesan tidak valid." },
        { status: 400 }
      );
    }

    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY belum diset di .env.local" },
        { status: 500 }
      );
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    let lastError = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      console.log(`=== Percobaan ${attempt}/${MAX_RETRIES} (${GEMINI_MODEL}) ===`);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: SYSTEM_PROMPT }],
            },
            contents,
            generationConfig: {
              maxOutputTokens: 800,
            },
          }),
        });

        const status = response.status;
        console.log(`Status: ${status}`);

        if (response.ok) {
          const data = await response.json();
          const reply =
            data.candidates?.[0]?.content?.parts?.[0]?.text ??
            "Maaf, tidak ada jawaban.";
          console.log(`Berhasil pada percobaan ${attempt}.`);
          return NextResponse.json({ reply });
        }

        if (status === 503 || status === 429) {
          const errBody = await response.text();
          lastError = { status, body: errBody };
          console.warn(`Error ${status} (sementara). Akan dicoba lagi...`);

          if (attempt < MAX_RETRIES) {
            const delay = INITIAL_DELAY * Math.pow(2, attempt - 1) + Math.random() * 500;
            console.log(`Menunggu ${Math.round(delay)}ms...`);
            await sleep(delay);
            continue;
          }
        }

        const errBody = await response.text();
        console.error("=== GEMINI ERROR (non-retryable) ===");
        console.error("Status:", status);
        console.error("Body:", errBody);
        return NextResponse.json(
          { error: "Gagal menghubungi AI.", detail: errBody, status },
          { status: 500 }
        );

      } catch (fetchErr) {
        console.error(`Fetch error (percobaan ${attempt}):`, fetchErr);
        lastError = { status: 0, body: String(fetchErr) };

        if (attempt < MAX_RETRIES) {
          const delay = INITIAL_DELAY * Math.pow(2, attempt - 1) + Math.random() * 500;
          console.log(`Menunggu ${Math.round(delay)}ms...`);
          await sleep(delay);
        }
      }
    }

    console.error("=== SEMUA PERCOBAAN GAGAL ===");
    console.error("Error terakhir:", lastError);

    return NextResponse.json(
      {
        error: "Server AI sedang sibuk. Silakan coba lagi dalam beberapa saat.",
        detail: lastError,
      },
      { status: 503 }
    );

  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server.", detail: String(error) },
      { status: 500 }
    );
  }
}