"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type FAQ = { id: string; question: string; answer?: string };
type Service = { id: string; name?: string; description?: string; title?: string; service_name?: string };
type Msg = { content: string; sender: "user" | "bot"; created_at?: string };

// new: centralized keyword list (easy to edit)
const CRITICAL_KEYWORDS = [
  "barangay residency",
  "barangay clearance",
  "barangay indigency",
  "barangay certification",
  "barangay captain",
  "office hours",
  "sk chairperson",
  "contact",
  "where",
  "address",
  "basketball",
  "center",
  "vision",
  "mission",
];

// Greetings and filler words to exclude from analysis
const GREETING_WORDS = [
  "hi",
  "hello",
  "hey",
  "thanks",
  "thank you",
  "ok",
  "okay",
  "yes",
  "no",
  "sure",
  "good morning",
  "good afternoon",
  "good evening",
  "how are you",
  "whats up",
  "help",
];

export default function AdminDashboard() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [faqsRes, servicesRes, msgsRes] = await Promise.all([
        supabase.from("faqs").select("id,question,answer"),
        supabase.from("services").select("*"),
        supabase.from("messages").select("content,sender,created_at").eq("sender", "user"),
      ]);

      if (faqsRes.error) throw new Error(`FAQs: ${faqsRes.error.message}`);
      if (servicesRes.error) throw new Error(`Services: ${servicesRes.error.message}`);
      if (msgsRes.error) throw new Error(`Messages: ${msgsRes.error.message}`);

      console.log("FAQs:", faqsRes.data);
      console.log("Services:", servicesRes.data);
      console.log("Messages:", msgsRes.data);

      setFaqs((faqsRes.data as any) ?? []);
      setServices((servicesRes.data as any) ?? []);
      setMessages(((msgsRes.data as any) ?? []).filter((m: any) => m?.content));
    } catch (e: any) {
      console.error("Dashboard fetch error:", e);
      setError(e.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ");

  // group user messages by normalized content OR by matching critical keyword (keyword groups count as one)
  const grouped = useMemo(() => {
    // prepare normalized critical keywords (longer first so multi-word keywords match first)
    const keywordNorms = CRITICAL_KEYWORDS
      .map((k) => normalize(k))
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);

    const greetingNorms = GREETING_WORDS
      .map((g) => normalize(g))
      .filter(Boolean);

    const map = new Map<
      string,
      { sample: string; normalized: string; count: number; examples: string[] }
    >();

    for (const m of messages) {
      const raw = (m.content || "").toString();
      const norm = normalize(raw);
      if (!norm) continue;

      // Skip if message is ONLY a greeting (no actual question/keyword)
      const isOnlyGreeting = greetingNorms.some((g) => norm === g);
      const hasKeyword = keywordNorms.some((kw) => norm.includes(kw));
      
      if (isOnlyGreeting && !hasKeyword) {
        continue; // skip pure greetings
      }

      // try to find a critical keyword present in the normalized message
      const matchedKw = keywordNorms.find((kw) => norm.includes(kw));

      // use grouped key: keyword groups use "kw:{keyword}" so all messages containing same keyword merge
      // otherwise fall back to full normalized text
      const key = matchedKw ? `kw:${matchedKw}` : `txt:${norm}`;
      const entry = map.get(key);
      if (entry) {
        entry.count += 1;
        if (entry.examples.length < 4) entry.examples.push(raw);
      } else {
        map.set(key, {
          sample: matchedKw ? matchedKw : raw,
          normalized: matchedKw ? matchedKw : norm,
          count: 1,
          examples: [raw],
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [messages]);

  // try to match grouped queries to FAQs or Services
  const classified = useMemo(() => {
    const keywordNorms = CRITICAL_KEYWORDS.map((k) => normalize(k));

    return grouped.map((g) => {
      // query-critical keywords present in this group (may be the group normalized itself)
      const queryCritical = keywordNorms.filter((kw) => g.normalized.includes(kw));

      // Try to match FAQ first
      let matchedFaq = faqs.find((f) => {
        const q = normalize(f.question || "");
        if (!q) return false;

        // FAQ-critical keywords present
        const faqCritical = keywordNorms.filter((kw) => q.includes(kw));

        // If both contain any critical keyword, prefer that match
        if (faqCritical.length > 0 && queryCritical.length > 0) {
          const overlap = faqCritical.some((kw) => g.normalized.includes(kw));
          if (overlap) return true;
        }

        // Fallback: standard strict overlap (exclude critical keywords from scoring)
        const qWords = q.split(" ").filter((w) => !keywordNorms.includes(w) && w.length > 1);
        if (qWords.length === 0) return false;
        const present = qWords.filter((w) => g.normalized.includes(w)).length;
        const threshold = Math.ceil(qWords.length * 0.7);
        return present >= threshold;
      });

      // If no FAQ match, try to match Service
      let matchedService = !matchedFaq
        ? services.find((s) => {
            const serviceName = s.name || (s as any).title || (s as any).service_name || "";
            const serviceDesc = s.description || (s as any).details || "";

            const sn = normalize(serviceName);
            const sd = normalize(serviceDesc);
            if (!sn && !sd) return false;

            const serviceCritical = keywordNorms.filter((kw) => sn.includes(kw) || sd.includes(kw));
            if (serviceCritical.length > 0 && queryCritical.length > 0) {
              return serviceCritical.some((kw) => g.normalized.includes(kw));
            }

            const kws = (sn + " " + sd).split(" ").filter((w) => w.length > 2 && !keywordNorms.includes(w));
            if (kws.length === 0) return false;
            const present = kws.filter((w) => g.normalized.includes(w)).length;
            const threshold = Math.ceil(kws.length * 0.6);
            return present >= threshold;
          })
        : undefined;

      return { ...g, matchedFaq, matchedService };
    });
  }, [grouped, faqs, services]);

  const metrics = useMemo(() => {
    const totalMessages = messages.length;
    const uniqueQueries = grouped.length;
    let answeredMessages = 0;
    let unansweredMessages = 0;
    let matchedGroups = 0;
    for (const g of classified) {
      if (g.matchedFaq) {
        matchedGroups += 1;
        if (g.matchedFaq.answer && g.matchedFaq.answer.trim().length) {
          answeredMessages += g.count;
        } else {
          unansweredMessages += g.count;
        }
      } else if (g.matchedService) {
        matchedGroups += 1;
        answeredMessages += g.count;
      } else {
        unansweredMessages += g.count;
      }
    }
    return { totalMessages, uniqueQueries, matchedGroups, answeredMessages, unansweredMessages };
  }, [messages.length, grouped, classified]);

  const topN = 5;
  const topQuestions = classified.slice(0, topN);
  const maxCount = Math.max(1, ...topQuestions.map((t) => t.count));

  return (
    <div className="dashboard-root">
      <header className="dash-header">
        <div>
          <h1>Admin Analytics — User Questions</h1>
          <p className="muted">Real-time summary derived from user messages</p>
        </div>
        <div className="actions">
          <button onClick={fetchData} className="btn" disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <strong>Error:</strong> {error}
        </div>
      )}

      <section className="metrics-grid">
        <div className="card metric">
          <div className="metric-label">Total user messages</div>
          <div className="metric-value">{metrics.totalMessages}</div>
          <div className="metric-sub muted">All incoming user queries</div>
        </div>

        <div className="card metric">
          <div className="metric-label">Unique user questions</div>
          <div className="metric-value">{metrics.uniqueQueries}</div>
          <div className="metric-sub muted">Grouped by normalized content</div>
        </div>

        <div className="card metric">
          <div className="metric-label">Matched (FAQ + Service)</div>
          <div className="metric-value">{metrics.matchedGroups}</div>
          <div className="metric-sub muted">Groups linked to FAQs or Services</div>
        </div>

        <div className="card metric">
          <div className="metric-label">Unanswered messages</div>
          <div className="metric-value">{metrics.unansweredMessages}</div>
          <div className="metric-sub muted">No matching answer in FAQs/Services</div>
        </div>
      </section>

      <section className="visuals">
        <div className="card chart-card">
          <h3>Top user questions</h3>
          {topQuestions.length === 0 ? (
            <div className="empty">No queries yet</div>
          ) : (
            <svg viewBox={`0 0 550 240`} className="bar-chart" preserveAspectRatio="none">
              <g transform="translate(40,20)">
                {topQuestions.map((t, i) => {
                  const w = 70;
                  const gap = 26;
                  const x = i * (w + gap);
                  const h = Math.round((t.count / maxCount) * 180);
                  const y = 180 - h;
                  let color = "#ef4444";
                  if (t.matchedFaq && t.matchedFaq.answer) color = "#106eea";
                  else if (t.matchedFaq || t.matchedService) color = "#f59e0b";
                  return (
                    <g key={i}>
                      <rect x={x} y={y} width={w} height={h} rx="6" fill={color} />
                      <text x={x + w / 2} y={196} fontSize="11" textAnchor="middle" fill="#0f172a">
                        {t.count}
                      </text>
                      <text x={x + w / 2} y={212} fontSize="10" textAnchor="middle" fill="#475569">
                        {t.sample.length > 28 ? t.sample.slice(0, 25) + "…" : t.sample}
                      </text>
                    </g>
                  );
                })}
                <text x={-30} y={90} transform="rotate(-90 -30 90)" fontSize="11" fill="#64748b">
                  Frequency
                </text>
              </g>
            </svg>
          )}
          <div className="legend">
            <div><span className="dot blue"></span>Answered FAQ</div>
            <div><span className="dot amber"></span>Matched FAQ/Service (partial)</div>
            <div><span className="dot red"></span>No matching FAQ/Service</div>
          </div>
        </div>

        <div className="card chart-card">
          <h3>Answer coverage</h3>
          <div className="coverage">
            <div className="coverage-bar">
              <div
                className="coverage-filled"
                style={{
                  width: `${Math.round(
                    (metrics.answeredMessages /
                      Math.max(1, metrics.answeredMessages + metrics.unansweredMessages)) *
                      100
                  )}%`,
                }}
                aria-hidden
              />
            </div>
            <div className="coverage-stats">
              <div>
                <div className="stat-num">{metrics.answeredMessages}</div>
                <div className="muted">Answered messages</div>
              </div>
              <div>
                <div className="stat-num">{metrics.unansweredMessages}</div>
                <div className="muted">Unanswered messages</div>
              </div>
            </div>
          </div>

          <h4 className="mt">Prioritized unanswered (from messages)</h4>
          <div className="unanswered-list">
            {classified
              .filter((c) => (!c.matchedFaq || !c.matchedFaq.answer || !c.matchedFaq.answer.trim()) && !c.matchedService)
              .slice(0, 6)
              .map((u) => (
                <div key={u.normalized} className="un-item">
                  <div className="u-left">
                    <div className="u-count">{u.count}</div>
                  </div>
                  <div className="u-right">
                    <div className="u-sample">{u.sample}</div>
                    <div className="muted small">
                      {u.matchedFaq ? `Matches FAQ: ${u.matchedFaq.question}` : "No matching FAQ/Service"}
                    </div>
                  </div>
                </div>
              ))}
            {classified.filter((c) => (!c.matchedFaq || !c.matchedFaq.answer || !c.matchedFaq.answer.trim()) && !c.matchedService).length === 0 && (
              <div className="empty muted">All top user queries have answers.</div>
            )}
          </div>
        </div>
      </section>

      <section className="card table-card">
        <h3>Detailed top matched questions</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Query (representative)</th>
                <th>Count</th>
                <th>Matched FAQ / Service</th>
              </tr>
            </thead>
            <tbody>
              {classified
                .filter((c) => (c.matchedFaq && c.matchedFaq.answer && c.matchedFaq.answer.trim().length) || c.matchedService)
                .slice(0, 5)
                .map((r, i) => (
                  <tr key={r.normalized}>
                    <td>{i + 1}</td>
                    <td className="mono">{r.sample}</td>
                    <td>{r.count}</td>
                    <td>
                      {r.matchedFaq ? (
                        <div>
                          <div className="faq-q">{r.matchedFaq.question}</div>
                          <div className="muted small">{r.matchedFaq.answer}</div>
                        </div>
                      ) : r.matchedService ? (
                        <div>
                          <div className="faq-q">{r.matchedService.name || (r.matchedService as any).title || "Service"}</div>
                          <div className="muted small">{r.matchedService.description || (r.matchedService as any).details}</div>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              {classified.filter((c) => (c.matchedFaq && c.matchedFaq.answer && c.matchedFaq.answer.trim().length) || c.matchedService).length === 0 && (
                <tr><td colSpan={4} className="muted">No matched & answered groups yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <style jsx>{`
        .dashboard-root { padding: 20px; font-family: Inter, ui-sans-serif, system-ui; color: #0f172a; }
        .dash-header { display:flex; justify-content:space-between; align-items:center; gap:20px; margin-bottom:18px; }
        .dash-header h1 { margin:0; font-size:1.25rem; }
        .muted { color:#64748b; font-size:0.9rem; }
        .error-banner { background:#fff5f5; border:1px solid #feb2b2; color:#c53030; padding:12px; border-radius:8px; margin-bottom:12px; }
        .btn { background:#0b4ed6; color:white; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; }
        .metrics-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:18px; }
        .card { background:white; padding:14px; border-radius:10px; box-shadow:0 8px 24px rgba(2,6,23,0.06); }
        .metric .metric-label { font-size:0.85rem; color:#475569; }
        .metric .metric-value { font-size:1.6rem; font-weight:700; margin-top:6px; }
        .metric .metric-sub { margin-top:6px; color:#94a3b8; font-size:0.85rem; }

        .visuals { display:grid; grid-template-columns: 2fr 1fr; gap:12px; margin-bottom:18px; }
        .chart-card h3 { margin:0 0 8px 0; font-size:1rem; }
        .bar-chart { width:100%; height:240px; background:linear-gradient(180deg,#fbfdff,#f7fbff); border-radius:8px; padding:6px; }
        .legend { display:flex; gap:10px; margin-top:10px; color:#475569; font-size:0.9rem; align-items:center; }
        .dot { display:inline-block; width:12px; height:12px; border-radius:3px; margin-right:6px; vertical-align:middle; }
        .dot.blue { background:#106eea; } .dot.amber { background:#f59e0b; } .dot.red { background:#ef4444; }

        .coverage { display:flex; flex-direction:column; gap:12px; }
        .coverage-bar { height:18px; background:#eef2ff; border-radius:999px; overflow:hidden; }
        .coverage-filled { height:100%; background:#10b981; border-radius:999px 0 0 999px; }
        .coverage-stats { display:flex; justify-content:space-between; gap:12px; align-items:center; }
        .stat-num { font-weight:700; font-size:1.2rem; }

        .unanswered-list { display:flex; flex-direction:column; gap:10px; margin-top:6px; }
        .un-item { display:flex; gap:12px; align-items:flex-start; }
        .u-left { width:44px; height:44px; background:#f8fafc; border-radius:8px; display:flex; align-items:center; justify-content:center; }
        .u-count { font-weight:700; color:#0f172a; }
        .u-sample { font-weight:600; }

        .table-card h3 { margin:0 0 8px 0; }
        .table-wrap { overflow:auto; max-height:360px; }
        table { width:100%; border-collapse:collapse; font-size:0.95rem; }
        th { text-align:left; color:#475569; font-size:0.85rem; padding:10px; position:sticky; top:0; background:white; }
        td { padding:10px; border-top:1px solid #eef2ff; vertical-align:top; color:#0f172a; }
        .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace; }
        .faq-q { font-weight:700; }
        .small { font-size:0.85rem; }
        .empty { color:#64748b; padding:12px 0; }
        .mt { margin-top: 12px; }
        @media (max-width: 980px) {
          .metrics-grid { grid-template-columns:repeat(2,1fr); }
          .visuals { grid-template-columns:1fr; }
        }
      `}</style>
    </div>
  );
}