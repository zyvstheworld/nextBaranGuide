"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type Message = {
  sender: "user" | "bot";
  content: string;
  timestamp: Date;
  isError?: boolean;
};

export default function ServicesPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      content: "Hello! Welcome to BaranGuide. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const setVh = () =>
      document.documentElement.style.setProperty(
        "--vh",
        `${window.innerHeight * 0.01}px`
      );
    setVh();
    window.addEventListener("resize", setVh);
    return () => window.removeEventListener("resize", setVh);
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop =
          chatContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  useEffect(() => {
    if (messages.length) scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    setMessages((prev) => [
      ...prev,
      { sender: "user", content: userInput, timestamp: new Date() },
    ]);

    const query = userInput;
    setUserInput("");
    setLoading(true);

    try {
      const response = await fetch(`/api/chatbot/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error getting response from server");
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          content: data.data?.response ?? "No response.",
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          content:
            "Sorry, I encountered an error while processing your request. Please try again later.",
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const formatMessage = (content: string) => content.replace(/\n/g, "<br>");

  const toggleModal = (open?: boolean) => {
    const next = typeof open === "boolean" ? open : !isOpen;
    setIsOpen(next);
    if (next) setTimeout(() => inputRef.current?.focus(), 150);
  };

  return (
    <div className="promo-page">
      <header className="site-header">
        <div className="brand-left">
          <Image src="/gapo-seal.png" alt="BaranGuide" width={140} height={44} />
          <div className="brand-text">
            <h1>Barangay Old Cabalan</h1>
            <p className="tagline">Service • Announcements • Assistance</p>
          </div>
        </div>

        <nav className={`main-nav ${navOpen ? "open" : ""}`} aria-label="Main navigation">
          <ul>
            <li><a className="nav-link" href="/">Home</a></li>
            <li><a className="nav-link" href="/services" aria-current="page">Services</a></li>
            <li><a className="nav-link" href="/announcements">Announcements</a></li>
            <li><a className="nav-link" href="/about">About</a></li>
            <li><a className="nav-link" href="/contact">Contact</a></li>
          </ul>
        </nav>

        <div className="brand-right">
          <button
            className="nav-toggle"
            aria-label="Toggle menu"
            aria-expanded={navOpen}
            onClick={() => setNavOpen((s) => !s)}
          >
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
          </button>
        </div>
      </header>

      <section className="hero-banner">
        <div className="hero-inner">
          <div className="hero-content">
            <h2>Barangay Services</h2>
            <p>
              Access essential services offered by Barangay Old Cabalan. Learn about requirements,
              processes, and how to apply for IDs, clearances, permits, and assistance programs.
            </p>
          </div>

          <div className="hero-image">
            <Image src="/permit.png" alt="Services banner" width={720} height={420} style={{ objectFit: 'cover', borderRadius: 12 }} />
          </div>
        </div>

        <div className="hero-highlights">
          <article className="highlight">
            <Image src="/id.jpg" alt="ID Services" width={420} height={220} style={{ objectFit: 'cover', borderRadius: 8 }} />
            <div className="highlight-body">
              <h4>Barangay ID</h4>
              <p>Official identification for barangay residents.</p>
            </div>
          </article>

          <article className="highlight">
            <Image src="/permit.png" alt="Clearances" width={420} height={220} style={{ objectFit: 'cover', borderRadius: 8 }} />
            <div className="highlight-body">
              <h4>Clearances & Permits</h4>
              <p>Barangay clearances and local permits.</p>
            </div>
          </article>

          <article className="highlight">
            <Image src="/health.jpg" alt="Health" width={420} height={220} style={{ objectFit: 'cover', borderRadius: 8 }} />
            <div className="highlight-body">
              <h4>Health & Welfare</h4>
              <p>Health programs and social assistance.</p>
            </div>
          </article>
        </div>
      </section>

      <main className="content">
        <section className="services-grid">
          <h3>Available Services</h3>
          <div className="cards">
            <article className="card">
              <Image src="/id.jpg" alt="ID Registration" width={320} height={180} />
              <div className="card-body">
                <strong>Barangay ID</strong>
                <p>Apply for your barangay ID — requirements and steps.</p>
              </div>
            </article>

            <article className="card">
              <Image src="/permit.png" alt="Permit" width={320} height={180} />
              <div className="card-body">
                <strong>Clearances & Permits</strong>
                <p>Guidelines for permits and barangay clearances.</p>
              </div>
            </article>

            <article className="card">
              <Image src="/health.jpg" alt="Health" width={320} height={180} />
              <div className="card-body">
                <strong>Health & Welfare</strong>
                <p>Local health programs, vaccination schedules, and assistance.</p>
              </div>
            </article>
          </div>
        </section>
      </main>

      <section className="officials-section">
        <div className="container">
          <h3>Barangay Officials</h3>
          <div className="officials-grid">
            <article className="official-card">
              <Image src="/olongapo-seal.png" alt="Punong Barangay" width={220} height={220} style={{ objectFit: 'cover', borderRadius: 8 }} />
              <div className="official-body">
                <strong>Hon. Rolando A. Alba Jr.</strong>
                <span>Punong Barangay</span>
              </div>
            </article>

            <article className="official-card">
              <Image src="/olongapo-seal.png" alt="Kagawad" width={220} height={220} style={{ objectFit: 'cover', borderRadius: 8 }} />
              <div className="official-body">
                <strong>Hon. Jose B. Galang Jr.</strong>
                <span>Kagawad</span>
              </div>
            </article>

            <article className="official-card">
              <Image src="/olongapo-seal.png" alt="IPMR" width={220} height={220} style={{ objectFit: 'cover', borderRadius: 8 }} />
              <div className="official-body">
                <strong>Hon. Zenaida L. Miranda</strong>
                <span>IPMR</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Chat plugin (modal) */}
      <div className={`chat-plugin ${isOpen ? "open" : ""}`} role="dialog" aria-hidden={!isOpen}>
        <div className="plugin-header">
          <div className="plugin-title">
            <Image src="/baranguide-log.png" alt="BaranGuide" width={36} height={36} />
            <div className="title-text">
              <strong>BaranGuide</strong>
              <div className="small">(Barangay Old Cabalan Chatbot)</div>
            </div>
          </div>
          <div className="plugin-actions">
            <button className="btn-close" onClick={() => toggleModal(false)} aria-label="Close">✕</button>
          </div>
        </div>

        <div className="plugin-body">
          <div className="messages-container" ref={chatContainerRef}>
            {messages.map((message, i) => (
              <div key={i} className={`message ${message.sender}`}>
                {message.sender === "bot" ? (
                  <div className={`message-content bot-message ${message.isError ? "error" : ""}`}>
                    <div dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }} />
                  </div>
                ) : (
                  <div className="message-content user-message">{message.content}</div>
                )}
              </div>
            ))}

            {loading && (
              <div className="message bot">
                <div className="message-content bot-message loading">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              </div>
            )}
          </div>

          <form className="input-area" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask about services, requirements or schedules..."
              disabled={loading}
              aria-label="Message"
            />
            <button type="submit" disabled={loading || !userInput.trim()} aria-label="Send">▶</button>
          </form>
        </div>
      </div>

      {!isOpen && (
        <button className="floating-launch" onClick={() => toggleModal(true)} aria-label="Open chatbot">
          <Image src="/baranguide-log.png" alt="Chat" width={36} height={36} />
        </button>
      )}

      
             <footer className="site-footer">
              <div className="footer-content">
                <div className="footer-grid">
                  <div className="footer-col">
                    <div className="footer-brand">
                      <Image src="/olongapo-seal.png" alt="Philippine Seal" width={80} height={80} />
                    </div>
                    <h5>REPUBLIC OF THE PHILIPPINES</h5>
                    <p className="footer-desc">
                      All content is in the public domain unless otherwise stated.
                    </p>
                  </div>
      
                  <div className="footer-col">
                    <h5>ABOUT GOVPH</h5>
                    <p className="footer-desc">
                      Learn more about the Philippine government, its structure, how government works and the people behind it.
                    </p>
                    <ul className="footer-links">
                      <li><a href="https://www.gov.ph" target="_blank" rel="noopener noreferrer">GOV.PH</a></li>
                      <li><a href="https://data.gov.ph" target="_blank" rel="noopener noreferrer">Open Data Portal</a></li>
                      <li><a href="https://www.officialgazette.gov.ph" target="_blank" rel="noopener noreferrer">Official Gazette</a></li>
                    </ul>
                  </div>
      
                  <div className="footer-col">
                    <h5>GOVERNMENT LINKS</h5>
                    <ul className="footer-links">
                      <li><a href="https://president.gov.ph" target="_blank" rel="noopener noreferrer">Office of the President</a></li>
                      <li><a href="https://ovp.gov.ph" target="_blank" rel="noopener noreferrer">Office of the Vice President</a></li>
                      <li><a href="https://senate.gov.ph" target="_blank" rel="noopener noreferrer">Senate of the Philippines</a></li>
                      <li><a href="https://congress.gov.ph" target="_blank" rel="noopener noreferrer">House of Representatives</a></li>
                      <li><a href="https://sc.judiciary.gov.ph" target="_blank" rel="noopener noreferrer">Supreme Court</a></li>
                      <li><a href="https://ca.judiciary.gov.ph" target="_blank" rel="noopener noreferrer">Court of Appeals</a></li>
                      <li><a href="https://sb.judiciary.gov.ph" target="_blank" rel="noopener noreferrer">Sandiganbayan</a></li>
                    </ul>
                  </div>
                </div>
              </div>
            </footer>

      <style jsx>{`
        :root { --max-width: 1100px; }
        .promo-page { font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial; color:#071030; min-height:100vh; background:#f7fbff; }

        .site-header {
          --header-h: 72px;
          position: sticky;
          top: 0;
          z-index: 60;
          display:flex;
          justify-content:space-between;
          align-items:center;
          max-width:var(--max-width);
          margin:0 auto;
          padding:12px 20px;
          gap:12px;
          background: rgba(255,255,255,0.96);
          backdrop-filter: blur(4px);
          box-shadow: 0 6px 18px rgba(2,6,23,0.04);
        }

        .site-footer { background: #f5f5f5; color: #000; margin-top: 0; padding: 40px 0 30px; border-top: 1px solid #ddd; }
        .footer-content { max-width: var(--max-width); margin: 0 auto; padding: 0 20px; }
        .footer-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; align-items: start; }
        .footer-col { display: flex; flex-direction: column; gap: 12px; }
        .footer-col h5 { margin: 0; font-size: 0.75rem; color: #000; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.4; }
        .footer-col p { margin: 0; color: #000; font-size: 0.813rem; line-height: 1.5; font-weight: 400; }
        .footer-links { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
        .footer-links a { color: #0066cc; text-decoration: none; font-size: 0.813rem; line-height: 1.5; transition: all 0.2s; }
        .footer-links a:hover { text-decoration: underline; }

        .brand-left { display:flex; gap:12px; align-items:center; min-width:0; }
        .brand-text h1 { margin:0; font-size:1.1rem; color:#0b4ed6; }
        .tagline { margin:4px 0 0; color:#526676; font-size:0.85rem; }

        .main-nav { margin-left:20px; }
        .main-nav ul { display:flex; gap:12px; list-style:none; margin:0; padding:0; align-items:center; }
        .main-nav .nav-link { color:#374151; text-decoration:none; padding:8px 10px; border-radius:8px; font-weight:500; }
        .main-nav .nav-link:hover { background:rgba(11,78,214,0.06); color:#0b4ed6; }

        .brand-right { display:flex; gap:10px; align-items:center; margin-left:auto; }

        .nav-toggle { display:none; background:transparent; border:none; padding:6px; margin-left:6px; cursor:pointer; }
        .nav-toggle .bar { display:block; width:18px; height:2px; background:#0b4ed6; margin:3px 0; border-radius:2px; }

        @media (max-width: 900px) {
          .main-nav {
            position: fixed;
            top: calc(var(--header-h));
            left: 0;
            right: 0;
            background: white;
            padding: 12px 20px;
            transform: translateY(-6px);
            opacity: 0;
            pointer-events: none;
            transition: all .18s ease;
            box-shadow: 0 10px 30px rgba(2,6,23,0.08);
            z-index: 55;
          }
          .main-nav.open { transform:none; opacity:1; pointer-events:auto; }
          .main-nav ul { flex-direction:column; gap:8px; }
          .nav-toggle { display:block; }
        }

        .hero-banner { max-width:var(--max-width); margin:12px auto; padding:0 20px; }
        .hero-inner { display:flex; gap:18px; align-items:center; background:white; padding:20px; border-radius:12px; box-shadow:0 8px 24px rgba(4,12,44,0.06); }
        .hero-content { flex:1; }
        .hero-content h2 { margin:0 0 8px; font-size:1.6rem; color:#06123b; }
        .hero-content p { margin:0; color:#475569; line-height:1.45; }

        .hero-image { width:360px; flex-shrink:0; display:flex; justify-content:center; align-items:center; }

        .hero-highlights { display:grid; grid-template-columns: repeat(3, 1fr); gap:14px; margin-top:18px; padding:0 2px; }
        .highlight { background:white; border-radius:8px; overflow:hidden; box-shadow:0 6px 18px rgba(2,8,35,0.04); }
        .highlight-body { padding:12px; }
        .highlight-body h4 { margin:0 0 6px; color:#06123b; }
        .highlight-body p { margin:0; color:#475569; font-size:0.95rem; }

        .content { max-width:var(--max-width); margin:20px auto; padding:0 20px; }
        .services-grid h3 { margin:0 0 12px; color:#0b4ed6; }
        .cards { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
        .card { background:white; border-radius:10px; overflow:hidden; box-shadow:0 6px 18px rgba(2,8,35,0.04); }
        .card-body { padding:10px; }
        .card-body strong { display:block; margin-bottom:6px; color:#06123b; }

        .officials-section { max-width:var(--max-width); margin:24px auto; padding:0 20px 48px; }
        .officials-section .container { background:transparent; }
        .officials-section h3 { margin:0 0 14px; color:#0b4ed6; }
        .officials-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:16px; }
        .official-card { background:white; border-radius:10px; padding:12px; text-align:center; box-shadow:0 10px 30px rgba(2,6,23,0.06); }
        .official-body { margin-top:10px; }
        .official-body strong { display:block; color:#06123b; }
        .official-body span { color:#475569; font-size:0.95rem; }

        .chat-plugin { position:fixed; right:20px; bottom:20px; width:360px; max-height:72vh; background:#fff; border-radius:12px; box-shadow:0 18px 48px rgba(2,6,23,0.12); overflow:hidden; transform:translateY(20px) scale(0.98); opacity:0; pointer-events:none; transition:all .18s ease; display:flex; flex-direction:column; }
        .chat-plugin.open { transform:none; opacity:1; pointer-events:auto; }
        .plugin-header { display:flex; align-items:center; justify-content:space-between; padding:10px 12px; border-bottom:1px solid #eef2ff; background:linear-gradient(90deg,#fbfdff,#f7fbff); }
        .plugin-title { display:flex; gap:10px; align-items:center; }
        .title-text .small { font-size:0.75rem; color:#475569; }

        .plugin-body { display:flex; flex-direction:column; padding:10px; gap:8px; }
        .messages-container { display:flex; flex-direction:column; gap:8px; overflow:auto; padding:6px; max-height:50vh; }
        .message { display:flex; }
        .bot { justify-content:flex-start; }
        .user { justify-content:flex-end; }
        .message-content { padding:8px 10px; border-radius:10px; max-width:78%; }
        .bot-message { background:#f8fafc; color:#0b1220; }
        .user-message { background:#0b4ed6; color:white; }
        .error { background:#fff0f0; border-left:3px solid #ff4d4f; }

        .input-area { display:flex; gap:8px; padding:6px; border-top:1px solid #eef2ff; }
        .input-area input { flex:1; padding:10px; border-radius:999px; border:1px solid #e6eefc; outline:none; }
        .input-area button { background:#0b4ed6; color:white; border:none; width:44px; border-radius:50%; cursor:pointer; }

        .floating-launch { position:fixed; right:20px; bottom:20px; border-radius:50%; width:56px; height:56px; display:flex; align-items:center; justify-content:center; box-shadow:0 10px 30px rgba(11,78,214,0.2); border:none; cursor:pointer; background:transparent; }

        .dot { width:8px; height:8px; background:#999; border-radius:50%; margin:0 3px; animation:bounce 1.5s infinite ease-in-out; }
        .dot:nth-child(1) { animation-delay:0s; } .dot:nth-child(2) { animation-delay:0.3s; } .dot:nth-child(3) { animation-delay:0.6s; }
        @keyframes bounce { 0%,80%,100%{ transform:translateY(0); } 40%{ transform:translateY(-8px); } }

        @media (max-width: 900px) {
          .content { }
          .cards { grid-template-columns:repeat(1,1fr); }
          .hero-inner { flex-direction:column; gap:12px; }
          .hero-image { width:100%; }
          .chat-plugin { right:12px; left:12px; bottom:12px; width:auto; max-width:420px; }
          .hero-highlights { grid-template-columns: 1fr; }
          .officials-grid { grid-template-columns: 1fr; }
          .nav-toggle { display:block; }
        }
      `}</style>
    </div>
  );
}