export type ContentType =
  | 'product_description'
  | 'blog_post_outline'
  | 'email_composer'
  | 'social_media_caption'

export interface ProductDescriptionInputs {
  productName: string
  keyFeatures: string[]
  tone: 'formal' | 'casual' | 'playful' | 'authoritative' | 'urgent' | 'empathetic' | 'minimalist'
  wordCount: 'teaser' | 'standard' | 'extended'
}

export interface BlogPostInputs {
  topic: string
  targetAudience: string
  desiredLength: 'short' | 'medium' | 'long'
}

export interface EmailInputs {
  companyName: string
  emailPurpose: string
  emailStyle: 'formal' | 'friendly' | 'persuasive' | 'direct' | 'empathetic'
  emailLength: 'brief' | 'standard' | 'detailed'
  keyPoints: string[]
}

export interface SocialMediaInputs {
  platform: 'instagram' | 'linkedin' | 'twitter' | 'facebook'
  topic: string
  tone: 'professional' | 'casual' | 'fun'
  wordCount: 'micro' | 'short' | 'medium' | 'long'
}

export type ContentInputs =
  | ProductDescriptionInputs
  | BlogPostInputs
  | EmailInputs
  | SocialMediaInputs

const VALID_CONTENT_TYPES = [
  'product_description',
  'blog_post_outline',
  'email_composer',
  'social_media_caption',
] as const

export function isValidContentType(value: unknown): value is ContentType {
  return typeof value === 'string' && (VALID_CONTENT_TYPES as readonly string[]).includes(value)
}

