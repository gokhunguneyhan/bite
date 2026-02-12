import { useState, useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { apiRequest } from '@/src/services/api';
import { supabase } from '@/src/lib/supabase';
import type { Summary } from '@/src/types/summary';

type TTSStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

interface UseTTSOptions {
  summary: Summary | null;
  language: string;
  isPro: boolean;
}

interface UseTTSReturn {
  status: TTSStatus;
  toggle: () => void;
  stop: () => void;
  isLoading: boolean;
}

export function useTTS({ summary, language, isPro }: UseTTSOptions): UseTTSReturn {
  const [status, setStatus] = useState<TTSStatus>('idle');
  const soundRef = useRef<Audio.Sound | null>(null);
  const isSpeechActive = useRef(false);

  // Reset when summary changes
  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
      if (isSpeechActive.current) Speech.stop();
    };
  }, [summary?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
      if (isSpeechActive.current) Speech.stop();
    };
  }, []);

  const playOpenAITTS = useCallback(async () => {
    if (!summary) return;

    setStatus('loading');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const result = await apiRequest<{ audioUrl: string }>('/api/tts', {
        method: 'POST',
        body: { summaryId: summary.id },
        token: session?.access_token,
        timeoutMs: 120_000,
      });

      // Unload previous sound if any
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: result.audioUrl },
        { shouldPlay: true },
      );

      soundRef.current = sound;
      setStatus('playing');

      sound.setOnPlaybackStatusUpdate((s) => {
        if (s.isLoaded && s.didJustFinish) {
          setStatus('idle');
        }
      });
    } catch (err) {
      console.error('[TTS] OpenAI error:', err);
      // Fall back to device TTS on OpenAI failure
      playDeviceTTS();
    }
  }, [summary]);

  const playDeviceTTS = useCallback(() => {
    if (!summary) return;

    const text = [
      summary.quickSummary,
      ...summary.contextualSections.map((s) => `${s.title}. ${s.content}`),
    ].join('. ');

    setStatus('playing');
    isSpeechActive.current = true;

    const voiceLang = language === 'en' ? 'en-US' : language;

    Speech.speak(text, {
      language: voiceLang,
      rate: 0.95,
      onDone: () => {
        setStatus('idle');
        isSpeechActive.current = false;
      },
      onError: () => {
        setStatus('error');
        isSpeechActive.current = false;
      },
    });
  }, [summary, language]);

  const toggle = useCallback(async () => {
    if (status === 'loading') return;

    if (status === 'playing') {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
        setStatus('paused');
      } else if (isSpeechActive.current) {
        Speech.stop();
        setStatus('idle');
        isSpeechActive.current = false;
      }
      return;
    }

    if (status === 'paused' && soundRef.current) {
      await soundRef.current.playAsync();
      setStatus('playing');
      return;
    }

    // Start fresh
    if (isPro) {
      await playOpenAITTS();
    } else {
      playDeviceTTS();
    }
  }, [status, isPro, playOpenAITTS, playDeviceTTS]);

  const stop = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    if (isSpeechActive.current) {
      Speech.stop();
      isSpeechActive.current = false;
    }
    setStatus('idle');
  }, []);

  return {
    status,
    toggle,
    stop,
    isLoading: status === 'loading',
  };
}
