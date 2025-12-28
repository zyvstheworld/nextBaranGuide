"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./page.module.css";

type Message = {
  sender: "user" | "bot";
  content: string;
  timestamp: Date;
  isError?: boolean;
};

function Header({ navOpen, setNavOpen }: { navOpen: boolean; setNavOpen: (open: boolean) => void }) {
  return (
    <header className={styles.siteHeader}>
      <div className={styles.brandLeft}>
        <Image src="/gapo-seal.png" alt="BaranGuide" width={140} height={44} />
        <div className={styles.brandText}>
          <h1>Barangay Old Cabalan</h1>
          <p className={styles.tagline}>Welcome to Barangay Cabalan Promotional Website</p>
        </div>
      </div>
      <nav className={`${styles.mainNav} ${navOpen ? styles.open : ""}`} aria-label="Main navigation">
        <ul>
          <li><a className={styles.navLink} href="/">Home</a></li>
          <li><a className={styles.navLink} href="/services">Services</a></li>
          <li><a className={styles.navLink} href="/announcements">Announcements</a></li>
          <li><a className={styles.navLink} href="/about">About</a></li>
          <li><a className={styles.navLink} href="/contact">Contact</a></li>
        </ul>
      </nav>
      <div className={styles.brandRight}>
        <button
          className={styles.navToggle}
          aria-label="Toggle menu"
          aria-expanded={navOpen}
          onClick={() => setNavOpen(!navOpen)}
        >
          <span className={styles.bar} />
          <span className={styles.bar} />
          <span className={styles.bar} />
        </button>
      </div>
    </header>
  );
}

function HeroBanner() {
  return (
    <section className={styles.heroBanner}>
      <div className={styles.heroInner}>
        <div className={styles.heroContent}>
          <h2>Barangay Old Cabalan — Community Services & Updates</h2>
          <p>
            Accessible, transparent, and timely service. Explore programs, announcements,
            and get help from our BaranGuide chatbot.
          </p>
        </div>
      </div>
      <DemographicsSection />
      <div className={styles.heroHighlights}>
        <article className={styles.highlight}>
          <Image src="/communityoutreach.png" alt="Programs" width={420} height={220} style={{ objectFit: 'cover', borderRadius: 8 }} />
          <div className={styles.highlightBody}>
            <h4>Community Programs</h4>
            <p>Education, livelihood, and health programs for residents.</p>
          </div>
        </article>
        <article className={styles.highlight}>
          <Image src="/announcement.jpg" alt="Announcements" width={420} height={220} style={{ objectFit: 'cover', borderRadius: 8 }} />
          <div className={styles.highlightBody}>
            <h4>Latest Announcements</h4>
            <p>Stay updated with schedules, events, and public advisories.</p>
          </div>
        </article>
        <article className={styles.highlight}>
          <Image src="/olongapo-seal.png" alt="Assistance" width={420} height={220} style={{ objectFit: 'cover', borderRadius: 8 }} />
          <div className={styles.highlightBody}>
            <h4>Citizen Assistance</h4>
            <p>Quick help through the BaranGuide chatbot and office support.</p>
          </div>
        </article>
      </div>
    </section>
  );
}

