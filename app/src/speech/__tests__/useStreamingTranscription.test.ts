/**
 * Tests for the streaming speech transcription types and hook interface.
 *
 * Note: Full integration tests require a real iOS device with microphone access.
 * These tests verify the TypeScript types and hook contract are correct.
 */

import type {
  TranscriptionSegment,
  TranscriptionResult,
  TranscriptionError,
  TranscriptionStateChange,
  SpeechAvailability,
  SpeechPermissions,
  StreamingOptions,
  StreamingTranscriptionCallbacks,
  UseStreamingTranscriptionReturn,
} from '../types'

describe('Streaming Speech Transcription Types', () => {
  it('should have correct TranscriptionSegment shape', () => {
    const segment: TranscriptionSegment = {
      text: 'hello',
      timestamp: 0.5,
      duration: 0.3,
      confidence: 0.95,
      alternativeSubstrings: ['Hello', 'helo'],
    }

    expect(segment.text).toBe('hello')
    expect(segment.timestamp).toBe(0.5)
    expect(segment.duration).toBe(0.3)
    expect(segment.confidence).toBe(0.95)
    expect(segment.alternativeSubstrings).toEqual(['Hello', 'helo'])
  })

  it('should allow TranscriptionSegment without optional fields', () => {
    const segment: TranscriptionSegment = {
      text: 'world',
      timestamp: 1.0,
      duration: 0.4,
      confidence: 0.88,
    }

    expect(segment.text).toBe('world')
    expect(segment.alternativeSubstrings).toBeUndefined()
  })

  it('should have correct TranscriptionResult shape for partial results', () => {
    const result: TranscriptionResult = {
      text: 'hello world',
      segments: [
        { text: 'hello', timestamp: 0, duration: 0.3, confidence: 0.9 },
        { text: 'world', timestamp: 0.4, duration: 0.3, confidence: 0.85 },
      ],
      isFinal: false,
    }

    expect(result.isFinal).toBe(false)
    expect(result.segments).toHaveLength(2)
  })

  it('should have correct TranscriptionResult shape for final results', () => {
    const result: TranscriptionResult = {
      text: 'hello world',
      segments: [
        { text: 'hello', timestamp: 0, duration: 0.3, confidence: 0.95 },
        { text: 'world', timestamp: 0.4, duration: 0.3, confidence: 0.92 },
      ],
      isFinal: true,
    }

    expect(result.isFinal).toBe(true)
  })

  it('should have correct TranscriptionError shape', () => {
    const error: TranscriptionError = {
      error: 'Speech recognition failed',
      code: 1,
    }

    expect(error.error).toBe('Speech recognition failed')
    expect(error.code).toBe(1)
  })

  it('should have correct TranscriptionStateChange shapes', () => {
    const streaming: TranscriptionStateChange = {
      state: 'streaming',
      locale: 'en-US',
    }

    const stopped: TranscriptionStateChange = {
      state: 'stopped',
    }

    expect(streaming.state).toBe('streaming')
    expect(streaming.locale).toBe('en-US')
    expect(stopped.state).toBe('stopped')
    expect(stopped.locale).toBeUndefined()
  })

  it('should have correct SpeechAvailability shape', () => {
    const availability: SpeechAvailability = {
      available: true,
      supportsOnDevice: true,
      locale: 'en-US',
    }

    expect(availability.available).toBe(true)
    expect(availability.supportsOnDevice).toBe(true)
    expect(availability.locale).toBe('en-US')
  })

  it('should have correct SpeechPermissions shape', () => {
    const permissions: SpeechPermissions = {
      speechRecognition: 'authorized',
      speechRecognitionGranted: true,
      microphone: 'authorized',
      microphoneGranted: true,
    }

    expect(permissions.speechRecognitionGranted).toBe(true)
    expect(permissions.microphoneGranted).toBe(true)
  })

  it('should have correct StreamingOptions shape', () => {
    const options: StreamingOptions = {
      preferOnDevice: true,
      taskHint: 'dictation',
    }

    expect(options.preferOnDevice).toBe(true)
    expect(options.taskHint).toBe('dictation')
  })

  it('should allow empty StreamingOptions', () => {
    const options: StreamingOptions = {}
    expect(options.preferOnDevice).toBeUndefined()
    expect(options.taskHint).toBeUndefined()
  })

  it('should have correct StreamingTranscriptionCallbacks shape', () => {
    const partialResults: TranscriptionResult[] = []
    let finalResult: TranscriptionResult | null = null
    let lastError: TranscriptionError | null = null

    const callbacks: StreamingTranscriptionCallbacks = {
      onPartialResult: (result) => {
        partialResults.push(result)
      },
      onFinalResult: (result) => {
        finalResult = result
      },
      onError: (error) => {
        lastError = error
      },
      onStateChange: (_state) => {
        // noop
      },
    }

    // Simulate calling the callbacks
    callbacks.onPartialResult!({
      text: 'hello',
      segments: [{ text: 'hello', timestamp: 0, duration: 0.3, confidence: 0.9 }],
      isFinal: false,
    })

    callbacks.onFinalResult!({
      text: 'hello world',
      segments: [
        { text: 'hello', timestamp: 0, duration: 0.3, confidence: 0.95 },
        { text: 'world', timestamp: 0.4, duration: 0.3, confidence: 0.92 },
      ],
      isFinal: true,
    })

    expect(partialResults).toHaveLength(1)
    expect(finalResult).not.toBeNull()
    expect(lastError).toBeNull()
  })

  it('should allow partial StreamingTranscriptionCallbacks', () => {
    const callbacks: StreamingTranscriptionCallbacks = {
      onFinalResult: (_result) => {
        // only care about final result
      },
    }

    expect(callbacks.onPartialResult).toBeUndefined()
    expect(callbacks.onError).toBeUndefined()
  })

  it('should have correct UseStreamingTranscriptionReturn shape', () => {
    // Verify the interface contract (type-level check)
    const mockReturn: UseStreamingTranscriptionReturn = {
      startStreaming: async () => {},
      stopStreaming: async () => {},
      transcribeFile: async () => ({
        text: 'hello world',
        segments: [],
        isFinal: true,
      }),
      isStreaming: false,
      partialText: '',
      finalText: '',
      segments: [],
      error: null,
      checkAvailability: async () => ({
        available: true,
        supportsOnDevice: true,
        locale: 'en-US',
      }),
      requestPermissions: async () => ({
        speechRecognition: 'authorized',
        speechRecognitionGranted: true,
        microphone: 'authorized',
        microphoneGranted: true,
      }),
    }

    expect(mockReturn.isStreaming).toBe(false)
    expect(mockReturn.partialText).toBe('')
    expect(mockReturn.finalText).toBe('')
    expect(mockReturn.segments).toEqual([])
    expect(mockReturn.error).toBeNull()
  })
})
