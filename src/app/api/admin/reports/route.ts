import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { classifyMessage, deduplicateQuestions, normalize } from '@/lib/classificationUtils';

interface UnansweredQuestion {
  message_id: string;
  question: string;
  timestamp: string;
  answer_found: boolean;
  matched_faq?: string;
}

interface ReportData {
  total_unanswered: number;
  total_questions: number;
  percentage_unanswered: number;
  data: UnansweredQuestion[];
  generated_at: string;
}

// Critical keywords for classification
const CRITICAL_KEYWORDS = [
  'barangay residency',
  'barangay clearance',
  'barangay indigency',
  'barangay certification',
  'barangay captain',
  'office hours',
  'sk chairperson',
  'contact',
  'where',
  'address',
  'basketball',
  'center',
  'vision',
  'mission',
];

const GREETING_WORDS = [
  'hi',
  'hello',
  'hey',
  'thanks',
  'thank you',
  'ok',
  'okay',
  'yes',
  'no',
  'sure',
  'good morning',
  'good afternoon',
  'good evening',
  'how are you',
  'whats up',
  'help',
];

function normalizeLocal(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
}

// Synchronous classification function
function classifyMessageLocal(
  message: string,
  faqs: any[],
  services: any[]
): { answered: boolean; matchedFaq?: any } {
  const normalized = normalizeLocal(message);

  if (!normalized) {
    return { answered: false };
  }

  // Skip if message is ONLY a greeting
  const greetingNorms = GREETING_WORDS.map((g) => normalizeLocal(g)).filter(Boolean);
  const isOnlyGreeting = greetingNorms.some((g) => normalized === g);
  const keywordNorms = CRITICAL_KEYWORDS.map((k) => normalizeLocal(k));
  const hasKeyword = keywordNorms.some((kw) => normalized.includes(kw));

  if (isOnlyGreeting && !hasKeyword) {
    return { answered: false };
  }

  // Try to match FAQ
  for (const faq of faqs) {
    const faqQuestion = normalizeLocal(faq.question || '');
    if (!faqQuestion) continue;

    // Check for critical keyword overlap
    const faqCritical = keywordNorms.filter((kw) => faqQuestion.includes(kw));
    const queryCritical = keywordNorms.filter((kw) => normalized.includes(kw));

    if (faqCritical.length > 0 && queryCritical.length > 0) {
      const overlap = faqCritical.some((kw) => normalized.includes(kw));
      if (overlap) {
        if (faq.answer && faq.answer.trim().length > 0) {
          return { answered: true, matchedFaq: faq };
        }
      }
    }

    // Fallback: check word overlap
    const faqWords = faqQuestion
      .split(' ')
      .filter((w) => !keywordNorms.includes(w) && w.length > 1);
    if (faqWords.length === 0) continue;

    const present = faqWords.filter((w) => normalized.includes(w)).length;
    const threshold = Math.ceil(faqWords.length * 0.7);

    if (present >= threshold) {
      if (faq.answer && faq.answer.trim().length > 0) {
        return { answered: true, matchedFaq: faq };
      }
    }
  }

  // Try to match Service
  for (const service of services) {
    const serviceName = normalizeLocal(service.title || '');
    const serviceDesc = normalizeLocal(service.requirements || '');

    if (!serviceName && !serviceDesc) continue;

    const serviceCritical = keywordNorms.filter(
      (kw) => serviceName.includes(kw) || serviceDesc.includes(kw)
    );
    const queryCritical = keywordNorms.filter((kw) => normalized.includes(kw));

    if (serviceCritical.length > 0 && queryCritical.length > 0) {
      const hasMatch = serviceCritical.some((kw) => normalized.includes(kw));
      if (hasMatch) {
        return { answered: true };
      }
    }

    // Fallback: check service keywords
    const serviceKeywords = (serviceName + ' ' + serviceDesc)
      .split(' ')
      .filter((w) => w.length > 2 && !keywordNorms.includes(w));
    if (serviceKeywords.length === 0) continue;

    const present = serviceKeywords.filter((w) => normalized.includes(w)).length;
    const threshold = Math.ceil(serviceKeywords.length * 0.6);

    if (present >= threshold) {
      return { answered: true };
    }
  }

  return { answered: false };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json'; // json or csv

    console.log('[Reports API] Starting report generation, format:', format);

    // Fetch all user messages, FAQs, and Services
    console.log('[Reports API] Fetching messages...');
    const messagesRes = await supabase.from('messages').select('id,content,created_at,sender').eq('sender', 'user');
    if (messagesRes.error) {
      console.error('[Reports API] Messages query error:', messagesRes.error);
      throw new Error(`Messages error: ${messagesRes.error.message}`);
    }
    console.log('[Reports API] Got', messagesRes.data?.length || 0, 'messages');

    console.log('[Reports API] Fetching FAQs...');
    const faqsRes = await supabase.from('faqs').select('id,question,answer');
    if (faqsRes.error) {
      console.error('[Reports API] FAQs query error:', faqsRes.error);
      throw new Error(`FAQs error: ${faqsRes.error.message}`);
    }
    console.log('[Reports API] Got', faqsRes.data?.length || 0, 'FAQs');

    console.log('[Reports API] Fetching services...');
    const servicesRes = await supabase.from('services').select('id,title,requirements');
    if (servicesRes.error) {
      console.error('[Reports API] Services query error:', servicesRes.error);
      throw new Error(`Services error: ${servicesRes.error.message}`);
    }
    console.log('[Reports API] Got', servicesRes.data?.length || 0, 'services');

    const messages = (messagesRes.data || []) as any[];
    const faqs = (faqsRes.data || []) as any[];
    const services = (servicesRes.data || []) as any[];

    const unansweredQuestions: UnansweredQuestion[] = [];
    let totalValidQuestions = 0;

    console.log('[Reports API] Classifying', messages.length, 'messages...');

    // Group messages by normalized content and keywords (same as dashboard)
    const keywordNorms = CRITICAL_KEYWORDS.map((k) => normalizeLocal(k))
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);

    const greetingNorms = GREETING_WORDS.map((g) => normalizeLocal(g)).filter(Boolean);

    const messageGroupMap = new Map<
      string,
      { sample: string; normalized: string; count: number; examples: string[]; messageIds: string[] }
    >();

    for (const m of messages) {
      if (!m.content || !m.content.trim()) continue;

      const raw = (m.content || "").toString();
      const norm = normalizeLocal(raw);
      if (!norm) continue;

      // Skip if message is ONLY a greeting (no actual question/keyword)
      const isOnlyGreeting = greetingNorms.some((g) => norm === g);
      const hasKeyword = keywordNorms.some((kw) => norm.includes(kw));

      if (isOnlyGreeting && !hasKeyword) {
        continue; // skip pure greetings - don't count these
      }

      totalValidQuestions++; // Only count non-greeting messages

      // Try to find a critical keyword present in the normalized message
      const matchedKw = keywordNorms.find((kw) => norm.includes(kw));

      // Use grouped key: keyword groups use "kw:{keyword}" so all messages containing same keyword merge
      const key = matchedKw ? `kw:${matchedKw}` : `txt:${norm}`;
      const entry = messageGroupMap.get(key);
      if (entry) {
        entry.count += 1;
        if (entry.examples.length < 3) entry.examples.push(raw);
        entry.messageIds.push(m.id);
      } else {
        messageGroupMap.set(key, {
          sample: matchedKw ? matchedKw : raw,
          normalized: matchedKw ? matchedKw : norm,
          count: 1,
          examples: [raw],
          messageIds: [m.id],
        });
      }
    }

    console.log('[Reports API] totalValidQuestions=', totalValidQuestions, ', groups=', messageGroupMap.size);

    // Classify groups (same as dashboard)
    const classifiedGroups = Array.from(messageGroupMap.values()).map((g) => {
      // Query-critical keywords present in this group
      const queryCritical = keywordNorms.filter((kw) => g.normalized.includes(kw));

      // Try to match FAQ first
      let matchedFaq = faqs.find((f) => {
        const q = normalizeLocal(f.question || "");
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
            const serviceName = normalizeLocal(s.title || "");
            const serviceDesc = normalizeLocal(s.requirements || "");

            if (!serviceName && !serviceDesc) return false;

            const serviceCritical = keywordNorms.filter((kw) => serviceName.includes(kw) || serviceDesc.includes(kw));
            if (serviceCritical.length > 0 && queryCritical.length > 0) {
              return serviceCritical.some((kw) => g.normalized.includes(kw));
            }

            const kws = (serviceName + " " + serviceDesc).split(" ").filter((w) => w.length > 2 && !keywordNorms.includes(w));
            if (kws.length === 0) return false;
            const present = kws.filter((w) => g.normalized.includes(w)).length;
            const threshold = Math.ceil(kws.length * 0.6);
            return present >= threshold;
          })
        : undefined;

      return { ...g, matchedFaq, matchedService };
    });

    // Count unanswered
    let answeredCount = 0;
    let unansweredCount = 0;

    for (const g of classifiedGroups) {
      if (g.matchedFaq) {
        if (g.matchedFaq.answer && g.matchedFaq.answer.trim().length) {
          answeredCount += g.count;
        } else {
          unansweredCount += g.count;
          unansweredQuestions.push({
            message_id: g.messageIds.join(', '),
            question: g.examples[0],
            timestamp: messages.find(m => g.messageIds.includes(m.id))?.created_at || new Date().toISOString(),
            answer_found: false,
          });
        }
      } else if (g.matchedService) {
        answeredCount += g.count;
      } else {
        unansweredCount += g.count;
        unansweredQuestions.push({
          message_id: g.messageIds.join(', '),
          question: g.examples[0],
          timestamp: messages.find(m => g.messageIds.includes(m.id))?.created_at || new Date().toISOString(),
          answer_found: false,
        });
      }
    }

    console.log('[Reports API] After classification: answered=', answeredCount, ', unanswered=', unansweredCount);

    const reportData: ReportData = {
      total_unanswered: unansweredCount,
      total_questions: totalValidQuestions,
      percentage_unanswered:
        totalValidQuestions > 0
          ? Math.round((unansweredCount / totalValidQuestions) * 100)
          : 0,
      data: unansweredQuestions.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
      generated_at: new Date().toISOString(),
    };

    if (format === 'csv') {
      // Generate CSV
      let csv =
        'Message ID,Question,Timestamp,Answer Found\n';
      for (const q of reportData.data) {
        const escapedQuestion = q.question
          .replace(/"/g, '""')
          .replace(/\n/g, ' ');
        csv += `"${q.message_id}","${escapedQuestion}","${q.timestamp}",${q.answer_found}\n`;
      }

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition':
            'attachment; filename=unanswered-questions-report.csv',
        },
      });
    }

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('[Reports API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to generate report', details: errorMessage },
      { status: 500 }
    );
  }
}
