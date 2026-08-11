import { useCallback, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';

type SpeechApi = typeof import('expo-speech-recognition');

// expo-speech-recognition, modül gövdesinde requireNativeModule çağırıyor, yani
// native modül yoksa import anında patlıyor. Expo Go bu modülü içermediği için
// statik import uygulamayı daha açılırken çökertirdi; burada yakalayıp sesi
// kapatılmış halde devam ediyoruz.
let speech: SpeechApi | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  speech = require('expo-speech-recognition') as SpeechApi;
} catch {
  speech = null;
}

export const isVoiceAvailable = speech !== null;

const noopEvent: (...args: unknown[]) => void = () => {};
const useSpeechEvent = (speech?.useSpeechRecognitionEvent ??
  noopEvent) as (...args: unknown[]) => void;

export type VoiceStage = 'idle' | 'listening' | 'processing' | 'done' | 'no-speech' | 'error';

export type VoiceState = {
  stage: VoiceStage;
  transcript: string;
  errorMessage: string | null;
};

const IDLE: VoiceState = { stage: 'idle', transcript: '', errorMessage: null };

// Wraps expo-speech-recognition (native SFSpeechRecognizer / SpeechRecognizer)
// behind the same listening -> processing -> done stage machine the design uses,
// but with a real recognized transcript instead of a canned phrase.
export function useVoiceRecognition() {
  const [state, setState] = useState<VoiceState>(IDLE);
  const finalizedRef = useRef(false);
  // Recognition language follows the app's effective locale, so a user who
  // switched to English in Settings dictates in English on a Turkish phone.
  const { localeTag, t } = useI18n();

  useSpeechEvent('start', () => {
    finalizedRef.current = false;
    setState({ stage: 'listening', transcript: '', errorMessage: null });
  });

  useSpeechEvent('result', (event: { results: { transcript: string }[]; isFinal: boolean }) => {
    const best = event.results[0]?.transcript ?? '';
    if (event.isFinal) {
      finalizedRef.current = true;
      setState((s) => ({ ...s, stage: 'processing', transcript: best }));
      // Small beat so "Bir saniye…" is perceptible, mirroring the design's
      // listening -> processing -> done rhythm, then land on the result.
      setTimeout(() => {
        setState((s) => (s.stage === 'processing' ? { ...s, stage: 'done' } : s));
      }, 350);
    } else {
      setState((s) => ({ ...s, transcript: best }));
    }
  });

  useSpeechEvent('end', () => {
    setState((s) => {
      if (finalizedRef.current) return s.stage === 'done' ? s : { ...s, stage: 'done' };
      if (!s.transcript) return { stage: 'no-speech', transcript: '', errorMessage: null };
      finalizedRef.current = true;
      return { ...s, stage: 'done' };
    });
  });

  useSpeechEvent('error', (event: { message?: string; error: string }) => {
    setState({ stage: 'error', transcript: '', errorMessage: event.message || event.error });
  });

  const start = useCallback(async () => {
    if (!speech) {
      setState({ stage: 'error', transcript: '', errorMessage: t('voice.unavailable') });
      return;
    }
    setState(IDLE);
    const perms = await speech.ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perms.granted) {
      setState({ stage: 'error', transcript: '', errorMessage: t('voice.permissionDenied') });
      return;
    }
    finalizedRef.current = false;
    speech.ExpoSpeechRecognitionModule.start({
      lang: localeTag,
      interimResults: true,
      continuous: false,
      maxAlternatives: 1,
    });
  }, [localeTag, t]);

  const stop = useCallback(() => {
    speech?.ExpoSpeechRecognitionModule.stop();
  }, []);

  const reset = useCallback(() => {
    speech?.ExpoSpeechRecognitionModule.abort();
    setState(IDLE);
  }, []);

  return { ...state, start, stop, reset };
}
