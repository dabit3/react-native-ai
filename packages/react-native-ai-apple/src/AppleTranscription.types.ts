/**
 * Represents a single segment of transcribed speech.
 */
export interface TranscriptionSegment {
  /** The transcribed text for this segment. */
  text: string;
  /** Start time of the segment in seconds relative to the audio start. */
  startTime: number;
  /** Duration of the segment in seconds. */
  duration: number;
  /** Confidence score between 0 and 1 for this segment. */
  confidence: number;
}

/**
 * Result of a batch transcription operation.
 */
export interface TranscriptionResult {
  /** Array of transcription segments. */
  segments: TranscriptionSegment[];
  /** The full transcribed text (all segments joined). */
  text: string;
}

/**
 * Payload emitted during streaming transcription for partial results.
 */
export interface StreamingTranscriptionEvent {
  /** The current partial or final transcribed text. */
  text: string;
  /** Whether this is a final result (speech segment completed) or partial (still speaking). */
  isFinal: boolean;
  /** Confidence score between 0 and 1 (available for final results). */
  confidence: number;
}

/**
 * Payload emitted when a streaming transcription error occurs.
 */
export interface StreamingTranscriptionErrorEvent {
  /** Error message describing what went wrong. */
  message: string;
  /** Error code for programmatic handling. */
  code: string;
}

/**
 * Configuration options for streaming transcription.
 */
export interface StreamingTranscriptionOptions {
  /** BCP-47 locale identifier (e.g., "en-US", "ja-JP"). Defaults to "en-US". */
  locale?: string;
  /** Whether to report partial (non-final) results. Defaults to true. */
  partialResults?: boolean;
  /** Whether to include punctuation in the transcription. Defaults to true. */
  addsPunctuation?: boolean;
  /** Whether to enable on-device recognition only (no network). Defaults to false. */
  requiresOnDeviceRecognition?: boolean;
  /** Task hint to improve recognition accuracy. */
  taskHint?: 'dictation' | 'search' | 'confirmation' | 'unspecified';
}

/**
 * State of the streaming transcription session.
 */
export type StreamingTranscriptionState =
  | 'idle'
  | 'starting'
  | 'listening'
  | 'stopping'
  | 'error';

/**
 * Return value of the useStreamingTranscription hook.
 */
export interface UseStreamingTranscriptionReturn {
  /** Start streaming transcription with optional configuration. */
  startListening: (options?: StreamingTranscriptionOptions) => Promise<void>;
  /** Stop the current streaming transcription session. */
  stopListening: () => Promise<void>;
  /** The current partial or accumulated transcript text. */
  transcript: string;
  /** Whether the current result is final (speech segment completed). */
  isFinal: boolean;
  /** Current state of the transcription session. */
  state: StreamingTranscriptionState;
  /** Last error that occurred, if any. */
  error: string | null;
  /** Whether the recognizer is currently available on this device. */
  isAvailable: boolean;
}
