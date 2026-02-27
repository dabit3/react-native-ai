import Speech
import AVFoundation

/// Manages a single streaming transcription session using SFSpeechRecognizer.
///
/// This class handles:
/// - Audio session configuration and microphone input via AVAudioEngine
/// - Real-time speech recognition with partial results via SFSpeechAudioBufferRecognitionRequest
/// - Lifecycle management (start / stop / cleanup)
///
/// On iOS 10+: Uses SFSpeechRecognizer with shouldReportPartialResults.
/// On iOS 17+: Uses additional addsPunctuation and requiresOnDeviceRecognition options.
///
/// Future: On iOS 26+, this can be extended to use Apple's SpeechAnalyzer/SpeechTranscriber
/// framework for even more capable on-device streaming transcription.
class StreamingTranscriptionSession {
  private let recognizer: SFSpeechRecognizer
  private let audioEngine = AVAudioEngine()
  private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
  private var recognitionTask: SFSpeechRecognitionTask?
  private var isStopped = false
  private let queue = DispatchQueue(label: "com.reactnativeai.apple.transcription")

  private let partialResults: Bool
  private let addsPunctuation: Bool
  private let requiresOnDeviceRecognition: Bool
  private let taskHint: String

  // Callbacks
  private let onPartialResult: (String, Bool, Float) -> Void
  private let onError: (String, String) -> Void
  private let onStateChange: (String) -> Void

  init(
    locale: String,
    partialResults: Bool,
    addsPunctuation: Bool,
    requiresOnDeviceRecognition: Bool,
    taskHint: String,
    onPartialResult: @escaping (String, Bool, Float) -> Void,
    onError: @escaping (String, String) -> Void,
    onStateChange: @escaping (String) -> Void
  ) throws {
    let sfLocale = Locale(identifier: locale)

    guard let recognizer = SFSpeechRecognizer(locale: sfLocale) else {
      throw StreamingError.recognizerUnavailable(locale: locale)
    }

    guard recognizer.isAvailable else {
      throw StreamingError.recognizerNotReady
    }

    self.recognizer = recognizer
    self.partialResults = partialResults
    self.addsPunctuation = addsPunctuation
    self.requiresOnDeviceRecognition = requiresOnDeviceRecognition
    self.taskHint = taskHint
    self.onPartialResult = onPartialResult
    self.onError = onError
    self.onStateChange = onStateChange
  }

  /// Start the streaming recognition session.
  func start() throws {
    // Cancel any previous task
    recognitionTask?.cancel()
    recognitionTask = nil

    // Configure audio session for recording
    let audioSession = AVAudioSession.sharedInstance()
    try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
    try audioSession.setActive(true, options: .notifyOthersOnDeactivation)

    // Create recognition request
    let request = SFSpeechAudioBufferRecognitionRequest()
    request.shouldReportPartialResults = partialResults

    // iOS 16+ features
    if #available(iOS 16.0, *) {
      request.addsPunctuation = addsPunctuation
    }
    // iOS 13+ features
    if #available(iOS 13.0, *) {
      request.requiresOnDeviceRecognition = requiresOnDeviceRecognition
    }

    // iOS 13+ task hint
    if #available(iOS 13.0, *) {
      switch taskHint {
      case "search":
        request.taskHint = .search
      case "confirmation":
        request.taskHint = .confirmation
      case "dictation":
        request.taskHint = .dictation
      default:
        request.taskHint = .unspecified
      }
    }

    self.recognitionRequest = request

    // Start recognition task
    isStopped = false
    recognitionTask = recognizer.recognitionTask(with: request) { [weak self] result, error in
      guard let self = self else { return }

      self.queue.async {
        if self.isStopped { return }

        if let result = result {
          let text = result.bestTranscription.formattedString
          let isFinal = result.isFinal

          // Calculate average confidence from segments
          let segments = result.bestTranscription.segments
          let avgConfidence: Float
          if segments.isEmpty {
            avgConfidence = 0.0
          } else {
            avgConfidence = segments.reduce(Float(0)) { $0 + $1.confidence } / Float(segments.count)
          }

          self.onPartialResult(text, isFinal, avgConfidence)

          if isFinal {
            self.stopInternal()
            return
          }
        }

        if let error = error {
          let nsError = error as NSError
          // Ignore cancellation errors (code 216 = user cancelled, code 1 = cancelled)
          if nsError.domain == "kAFAssistantErrorDomain" && nsError.code == 216 {
            return
          }
          if nsError.domain == "kAFAssistantErrorDomain" && nsError.code == 1 {
            return
          }
          self.onError(error.localizedDescription, "RECOGNITION_ERROR")
        }
      }
    }

    // Install audio tap on input node
    let inputNode = audioEngine.inputNode
    let recordingFormat = inputNode.outputFormat(forBus: 0)
    inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
      request.append(buffer)
    }

    audioEngine.prepare()
    try audioEngine.start()

    onStateChange("listening")
  }

  /// Stop the streaming recognition session and clean up resources.
  /// Thread-safe: synchronizes on the internal serial queue.
  func stop() {
    queue.sync {
      stopInternal()
    }
  }

  /// Internal stop implementation. Must be called on `queue`.
  private func stopInternal() {
    if isStopped { return }
    isStopped = true

    // Stop audio engine
    if audioEngine.isRunning {
      audioEngine.stop()
      audioEngine.inputNode.removeTap(onBus: 0)
    }

    // End the recognition request (signals end of audio)
    recognitionRequest?.endAudio()
    recognitionRequest = nil

    // Cancel the recognition task
    recognitionTask?.cancel()
    recognitionTask = nil

    // Deactivate audio session
    try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)

    // Notify JS that we're idle
    onStateChange("idle")
  }
}

// MARK: - Error Types

enum StreamingError: Error, LocalizedError {
  case recognizerUnavailable(locale: String)
  case recognizerNotReady

  var errorDescription: String? {
    switch self {
    case .recognizerUnavailable(let locale):
      return "Speech recognizer is not available for locale: \(locale)"
    case .recognizerNotReady:
      return "Speech recognizer is not currently available on this device"
    }
  }
}
