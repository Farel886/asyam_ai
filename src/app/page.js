"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { ASYAM_DATA } from "@/data/asyam";

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

const NOW_ITEMS = [
  { label: "Learning", value: "Python & Computer Vision" },
  { label: "Building", value: "Asyam AI Portfolio" },
  { label: "School", value: "SMP Negeri 3 Cepu" },
];

const TICKER_ITEMS = ["Think", "Build", "Experiment", "Learn", "Repeat"];

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
  const [scrolled, setScrolled] = useState(false);
  const chatAreaRef = useRef(null);
  const inputRef = useRef(null);
  const mounted = useRef(false);
  const copyTimer = useRef(null);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const el = chatAreaRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "auto" });
    });
    return () => cancelAnimationFrame(raf);
  }, [messages, loading]);

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

  useEffect(() => {
    if (!loading) inputRef.current?.focus({ preventScroll: true });
  }, [loading]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

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
    el.scrollTo({ top: el.scrollHeight, behavior: "auto" });
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
      <header
        style={{
          ...styles.header,
          borderBottomColor: scrolled ? "#d4d4d4" : "#e5e5e5",
          boxShadow: scrolled
            ? "0 1px 0 rgba(0,0,0,0.03), 0 8px 24px -20px rgba(0,0,0,0.15)"
            : "none",
        }}
      >
        <div style={styles.brand}>
          <span style={styles.brandMark}>A</span>
          <span style={styles.brandName}>asyam.f</span>
        </div>
        <nav style={styles.nav} className="nav" aria-label="Main navigation">
          <a href="#work" style={styles.navLink}>
            Work
          </a>
          <a href="#ai" style={styles.navLink}>
            AI
          </a>
          <a href="#contact" style={styles.navLink}>
            Contact
          </a>
        </nav>
        <div style={styles.headerRight}>
          <span style={styles.statusPulse} />
          <span style={styles.headerMono}>Available</span>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section style={styles.hero}>
        <div style={styles.heroInner} className="hero-inner">
          <div style={styles.heroGrid} className="hero-grid">
            <div style={styles.heroText}>
              <p style={styles.eyebrow}>
                <span style={styles.eyebrowDot} />
                Student developer · Indonesia
              </p>
              <h1 style={styles.heroTitle}>
                Building things
                <br />
                that <span style={styles.accentText}>matter</span>.
              </h1>
              <p style={styles.heroDesc}>
                I'm Asyam — I turn curiosity into experiments, projects, and
                useful digital experiences.
              </p>

              <div style={styles.schoolRow}>
                <div style={styles.schoolLogoWrap}>
                  <Image
                    src="/images/smp3.png"
                    alt="SMP Negeri 3 Cepu logo"
                    width={32}
                    height={32}
                    style={styles.schoolLogo}
                  />
                </div>
                <div style={styles.schoolText}>
                  <div style={styles.schoolLabel}>Studying at</div>
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

            <div style={styles.heroImageWrap} className="hero-image-wrap">
              <div style={styles.heroImageFrame}>
                <Image
                  src="/images/asyam.png"
                  alt="Asyam Farrel Dzakwan portrait"
                  width={200}
                  height={240}
                  sizes="(max-width: 720px) 160px, 200px"
                  style={styles.heroImage}
                  priority
                />
                <span style={styles.cornerTL} />
                <span style={styles.cornerBR} />
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
        <div style={styles.sectionInner} className="section-inner" data-reveal>
          <div style={styles.sectionHead}>
            <span style={styles.sectionNum}>00</span>
            <h2 style={styles.sectionLabel}>Now</h2>
          </div>
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
        <div style={styles.sectionInner} className="section-inner" data-reveal>
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
            <p style={styles.body}>{ASYAM_DATA.bio}</p>
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
                width={40}
                height={40}
                style={styles.schoolLogo}
              />
            </div>
            <div>
              <div style={styles.aboutSchoolLabel}>Education</div>
              <div style={styles.aboutSchoolName}>SMP Negeri 3 Cepu</div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 02 WORK ================= */}
      <section id="work" style={styles.section}>
        <div style={styles.sectionInner} className="section-inner" data-reveal>
          <div style={styles.sectionHead}>
            <span style={styles.sectionNum}>02</span>
            <h2 style={styles.sectionLabel}>Selected work</h2>
          </div>
          <h3 style={styles.sectionTitle}>Things I'm building.</h3>

          <div style={styles.projectList}>
            {ASYAM_DATA.projects.map((p, i) => (
              <article
                key={p.name}
                style={styles.projectRow}
                className="project-row"
              >
                <span style={styles.projectNum}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div style={styles.projectBody}>
                  <h4 style={styles.projectTitle}>{p.name}</h4>
                  <p style={styles.projectDesc}>{p.desc}</p>
                </div>
                <span style={styles.projectTag}>{p.status}</span>
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
                      "Online"
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
                className="chat-area"
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
        <div style={styles.sectionInner} className="section-inner" data-reveal>
          <div style={styles.sectionHead}>
            <span style={styles.sectionNum}>04</span>
            <h2 style={styles.sectionLabel}>Toolkit</h2>
          </div>
          <h3 style={styles.sectionTitle}>Tools I use.</h3>

          <ul style={styles.tagList}>
            {ASYAM_DATA.skills.map((s) => (
              <li key={s} style={styles.tag}>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ================= 05 CONTACT ================= */}
      <section id="contact" style={styles.section}>
        <div style={styles.sectionInner} className="section-inner" data-reveal>
          <div style={styles.sectionHead}>
            <span style={styles.sectionNum}>05</span>
            <h2 style={styles.sectionLabel}>Contact</h2>
          </div>
          <h3 style={styles.sectionTitle}>
            Have an idea,
            <br />
            or something to learn together?
          </h3>

          <ul style={styles.contactList}>
            <li style={styles.contactItem} className="contact-item">
              <span style={styles.contactKey}>Email</span>
              <a
                href={`mailto:${ASYAM_DATA.contact.email}`}
                style={styles.contactLink}
              >
                {ASYAM_DATA.contact.email} ↗
              </a>
            </li>
            <li style={styles.contactItem} className="contact-item">
              <span style={styles.contactKey}>GitHub</span>
              <a
                href={ASYAM_DATA.contact.github}
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
                href={ASYAM_DATA.contact.tiktok}
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
        :global(#contact),
        :global(#work) { scroll-margin-top: 80px; }

        :global(.project-row) { transition: background 0.2s; }
        :global(.project-row:hover) { background: rgba(37,99,235,0.03); }
        :global(.project-row:hover h4) { color: #2563eb; }
        :global(.contact-item:hover a) { color: #2563eb; }
        :global(.primary-btn) { transition: transform 0.15s; }
        :global(.primary-btn:hover) { transform: translateY(-1px); }
        :global(.secondary-btn) { transition: border-color 0.2s; }
        :global(.secondary-btn:hover) { border-color: #2563eb !important; }

        @media (max-width: 720px) {
          :global(h1) { font-size: 1.9rem !important; }
          :global(h3) { font-size: 1.25rem !important; }

          :global(.hero-grid) {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }
          :global(.hero-image-wrap) {
            width: 100% !important;
            max-width: 200px !important;
            margin: 0 auto !important;
            order: 0;
          }
          :global(.nav) { display: none !important; }

          :global(.chat-area) {
            height: 40vh !important;
            max-height: 300px !important;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
          }

          :global(html) { scroll-behavior: auto !important; }

          :global(.section-inner) { padding: 2rem 1.25rem !important; }
          :global(.hero-inner) { padding: 2rem 1.25rem 0 !important; }

          :global(input) { font-size: 16px !important; }
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
    overflowX: "hidden",
  },
  gridBg: {
    position: "fixed",
    inset: 0,
    backgroundImage:
      "linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)",
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
    padding: "0.9rem 1.5rem",
    borderBottom: "1px solid #e5e5e5",
    position: "sticky",
    top: 0,
    background: "rgba(250,250,250,0.9)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    zIndex: 10,
    transition: "border-color 0.2s, box-shadow 0.2s",
    gap: "1rem",
  },
  brand: { display: "flex", alignItems: "center", gap: "0.5rem" },
  brandMark: {
    width: 26,
    height: 26,
    background: "#111111",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "0.8rem",
    borderRadius: 4,
  },
  brandName: {
    fontSize: "0.78rem",
    letterSpacing: "0.06em",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
    color: "#111111",
  },
  nav: { display: "flex", alignItems: "center", gap: "1rem" },
  navLink: {
    fontSize: "0.75rem",
    color: "#555555",
    textDecoration: "none",
  },
  headerRight: { display: "flex", alignItems: "center", gap: 6 },
  statusPulse: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: ACCENT,
    display: "inline-block",
    animation: "pulseRing 2s infinite",
    flexShrink: 0,
  },
  headerMono: {
    fontSize: "0.65rem",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#555555",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
    whiteSpace: "nowrap",
  },

  /* ---------- HERO ---------- */
  hero: { borderBottom: "1px solid #e5e5e5", position: "relative", zIndex: 1 },
  heroInner: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "3.5rem 1.5rem 0",
  },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: "2.5rem",
    alignItems: "start",
  },
  heroText: { minWidth: 0 },
  eyebrow: {
    fontSize: "0.68rem",
    color: "#666666",
    margin: "0 0 0.85rem",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: ACCENT,
    display: "inline-block",
    animation: "pulseRing 2s infinite",
  },
  heroTitle: {
    fontSize: "clamp(2rem, 5vw, 3.2rem)",
    lineHeight: 1.1,
    fontWeight: 500,
    letterSpacing: "-0.02em",
    margin: "0 0 1.15rem",
    color: "#111111",
  },
  accentText: { color: ACCENT },
  heroDesc: {
    fontSize: "0.95rem",
    lineHeight: 1.65,
    color: "#444444",
    maxWidth: 480,
    margin: "0 0 1.25rem",
  },
  schoolRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    padding: "0.5rem 0.7rem",
    border: "1px solid #e5e5e5",
    borderRadius: 6,
    background: "#ffffff",
    maxWidth: 300,
    marginBottom: "1.25rem",
  },
  schoolLogoWrap: {
    width: 32,
    height: 32,
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
  schoolText: { minWidth: 0 },
  schoolLabel: {
    fontSize: "0.6rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#888888",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
  },
  schoolName: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#111111",
    marginTop: 1,
  },
  heroActions: { display: "flex", flexWrap: "wrap", gap: "0.5rem" },
  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "0.6rem 1rem",
    background: "#111111",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "0.78rem",
    fontWeight: 500,
    borderRadius: 4,
    border: "1px solid #111111",
  },
  btnArrow: { color: ACCENT },
  secondaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    padding: "0.6rem 1rem",
    background: "#ffffff",
    color: "#111111",
    textDecoration: "none",
    fontSize: "0.78rem",
    fontWeight: 500,
    borderRadius: 4,
    border: "1px solid #d4d4d4",
  },
  heroImageWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
    width: 200,
    maxWidth: "100%",
  },
  heroImageFrame: {
    position: "relative",
    border: "1px solid #d4d4d4",
    borderRadius: 4,
    padding: 5,
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
    width: 14,
    height: 14,
    borderTop: `2px solid ${ACCENT}`,
    borderLeft: `2px solid ${ACCENT}`,
    borderTopLeftRadius: 4,
  },
  cornerBR: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 14,
    height: 14,
    borderBottom: `2px solid ${ACCENT}`,
    borderRight: `2px solid ${ACCENT}`,
    borderBottomRightRadius: 4,
  },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.7rem",
    borderTop: "1px solid #e5e5e5",
    padding: "0.45rem 0",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
  },
  metaKey: { color: "#888888" },
  metaVal: { color: "#111111", fontWeight: 500 },

  /* ---------- TICKER ---------- */
  ticker: {
    marginTop: "3rem",
    borderTop: "1px solid #e5e5e5",
    padding: "0.85rem 0",
    overflow: "hidden",
    whiteSpace: "nowrap",
  },
  tickerTrack: {
    display: "inline-flex",
    animation: "tickerMove 30s linear infinite",
  },
  tickerGroup: { display: "inline-flex", flexShrink: 0 },
  tickerItem: {
    fontSize: "0.82rem",
    letterSpacing: "0.04em",
    color: "#444444",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
    paddingRight: "1.25rem",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
  },
  tickerArrow: { color: ACCENT, fontSize: "0.8rem" },

  /* ---------- GENERIC SECTION ---------- */
  section: {
    borderBottom: "1px solid #e5e5e5",
    position: "relative",
    zIndex: 1,
  },
  sectionInner: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "2.75rem 1.5rem",
  },
  sectionHead: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    marginBottom: "1rem",
  },
  sectionNum: {
    fontSize: "0.68rem",
    letterSpacing: "0.08em",
    color: ACCENT,
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
  },
  sectionLabel: {
    fontSize: "0.68rem",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#111111",
    margin: 0,
    fontWeight: 600,
  },
  sectionTitle: {
    fontSize: "clamp(1.4rem, 3vw, 2rem)",
    lineHeight: 1.25,
    fontWeight: 500,
    letterSpacing: "-0.01em",
    margin: "0 0 1.25rem",
    color: "#111111",
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "1.5rem",
  },
  body: {
    fontSize: "0.9rem",
    lineHeight: 1.7,
    color: "#444444",
    margin: 0,
  },

  /* ---------- NOW ---------- */
  nowGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "0.6rem",
  },
  nowCard: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    padding: "0.75rem 0.9rem",
    border: "1px solid #e5e5e5",
    borderRadius: 6,
    background: "#ffffff",
  },
  nowLabel: {
    fontSize: "0.62rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#888888",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
  },
  nowValue: {
    fontSize: "0.82rem",
    color: "#111111",
    fontWeight: 500,
  },

  /* ---------- ABOUT ---------- */
  aboutSchool: {
    display: "flex",
    alignItems: "center",
    gap: "0.7rem",
    marginTop: "1.5rem",
    padding: "0.8rem",
    border: "1px solid #e5e5e5",
    borderRadius: 6,
    background: "#ffffff",
  },
  aboutSchoolLogo: {
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
  aboutSchoolLabel: {
    fontSize: "0.6rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#888888",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
  },
  aboutSchoolName: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#111111",
    marginTop: 1,
  },

  /* ---------- PROJECTS ---------- */
  projectList: {
    display: "flex",
    flexDirection: "column",
    borderTop: "1px solid #e5e5e5",
  },
  projectRow: {
    display: "grid",
    gridTemplateColumns: "32px 1fr auto",
    gap: "0.75rem",
    alignItems: "start",
    padding: "1.1rem 0",
    borderBottom: "1px solid #e5e5e5",
  },
  projectNum: {
    fontSize: "0.7rem",
    color: ACCENT,
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
    paddingTop: 3,
  },
  projectBody: { minWidth: 0 },
  projectTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    margin: "0 0 0.3rem",
    color: "#111111",
  },
  projectDesc: {
    fontSize: "0.85rem",
    lineHeight: 1.55,
    color: "#555555",
    margin: 0,
  },
  projectTag: {
    fontSize: "0.65rem",
    color: "#666666",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
    border: "1px solid #d4d4d4",
    padding: "0.2rem 0.5rem",
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
    maxWidth: 960,
    margin: "0 auto",
    padding: "3rem 1.5rem",
    textAlign: "center",
  },
  quoteText: {
    fontSize: "clamp(1.2rem, 2.6vw, 1.8rem)",
    lineHeight: 1.35,
    fontWeight: 400,
    letterSpacing: "-0.01em",
    color: "#ffffff",
    margin: "0 0 0.75rem",
  },
  quoteBy: {
    fontSize: "0.68rem",
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
    maxWidth: 720,
    margin: "0 auto",
    padding: "2.75rem 1.5rem",
  },
  chatCard: {
    background: "#ffffff",
    border: "1px solid #d4d4d4",
    borderRadius: 8,
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    marginTop: "0.75rem",
    position: "relative",
  },
  chatHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: "0.7rem",
    borderBottom: "1px solid #e5e5e5",
    marginBottom: "0.7rem",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  chatHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "0.55rem",
    minWidth: 0,
  },
  chatDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: ACCENT,
    display: "inline-block",
    flexShrink: 0,
    animation: "pulseRing 2s infinite",
  },
  chatTitle: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#111111",
  },
  chatSubtitle: {
    fontSize: "0.68rem",
    color: "#777777",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
  },
  resetBtn: {
    border: "1px solid #d4d4d4",
    background: "#ffffff",
    color: "#111111",
    fontSize: "0.68rem",
    padding: "0.25rem 0.6rem",
    borderRadius: 3,
    cursor: "pointer",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
    flexShrink: 0,
  },
  chatWrap: { position: "relative" },
  chatArea: {
    display: "flex",
    flexDirection: "column",
    gap: "0.55rem",
    height: "clamp(240px, 40vh, 340px)",
    overflowY: "auto",
    overflowX: "hidden",
    padding: "0.2rem 0.1rem",
    scrollBehavior: "auto",
    overscrollBehavior: "contain",
    WebkitOverflowScrolling: "touch",
  },
  msgRow: { display: "flex", alignItems: "flex-end", gap: 5 },
  bubbleAvatar: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "#111111",
    color: "#ffffff",
    fontSize: "0.6rem",
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
    padding: "0.55rem 0.8rem",
    borderRadius: 8,
    fontSize: "0.85rem",
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  bubbleMeta: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 3,
    fontSize: "0.6rem",
    color: "#999999",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
  },
  bubbleTime: { opacity: 0.85 },
  copyBtn: {
    border: "none",
    background: "transparent",
    color: "#999999",
    cursor: "pointer",
    fontSize: "0.6rem",
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
    bottom: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: "50%",
    border: `1px solid ${ACCENT_BORDER}`,
    background: "#ffffff",
    color: ACCENT,
    cursor: "pointer",
    fontWeight: 700,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    fontSize: "0.8rem",
  },
  suggestions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.35rem",
    margin: "0.7rem 0 0.5rem",
  },
  suggestionBtn: {
    fontSize: "0.7rem",
    padding: "0.3rem 0.6rem",
    borderRadius: 3,
    border: `1px solid ${ACCENT_BORDER}`,
    background: ACCENT_SOFT,
    color: ACCENT,
    cursor: "pointer",
  },
  form: { display: "flex", gap: "0.4rem", marginTop: "0.6rem" },
  input: {
    flex: 1,
    minWidth: 0,
    padding: "0.55rem 0.7rem",
    borderRadius: 4,
    border: "1px solid #d4d4d4",
    fontSize: "0.85rem",
    outline: "none",
    background: "#ffffff",
    color: "#111111",
  },
  sendBtn: {
    padding: "0.55rem 0.9rem",
    borderRadius: 4,
    border: `1px solid ${ACCENT}`,
    background: ACCENT,
    color: "#ffffff",
    fontWeight: 600,
    fontSize: "0.78rem",
    flexShrink: 0,
  },

  /* ---------- TOOLKIT ---------- */
  tagList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexWrap: "wrap",
    gap: "0.35rem",
  },
  tag: {
    fontSize: "0.7rem",
    padding: "0.25rem 0.55rem",
    border: "1px solid #e5e5e5",
    borderRadius: 3,
    background: "#ffffff",
    color: "#333333",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
  },

  /* ---------- CONTACT ---------- */
  contactList: {
    listStyle: "none",
    padding: 0,
    margin: "1rem 0 0",
    borderTop: "1px solid #e5e5e5",
  },
  contactItem: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.8rem 0",
    borderBottom: "1px solid #e5e5e5",
  },
  contactKey: {
    fontSize: "0.7rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#888888",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
  },
  contactLink: {
    fontSize: "0.85rem",
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
    maxWidth: 960,
    margin: "0 auto",
    padding: "1.25rem 1.5rem",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: "0.4rem",
  },
};
