import Foundation
import Speech
import AVFoundation
import React

/// Native iOS module that provides streaming speech transcription using SFSpeechRecognizer.
/// Emits partial and final transcription results as events to the React Native JS layer.
/// On iOS 26+, uses on-device recognition by default for privacy and performance.
@objc(SpeechTranscriptionModule)
class SpeechTranscriptionModule: RCTEventEmitter {

  private var speechRecognizer: SFSpeechRecognizer?
  private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
  private var recognitionTask: SFSpeechRecognitionTask?
  private let audioEngine = AVAudioEngine()
  private var isStreaming = false

  override init() {
    super.init()
  }

  // MARK: - RCTEventEmitter

  override static func requiresMainQueueSetup() -> Bool {
    return false
  }

  override func supportedEvents() -> [String]! {
    return [
      "onTranscriptionPartialResult",
      "onTranscriptionFinalResult",
      "onTranscriptionError",
      "onTranscriptionStateChange"
    ]
  }

  // MARK: - Public API

  /// Check if speech recognition is available for the given locale.
  @objc
  func isAvailable(_ locale: String,
                    resolver resolve: @escaping RCTPromiseResolveBlock,
                    rejecter reject: @escaping RCTPromiseRejectBlock) {
    let recognizer = SFSpeechRecognizer(locale: Locale(identifier: locale))
    let available = recognizer?.isAvailable ?? false
    var supportsOnDevice = false
    if #available(iOS 13, *) {
      supportsOnDevice = recognizer?.supportsOnDeviceRecognition ?? false
    }
    resolve([
      "available": available,
      "supportsOnDevice": supportsOnDevice,
      "locale": locale
    ])
  }

  /// Request speech recognition authorization from the user.
  @objc
  func requestPermissions(_ resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
    SFSpeechRecognizer.requestAuthorization { status in
      var granted = false
      var statusString = "notDetermined"
      switch status {
      case .authorized:
        granted = true
        statusString = "authorized"
      case .denied:
        statusString = "denied"
      case .restricted:
        statusString = "restricted"
      case .notDetermined:
        statusString = "notDetermined"
      @unknown default:
        statusString = "unknown"
      }

      AVAudioSession.sharedInstance().requestRecordPermission { micGranted in
        resolve([
          "speechRecognition": statusString,
          "speechRecognitionGranted": granted,
          "microphone": micGranted ? "authorized" : "denied",
          "microphoneGranted": micGranted
        ])
      }
    }
  }

  /// Start streaming transcription for the given locale.
  /// Emits `onTranscriptionPartialResult` events with partial transcriptions,
  /// and `onTranscriptionFinalResult` when complete.
  @objc
  func startStreaming(_ locale: String,
                      options: NSDictionary,
                      resolver resolve: @escaping RCTPromiseResolveBlock,
                      rejecter reject: @escaping RCTPromiseRejectBlock) {
    if isStreaming {
      reject("ERR_ALREADY_STREAMING", "Streaming transcription is already active", nil)
      return
    }

    let recognizer = SFSpeechRecognizer(locale: Locale(identifier: locale))
    guard let recognizer = recognizer, recognizer.isAvailable else {
      reject("ERR_NOT_AVAILABLE", "Speech recognition is not available for locale: \(locale)", nil)
      return
    }

    speechRecognizer = recognizer

    let request = SFSpeechAudioBufferRecognitionRequest()
    request.shouldReportPartialResults = true

    // Prefer on-device recognition when available for privacy
    let preferOnDevice = options["preferOnDevice"] as? Bool ?? true
    if #available(iOS 13, *) {
      if preferOnDevice && recognizer.supportsOnDeviceRecognition {
        request.requiresOnDeviceRecognition = true
      }
    }

    // Add task hints if provided
    if let taskHint = options["taskHint"] as? String {
      switch taskHint {
      case "dictation":
        request.taskHint = .dictation
      case "search":
        request.taskHint = .search
      case "confirmation":
        request.taskHint = .confirmation
      default:
        request.taskHint = .unspecified
      }
    }

    recognitionRequest = request

    // Configure audio session
    let audioSession = AVAudioSession.sharedInstance()
    do {
      try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
      try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
    } catch {
      reject("ERR_AUDIO_SESSION", "Failed to configure audio session: \(error.localizedDescription)", error)
      return
    }

    let inputNode = audioEngine.inputNode

    // Start recognition task
    recognitionTask = recognizer.recognitionTask(with: request) { [weak self] result, error in
      guard let self = self else { return }

      if let error = error {
        self.sendEvent(withName: "onTranscriptionError", body: [
          "error": error.localizedDescription,
          "code": (error as NSError).code
        ])
        self.cleanupStreaming()
        return
      }

      guard let result = result else { return }

      let segments = result.bestTranscription.segments.map { segment -> [String: Any] in
        return [
          "text": segment.substring,
          "timestamp": segment.timestamp,
          "duration": segment.duration,
          "confidence": segment.confidence,
          "alternativeSubstrings": segment.alternativeSubstrings
        ]
      }

      let transcriptionData: [String: Any] = [
        "text": result.bestTranscription.formattedString,
        "segments": segments,
        "isFinal": result.isFinal
      ]

      if result.isFinal {
        self.sendEvent(withName: "onTranscriptionFinalResult", body: transcriptionData)
        self.cleanupStreaming()
      } else {
        self.sendEvent(withName: "onTranscriptionPartialResult", body: transcriptionData)
      }
    }

    // Install audio tap
    let recordingFormat = inputNode.outputFormat(forBus: 0)
    inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { [weak self] buffer, _ in
      self?.recognitionRequest?.append(buffer)
    }

    // Start audio engine
    do {
      audioEngine.prepare()
      try audioEngine.start()
      isStreaming = true
      sendEvent(withName: "onTranscriptionStateChange", body: [
        "state": "streaming",
        "locale": locale
      ])
      resolve([
        "started": true,
        "locale": locale
      ])
    } catch {
      cleanupStreaming()
      reject("ERR_AUDIO_ENGINE", "Failed to start audio engine: \(error.localizedDescription)", error)
    }
  }

  /// Stop the current streaming transcription session.
  @objc
  func stopStreaming(_ resolve: @escaping RCTPromiseResolveBlock,
                     rejecter reject: @escaping RCTPromiseRejectBlock) {
    if !isStreaming {
      resolve(["stopped": true, "wasStreaming": false])
      return
    }

    recognitionRequest?.endAudio()
    cleanupStreaming()
    sendEvent(withName: "onTranscriptionStateChange", body: [
      "state": "stopped"
    ])
    resolve(["stopped": true, "wasStreaming": true])
  }

  /// Perform batch transcription on an audio file at the given path.
  @objc
  func transcribeFile(_ filePath: String,
                      locale: String,
                      resolver resolve: @escaping RCTPromiseResolveBlock,
                      rejecter reject: @escaping RCTPromiseRejectBlock) {
    let recognizer = SFSpeechRecognizer(locale: Locale(identifier: locale))
    guard let recognizer = recognizer, recognizer.isAvailable else {
      reject("ERR_NOT_AVAILABLE", "Speech recognition is not available for locale: \(locale)", nil)
      return
    }

    let url = URL(fileURLWithPath: filePath)
    let request = SFSpeechURLRecognitionRequest(url: url)

    if #available(iOS 13, *) {
      if recognizer.supportsOnDeviceRecognition {
        request.requiresOnDeviceRecognition = true
      }
    }

    recognizer.recognitionTask(with: request) { result, error in
      if let error = error {
        reject("ERR_TRANSCRIPTION", "Transcription failed: \(error.localizedDescription)", error)
        return
      }
      guard let result = result, result.isFinal else { return }

      let segments = result.bestTranscription.segments.map { segment -> [String: Any] in
        return [
          "text": segment.substring,
          "timestamp": segment.timestamp,
          "duration": segment.duration,
          "confidence": segment.confidence
        ]
      }

      resolve([
        "text": result.bestTranscription.formattedString,
        "segments": segments,
        "isFinal": true
      ])
    }
  }

  // MARK: - Private

  private func cleanupStreaming() {
    audioEngine.stop()
    audioEngine.inputNode.removeTap(onBus: 0)
    recognitionRequest = nil
    recognitionTask?.cancel()
    recognitionTask = nil
    isStreaming = false

    try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
  }
}
