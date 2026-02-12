import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'tr', label: 'Turkish' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'it', label: 'Italian' },
  { code: 'nl', label: 'Dutch' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ar', label: 'Arabic' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ru', label: 'Russian' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

export type Tier = 'free' | 'pro' | 'power';

interface SettingsState {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  /** Current tier — driven by RevenueCat entitlements */
  selectedTier: Tier;
  /** Internal: called by RevenueCatProvider to sync entitlement state */
  _setTier: (tier: Tier) => void;
  lastUserId: string | null;
  setLastUserId: (id: string) => void;
  clear: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (language) => set({ language }),
      selectedTier: 'free' as Tier,
      _setTier: (tier) => set({ selectedTier: tier }),
      lastUserId: null,
      setLastUserId: (id) => set({ lastUserId: id }),
      clear: () =>
        set({
          language: 'en',
          selectedTier: 'free' as Tier,
          lastUserId: null,
        }),
    }),
    {
      name: '@bite_settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
