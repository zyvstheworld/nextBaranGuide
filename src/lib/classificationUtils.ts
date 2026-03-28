/**
 * Shared classification logic for unanswered questions
 * Used by both dashboard and reports to ensure consistency
 */

// Critical keywords for classification
export const CRITICAL_KEYWORDS = [
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

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
}

export function classifyMessage(
  message: string,
  faqs: any[],
  services: any[]
): { answered: boolean; matchedFaq?: any } {
  const normalized = normalize(message);

  if (!normalized) {
    return { answered: false };
  }

  // Skip if message is ONLY a greeting
  const greetingNorms = GREETING_WORDS.map((g) => normalize(g)).filter(Boolean);
  const isOnlyGreeting = greetingNorms.some((g) => normalized === g);
  const keywordNorms = CRITICAL_KEYWORDS.map((k) => normalize(k));
  const hasKeyword = keywordNorms.some((kw) => normalized.includes(kw));

  if (isOnlyGreeting && !hasKeyword) {
    return { answered: false };
  }

  // Try to match FAQ
  for (const faq of faqs) {
    const faqQuestion = normalize(faq.question || '');
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
    const serviceName = normalize(service.title || '');
    const serviceDesc = normalize(service.requirements || '');

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

export interface ClassifiedMessage {
  id: string;
  content: string;
  created_at: string;
  answered: boolean;
}

export interface DeduplicatedQuestion {
  normalized: string;
  examples: string[];
  latestTimestamp: string;
  messageIds: string[];
  count: number;
}

/**
 * Deduplicate similar questions based on normalized content
 */
export function deduplicateQuestions(
  messages: ClassifiedMessage[]
): DeduplicatedQuestion[] {
  const questionMap = new Map<string, DeduplicatedQuestion>();

  for (const msg of messages) {
    const normalized = normalize(msg.content);

    if (!questionMap.has(normalized)) {
      questionMap.set(normalized, {
        normalized,
        examples: [msg.content],
        latestTimestamp: msg.created_at,
        messageIds: [msg.id],
        count: 1,
      });
    } else {
      const existing = questionMap.get(normalized)!;
      if (existing.examples.length < 3) {
        existing.examples.push(msg.content);
      }
      existing.messageIds.push(msg.id);
      existing.count += 1;
      // Keep the latest timestamp
      if (new Date(msg.created_at) > new Date(existing.latestTimestamp)) {
        existing.latestTimestamp = msg.created_at;
      }
    }
  }

  return Array.from(questionMap.values());
}
