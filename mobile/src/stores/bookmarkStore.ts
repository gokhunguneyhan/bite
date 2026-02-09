import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Bookmark {
  id: string;
  summaryId: string;
  sectionIndex: number;
  sectionTitle: string;
  sectionContent: string; // first 200 chars
  videoTitle: string;
  channelName: string;
  createdAt: string;
}

interface BookmarkState {
  bookmarks: Bookmark[];
  addBookmark: (data: Omit<Bookmark, 'id' | 'createdAt'>) => void;
  removeBookmark: (summaryId: string, sectionIndex: number) => void;
  isBookmarked: (summaryId: string, sectionIndex: number) => boolean;
}

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      addBookmark: (data) => {
        const bookmark: Bookmark = {
          ...data,
          id: `${data.summaryId}_${data.sectionIndex}_${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ bookmarks: [bookmark, ...state.bookmarks] }));
      },
      removeBookmark: (summaryId, sectionIndex) => {
        set((state) => ({
          bookmarks: state.bookmarks.filter(
            (b) => !(b.summaryId === summaryId && b.sectionIndex === sectionIndex),
          ),
        }));
      },
      isBookmarked: (summaryId, sectionIndex) => {
        return get().bookmarks.some(
          (b) => b.summaryId === summaryId && b.sectionIndex === sectionIndex,
        );
      },
    }),
    {
      name: '@yt_summarise_bookmarks',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
