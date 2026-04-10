import { en } from './en';

export type TranslationKey = keyof typeof en;

export const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
  let text: string = en[key];
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
};
