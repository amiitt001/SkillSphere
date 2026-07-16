export type Locale = 'en' | 'es' | 'hi';

export const TRANSLATIONS: Record<Locale, Record<string, string>> = {
  en: {
    welcome: 'Welcome to your Enterprise dashboard',
    searchPlaceholder: 'Search jobs, projects, users, or skills...',
    seatsUsed: 'seats allocated',
    installed: 'installed',
    install: 'install'
  },
  es: {
    welcome: 'Bienvenido a su panel de control empresarial',
    searchPlaceholder: 'Buscar trabajos, proyectos, usuarios o habilidades...',
    seatsUsed: 'asientos asignados',
    installed: 'instalado',
    install: 'instalar'
  },
  hi: {
    welcome: 'आपके एंटरप्राइज़ डैशबोर्ड में आपका स्वागत है',
    searchPlaceholder: 'नौकरियां, परियोजनाएं, उपयोगकर्ता या कौशल खोजें...',
    seatsUsed: 'सीटें आवंटित',
    installed: 'स्थापित',
    install: 'स्थापित करें'
  }
};

/**
 * Evaluates translating a dictionary key for the target language.
 */
export function translate(key: string, locale: Locale = 'en'): string {
  return TRANSLATIONS[locale]?.[key] || TRANSLATIONS.en[key] || key;
}
