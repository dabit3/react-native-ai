/**
 * @react-native-ai/apple
 *
 * Apple on-device AI capabilities for React Native, including
 * streaming speech transcription via SFSpeechRecognizer (iOS 10+).
 *
 * @example
 * ```tsx
 * // Streaming transcription with React hook
 * import { useStreamingTranscription } from '@react-native-ai/apple';
 *
 * const { startListening, stopListening, transcript, state } = useStreamingTranscription();
 *
 * // Start listening with options
 * await startListening({ locale: 'en-US', partialResults: true });
 *
 * // Stop listening
 * await stopListening();
 * ```
 *
 * @example
 * ```tsx
 * // Batch transcription
 * import { NativeAppleTranscription } from '@react-native-ai/apple';
 *
 * const result = await NativeAppleTranscription.transcribe('/path/to/audio.m4a', 'en-US');
 * console.log(result.text);
 * ```
 *
 * @example
 * ```tsx
 * // Direct event-based streaming (without hook)
 * import { NativeAppleTranscription } from '@react-native-ai/apple';
 *
 * NativeAppleTranscription.addListener('onPartialResult', (event) => {
 *   console.log(event.text, event.isFinal);
 * });
 *
 * await NativeAppleTranscription.startStreamingTranscription('en-US', true, true, false, 'dictation');
 * ```
 */

// Native module
export { NativeAppleTranscription } from './AppleTranscriptionModule';
export type { AppleTranscriptionNativeModule, EventSubscription } from './AppleTranscriptionModule';

// React hook
export { useStreamingTranscription } from './useStreamingTranscription';

// Types
export type {
  TranscriptionSegment,
  TranscriptionResult,
  StreamingTranscriptionEvent,
  StreamingTranscriptionErrorEvent,
  StreamingTranscriptionOptions,
  StreamingTranscriptionState,
  UseStreamingTranscriptionReturn,
} from './AppleTranscription.types';