function DemographicsSection() {
  return (
    <div className={styles.demographicSection}>
      <h3 className={styles.demographicTitle}>Demographic Data</h3>
      <table className={styles.demographicTable}>
        <tbody>
          <tr>
            <td className={styles.label}>Total Population</td>
            <td className={styles.value}>24,571</td>
            <td className={styles.label}>Total Land Area <span className={styles.italic}>(hectares)</span></td>
            <td className={styles.value}>1,200</td>
          </tr>
          <tr>
            <td className={styles.label}>Number of Households</td>
            <td className={styles.value}>7680</td>
            <td className={styles.label}>No. of Registered Voters</td>
            <td className={styles.value}>9370</td>
          </tr>
          <tr>
            <td className={styles.label}>No. of Families</td>
            <td className={styles.value}>5,852</td>
            <td className={styles.label}>No. of Precincts</td>
            <td className={styles.value}>102</td>
          </tr>
          <tr>
            <td className={styles.label}>Male</td>
            <td className={styles.value}>10,566</td>
            <td className={styles.label}>Married</td>
            <td className={styles.value}>16,823</td>
          </tr>
          <tr>
            <td className={styles.label}>Female</td>
            <td className={styles.value}>14,005</td>
            <td className={styles.label}>No. of Unmarried</td>
            <td className={styles.value}>5,471</td>
          </tr>
          <tr>
            <td className={styles.label}></td>
            <td className={styles.value}></td>
            <td className={styles.label}>Filipino</td>
            <td className={styles.value}>24,570</td>
          </tr>
          <tr>
            <td className={styles.label}></td>
            <td className={styles.value}></td>
            <td className={styles.label}>Foreigner</td>
            <td className={styles.value}>1</td>
          </tr>
          <tr>
            <td className={styles.label}></td>
            <td className={styles.value}></td>
            <td className={styles.label}>Indigenous People (IPs)</td>
            <td className={styles.value}>693</td>
          </tr>
          <tr>
            <td className={styles.label}>2024 Census of Population</td>
            <td className={styles.value}></td>
            <td className={styles.label}></td>
            <td className={styles.value}></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function ServicesGrid() {
  return (
    <section className={styles.servicesGrid}>
      <h3>Key Services</h3>
      <div className={styles.cards}>
        <article className={styles.card}>
          <Image src="/id.jpg" alt="ID Registration" width={320} height={180} />
          <div className={styles.cardBody}>
            <strong>Barangay ID</strong>
            <p>Apply for your barangay ID — requirements and steps.</p>
          </div>
        </article>

        <article className={styles.card}>
          <Image src="/permit.png" alt="Permit" width={320} height={180} />
          <div className={styles.cardBody}>
            <strong>Clearances & Permits</strong>
            <p>Guidelines for permits and barangay clearances.</p>
          </div>
        </article>

        <article className={styles.card}>
          <Image src="/health.jpg" alt="Health" width={320} height={180} />
          <div className={styles.cardBody}>
            <strong>Health & Welfare</strong>
            <p>Local health programs, vaccination schedules, and assistance.</p>
          </div>
        </article>
      </div>
    </section>
  );
}

function OfficialsSection() {
  return (
    <section className={styles.officialsSection}>
      <div className={styles.container}>
        <h3>Barangay Officials</h3>
        <div className={styles.officialsPhoto}>
          <Image 
            src="/officials-group.jpg" 
            alt="Barangay Old Cabalan Officials" 
            width={1200} 
            height={800} 
            style={{ width: '100%', height: 'auto', borderRadius: 12, boxShadow: '0 10px 30px rgba(2,6,23,0.12)' }} 
          />
        </div>
        <div className={styles.officialsList}>
          <div className={styles.officialItem}>
            <strong>Hon. Rolando A. Alba Jr.</strong>
            <span>Punong Barangay</span>
          </div>
          
          <div className={styles.officialsGridList}>
            <div className={styles.officialItem}>
              <strong>Hon. Jose B. Galang Jr.</strong>
              <span>Brgy. Kagawad</span>
            </div>
            
            <div className={styles.officialItem}>
              <strong>Hon. Gerardo Q. Andrade</strong>
              <span>Brgy. Kagawad</span>
            </div>
            
            <div className={styles.officialItem}>
              <strong>Hon. Roderick T. Gaton</strong>
              <span>Brgy. Kagawad</span>
            </div>
            
            <div className={styles.officialItem}>
              <strong>Hon. Glenda C. Flores</strong>
              <span>Brgy. Kagawad</span>
            </div>
            
            <div className={styles.officialItem}>
              <strong>Hon. Ferdinand R. Dicen</strong>
              <span>Brgy. Kagawad</span>
            </div>
            
            <div className={styles.officialItem}>
              <strong>Hon. Joey A. Maglalang</strong>
              <span>Brgy. Kagawad</span>
            </div>
            
            <div className={styles.officialItem}>
              <strong>Hon. Jerome L. Duos</strong>
              <span>Brgy. Kagawad</span>
            </div>

            <div className={styles.officialItem}>
              <strong>Mr. Edmer T. Lucido</strong>
              <span>Brgy. Secretary</span>
            </div>

          </div>
          
          
          <div className={styles.officialItem}>
            <strong>Hon. Zenaida L. Miranda</strong>
            <span>IPM Representative</span>
          </div>
          
          <div className={styles.officialItem}>
            <strong>Hon. Angel Victoria M. Bibanco</strong>
            <span>SK Chairman</span>
          </div>

          <div className={styles.officialItem}>
            <strong>Ms. Rosalinda P. Eledia</strong>
            <span>Brgy. Treasurer</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function ChatPlugin({ isOpen, toggleModal, messages, userInput, setUserInput, loading, sendMessage }: {
  isOpen: boolean;
  toggleModal: (open?: boolean) => void;
  messages: Message[];
  userInput: string;
  setUserInput: (input: string) => void;
  loading: boolean;
  sendMessage: () => void;
}) {
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (messages.length) {
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const formatMessage = (content: string) => content.replace(/\n/g, "<br>");

  return (
    <>
      <div className={`${styles.chatPlugin} ${isOpen ? styles.open : ""}`} role="dialog" aria-hidden={!isOpen}>
        <div className={styles.pluginHeader}>
          <div className={styles.pluginTitle}>
            <Image src="/baranguide-log.png" alt="BaranGuide" width={36} height={36} />
            <div className={styles.titleText}>
              <strong>BaranGuide</strong>
              <div className={styles.small}>(Barangay Old Cabalan Chatbot)</div>
            </div>
          </div>
          <div className={styles.pluginActions}>
            <button className={styles.btnClose} onClick={() => toggleModal(false)} aria-label="Close">✕</button>
          </div>
        </div>
        <div className={styles.pluginBody}>
          <div className={styles.messagesContainer} ref={chatContainerRef}>
            {messages.map((message, i) => (
              <div key={i} className={`${styles.message} ${message.sender}`}>
                {message.sender === "bot" ? (
                  <div className={`${styles.messageContent} ${styles.botMessage} ${message.isError ? styles.error : ""}`}>
                    <div dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }} />
                  </div>
                ) : (
                  <div className={`${styles.messageContent} ${styles.userMessage}`}>{message.content}</div>
                )}
              </div>
            ))}
            {loading && (
              <div className={`${styles.message} ${styles.bot}`}>
                <div className={`${styles.messageContent} ${styles.botMessage} ${styles.loading}`}>
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                </div>
              </div>
            )}
          </div>
          <form className={styles.inputArea} onSubmit={handleSubmit}>
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
        <button className={styles.floatingLaunch} onClick={() => toggleModal(true)} aria-label="Open chatbot">
          <Image src="/baranguide-log.png" alt="Chat" width={36} height={36} />
        </button>
      )}
    </>
  );
}

function Footer() {
  return (
    <footer className={styles.siteFooter}>
      <div className={styles.footerContent}>
        <div className={styles.footerGrid}>
          <div className={styles.footerCol}>
            <div className={styles.footerBrand}>
              <Image src="/olongapo-seal.png" alt="Philippine Seal" width={80} height={80} />
            </div>
            <h5>REPUBLIC OF THE PHILIPPINES</h5>
            <p className={styles.footerDesc}>
              All content is in the public domain unless otherwise stated.
            </p>
          </div>

          <div className={styles.footerCol}>
            <h5>ABOUT GOVPH</h5>
            <p className={styles.footerDesc}>
              Learn more about the Philippine government, its structure, how government works and the people behind it.
            </p>
            <ul className={styles.footerLinks}>
              <li><a href="https://www.gov.ph" target="_blank" rel="noopener noreferrer">GOV.PH</a></li>
              <li><a href="https://data.gov.ph" target="_blank" rel="noopener noreferrer">Open Data Portal</a></li>
              <li><a href="https://www.officialgazette.gov.ph" target="_blank" rel="noopener noreferrer">Official Gazette</a></li>
            </ul>
          </div>

          <div className={styles.footerCol}>
            <h5>GOVERNMENT LINKS</h5>
            <ul className={styles.footerLinks}>
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
  );
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>(
    [
      {
        sender: "bot",
        content: "Hello! Welcome to BaranGuide. How can I help you today?",
        timestamp: new Date(),
      },
    ]
  );
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

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
    }
  };

  const toggleModal = (open?: boolean) => {
    const next = typeof open === "boolean" ? open : !isOpen;
    setIsOpen(next);
  };

  return (
    <div className={styles.promoPage}>
      <Header navOpen={navOpen} setNavOpen={setNavOpen} />
      <HeroBanner />
      <main className={styles.content}>
        <ServicesGrid />
      </main>
      <OfficialsSection />
      <ChatPlugin
        isOpen={isOpen}
        toggleModal={toggleModal}
        messages={messages}
        userInput={userInput}
        setUserInput={setUserInput}
        loading={loading}
        sendMessage={sendMessage}
      />
      <Footer />
    </div>
  );
}