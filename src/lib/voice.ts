import { useCallback, useRef, useState } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

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

  useSpeechRecognitionEvent('start', () => {
    finalizedRef.current = false;
    setState({ stage: 'listening', transcript: '', errorMessage: null });
  });

  useSpeechRecognitionEvent('result', (event) => {
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

  useSpeechRecognitionEvent('end', () => {
    setState((s) => {
      if (finalizedRef.current) return s.stage === 'done' ? s : { ...s, stage: 'done' };
      if (!s.transcript) return { stage: 'no-speech', transcript: '', errorMessage: null };
      finalizedRef.current = true;
      return { ...s, stage: 'done' };
    });
  });

  useSpeechRecognitionEvent('error', (event) => {
    setState({ stage: 'error', transcript: '', errorMessage: event.message || event.error });
  });

  const start = useCallback(async () => {
    setState(IDLE);
    const perms = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perms.granted) {
      setState({ stage: 'error', transcript: '', errorMessage: 'İzin verilmedi.' });
      return;
    }
    finalizedRef.current = false;
    ExpoSpeechRecognitionModule.start({
      lang: 'tr-TR',
      interimResults: true,
      continuous: false,
      maxAlternatives: 1,
    });
  }, []);

  const stop = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
  }, []);

  const reset = useCallback(() => {
    ExpoSpeechRecognitionModule.abort();
    setState(IDLE);
  }, []);

  return { ...state, start, stop, reset };
}
