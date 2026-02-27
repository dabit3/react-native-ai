import { useState, useCallback, useEffect, useRef } from 'react';
import { NativeAppleTranscription } from './AppleTranscriptionModule';
import type {
  StreamingTranscriptionOptions,
  StreamingTranscriptionState,
  StreamingTranscriptionEvent,
  StreamingTranscriptionErrorEvent,
  UseStreamingTranscriptionReturn,
} from './AppleTranscription.types';

/**
 * React hook for streaming on-device speech transcription using Apple's
 * SFSpeechRecognizer (iOS 10+) with real-time partial results.
 *
 * @example
 * ```tsx
 * import { useStreamingTranscription } from '@react-native-ai/apple';
 *
 * function VoiceInput() {
 *   const {
 *     startListening,
 *     stopListening,
 *     transcript,
 *     isFinal,
 *     state,
 *     error,
 *     isAvailable,
 *   } = useStreamingTranscription();
 *
 *   return (
 *     <View>
 *       <Text>{transcript}</Text>
 *       <Button
 *         title={state === 'listening' ? 'Stop' : 'Start'}
 *         onPress={state === 'listening' ? stopListening : () => startListening()}
 *       />
 *     </View>
 *   );
 * }
 * ```
 */
export function useStreamingTranscription(): UseStreamingTranscriptionReturn {
  const [transcript, setTranscript] = useState<string>('');
  const [isFinal, setIsFinal] = useState<boolean>(false);
  const [state, setState] = useState<StreamingTranscriptionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);

  const partialResultSubscription = useRef<{ remove: () => void } | null>(null);
  const errorSubscription = useRef<{ remove: () => void } | null>(null);
  const stateSubscription = useRef<{ remove: () => void } | null>(null);

  // Check availability on mount
  useEffect(() => {
    checkAvailability();
    return () => {
      cleanupSubscriptions();
    };
  }, []);

  function checkAvailability(): void {
    if (!NativeAppleTranscription) {
      setIsAvailable(false);
      return;
    }
    NativeAppleTranscription.isAvailable('en-US')
      .then((available: boolean) => setIsAvailable(available))
      .catch(() => setIsAvailable(false));
  }

  function cleanupSubscriptions(): void {
    if (partialResultSubscription.current) {
      partialResultSubscription.current.remove();
      partialResultSubscription.current = null;
    }
    if (errorSubscription.current) {
      errorSubscription.current.remove();
      errorSubscription.current = null;
    }
    if (stateSubscription.current) {
      stateSubscription.current.remove();
      stateSubscription.current = null;
    }
  }

  const startListening = useCallback(
    async (options?: StreamingTranscriptionOptions): Promise<void> => {
      if (!NativeAppleTranscription) {
        setError('Apple transcription is not available on this platform');
        setState('error');
        return;
      }

      try {
        setError(null);
        setState('starting');
        setTranscript('');
        setIsFinal(false);

        // Clean up any existing subscriptions
        cleanupSubscriptions();

        // Subscribe to streaming events
        partialResultSubscription.current =
          NativeAppleTranscription.addListener(
            'onPartialResult',
            (event: StreamingTranscriptionEvent) => {
              setTranscript(event.text);
              setIsFinal(event.isFinal);
            }
          );

        errorSubscription.current = NativeAppleTranscription.addListener(
          'onError',
          (event: StreamingTranscriptionErrorEvent) => {
            setError(event.message);
            setState('error');
          }
        );

        stateSubscription.current = NativeAppleTranscription.addListener(
          'onStreamingStateChange',
          (event: { state: string }) => {
            setState(event.state as StreamingTranscriptionState);
          }
        );

        const locale = options?.locale ?? 'en-US';
        const partialResults = options?.partialResults ?? true;
        const addsPunctuation = options?.addsPunctuation ?? true;
        const requiresOnDevice = options?.requiresOnDeviceRecognition ?? false;
        const taskHint = options?.taskHint ?? 'dictation';

        // Request permissions and start native streaming
        await NativeAppleTranscription.requestPermissions();
        await NativeAppleTranscription.startStreamingTranscription(
          locale,
          partialResults,
          addsPunctuation,
          requiresOnDevice,
          taskHint
        );
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to start transcription';
        setError(message);
        setState('error');
        cleanupSubscriptions();
      }
    },
    []
  );

  const stopListening = useCallback(async (): Promise<void> => {
    if (!NativeAppleTranscription) {
      return;
    }

    try {
      setState('stopping');
      await NativeAppleTranscription.stopStreamingTranscription();
      cleanupSubscriptions();
      setState('idle');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to stop transcription';
      setError(message);
      setState('error');
      cleanupSubscriptions();
    }
  }, []);

  return {
    startListening,
    stopListening,
    transcript,
    isFinal,
    state,
    error,
    isAvailable,
  };
}
