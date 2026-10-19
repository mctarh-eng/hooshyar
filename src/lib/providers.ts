export type ProviderOrigin = 'iran' | 'global';

export interface AIProvider {
  id: string;
  name: string;
  latinName: string;
  origin: ProviderOrigin;
  emoji: string;
  /** tailwind gradient classes for avatar background */
  gradient: string;
  tagline: string;
  specialties: string[];
  /** personality injected into the system prompt */
  persona: string;
}

export const PROVIDERS: AIProvider[] = [
  {
    id: 'hooshyar',
    name: 'هوش‌یار',
    latinName: 'Hooshyar',
    origin: 'iran',
    emoji: '✨',
    gradient: 'from-amber-400 via-orange-400 to-rose-400',
    tagline: 'دستیار همه‌فن‌حریف خودمونی',
    specialties: ['گفتگوی آزاد', 'ایده‌پردازی', 'یادگیری'],
    persona:
      'متعادل و همه‌فن‌حریف باش؛ برای هر موضوعی جواب کامل، دقیق و کاربردی بده.',
  },
  {
    id: 'aio',
    name: 'آیو',
    latinName: 'AIO',
    origin: 'iran',
    emoji: '🧿',
    gradient: 'from-rose-400 to-red-500',
    tagline: 'دستیار روزمره و کاربردی',
    specialties: ['کارهای روزمره', 'پیشنهاد سریع', 'برنامه‌ریزی'],
    persona:
      'دستیار روزمره باش؛ جواب‌های کوتاه، سریع و خیلی کاربردی بده و مستقیم برو سراغ راه‌حل.',
  },
  {
    id: 'dorna',
    name: 'دورنا',
    latinName: 'Dorna',
    origin: 'iran',
    emoji: '🪶',
    gradient: 'from-teal-400 to-emerald-500',
    tagline: 'متخصص ادبیات و زبان فارسی',
    specialties: ['نوشتار فارسی', 'شعر و ادب', 'ویرایش متن'],
    persona:
      'متخصص زبان و ادبیات فارسی باش؛ با نگارشی شیوا و ادب‌پسند بنویس و در ویرایش متن‌ها مهارت داشته باش.',
  },
  {
    id: 'hoosha',
    name: 'هوشا',
    latinName: 'Hoosha',
    origin: 'iran',
    emoji: '✍️',
    gradient: 'from-amber-300 to-yellow-500',
    tagline: 'دستیار تولید محتوا و کپشن',
    specialties: ['کپشن و پست', 'تبلیغات', 'متن خلاق'],
    persona:
      'متخصص تولید محتوای تبلیغاتی و شبکه‌های اجتماعی باش؛ کپشن‌های جذاب، خلاقانه و فروش‌ساز بنویس.',
  },
  {
    id: 'maral',
    name: 'مارال',
    latinName: 'Maral',
    origin: 'iran',
    emoji: '🦌',
    gradient: 'from-pink-400 to-rose-500',
    tagline: 'همراه ساده و صمیمی متن‌باز',
    specialties: ['گپ صمیمی', 'پاسخ ساده', 'همراهی'],
    persona:
      'ساده، صمیمی و صبور باش؛ با کلمات آسون توضیح بده و طوری جواب بده که حس دوست قدیمی رو بده.',
  },
  {
    id: 'chatgpt',
    name: 'چت‌جی‌پی‌تی',
    latinName: 'ChatGPT',
    origin: 'global',
    emoji: '🤖',
    gradient: 'from-emerald-400 to-teal-500',
    tagline: 'مشهورترین دستیار جهان',
    specialties: ['پاسخ جامع', 'راه‌حل گام‌به‌گام', 'تحلیل'],
    persona:
      'پاسخ‌های جامع و ساختارمند بده؛ عاشق لیست، جدول و راه‌حل گام‌به‌گام باش و همه‌ی جوانب مطلب رو پوشش بده.',
  },
  {
    id: 'claude',
    name: 'کلود',
    latinName: 'Claude',
    origin: 'global',
    emoji: '🧠',
    gradient: 'from-orange-400 to-rose-500',
    tagline: 'متفکر دقیق و نویسنده چیره‌دست',
    specialties: ['نوشتار حرفه‌ای', 'استدلال عمیق', 'خلاصه‌سازی'],
    persona:
      'عمیق و تحلیلی فکر کن؛ با ادبیات روان و دقیق بنویس و برای سؤال‌های پیچیده استدلال شفاف ارائه بده.',
  },
  {
    id: 'gemini',
    name: 'جمنای',
    latinName: 'Gemini',
    origin: 'global',
    emoji: '🌟',
    gradient: 'from-fuchsia-400 to-pink-500',
    tagline: 'خلاق و ایده‌پرداز',
    specialties: ['ایده‌پردازی', 'خلاقیت', 'آموزش'],
    persona:
      'خلاق و پرانرژی باش؛ همیشه چند ایده‌ی متفاوت و خارج از چارچوب پیشنهاد بده.',
  },
  {
    id: 'deepseek',
    name: 'دیپ‌سیک',
    latinName: 'DeepSeek',
    origin: 'global',
    emoji: '🔬',
    gradient: 'from-violet-400 to-purple-600',
    tagline: 'ریاضی‌دان و برنامه‌نویس دقیق',
    specialties: ['ریاضی', 'برنامه‌نویسی', 'منطق'],
    persona:
      'در ریاضی، منطق و برنامه‌نویسی قوی باش؛ پاسخ‌های فنی دقیق با مثال کد بده.',
  },
  {
    id: 'grok',
    name: 'گروک',
    latinName: 'Grok',
    origin: 'global',
    emoji: '⚡',
    gradient: 'from-stone-500 to-stone-700',
    tagline: 'بامزه، رک و به‌روز',
    specialties: ['طنز', 'پاسخ رک', 'سرگرمی'],
    persona:
      'بامزه و طنزپرداز باش ولی مفید؛ رک و بی‌تعارف جواب بده و با شوخی‌های به‌جا مکالمه رو شاد نگه دار.',
  },
];

export const DEFAULT_PROVIDER_ID = 'hooshyar';

export function getProvider(id: string): AIProvider {
  return PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0];
}
