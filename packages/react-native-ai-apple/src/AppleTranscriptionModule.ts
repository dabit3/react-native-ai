import { requireNativeModule } from 'expo-modules-core';
import type {
  TranscriptionResult,
  StreamingTranscriptionEvent,
  StreamingTranscriptionErrorEvent,
} from './AppleTranscription.types';

/**
 * Subscription handle returned by addListener, used to unsubscribe.
 */
interface EventSubscription {
  remove(): void;
}

/**
 * Native module interface for Apple speech transcription.
 *
 * Provides both batch transcription (transcribe) and streaming transcription
 * (startStreamingTranscription / stopStreamingTranscription) with event-based
 * partial results via addListener.
 */
interface AppleTranscriptionNativeModule {
  /**
   * Batch-transcribe an audio file at the given path.
   * @param audioFilePath - Absolute path to the audio file.
   * @param locale - BCP-47 locale identifier (e.g., "en-US").
   * @returns Promise resolving to a TranscriptionResult.
   */
  transcribe(audioFilePath: string, locale: string): Promise<TranscriptionResult>;

  /**
   * Start streaming transcription from the device microphone.
   * @param locale - BCP-47 locale (e.g., "en-US").
   * @param partialResults - Whether to emit partial results.
   * @param addsPunctuation - Whether to add punctuation.
   * @param requiresOnDeviceRecognition - Whether to require on-device only.
   * @param taskHint - Recognition task hint.
   */
  startStreamingTranscription(
    locale: string,
    partialResults: boolean,
    addsPunctuation: boolean,
    requiresOnDeviceRecognition: boolean,
    taskHint: string
  ): Promise<void>;

  /**
   * Stop the current streaming transcription session.
   */
  stopStreamingTranscription(): Promise<void>;

  /**
   * Check if speech recognition is available on this device for a given locale.
   * @param locale - BCP-47 locale identifier.
   * @returns Promise resolving to availability status.
   */
  isAvailable(locale: string): Promise<boolean>;

  /**
   * Request speech recognition and microphone permissions.
   * @returns Promise resolving to the authorization status string.
   */
  requestPermissions(): Promise<string>;

  /**
   * Subscribe to native events emitted during streaming transcription.
   *
   * Supported event names:
   * - `onPartialResult` - Fired with StreamingTranscriptionEvent during streaming.
   * - `onError` - Fired with StreamingTranscriptionErrorEvent on errors.
   * - `onStreamingStateChange` - Fired with `{ state: string }` on state transitions.
   */
  addListener(
    eventName: 'onPartialResult',
    listener: (event: StreamingTranscriptionEvent) => void
  ): EventSubscription;
  addListener(
    eventName: 'onError',
    listener: (event: StreamingTranscriptionErrorEvent) => void
  ): EventSubscription;
  addListener(
    eventName: 'onStreamingStateChange',
    listener: (event: { state: string }) => void
  ): EventSubscription;
}

/**
 * The native Apple transcription module, loaded via Expo Modules.
 *
 * Falls back to null when running on unsupported platforms (e.g., Android, Web)
 * so that consuming code can check availability before calling native methods.
 */
let NativeAppleTranscription: AppleTranscriptionNativeModule | null = null;

try {
  NativeAppleTranscription =
    requireNativeModule<AppleTranscriptionNativeModule>('AppleTranscription');
} catch {
  // Module not available on this platform (Android, Web, etc.)
}

export { NativeAppleTranscription };
export type { AppleTranscriptionNativeModule, EventSubscription };
