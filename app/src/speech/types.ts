/**
 * Types for the streaming speech transcription module.
 */

/** A single transcription segment with timing and confidence info. */
export interface TranscriptionSegment {
  /** The transcribed text for this segment. */
  text: string
  /** Timestamp (in seconds) of where this segment starts in the audio. */
  timestamp: number
  /** Duration (in seconds) of this segment. */
  duration: number
  /** Confidence score from 0 to 1. */
  confidence: number
  /** Alternative transcriptions for this segment. */
  alternativeSubstrings?: string[]
}

/** A transcription result containing the full text and individual segments. */
export interface TranscriptionResult {
  /** The full formatted transcription text. */
  text: string
  /** Individual transcription segments with timing and confidence. */
  segments: TranscriptionSegment[]
  /** Whether this is the final result (true) or a partial/interim result (false). */
  isFinal: boolean
}

/** Error event data from the transcription module. */
export interface TranscriptionError {
  /** Human-readable error description. */
  error: string
  /** Native error code. */
  code: number
}

/** State change event data from the transcription module. */
export interface TranscriptionStateChange {
  /** Current state of the transcription session. */
  state: 'streaming' | 'stopped'
  /** Locale being used for transcription (only present when state is 'streaming'). */
  locale?: string
}

/** Availability info for speech recognition on the device. */
export interface SpeechAvailability {
  /** Whether speech recognition is available for the given locale. */
  available: boolean
  /** Whether on-device recognition is supported (iOS 13+). */
  supportsOnDevice: boolean
  /** The locale that was checked. */
  locale: string
}

/** Permission status for speech recognition and microphone access. */
export interface SpeechPermissions {
  /** Speech recognition authorization status. */
  speechRecognition: 'authorized' | 'denied' | 'restricted' | 'notDetermined' | 'unknown'
  /** Whether speech recognition permission is granted. */
  speechRecognitionGranted: boolean
  /** Microphone authorization status. */
  microphone: 'authorized' | 'denied'
  /** Whether microphone permission is granted. */
  microphoneGranted: boolean
}

/** Options for starting a streaming transcription session. */
export interface StreamingOptions {
  /** Prefer on-device recognition for privacy. Defaults to true. */
  preferOnDevice?: boolean
  /**
   * Hint for the type of speech being recognized.
   * - 'dictation': Free-form text dictation
   * - 'search': Short search queries
   * - 'confirmation': Yes/no confirmations
   */
  taskHint?: 'dictation' | 'search' | 'confirmation'
}

/** Callbacks for streaming transcription events. */
export interface StreamingTranscriptionCallbacks {
  /** Called when a partial (interim) transcription result is available. */
  onPartialResult?: (result: TranscriptionResult) => void
  /** Called when the final transcription result is available. */
  onFinalResult?: (result: TranscriptionResult) => void
  /** Called when an error occurs during transcription. */
  onError?: (error: TranscriptionError) => void
  /** Called when the transcription state changes. */
  onStateChange?: (state: TranscriptionStateChange) => void
}

/** Return type for the useStreamingTranscription hook. */
export interface UseStreamingTranscriptionReturn {
  /** Start streaming transcription for the given locale. */
  startStreaming: (locale?: string, options?: StreamingOptions) => Promise<void>
  /** Stop the current streaming transcription session. */
  stopStreaming: () => Promise<void>
  /** Whether streaming transcription is currently active. */
  isStreaming: boolean
  /** The current partial transcription text (updated in real-time). */
  partialText: string
  /** The final transcription text (set when transcription completes). */
  finalText: string
  /** All transcription segments from the current/last session. */
  segments: TranscriptionSegment[]
  /** The last error that occurred, or null. */
  error: TranscriptionError | null
  /** Check if speech recognition is available for a locale. */
  checkAvailability: (locale?: string) => Promise<SpeechAvailability>
  /** Request speech recognition and microphone permissions. */
  requestPermissions: () => Promise<SpeechPermissions>
}