export function buildPrompt(contentType: ContentType, inputs: ContentInputs): string {
  switch (contentType) {
    case 'product_description': {
      const i = inputs as ProductDescriptionInputs
      const wordCountGuide: Record<string, string> = {
        teaser:   '50–80 words — one tight paragraph; every word earns its place. Ideal for product cards and catalogue listings.',
        standard: '120–200 words — 2 focused paragraphs that cover the key benefits and end with a call to action. Ideal for product pages.',
        extended: '250–400 words — 3–4 paragraphs with richer context, use cases, and a strong closing CTA. Ideal for landing pages.',
      }
      return (
        'Write a compelling product description for "' + i.productName + '".\n\n' +
        'Key features: ' + i.keyFeatures.join(', ') + '\n' +
        'Tone: ' + i.tone + '\n' +
        'Length target: ' + wordCountGuide[i.wordCount] + '\n\n' +
        'Instructions:\n' +
        '1. If "' + i.productName + '" is a real existing product or brand, ground the description in its actual real-world qualities, reputation, and known characteristics. Use the provided key features as emphasis points, but stay true to what the product actually is.\n' +
        '2. If the product is unknown or fictional, use the key features as a starting point and freely enrich the description with plausible, creative detail that fits the product category and tone.\n' +
        '3. Every key feature listed (' + i.keyFeatures.join(', ') + ') must appear in the text at least once — either the exact word or a direct synonym. Do not ignore any of them.\n' +
        '4. Do not compare the product to other brands or products. Write about it on its own merits.\n' +
        '5. Strictly respect the length target above. Do not exceed it or fall significantly short.\n' +
        '6. End with a short, natural call to action that fits the tone (e.g. "Order today.", "Try it now.", "See what it can do for you." — adapt to the context).\n' +
        '7. Avoid clichés. Do not use these phrases: "feels great in your hand", "staying power", "flagship-level", "without breaking the bank", "day-to-day", "game-changer", "state-of-the-art", "seamless experience", "intuitive design", "best of both worlds".\n' +
        '8. Do not include a title — just the description text.\n' +
        '9. Use plain text only. No markdown: no hashtags (#), no asterisks (*), no underscores (_). To emphasize a word or phrase, wrap it in double quotes.\n' +
        '10. Respond in the same language as the product name and key features are written in.'
      )
    }
    case 'blog_post_outline': {
      const i = inputs as BlogPostInputs
      const lengthMap: Record<string, { sections: string; words: string }> = {
        short:  { sections: '5–7 sections', words: '~500 words' },
        medium: { sections: '7–10 sections', words: '~1 000 words' },
        long:   { sections: '10–15 sections', words: '~2 000+ words' },
      }
      const { sections, words } = lengthMap[i.desiredLength]
      return (
        'Create a detailed blog post outline on the topic: "' + i.topic + '".\n\n' +
        'Target audience: ' + i.targetAudience + '\n' +
        'Article scope: ' + sections + ', target length for the full article — ' + words + '\n\n' +
        'FORMATTING RULES:\n' +
        '1. Respond fully in the same language as the topic is written in. If the topic is in Ukrainian, write everything in Ukrainian, including section names (not "Title" but the local equivalent, not "Introduction Hook" but the local equivalent, etc.).\n' +
        '2. No markdown symbols: no hashtags (#), no asterisks (*), no underscores (_).\n' +
        '3. Number main sections with digits and a period (1. 2. 3.); use letters or indented dashes for sub-points.\n' +
        '4. To emphasize text, use quotation marks.\n' +
        '5. For each section, indicate the approximate word count so the total adds up to ' + words + '.\n\n' +
        'OUTLINE STRUCTURE:\n' +
        'Title\n' +
        'Opening hook\n' +
        'Main sections with sub-points (' + sections + ')\n' +
        'Conclusion\n' +
        'Call to action'
      )
    }
    case 'email_composer': {
      const i = inputs as EmailInputs
      const lengthMap: Record<string, string> = {
        brief:    '100–180 words — one clear message, no filler',
        standard: '200–350 words — full context with supporting detail',
        detailed: '400–600 words — comprehensive letter covering all nuances',
      }
      const styleMap: Record<string, string> = {
        formal:     'formal — precise wording, complete sentences, no contractions',
        friendly:   'friendly — warm but on-point, light tone without over-familiarity',
        persuasive: 'persuasive — benefit-focused, gently drives the reader to act',
        direct:     'direct — no preamble, straight to the point',
        empathetic: 'empathetic — acknowledges the reader\'s situation, supportive tone',
      }
      return (
        'Write a business email on behalf of "' + i.companyName + '".\n\n' +
        'Email purpose: ' + i.emailPurpose + '\n' +
        'Style: ' + styleMap[i.emailStyle] + '\n' +
        'Length: ' + lengthMap[i.emailLength] + '\n' +
        (i.keyPoints.length > 0
          ? 'Key points to include: ' + i.keyPoints.join(', ') + '\n'
          : '') +
        '\nRespond in the same language as the email purpose is written in.\n\n' +
        'STRUCTURE:\n' +
        '1. Subject line (Subject:) — concise and specific, under 60 characters.\n' +
        '2. Greeting.\n' +
        '3. Body — flowing paragraphs, not a bullet list. Weave each key point naturally into the text.\n' +
        '4. Clear call to action.\n' +
        '5. Sign-off on behalf of the company.\n\n' +
        'RULES:\n' +
        '- No markdown: no asterisks, hashtags, or underscores.\n' +
        '- Put the "Subject:" line first, separate from the email body.\n' +
        '- Do not start consecutive paragraphs with "I" or the company name.'
      )
    }
    case 'social_media_caption': {
      const i = inputs as SocialMediaInputs
      const platformName: Record<string, string> = {
        instagram: 'Instagram',
        linkedin: 'LinkedIn',
        twitter: 'Twitter/X',
        facebook: 'Facebook',
      }

      // Word count targets per platform per size
      const wordCountGuide: Record<string, Record<string, string>> = {
        instagram: {
          micro:  '30-50 слів — одна сильна думка, максимум концентрації',
          short:  '60-90 слів — швидка історія або влучне спостереження',
          medium: '120-180 слів — розгорнута думка з деталями та емоцією',
          long:   '220-300 слів — сторітелінг, кейс або особиста історія',
        },
        linkedin: {
          micro:  '40-70 слів — гострий інсайт або провокативне твердження',
          short:  '80-130 слів — думка з одним ключовим аргументом',
          medium: '180-280 слів — розгорнута позиція з прикладами',
          long:   '350-500 слів — детальний кейс, урок або thought leadership',
        },
        twitter: {
          micro:  'До 140 символів — максимально стисло, один удар',
          short:  '150-220 символів — думка з невеликим контекстом',
          medium: 'До 280 символів — повноцінний твіт з гачком і висновком',
          long:   'Тред з 3-4 твітів, кожен до 280 символів. Нумеруй: 1/ 2/ 3/',
        },
        facebook: {
          micro:  '40-70 слів — коротка думка або анонс, що спонукає до реакції',
          short:  '80-130 слів — пост з контекстом і закликом до коментарів',
          medium: '150-250 слів — розгорнута думка або невелика історія',
          long:   '300-450 слів — детальний сторітелінг або пост-обговорення',
        },
      }

      const platformRules: Record<string, string> = {
        instagram: 'Додай доречні емодзі (не перестарайся). Роби короткі абзаци — 1-2 речення. Завершуй 3-5 релевантними хештегами окремим рядком.',
        linkedin:  'Короткі абзаци з пробілом між ними. Без емодзі або мінімум. Можна 1-2 хештеги в кінці. Заклик до дії або питання в кінці.',
        twitter:   'Без markdown. Максимум 1-2 хештеги якщо доречно.',
        facebook:  'Природній розмовний стиль. Можна 1-2 емодзі якщо тон дозволяє. Завершуй питанням або закликом залишити коментар — це підвищує охоплення. Хештеги не обов\'язкові, але можна 1-2.',
      }

      return (
        'Напиши пост для ' + platformName[i.platform] + '.\n\n' +
        'Тема: ' + i.topic + '\n' +
        'Тон: ' + i.tone + '\n' +
        'Обсяг: ' + wordCountGuide[i.platform][i.wordCount] + '\n\n' +
        'Відповідай тією мовою, якою написана тема.\n\n' +
        'ОБОВ\'ЯЗКОВА СТРУКТУРА:\n' +
        '1. ХУК (перший рядок) — зупиняє скролінг. Це може бути провокативне твердження, несподіваний факт, питання або сильна цитата. Не починай з "Я", не використовуй кліше типу "У сучасному світі".\n' +
        '2. РОЗВИТОК — зв\'язний, плавний текст (не список тез). Розкривай думку через конкретику, деталі або короткий сторітелінг.\n' +
        '3. ВИСНОВОК / ЗАКЛИК — сильна фінальна думка або дія.\n\n' +
        'Правила платформи: ' + platformRules[i.platform] + '\n' +
        'Без markdown символів у тексті: без решіток (#) поза хештегами, без зірочок, без підкреслень.'
      )
    }
    default:
      return 'Write helpful content.'
  }
}
