export type ContentType =
  | 'product_description'
  | 'blog_post_outline'
  | 'email_composer'
  | 'social_media_caption'

export interface ProductDescriptionInputs {
  productName: string
  keyFeatures: string[]
  tone: 'formal' | 'casual' | 'playful' | 'authoritative' | 'urgent' | 'empathetic' | 'minimalist'
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

export function buildPrompt(contentType: ContentType, inputs: ContentInputs): string {
  switch (contentType) {
    case 'product_description': {
      const i = inputs as ProductDescriptionInputs
      return (
        'Write a compelling product description for "' +
        i.productName +
        '".\n\n' +
        'Key features: ' +
        i.keyFeatures.join(', ') +
        '\nTone: ' +
        i.tone +
        '\n\n' +
        'Instructions:\n' +
        '1. If "' + i.productName + '" is a real existing product or brand, ground the description in its actual real-world qualities, reputation, and known characteristics. Use the provided key features as emphasis points, but stay true to what the product actually is.\n' +
        '2. If the product is unknown or fictional, use the key features as a starting point and freely enrich the description with plausible, creative detail that fits the product category and tone.\n' +
        '3. Every key feature listed (' + i.keyFeatures.join(', ') + ') must appear in the text at least once — either the exact word or a direct synonym. Do not ignore any of them.\n' +
        '4. Do not compare the product to other brands or products. Write about it on its own merits.\n' +
        '5. Write 2-3 paragraphs in a ' + i.tone + ' tone.\n' +
        '6. End with a short, natural call to action that fits the tone (e.g. "Order today.", "Try it now.", "See what it can do for you." — adapt to the context).\n' +
        '7. Avoid clichés. Do not use these phrases: "feels great in your hand", "staying power", "flagship-level", "without breaking the bank", "day-to-day", "game-changer", "state-of-the-art", "seamless experience", "intuitive design", "best of both worlds".\n' +
        '8. Do not include a title — just the description text.\n' +
        '9. Use plain text only. No markdown: no hashtags (#), no asterisks (*), no underscores (_). To emphasize a word or phrase, wrap it in double quotes.\n' +
        '10. Respond in the same language as the product name and key features are written in.'
      )
    }
    case 'blog_post_outline': {
      const i = inputs as BlogPostInputs
      const lengthMap: Record<string, string> = {
        short: '5-7 розділів',
        medium: '7-10 розділів',
        long: '10-15 розділів',
      }
      return (
        'Створи детальний outline для блог-посту на тему: "' + i.topic + '".\n\n' +
        'Цільова аудиторія: ' + i.targetAudience + '\n' +
        'Бажана довжина: ' + lengthMap[i.desiredLength] + '\n\n' +
        'ВАЖЛИВО — правила форматування:\n' +
        '- Відповідай повністю тією мовою, якою написана тема. Якщо тема українською — весь текст українською, включно з назвами розділів (не "Title", а "Назва"; не "Introduction Hook", а "Вступний гачок" тощо).\n' +
        '- Не використовуй символи markdown: без решіток (#), без зірочок (*), без підкреслень (_).\n' +
        '- Розділи нумеруй цифрами з крапкою (1. 2. 3.), підрозділи — літерами або дефісом з відступом.\n' +
        '- Для виділення тексту використовуй лапки.\n\n' +
        'Структура outline:\n' +
        'Назва\n' +
        'Вступний гачок\n' +
        'Основні розділи з підпунктами (' + lengthMap[i.desiredLength] + ')\n' +
        'Висновок\n' +
        'Заклик до дії'
      )
    }
    case 'email_composer': {
      const i = inputs as EmailInputs
      const lengthMap: Record<string, string> = {
        brief:    '100-180 слів — стислий лист з одним чітким меседжем',
        standard: '200-350 слів — повноцінний лист з контекстом і деталями',
        detailed: '400-600 слів — розгорнутий лист з обґрунтуванням і всіма нюансами',
      }
      const styleMap: Record<string, string> = {
        formal:     'офіційний — чіткі формулювання, повні речення, без скорочень',
        friendly:   'дружній — тепло, але по-справі, легкий тон без зайвої фамільярності',
        persuasive: 'переконливий — акцент на вигодах, м\'яке заохочення до дії',
        direct:     'прямий — без вступів і прелюдій, одразу до суті',
        empathetic: 'емпатійний — розуміння ситуації читача, підтримуючий тон',
      }
      return (
        'Напиши email-лист від імені компанії "' + i.companyName + '".\n\n' +
        'Призначення листа: ' + i.emailPurpose + '\n' +
        'Стиль: ' + styleMap[i.emailStyle] + '\n' +
        'Обсяг: ' + lengthMap[i.emailLength] + '\n' +
        (i.keyPoints.length > 0
          ? 'Ключові моменти, які обов\'язково підкреслити: ' + i.keyPoints.join(', ') + '\n'
          : '') +
        '\nВідповідай тією мовою, якою написане призначення листа.\n\n' +
        'СТРУКТУРА:\n' +
        '1. Тема листа (Subject:) — коротка, конкретна, до 60 символів.\n' +
        '2. Привітання.\n' +
        '3. Основний текст — зв\'язні абзаци, не список. Кожен ключовий момент розкрий природньо в тексті, а не переліком.\n' +
        '4. Чіткий заклик до дії.\n' +
        '5. Підпис від імені компанії.\n\n' +
        'Правила:\n' +
        '- Без markdown: без зірочок, решіток, підкреслень.\n' +
        '- Рядок "Subject:" виводь першим, окремо від тіла листа.\n' +
        '- Не починай кожен абзац з "Я" або назви компанії.'
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
