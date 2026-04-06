export type ContentType =
  | 'product_description'
  | 'blog_post_outline'
  | 'email_subject_lines'
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

export interface EmailSubjectInputs {
  campaignGoal: string
  productName: string
}

export interface SocialMediaInputs {
  platform: 'instagram' | 'linkedin' | 'twitter'
  topic: string
  tone: 'professional' | 'casual' | 'fun'
}

export type ContentInputs =
  | ProductDescriptionInputs
  | BlogPostInputs
  | EmailSubjectInputs
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
    case 'email_subject_lines': {
      const i = inputs as EmailSubjectInputs
      return (
        'Згенеруй 5 привабливих теми для email-розсилки.\n\n' +
        'Мета кампанії: ' + i.campaignGoal + '\n' +
        'Продукт / послуга: ' + i.productName + '\n\n' +
        'Вимоги:\n' +
        '- Відповідай тією мовою, якою написані мета кампанії та назва продукту.\n' +
        '- Кожна тема — не більше 60 символів.\n' +
        '- Включи різні стилі: терміновість, цікавість, акцент на вигоді, персоналізація, питання.\n' +
        '- Нумеруй варіанти цифрами з крапкою: 1. 2. 3. 4. 5.\n' +
        '- Після кожної теми — одне речення пояснення чому вона працює.\n' +
        '- Без markdown символів: без решіток, зірочок, підкреслень.'
      )
    }
    case 'social_media_caption': {
      const i = inputs as SocialMediaInputs
      const platformGuides: Record<string, string> = {
        instagram:
          'Додай доречні емодзі, роби переноси рядків для читабельності, завершуй 3-5 релевантними хештегами. Обсяг: 150-300 символів.',
        linkedin:
          'Починай із сильного гачка. Короткі абзаци, додай інсайт, завершуй закликом до дії. Максимум 1300 символів.',
        twitter:
          'Стисло і влучно. Не більше 280 символів. Максимум 1-2 хештеги.',
      }
      const platformName: Record<string, string> = {
        instagram: 'Instagram',
        linkedin: 'LinkedIn',
        twitter: 'Twitter/X',
      }
      return (
        'Напиши підпис для публікації в ' + platformName[i.platform] + '.\n\n' +
        'Тема: ' + i.topic + '\n' +
        'Тон: ' + i.tone + '\n\n' +
        'Відповідай тією мовою, якою написана тема.\n' +
        'Вимоги платформи: ' + platformGuides[i.platform] + '\n\n' +
        'Без markdown символів у тексті: без решіток (#) поза хештегами, без зірочок, без підкреслень.'
      )
    }
    default:
      return 'Write helpful content.'
  }
}
