import { useState, useEffect, useCallback, useRef } from 'react'
import { NativeModules, NativeEventEmitter, Platform } from 'react-native'
import type {
  TranscriptionResult,
  TranscriptionError,
  TranscriptionStateChange,
  TranscriptionSegment,
  StreamingOptions,
  SpeechAvailability,
  SpeechPermissions,
  StreamingTranscriptionCallbacks,
  UseStreamingTranscriptionReturn,
} from './types'

const { SpeechTranscriptionModule } = NativeModules

/**
 * React hook for streaming on-device speech transcription.
 *
 * Uses Apple's SFSpeechRecognizer under the hood with real-time partial results.
 * On iOS 13+, supports on-device recognition for privacy.
 *
 * @example
 * ```tsx
 * function VoiceInput() {
 *   const {
 *     startStreaming,
 *     stopStreaming,
 *     isStreaming,
 *     partialText,
 *     finalText,
 *   } = useStreamingTranscription({
 *     onPartialResult: (result) => console.log('Partial:', result.text),
 *     onFinalResult: (result) => console.log('Final:', result.text),
 *   });
 *
 *   return (
 *     <View>
 *       <Text>{isStreaming ? partialText : finalText}</Text>
 *       <Button
 *         title={isStreaming ? 'Stop' : 'Start'}
 *         onPress={isStreaming ? stopStreaming : () => startStreaming('en-US')}
 *       />
 *     </View>
 *   );
 * }
 * ```
 */
export function useStreamingTranscription(
  callbacks?: StreamingTranscriptionCallbacks
): UseStreamingTranscriptionReturn {
  const [isStreaming, setIsStreaming] = useState(false)
  const [partialText, setPartialText] = useState('')
  const [finalText, setFinalText] = useState('')
  const [segments, setSegments] = useState<TranscriptionSegment[]>([])
  const [error, setError] = useState<TranscriptionError | null>(null)

  // Store callbacks in refs to avoid stale closures
  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks

  useEffect(() => {
    if (Platform.OS !== 'ios' || !SpeechTranscriptionModule) {
      return
    }

    const emitter = new NativeEventEmitter(SpeechTranscriptionModule)

    const partialSub = emitter.addListener(
      'onTranscriptionPartialResult',
      (result: TranscriptionResult) => {
        setPartialText(result.text)
        setSegments(result.segments)
        callbacksRef.current?.onPartialResult?.(result)
      }
    )

    const finalSub = emitter.addListener(
      'onTranscriptionFinalResult',
      (result: TranscriptionResult) => {
        setFinalText(result.text)
        setPartialText('')
        setSegments(result.segments)
        setIsStreaming(false)
        callbacksRef.current?.onFinalResult?.(result)
      }
    )

    const errorSub = emitter.addListener(
      'onTranscriptionError',
      (err: TranscriptionError) => {
        setError(err)
        setIsStreaming(false)
        callbacksRef.current?.onError?.(err)
      }
    )

    const stateSub = emitter.addListener(
      'onTranscriptionStateChange',
      (state: TranscriptionStateChange) => {
        setIsStreaming(state.state === 'streaming')
        callbacksRef.current?.onStateChange?.(state)
      }
    )

    return () => {
      partialSub.remove()
      finalSub.remove()
      errorSub.remove()
      stateSub.remove()
    }
  }, [])

  const startStreaming = useCallback(
    async (locale: string = 'en-US', options: StreamingOptions = {}) => {
      if (Platform.OS !== 'ios') {
        throw new Error('Streaming transcription is only available on iOS')
      }
      if (!SpeechTranscriptionModule) {
        throw new Error(
          'SpeechTranscriptionModule is not available. Make sure you are running on a real iOS device.'
        )
      }

      setError(null)
      setPartialText('')
      setFinalText('')
      setSegments([])

      await SpeechTranscriptionModule.startStreaming(locale, options)
    },
    []
  )

  const stopStreaming = useCallback(async () => {
    if (Platform.OS !== 'ios' || !SpeechTranscriptionModule) {
      return
    }
    await SpeechTranscriptionModule.stopStreaming()
  }, [])

  const checkAvailability = useCallback(
    async (locale: string = 'en-US'): Promise<SpeechAvailability> => {
      if (Platform.OS !== 'ios' || !SpeechTranscriptionModule) {
        return { available: false, supportsOnDevice: false, locale }
      }
      return SpeechTranscriptionModule.isAvailable(locale)
    },
    []
  )

  const requestPermissions = useCallback(async (): Promise<SpeechPermissions> => {
    if (Platform.OS !== 'ios' || !SpeechTranscriptionModule) {
      return {
        speechRecognition: 'denied',
        speechRecognitionGranted: false,
        microphone: 'denied',
        microphoneGranted: false,
      }
    }
    return SpeechTranscriptionModule.requestPermissions()
  }, [])

  return {
    startStreaming,
    stopStreaming,
    isStreaming,
    partialText,
    finalText,
    segments,
    error,
    checkAvailability,
    requestPermissions,
  }
}
