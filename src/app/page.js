"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";

const ACCENT = "#2563eb";
const ACCENT_SOFT = "rgba(37,99,235,0.08)";
const ACCENT_BORDER = "rgba(37,99,235,0.25)";

const SUGGESTIONS = [
  "Who are you?",
  "What are Asyam's skills?",
  "What is Asyam building?",
  "Web dev learning tips?",
];

const INITIAL_MESSAGE = {
  role: "assistant",
  content:
    "Hi! I'm Asyam AI — a digital representation of Asyam Farrel Dzakwan. Ask me anything: about the portfolio, coding, or just a casual chat. I reply in whatever language you use.",
  time: null,
};

const PROJECTS = [
  {
    num: "01",
    title: "Asyam AI Portfolio",
    desc: "A personal portfolio with a Gemini-powered AI assistant. Built with Next.js, React, and API integration.",
    tag: "Next.js · AI",
  },
  {
    num: "02",
    title: "Experiment Project",
    desc: "Small experiments around web development and computer vision using Python and OpenCV.",
    tag: "Python · CV",
  },
  {
    num: "03",
    title: "Coming Soon",
    desc: "Still in progress. Every project is a chance to learn something new.",
    tag: "In progress",
  },
];

const TICKER_ITEMS = ["Think", "Build", "Experiment", "Learn", "Repeat"];

const NOW_ITEMS = [
  { label: "Learning", value: "Python & Computer Vision" },
  { label: "Building", value: "Asyam AI Portfolio" },
  { label: "Reading", value: "Docs, articles, and source code" },
  { label: "School", value: "SMP Negeri 3 Cepu" },
];

const PRINCIPLES = [
  { num: "01", title: "Stay curious", desc: "Ask questions and keep exploring." },
  { num: "02", title: "Build to learn", desc: "Turn ideas into practical experiments." },
  { num: "03", title: "Keep it useful", desc: "Focus on solving meaningful problems." },
  { num: "04", title: "Improve steadily", desc: "Use feedback to get better over time." },
];

// Hapus tanda markdown supaya bubble chat tetap bersih
function stripMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/```[\s\S]*?```/g, (match) =>
      match.replace(/```[a-zA-Z]*\n?/g, "").replace(/```/g, "")
    )
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/^\s*>\s?/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatTime() {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date());
  } catch {
    return "";
  }
}

