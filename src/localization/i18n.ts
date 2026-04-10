import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import { en } from './en';

type LeafPaths<T, Prefix extends string = ''> = T extends string
  ? Prefix
  : {
      [K in keyof T & string]: LeafPaths<
        T[K],
        Prefix extends '' ? K : `${Prefix}.${K}`
      >;
    }[keyof T & string];

export type TranslationKey = LeafPaths<typeof en>;

const i18n = new I18n({ en });
i18n.locale = getLocales()[0]?.languageCode ?? 'en';
i18n.enableFallback = true;

export const t = (key: TranslationKey, params?: Record<string, string | number>): string =>
  i18n.t(key, params);
