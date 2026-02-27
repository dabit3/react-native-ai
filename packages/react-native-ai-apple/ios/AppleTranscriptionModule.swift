import ExpoModulesCore
import Speech
import AVFoundation

/// Expo native module that exposes Apple's SFSpeechRecognizer for both batch
/// and streaming transcription to React Native / TypeScript.
///
/// Events emitted:
/// - `onPartialResult`: Fired with `{ text, isFinal, confidence }` during streaming.
/// - `onError`: Fired with `{ message, code }` when an error occurs.
/// - `onStreamingStateChange`: Fired with `{ state }` when streaming state changes.
public class AppleTranscriptionModule: Module {
  private var streamingSession: StreamingTranscriptionSession?
  /// Incremented each time a new streaming session is created.
  /// Callbacks from older sessions compare their captured generation
  /// against this value and become no-ops when they don't match.
  private var sessionGeneration: Int = 0

  public func definition() -> ModuleDefinition {
    Name("AppleTranscription")

    Events("onPartialResult", "onError", "onStreamingStateChange")

    // MARK: - Batch Transcription

    AsyncFunction("transcribe") { (audioFilePath: String, locale: String, promise: Promise) in
      let url = URL(fileURLWithPath: audioFilePath)
      let sfLocale = Locale(identifier: locale)

      guard let recognizer = SFSpeechRecognizer(locale: sfLocale) else {
        promise.reject(
          TranscriptionError.recognizerUnavailable,
          "Speech recognizer is not available for locale: \(locale)"
        )
        return
      }

      guard recognizer.isAvailable else {
        promise.reject(
          TranscriptionError.recognizerUnavailable,
          "Speech recognizer is not currently available"
        )
        return
      }

      let request = SFSpeechURLRecognitionRequest(url: url)

      var hasSettled = false
      recognizer.recognitionTask(with: request) { result, error in
        if hasSettled { return }

        if let error = error {
          hasSettled = true
          promise.reject(
            TranscriptionError.recognitionFailed,
            error.localizedDescription
          )
          return
        }

        guard let result = result, result.isFinal else {
          return
        }

        hasSettled = true
        let segments: [[String: Any]] = result.bestTranscription.segments.map { segment in
          return [
            "text": segment.substring,
            "startTime": segment.timestamp,
            "duration": segment.duration,
            "confidence": segment.confidence,
          ]
        }

        let fullText = result.bestTranscription.formattedString

        promise.resolve([
          "segments": segments,
          "text": fullText,
        ])
      }
    }

    // MARK: - Streaming Transcription

    AsyncFunction("startStreamingTranscription") {
      (
        locale: String,
        partialResults: Bool,
        addsPunctuation: Bool,
        requiresOnDeviceRecognition: Bool,
        taskHint: String,
        promise: Promise
      ) in
      // Tear down any existing session and bump generation so stale
      // callbacks from the old session are silently discarded.
      self.streamingSession?.stop()
      self.streamingSession = nil
      self.sessionGeneration += 1
      let gen = self.sessionGeneration

      self.sendEvent("onStreamingStateChange", ["state": "starting"])

      do {
        let session = try StreamingTranscriptionSession(
          locale: locale,
          partialResults: partialResults,
          addsPunctuation: addsPunctuation,
          requiresOnDeviceRecognition: requiresOnDeviceRecognition,
          taskHint: taskHint,
          onPartialResult: { [weak self] text, isFinal, confidence in
            guard let self = self, self.sessionGeneration == gen else { return }
            self.sendEvent("onPartialResult", [
              "text": text,
              "isFinal": isFinal,
              "confidence": confidence,
            ])
          },
          onError: { [weak self] message, code in
            guard let self = self, self.sessionGeneration == gen else { return }
            self.sendEvent("onError", [
              "message": message,
              "code": code,
            ])
            self.sendEvent("onStreamingStateChange", ["state": "error"])
          },
          onStateChange: { [weak self] state in
            guard let self = self, self.sessionGeneration == gen else { return }
            self.sendEvent("onStreamingStateChange", ["state": state])
          }
        )

        try session.start()
        self.streamingSession = session
        promise.resolve(nil)
      } catch {
        self.sendEvent("onStreamingStateChange", ["state": "error"])
        promise.reject(
          TranscriptionError.streamingStartFailed,
          error.localizedDescription
        )
      }
    }

    AsyncFunction("stopStreamingTranscription") { (promise: Promise) in
      self.streamingSession?.stop()
      self.streamingSession = nil
      // Note: stop() already emits onStreamingStateChange("idle") via the session's onStateChange callback
      promise.resolve(nil)
    }

    // MARK: - Utilities

    AsyncFunction("isAvailable") { (locale: String, promise: Promise) in
      let sfLocale = Locale(identifier: locale)
      if let recognizer = SFSpeechRecognizer(locale: sfLocale) {
        promise.resolve(recognizer.isAvailable)
      } else {
        promise.resolve(false)
      }
    }

    AsyncFunction("requestPermissions") { (promise: Promise) in
      SFSpeechRecognizer.requestAuthorization { authStatus in
        switch authStatus {
        case .authorized:
          // Also request microphone permission
          if #available(iOS 17.0, *) {
            AVAudioApplication.requestRecordPermission { granted in
              promise.resolve(granted ? "authorized" : "microphone_denied")
            }
          } else {
            AVAudioSession.sharedInstance().requestRecordPermission { granted in
              promise.resolve(granted ? "authorized" : "microphone_denied")
            }
          }
        case .denied:
          promise.resolve("denied")
        case .restricted:
          promise.resolve("restricted")
        case .notDetermined:
          promise.resolve("not_determined")
        @unknown default:
          promise.resolve("unknown")
        }
      }
    }
  }
}

// MARK: - Error Types

private enum TranscriptionError: String, Error {
  case recognizerUnavailable = "RECOGNIZER_UNAVAILABLE"
  case recognitionFailed = "RECOGNITION_FAILED"
  case streamingStartFailed = "STREAMING_START_FAILED"
}
