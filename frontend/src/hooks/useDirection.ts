import { useTranslation } from 'react-i18next';

/** Returns 'rtl' for Arabic, 'ltr' for all other languages. */
export function useDirection(): 'ltr' | 'rtl' {
  const { i18n } = useTranslation();
  return i18n.language === 'ar' ? 'rtl' : 'ltr';
}