export default function Home() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState("--:--");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const chatAreaRef = useRef(null);
  const inputRef = useRef(null);
  const mounted = useRef(false);
  const copyTimer = useRef(null);

  // Auto-scroll HANYA di dalam chat container
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const el = chatAreaRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
    return () => cancelAnimationFrame(raf);
  }, [messages, loading]);

  // Live Jakarta time
  useEffect(() => {
    function tick() {
      try {
        const now = new Date();
        const formatted = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(now);
        setTime(formatted);
      } catch {
        setTime("--:--");
      }
    }
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, []);

  // Focus input after loading
  useEffect(() => {
    if (!loading) inputRef.current?.focus({ preventScroll: true });
  }, [loading]);

  // Scroll reveal
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => (el.style.opacity = 1));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = 1;
            entry.target.style.transform = "translateY(0)";
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => {
      el.style.opacity = 0;
      el.style.transform = "translateY(14px)";
      el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
      io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  // Cleanup copy timer
  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  // Deteksi user scroll ke atas
  function handleChatScroll() {
    const el = chatAreaRef.current;
    if (!el) return;
    const isNearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setShowScrollBtn(!isNearBottom);
  }

  function scrollToBottom() {
    const el = chatAreaRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    setShowScrollBtn(false);
  }

  async function copyMessage(text, index) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopiedIndex(null), 1500);
    } catch {
      // clipboard tidak tersedia
    }
  }

  const sendMessage = useCallback(
    async (text) => {
      const content = (text ?? input).trim();
      if (!content || loading) return;

      const newMessages = [
        ...messages,
        { role: "user", content, time: formatTime() },
      ];
      setMessages(newMessages);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.reply,
            time: formatTime(),
          },
        ]);
      } catch (err) {
        console.error(err);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Sorry, I'm having connection trouble. Please try again.",
            time: formatTime(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages]
  );

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage();
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleReset() {
    setMessages([INITIAL_MESSAGE]);
    setInput("");
    setShowScrollBtn(false);
  }

  const showSuggestions = messages.length === 1 && !loading;

  return (
    <main style={styles.page}>
      <div style={styles.gridBg} aria-hidden="true" />

      {/* ================= HEADER ================= */}
      <header style={styles.header}>
        <div style={styles.brand}>
          <span style={styles.brandMark}>A</span>
          <span style={styles.brandName}>asyam.f</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.statusPulse} />
          <span style={styles.headerMono}>Available for collaboration</span>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.heroGrid}>
            <div style={styles.heroText}>
              <p style={styles.eyebrow}>
                <span style={styles.eyebrowLine} />
                Student developer · Indonesia
              </p>
              <h1 style={styles.heroTitle}>
                Building things
                <br />
                that <span style={styles.accentText}>matter</span>.
              </h1>
              <p style={styles.heroDesc}>
                I'm Asyam — I turn curiosity into experiments, projects, and
                useful digital experiences. Focused on web development, AI, and
                creative technology.
              </p>

              <div style={styles.schoolRow}>
                <div style={styles.schoolLogoWrap}>
                  <Image
                    src="/images/smp3.png"
                    alt="SMP Negeri 3 Cepu logo"
                    width={40}
                    height={40}
                    style={styles.schoolLogo}
                  />
                </div>
                <div>
                  <div style={styles.schoolLabel}>Currently studying at</div>
                  <div style={styles.schoolName}>SMP Negeri 3 Cepu</div>
                </div>
              </div>

              <div style={styles.heroActions}>
                <a href="#ai" style={styles.primaryBtn} className="primary-btn">
                  Try Asyam AI <span style={styles.btnArrow}>↓</span>
                </a>
                <a
                  href="#contact"
                  style={styles.secondaryBtn}
                  className="secondary-btn"
                >
                  Contact
                </a>
              </div>
            </div>

            <div style={styles.heroImageWrap}>
              <div style={styles.heroImageFrame}>
                <Image
                  src="/images/asyam.png"
                  alt="Asyam Farrel Dzakwan portrait"
                  width={260}
                  height={320}
                  sizes="(max-width: 720px) 220px, 260px"
                  style={styles.heroImage}
                  priority
                />
                <span style={styles.cornerTL} />
                <span style={styles.cornerBR} />
              </div>
              <div style={styles.heroImageMeta}>
                <div style={styles.metaRow}>
                  <span style={styles.metaKey}>Projects</span>
                  <span style={styles.metaVal}>03</span>
                </div>
                <div style={styles.metaRow}>
                  <span style={styles.metaKey}>Learning</span>
                  <span style={styles.metaVal}>Python</span>
                </div>
                <div style={styles.metaRow}>
                  <span style={styles.metaKey}>Jakarta</span>
                  <span style={{ ...styles.metaVal, color: ACCENT }}>
                    {time}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.ticker} aria-hidden="true">
          <div style={styles.tickerTrack}>
            {[0, 1].map((dup) => (
              <div key={dup} style={styles.tickerGroup}>
                {TICKER_ITEMS.map((item, i) => (
                  <span key={`${dup}-${i}`} style={styles.tickerItem}>
                    {item}
                    <span style={styles.tickerArrow}>↗</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 00 NOW ================= */}
      <section style={styles.section}>
        <div style={styles.sectionInner} data-reveal>
          <div style={styles.sectionHead}>
            <span style={styles.sectionNum}>00</span>
            <h2 style={styles.sectionLabel}>Now</h2>
          </div>
          <h3 style={styles.sectionTitle}>What I'm up to.</h3>
          <div style={styles.nowGrid}>
            {NOW_ITEMS.map((item) => (
              <div key={item.label} style={styles.nowCard}>
                <span style={styles.nowLabel}>{item.label}</span>
                <span style={styles.nowValue}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 01 ABOUT ================= */}
      <section style={styles.section}>
        <div style={styles.sectionInner} data-reveal>
          <div style={styles.sectionHead}>
            <span style={styles.sectionNum}>01</span>
            <h2 style={styles.sectionLabel}>About</h2>
          </div>
          <h3 style={styles.sectionTitle}>
            Learning by building,
            <br />
            one experiment at a time.
          </h3>
          <div style={styles.twoCol}>
            <p style={styles.body}>
              I'm Asyam, a student developer from Indonesia interested in how
              technology can solve problems and make complex ideas easier to
              understand.
            </p>
            <p style={styles.body}>
              My projects help me learn beyond the classroom. I explore Python,
              web development, artificial intelligence, and computer vision by
              creating practical experiments and improving them step by step.
            </p>
          </div>

          <div style={styles.aboutSchool}>
            <div style={styles.aboutSchoolLogo}>
              <Image
                src="/images/smp3.png"
                alt="SMP Negeri 3 Cepu logo"
                width={48}
                height={48}
                style={styles.schoolLogo}
              />
            </div>
            <div>
              <div style={styles.aboutSchoolLabel}>Education</div>
              <div style={styles.aboutSchoolName}>SMP Negeri 3 Cepu</div>
              <div style={styles.aboutSchoolDesc}>
                Currently a student, learning through projects and experiments
                outside the classroom.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 02 WORK ================= */}
      <section style={styles.section}>
        <div style={styles.sectionInner} data-reveal>
          <div style={styles.sectionHead}>
            <span style={styles.sectionNum}>02</span>
            <h2 style={styles.sectionLabel}>Selected work</h2>
          </div>
          <h3 style={styles.sectionTitle}>Things I'm building.</h3>
          <p style={styles.sectionDesc}>
            Projects, experiments, and ideas in progress — each one a chance to
            learn something new.
          </p>

          <div style={styles.projectList}>
            {PROJECTS.map((p) => (
              <article
                key={p.num}
                style={styles.projectRow}
                className="project-row"
              >
                <span style={styles.projectNum}>{p.num}</span>
                <div style={styles.projectBody}>
                  <h4 style={styles.projectTitle}>{p.title}</h4>
                  <p style={styles.projectDesc}>{p.desc}</p>
                </div>
                <span style={styles.projectTag}>{p.tag}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ================= QUOTE ================= */}
      <section style={styles.quoteSection}>
        <div style={styles.quoteInner} data-reveal>
          <p style={styles.quoteText}>
            "Stay curious. Build to learn.
            <br />
            Keep it useful."
          </p>
          <span style={styles.quoteBy}>— Asyam</span>
        </div>
      </section>

      {/* ================= 03 ASYAM AI ================= */}
      <section id="ai" style={styles.aiSection}>
        <div style={styles.aiInner} data-reveal>
          <div style={styles.sectionHead}>
            <span style={styles.sectionNum}>03</span>
            <h2 style={styles.sectionLabel}>Asyam AI</h2>
          </div>
          <h3 style={styles.sectionTitle}>
            Ask anything.
            <br />
            I'm <span style={styles.accentText}>here</span>.
          </h3>
          <p style={styles.sectionDesc}>
            My digital assistant, powered by Gemini API. Ask about the
            portfolio, coding, or just chat — in any language.
          </p>

          <div style={styles.chatCard}>
            <header style={styles.chatHeader}>
              <div style={styles.chatHeaderLeft}>
                <span style={styles.chatDot} />
                <div>
                  <div style={styles.chatTitle}>Asyam AI Demo</div>
                  <div style={styles.chatSubtitle}>
                    {loading ? (
                      <span style={{ color: ACCENT }}>Typing…</span>
                    ) : (
                      "Online · ready to chat"
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReset}
                style={styles.resetBtn}
                disabled={loading}
              >
                Reset
              </button>
            </header>

            <div style={styles.chatWrap}>
              <div
                ref={chatAreaRef}
                style={styles.chatArea}
                role="log"
                aria-live="polite"
                aria-label="Conversation with Asyam AI"
                onScroll={handleChatScroll}
              >
                {messages.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      ...styles.msgRow,
                      justifyContent:
                        m.role === "user" ? "flex-end" : "flex-start",
                    }}
                  >
                    {m.role === "assistant" && (
                      <div style={styles.bubbleAvatar} aria-hidden="true">
                        A
                      </div>
                    )}
                    <div style={styles.bubbleWrap}>
                      <div
                        style={{
                          ...styles.bubble,
                          background:
                            m.role === "user" ? "#111111" : ACCENT_SOFT,
                          color:
                            m.role === "user" ? "#ffffff" : "#111111",
                          border:
                            m.role === "user"
                              ? "1px solid #111111"
                              : `1px solid ${ACCENT_BORDER}`,
                          borderTopLeftRadius:
                            m.role === "assistant" ? 2 : 8,
                          borderTopRightRadius:
                            m.role === "user" ? 2 : 8,
                        }}
                      >
                        {stripMarkdown(m.content)}
                      </div>
                      <div
                        style={{
                          ...styles.bubbleMeta,
                          justifyContent:
                            m.role === "user" ? "flex-end" : "flex-start",
                        }}
                      >
                        {m.time && (
                          <span style={styles.bubbleTime}>{m.time}</span>
                        )}
                        {m.role === "assistant" && i !== 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              copyMessage(stripMarkdown(m.content), i)
                            }
                            style={styles.copyBtn}
                            aria-label="Copy message"
                          >
                            {copiedIndex === i ? "Copied!" : "Copy"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div
                    style={{ ...styles.msgRow, justifyContent: "flex-start" }}
                  >
                    <div style={styles.bubbleAvatar} aria-hidden="true">
                      A
                    </div>
                    <div
                      style={{
                        ...styles.bubble,
                        background: ACCENT_SOFT,
                        border: `1px solid ${ACCENT_BORDER}`,
                        display: "flex",
                        gap: 4,
                        alignItems: "center",
                        borderTopLeftRadius: 2,
                      }}
                    >
                      <span style={styles.typingDot} />
                      <span
                        style={{
                          ...styles.typingDot,
                          animationDelay: "0.15s",
                        }}
                      />
                      <span
                        style={{
                          ...styles.typingDot,
                          animationDelay: "0.3s",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {showScrollBtn && (
                <button
                  type="button"
                  onClick={scrollToBottom}
                  style={styles.scrollBtn}
                  aria-label="Scroll to latest message"
                >
                  ↓
                </button>
              )}
            </div>

            {showSuggestions && (
              <div style={styles.suggestions}>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => sendMessage(s)}
                    style={styles.suggestionBtn}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} style={styles.form}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything…"
                style={styles.input}
                aria-label="Message for Asyam AI"
              />
              <button
                type="submit"
                style={{
                  ...styles.sendBtn,
                  opacity: loading || !input.trim() ? 0.5 : 1,
                  cursor:
                    loading || !input.trim() ? "not-allowed" : "pointer",
                }}
                disabled={loading || !input.trim()}
              >
                {loading ? "…" : "Send"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ================= 04 TOOLKIT ================= */}
      <section style={styles.section}>
        <div style={styles.sectionInner} data-reveal>
          <div style={styles.sectionHead}>
            <span style={styles.sectionNum}>04</span>
            <h2 style={styles.sectionLabel}>Toolkit</h2>
          </div>
          <h3 style={styles.sectionTitle}>
            Tools I use.
            <br />
            Skills I'm growing.
          </h3>

          <div style={styles.toolkitGrid}>
            <div style={styles.toolkitCard} className="toolkit-card">
              <span style={styles.toolkitNum}>01 / 03</span>
              <h4 style={styles.toolkitTitle}>Development</h4>
              <p style={styles.toolkitDesc}>
                Building interactive digital experiences.
              </p>
              <ul style={styles.tagList}>
                <li style={styles.tag}>HTML & CSS</li>
                <li style={styles.tag}>JavaScript</li>
                <li style={styles.tag}>Next.js</li>
                <li style={styles.tag}>Responsive</li>
              </ul>
            </div>
            <div style={styles.toolkitCard} className="toolkit-card">
              <span style={styles.toolkitNum}>02 / 03</span>
              <h4 style={styles.toolkitTitle}>Programming</h4>
              <p style={styles.toolkitDesc}>
                Learning through practical experiments.
              </p>
              <ul style={styles.tagList}>
                <li style={styles.tag}>Python</li>
                <li style={styles.tag}>OpenCV</li>
                <li style={styles.tag}>API Integration</li>
              </ul>
            </div>
            <div style={styles.toolkitCard} className="toolkit-card">
              <span style={styles.toolkitNum}>03 / 03</span>
              <h4 style={styles.toolkitTitle}>Exploration</h4>
              <p style={styles.toolkitDesc}>
                Technologies I want to understand deeply.
              </p>
              <ul style={styles.tagList}>
                <li style={styles.tag}>AI</li>
                <li style={styles.tag}>Computer Vision</li>
                <li style={styles.tag}>Creative Tech</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 05 PRINCIPLES ================= */}
      <section style={styles.section}>
        <div style={styles.sectionInner} data-reveal>
          <div style={styles.sectionHead}>
            <span style={styles.sectionNum}>05</span>
            <h2 style={styles.sectionLabel}>Principles</h2>
          </div>
          <h3 style={styles.sectionTitle}>
            How I approach
            <br />
            the process.
          </h3>

          <div style={styles.principlesGrid}>
            {PRINCIPLES.map((p) => (
              <div key={p.num} style={styles.principleCard}>
                <span style={styles.principleNum}>{p.num}</span>
                <h4 style={styles.principleTitle}>{p.title}</h4>
                <p style={styles.principleDesc}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 06 CONTACT ================= */}
      <section id="contact" style={styles.section}>
        <div style={styles.sectionInner} data-reveal>
          <div style={styles.sectionHead}>
            <span style={styles.sectionNum}>06</span>
            <h2 style={styles.sectionLabel}>Contact</h2>
          </div>
          <h3 style={styles.sectionTitle}>
            Have an idea, a question,
            <br />
            or something to learn together?
          </h3>

          <ul style={styles.contactList}>
            <li style={styles.contactItem} className="contact-item">
              <span style={styles.contactKey}>Email</span>
              <a
                href="mailto:farrelanakpintar@gmail.com"
                style={styles.contactLink}
              >
                farrelanakpintar@gmail.com ↗
              </a>
            </li>
            <li style={styles.contactItem} className="contact-item">
              <span style={styles.contactKey}>GitHub</span>
              <a
                href="https://github.com/Farel886"
                target="_blank"
                rel="noopener noreferrer"
                style={styles.contactLink}
              >
                github.com/Farel886 ↗
              </a>
            </li>
            <li style={styles.contactItem} className="contact-item">
              <span style={styles.contactKey}>TikTok</span>
              <a
                href="https://tiktok.com/@oscarlevha"
                target="_blank"
                rel="noopener noreferrer"
                style={styles.contactLink}
              >
                @oscarlevha ↗
              </a>
            </li>
          </ul>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div style={styles.footerCol}>
            <div style={styles.footerBrand}>
              <span style={styles.brandMark}>A</span>
              <span style={styles.brandName}>asyam.f</span>
            </div>
            <p style={styles.footerTagline}>
              Student developer from Indonesia. Building things that matter.
            </p>
          </div>

          <div style={styles.footerCol}>
            <span style={styles.footerHeading}>Navigate</span>
            <a href="#ai" style={styles.footerLink}>
              Asyam AI
            </a>
            <a href="#contact" style={styles.footerLink}>
              Contact
            </a>
          </div>

          <div style={styles.footerCol}>
            <span style={styles.footerHeading}>Elsewhere</span>
            <a
              href="https://github.com/Farel886"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.footerLink}
            >
              GitHub
            </a>
            <a
              href="https://tiktok.com/@oscarlevha"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.footerLink}
            >
              TikTok
            </a>
            <a
              href="mailto:farrelanakpintar@gmail.com"
              style={styles.footerLink}
            >
              Email
            </a>
          </div>
        </div>

        <div style={styles.footerBottom}>
          <span style={styles.headerMono}>© 2025 Asyam Farrel Dzakwan</span>
          <span style={styles.headerMono}>
            Built with Next.js & Gemini API
          </span>
        </div>
      </footer>

      {/* ================= GLOBAL STYLE ================= */}
      <style jsx global>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes tickerMove {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes pulseRing {
          0% { box-shadow: 0 0 0 0 rgba(37,99,235,0.5); }
          70% { box-shadow: 0 0 0 8px rgba(37,99,235,0); }
          100% { box-shadow: 0 0 0 0 rgba(37,99,235,0); }
        }
        @keyframes gridShift {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
        @keyframes bubbleIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        :global(body) {
          margin: 0;
          font-family: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
          background: #fafafa;
          color: #111111;
          -webkit-font-smoothing: antialiased;
        }
        :global(a) { color: inherit; }
        :global(html) { scroll-behavior: smooth; }
        :global(*) { box-sizing: border-box; }
        :global(#ai),
        :global(#contact) { scroll-margin-top: 80px; }

        :global(.project-row) { transition: background 0.2s; }
        :global(.project-row:hover) { background: rgba(37,99,235,0.03); }
        :global(.project-row:hover h4) { color: #2563eb; }
        :global(.toolkit-card) {
          transition: border-color 0.2s, transform 0.2s;
        }
        :global(.toolkit-card:hover) {
          border-color: rgba(37,99,235,0.35) !important;
          transform: translateY(-2px);
        }
        :global(.contact-item:hover a) { color: #2563eb; }
        :global(.primary-btn) { transition: transform 0.15s; }
        :global(.primary-btn:hover) { transform: translateY(-1px); }
        :global(.secondary-btn) { transition: border-color 0.2s; }
        :global(.secondary-btn:hover) { border-color: #2563eb !important; }

        @media (max-width: 720px) {
          :global(h1) { font-size: 2.2rem !important; }
          :global(h3) { font-size: 1.4rem !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          :global(*),
          :global(*::before),
          :global(*::after) {
            animation-duration: 0.001ms !important;
            transition-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#fafafa",
    color: "#111111",
    position: "relative",
  },
  gridBg: {
    position: "fixed",
    inset: 0,
    backgroundImage:
      "linear-gradient(to right, rgba(0,0,0,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.035) 1px, transparent 1px)",
    backgroundSize: "40px 40px",
    animation: "gridShift 20s linear infinite",
    pointerEvents: "none",
    zIndex: 0,
  },

  /* ---------- HEADER ---------- */
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1.1rem 2rem",
    borderBottom: "1px solid #e5e5e5",
    position: "sticky",
    top: 0,
    background: "rgba(250,250,250,0.85)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    zIndex: 10,
  },
  brand: { display: "flex", alignItems: "center", gap: "0.6rem" },
  brandMark: {
    width: 28,
    height: 28,
    background: "#111111",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "0.85rem",
    borderRadius: 4,
  },
  brandName: {
    fontSize: "0.82rem",
    letterSpacing: "0.06em",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
    color: "#111111",
  },
  headerRight: { display: "flex", alignItems: "center", gap: 10 },
  statusPulse: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: ACCENT,
    display: "inline-block",
    animation: "pulseRing 2s infinite",
  },
  headerMono: {
    fontSize: "0.7rem",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#555555",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
  },

  /* ---------- HERO ---------- */
  hero: { borderBottom: "1px solid #e5e5e5", position: "relative", zIndex: 1 },
  heroInner: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "4.5rem 2rem 0",
  },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: "3rem",
    alignItems: "start",
  },
  heroText: { minWidth: 0 },
  eyebrow: {
    fontSize: "0.72rem",
    color: "#666666",
    margin: "0 0 1rem",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  eyebrowLine: {
    display: "inline-block",
    width: 24,
    height: 1,
    background: ACCENT,
  },
  heroTitle: {
    fontSize: "clamp(2.4rem, 6vw, 4.2rem)",
    lineHeight: 1.05,
    fontWeight: 500,
    letterSpacing: "-0.025em",
    margin: "0 0 1.5rem",
    color: "#111111",
  },
  accentText: { color: ACCENT },
  heroDesc: {
    fontSize: "1rem",
    lineHeight: 1.7,
    color: "#444444",
    maxWidth: 540,
    margin: "0 0 1.5rem",
  },
  schoolRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.7rem 0.9rem",
    border: "1px solid #e5e5e5",
    borderRadius: 6,
    background: "#ffffff",
    maxWidth: 340,
    marginBottom: "1.5rem",
  },
  schoolLogoWrap: {
    width: 40,
    height: 40,
    borderRadius: 4,
    overflow: "hidden",
    border: "1px solid #e5e5e5",
    background: "#fafafa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  schoolLogo: {
    objectFit: "contain",
    width: "100%",
    height: "100%",
    display: "block",
  },
  schoolLabel: {
    fontSize: "0.65rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#888888",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
  },
  schoolName: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#111111",
    marginTop: 2,
  },
  heroActions: { display: "flex", flexWrap: "wrap", gap: "0.65rem" },
  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "0.7rem 1.15rem",
    background: "#111111",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "0.82rem",
    fontWeight: 500,
    borderRadius: 4,
    border: "1px solid #111111",
  },
  btnArrow: { color: ACCENT },
  secondaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    padding: "0.7rem 1.15rem",
    background: "#ffffff",
    color: "#111111",
    textDecoration: "none",
    fontSize: "0.82rem",
    fontWeight: 500,
    borderRadius: 4,
    border: "1px solid #d4d4d4",
  },
  heroImageWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "0.9rem",
    width: 260,
    maxWidth: "100%",
  },
  heroImageFrame: {
    position: "relative",
    border: "1px solid #d4d4d4",
    borderRadius: 4,
    padding: 6,
    background: "#ffffff",
  },
  heroImage: {
    borderRadius: 2,
    objectFit: "cover",
    width: "100%",
    height: "auto",
    display: "block",
  },
  cornerTL: {
    position: "absolute",
    top: -1,
    left: -1,
    width: 16,
    height: 16,
    borderTop: `2px solid ${ACCENT}`,
    borderLeft: `2px solid ${ACCENT}`,
    borderTopLeftRadius: 4,
  },
  cornerBR: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 16,
    height: 16,
    borderBottom: `2px solid ${ACCENT}`,
    borderRight: `2px solid ${ACCENT}`,
    borderBottomRightRadius: 4,
  },
  heroImageMeta: { display: "flex", flexDirection: "column" },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.75rem",
    borderTop: "1px solid #e5e5e5",
    padding: "0.55rem 0",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
  },
  metaKey: { color: "#888888" },
  metaVal: { color: "#111111", fontWeight: 500 },

  /* ---------- TICKER ---------- */
  ticker: {
    marginTop: "4rem",
    borderTop: "1px solid #e5e5e5",
    padding: "1.05rem 0",
    overflow: "hidden",
    whiteSpace: "nowrap",
  },
  tickerTrack: {
    display: "inline-flex",
    animation: "tickerMove 30s linear infinite",
  },
  tickerGroup: { display: "inline-flex", flexShrink: 0 },
  tickerItem: {
    fontSize: "0.9rem",
    letterSpacing: "0.04em",
    color: "#444444",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
    paddingRight: "1.5rem",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },
  tickerArrow: { color: ACCENT, fontSize: "0.85rem" },

  /* ---------- NOW ---------- */
  nowGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "0.75rem",
    marginTop: "1.5rem",
  },
  nowCard: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: "0.9rem 1rem",
    border: "1px solid #e5e5e5",
    borderRadius: 6,
    background: "#ffffff",
  },
  nowLabel: {
    fontSize: "0.68rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#888888",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
  },
  nowValue: {
    fontSize: "0.88rem",
    color: "#111111",
    fontWeight: 500,
  },

  /* ---------- ABOUT ---------- */
  aboutSchool: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.9rem",
    marginTop: "2rem",
    padding: "1rem",
    border: "1px solid #e5e5e5",
    borderRadius: 6,
    background: "#ffffff",
  },
  aboutSchoolLogo: {
    width: 48,
    height: 48,
    borderRadius: 4,
    overflow: "hidden",
    border: "1px solid #e5e5e5",
    background: "#fafafa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  aboutSchoolLabel: {
    fontSize: "0.65rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#888888",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
    marginBottom: 2,
  },
  aboutSchoolName: {
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#111111",
  },
  aboutSchoolDesc: {
    fontSize: "0.82rem",
    color: "#555555",
    marginTop: 4,
    lineHeight: 1.5,
  },

  /* ---------- GENERIC SECTION ---------- */
  section: {
    borderBottom: "1px solid #e5e5e5",
    position: "relative",
    zIndex: 1,
  },
  sectionInner: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "4rem 2rem",
  },
  sectionHead: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "1.25rem",
  },
  sectionNum: {
    fontSize: "0.7rem",
    letterSpacing: "0.08em",
    color: ACCENT,
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
  },
  sectionLabel: {
    fontSize: "0.7rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#111111",
    margin: 0,
    fontWeight: 600,
  },
  sectionTitle: {
    fontSize: "clamp(1.6rem, 3.4vw, 2.4rem)",
    lineHeight: 1.2,
    fontWeight: 500,
    letterSpacing: "-0.015em",
    margin: "0 0 1.5rem",
    color: "#111111",
  },
  sectionDesc: {
    fontSize: "0.95rem",
    lineHeight: 1.7,
    color: "#555555",
    maxWidth: 600,
    margin: "0 0 2rem",
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "2rem",
  },
  body: {
    fontSize: "0.95rem",
    lineHeight: 1.75,
    color: "#444444",
    margin: 0,
  },

  /* ---------- PROJECTS ---------- */
  projectList: {
    display: "flex",
    flexDirection: "column",
    borderTop: "1px solid #e5e5e5",
  },
  projectRow: {
    display: "grid",
    gridTemplateColumns: "40px 1fr auto",
    gap: "1rem",
    alignItems: "start",
    padding: "1.5rem 0",
    borderBottom: "1px solid #e5e5e5",
  },
  projectNum: {
    fontSize: "0.75rem",
    color: ACCENT,
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
    paddingTop: 4,
  },
  projectBody: { minWidth: 0 },
  projectTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    margin: "0 0 0.4rem",
    color: "#111111",
  },
  projectDesc: {
    fontSize: "0.9rem",
    lineHeight: 1.6,
    color: "#555555",
    margin: 0,
  },
  projectTag: {
    fontSize: "0.72rem",
    color: "#666666",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
    border: "1px solid #d4d4d4",
    padding: "0.3rem 0.6rem",
    borderRadius: 3,
    whiteSpace: "nowrap",
    alignSelf: "start",
  },

  /* ---------- QUOTE ---------- */
  quoteSection: {
    borderBottom: "1px solid #e5e5e5",
    background: "#111111",
    position: "relative",
    zIndex: 1,
  },
  quoteInner: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "4.5rem 2rem",
    textAlign: "center",
  },
  quoteText: {
    fontSize: "clamp(1.4rem, 3vw, 2.2rem)",
    lineHeight: 1.3,
    fontWeight: 400,
    letterSpacing: "-0.01em",
    color: "#ffffff",
    margin: "0 0 1rem",
  },
  quoteBy: {
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: ACCENT,
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
  },

  /* ---------- AI CHAT ---------- */
  aiSection: {
    borderBottom: "1px solid #e5e5e5",
    background: "#ffffff",
    position: "relative",
    zIndex: 1,
  },
  aiInner: {
    maxWidth: 820,
    margin: "0 auto",
    padding: "4rem 2rem",
  },
  chatCard: {
    background: "#ffffff",
    border: "1px solid #d4d4d4",
    borderRadius: 8,
    padding: "1.25rem",
    display: "flex",
    flexDirection: "column",
    marginTop: "1rem",
    position: "relative",
    boxShadow:
      "0 1px 0 rgba(37,99,235,0.06), 0 12px 40px -24px rgba(37,99,235,0.25)",
  },
  chatHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: "0.85rem",
    borderBottom: "1px solid #e5e5e5",
    marginBottom: "0.85rem",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  chatHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    minWidth: 0,
  },
  chatDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: ACCENT,
    display: "inline-block",
    flexShrink: 0,
    animation: "pulseRing 2s infinite",
  },
  chatTitle: {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#111111",
  },
  chatSubtitle: {
    fontSize: "0.72rem",
    color: "#777777",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
  },
  resetBtn: {
    border: "1px solid #d4d4d4",
    background: "#ffffff",
    color: "#111111",
    fontSize: "0.72rem",
    padding: "0.3rem 0.7rem",
    borderRadius: 3,
    cursor: "pointer",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
    flexShrink: 0,
  },
  chatWrap: { position: "relative" },
  chatArea: {
    display: "flex",
    flexDirection: "column",
    gap: "0.65rem",
    height: "clamp(280px, 45vh, 380px)",
    overflowY: "auto",
    overflowX: "hidden",
    padding: "0.25rem 0.1rem",
    scrollBehavior: "smooth",
  },
  msgRow: { display: "flex", alignItems: "flex-end", gap: 6 },
  bubbleAvatar: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    background: "#111111",
    color: "#ffffff",
    fontSize: "0.65rem",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bubbleWrap: {
    display: "flex",
    flexDirection: "column",
    maxWidth: "82%",
    minWidth: 0,
    animation: "bubbleIn 0.25s ease",
  },
  bubble: {
    padding: "0.6rem 0.9rem",
    borderRadius: 8,
    fontSize: "0.88rem",
    lineHeight: 1.55,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  bubbleMeta: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 3,
    fontSize: "0.65rem",
    color: "#999999",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
  },
  bubbleTime: { opacity: 0.85 },
  copyBtn: {
    border: "none",
    background: "transparent",
    color: "#999999",
    cursor: "pointer",
    fontSize: "0.65rem",
    padding: 0,
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
    textDecoration: "underline",
    textUnderlineOffset: 2,
  },
  typingDot: {
    display: "inline-block",
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: ACCENT,
    animation: "typingBounce 1.2s infinite",
  },
  scrollBtn: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: `1px solid ${ACCENT_BORDER}`,
    background: "#ffffff",
    color: ACCENT,
    cursor: "pointer",
    fontWeight: 700,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  suggestions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.4rem",
    margin: "0.85rem 0 0.6rem",
  },
  suggestionBtn: {
    fontSize: "0.75rem",
    padding: "0.35rem 0.7rem",
    borderRadius: 3,
    border: `1px solid ${ACCENT_BORDER}`,
    background: ACCENT_SOFT,
    color: ACCENT,
    cursor: "pointer",
  },
  form: { display: "flex", gap: "0.5rem", marginTop: "0.75rem" },
  input: {
    flex: 1,
    minWidth: 0,
    padding: "0.6rem 0.8rem",
    borderRadius: 4,
    border: "1px solid #d4d4d4",
    fontSize: "0.88rem",
    outline: "none",
    background: "#ffffff",
    color: "#111111",
  },
  sendBtn: {
    padding: "0.6rem 1rem",
    borderRadius: 4,
    border: `1px solid ${ACCENT}`,
    background: ACCENT,
    color: "#ffffff",
    fontWeight: 600,
    fontSize: "0.82rem",
    flexShrink: 0,
  },

  /* ---------- TOOLKIT ---------- */
  toolkitGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "1.25rem",
    marginTop: "1.5rem",
  },
  toolkitCard: {
    border: "1px solid #d4d4d4",
    borderRadius: 6,
    padding: "1.25rem",
    background: "#ffffff",
  },
  toolkitNum: {
    fontSize: "0.7rem",
    color: ACCENT,
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
  },
  toolkitTitle: {
    fontSize: "1.05rem",
    fontWeight: 600,
    margin: "0.5rem 0 0.4rem",
    color: "#111111",
  },
  toolkitDesc: {
    fontSize: "0.85rem",
    lineHeight: 1.55,
    color: "#555555",
    margin: "0 0 0.9rem",
  },
  tagList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexWrap: "wrap",
    gap: "0.35rem",
  },
  tag: {
    fontSize: "0.72rem",
    padding: "0.25rem 0.55rem",
    border: "1px solid #e5e5e5",
    borderRadius: 3,
    background: "#fafafa",
    color: "#333333",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
  },

  /* ---------- PRINCIPLES ---------- */
  principlesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "1rem",
    marginTop: "1.5rem",
  },
  principleCard: {
    border: "1px solid #e5e5e5",
    borderRadius: 6,
    padding: "1.25rem",
    background: "#ffffff",
  },
  principleNum: {
    fontSize: "0.72rem",
    color: ACCENT,
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
  },
  principleTitle: {
    fontSize: "1.05rem",
    fontWeight: 600,
    margin: "0.5rem 0 0.4rem",
    color: "#111111",
  },
  principleDesc: {
    fontSize: "0.85rem",
    lineHeight: 1.55,
    color: "#555555",
    margin: 0,
  },

  /* ---------- CONTACT ---------- */
  contactList: {
    listStyle: "none",
    padding: 0,
    margin: "1.5rem 0 0",
    borderTop: "1px solid #e5e5e5",
  },
  contactItem: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "0.5rem",
    padding: "1rem 0",
    borderBottom: "1px solid #e5e5e5",
  },
  contactKey: {
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#888888",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
  },
  contactLink: {
    fontSize: "0.9rem",
    color: "#111111",
    textDecoration: "underline",
    textUnderlineOffset: 3,
    wordBreak: "break-all",
    transition: "color 0.2s",
  },

  /* ---------- FOOTER ---------- */
  footer: {
    position: "relative",
    zIndex: 1,
    background: "#fafafa",
  },
  footerInner: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "3rem 2rem 2rem",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "2rem",
    borderBottom: "1px solid #e5e5e5",
  },
  footerCol: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  footerBrand: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    marginBottom: "0.5rem",
  },
  footerTagline: {
    fontSize: "0.82rem",
    color: "#666666",
    lineHeight: 1.6,
    margin: 0,
    maxWidth: 260,
  },
  footerHeading: {
    fontSize: "0.68rem",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#888888",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
    marginBottom: "0.25rem",
  },
  footerLink: {
    fontSize: "0.85rem",
    color: "#111111",
    textDecoration: "none",
    width: "fit-content",
    transition: "color 0.2s",
  },
  footerBottom: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "1.25rem 2rem",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: "0.5rem",
  },
};
