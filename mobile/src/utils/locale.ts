import { getLocales } from 'expo-localization';

const isAmericanEnglish = (() => {
  try {
    const locale = getLocales()[0];
    return locale?.languageTag?.startsWith('en-US') ?? false;
  } catch {
    return false;
  }
})();

/** "Summarise" (British) or "Summarize" (American) */
export const SUMMARIZE = isAmericanEnglish ? 'Summarize' : 'Summarise';

/** "Summarise this video" / "Summarize this video" */
export const SUMMARIZE_THIS_VIDEO = isAmericanEnglish
  ? 'Summarize this video'
  : 'Summarise this video';
