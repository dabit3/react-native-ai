/**
 * Tests for @react-native-ai/apple transcription module.
 *
 * Validates the TypeScript layer: types, module loading fallback,
 * and the useStreamingTranscription hook behavior.
 */

// Shared mock state
const mockAddListener = jest.fn().mockReturnValue({ remove: jest.fn() });
const mockStartStreaming = jest.fn().mockResolvedValue(undefined);
const mockStopStreaming = jest.fn().mockResolvedValue(undefined);
const mockIsAvailableFn = jest.fn().mockResolvedValue(true);
const mockRequestPermissions = jest.fn().mockResolvedValue('authorized');
const mockTranscribe = jest.fn();

// Control whether the native module "exists"
let shouldModuleExist = false;

jest.mock('expo-modules-core', () => ({
  requireNativeModule: jest.fn((): unknown => {
    if (!shouldModuleExist) {
      throw new Error('Native module not available');
    }
    return {
      transcribe: mockTranscribe,
      startStreamingTranscription: mockStartStreaming,
      stopStreamingTranscription: mockStopStreaming,
      isAvailable: mockIsAvailableFn,
      requestPermissions: mockRequestPermissions,
      addListener: mockAddListener,
    };
  }),
  NativeModule: class {},
}));

// Mock React hooks
const capturedSetters: jest.Mock[] = [];

jest.mock('react', () => {
  return {
    useState: jest.fn((initial: unknown) => {
      const setter = jest.fn();
      capturedSetters.push(setter);
      return [initial, setter];
    }),
    useCallback: jest.fn((fn: Function) => fn),
    useEffect: jest.fn((cb: Function) => {
      cb();
    }),
    useRef: jest.fn((initial: unknown) => ({ current: initial !== undefined ? initial : null })),
  };
});

beforeEach(() => {
  jest.clearAllMocks();
  capturedSetters.length = 0;
  shouldModuleExist = false;
});

// ---- Module loading tests ----

describe('AppleTranscriptionModule', () => {
  // Note: Because jest.mock is hoisted and the module is loaded once,
  // we test the default (unavailable) case here.
  test('NativeAppleTranscription is null when native module throws', () => {
    shouldModuleExist = false;
    jest.isolateModules(() => {
      const mod = require('../src/AppleTranscriptionModule');
      expect(mod.NativeAppleTranscription).toBeNull();
    });
  });

  test('NativeAppleTranscription is set when native module is available', () => {
    shouldModuleExist = true;
    jest.isolateModules(() => {
      const mod = require('../src/AppleTranscriptionModule');
      expect(mod.NativeAppleTranscription).not.toBeNull();
      expect(mod.NativeAppleTranscription).toHaveProperty('transcribe');
      expect(mod.NativeAppleTranscription).toHaveProperty('startStreamingTranscription');
      expect(mod.NativeAppleTranscription).toHaveProperty('stopStreamingTranscription');
      expect(mod.NativeAppleTranscription).toHaveProperty('isAvailable');
      expect(mod.NativeAppleTranscription).toHaveProperty('requestPermissions');
      expect(mod.NativeAppleTranscription).toHaveProperty('addListener');
    });
  });
});

// ---- Types tests ----

describe('AppleTranscription.types', () => {
  test('types module loads without error', () => {
    jest.isolateModules(() => {
      const types = require('../src/AppleTranscription.types');
      expect(types).toBeDefined();
    });
  });
});

// ---- Index exports tests ----

describe('Index exports', () => {
  test('exports useStreamingTranscription function', () => {
    jest.isolateModules(() => {
      const mod = require('../src/index');
      expect(typeof mod.useStreamingTranscription).toBe('function');
    });
  });

  test('exports NativeAppleTranscription', () => {
    jest.isolateModules(() => {
      const mod = require('../src/index');
      expect(mod).toHaveProperty('NativeAppleTranscription');
    });
  });
});

// ---- Hook tests ----

describe('useStreamingTranscription', () => {
  function getHook(moduleAvailable: boolean) {
    shouldModuleExist = moduleAvailable;
    let hookResult: ReturnType<typeof import('../src/useStreamingTranscription').useStreamingTranscription>;
    jest.isolateModules(() => {
      const { useStreamingTranscription } = require('../src/useStreamingTranscription');
      hookResult = useStreamingTranscription();
    });
    return hookResult!;
  }

  test('returns all expected properties', () => {
    const result = getHook(false);
    expect(result).toHaveProperty('startListening');
    expect(result).toHaveProperty('stopListening');
    expect(result).toHaveProperty('transcript');
    expect(result).toHaveProperty('isFinal');
    expect(result).toHaveProperty('state');
    expect(result).toHaveProperty('error');
    expect(result).toHaveProperty('isAvailable');
  });

  test('startListening and stopListening are functions', () => {
    const result = getHook(false);
    expect(typeof result.startListening).toBe('function');
    expect(typeof result.stopListening).toBe('function');
  });

  test('initializes with correct default values', () => {
    const result = getHook(false);
    expect(result.transcript).toBe('');
    expect(result.isFinal).toBe(false);
    expect(result.state).toBe('idle');
    expect(result.error).toBeNull();
    expect(result.isAvailable).toBe(false);
  });

  test('startListening sets error when native module unavailable', async () => {
    const result = getHook(false);
    await result.startListening();

    // useState is called 5 times (transcript, isFinal, state, error, isAvailable)
    // setError is the 4th setter (index 3), setState is the 3rd (index 2)
    const setError = capturedSetters[3];
    const setState = capturedSetters[2];

    expect(setError).toHaveBeenCalledWith(
      'Apple transcription is not available on this platform'
    );
    expect(setState).toHaveBeenCalledWith('error');
  });

  test('stopListening resolves when native module unavailable', async () => {
    const result = getHook(false);
    await expect(result.stopListening()).resolves.toBeUndefined();
  });

  test('startListening calls native module with default options', async () => {
    const result = getHook(true);
    await result.startListening();

    expect(mockRequestPermissions).toHaveBeenCalled();
    expect(mockStartStreaming).toHaveBeenCalledWith(
      'en-US',
      true,
      true,
      false,
      'dictation'
    );
  });

  test('startListening calls native module with custom options', async () => {
    const result = getHook(true);
    await result.startListening({
      locale: 'ja-JP',
      partialResults: false,
      addsPunctuation: false,
      requiresOnDeviceRecognition: true,
      taskHint: 'search',
    });

    expect(mockStartStreaming).toHaveBeenCalledWith(
      'ja-JP',
      false,
      false,
      true,
      'search'
    );
  });

  test('startListening subscribes to native events', async () => {
    const result = getHook(true);
    await result.startListening();

    expect(mockAddListener).toHaveBeenCalledWith('onPartialResult', expect.any(Function));
    expect(mockAddListener).toHaveBeenCalledWith('onError', expect.any(Function));
    expect(mockAddListener).toHaveBeenCalledWith('onStreamingStateChange', expect.any(Function));
  });

  test('stopListening calls native stopStreamingTranscription', async () => {
    const result = getHook(true);
    await result.stopListening();

    expect(mockStopStreaming).toHaveBeenCalled();
  });

  test('startListening sets error when permission denied', async () => {
    mockRequestPermissions.mockResolvedValueOnce('denied');
    const result = getHook(true);
    await result.startListening();

    // Permission was requested
    expect(mockRequestPermissions).toHaveBeenCalled();
    // But streaming should NOT have been started
    expect(mockStartStreaming).not.toHaveBeenCalled();

    // setError (index 3) and setState (index 2) should reflect the denial
    const setError = capturedSetters[3];
    const setState = capturedSetters[2];
    expect(setError).toHaveBeenCalledWith('Permission not granted: denied');
    expect(setState).toHaveBeenCalledWith('error');
  });

  test('startListening sets error when microphone denied', async () => {
    mockRequestPermissions.mockResolvedValueOnce('microphone_denied');
    const result = getHook(true);
    await result.startListening();

    expect(mockRequestPermissions).toHaveBeenCalled();
    expect(mockStartStreaming).not.toHaveBeenCalled();

    const setError = capturedSetters[3];
    expect(setError).toHaveBeenCalledWith('Permission not granted: microphone_denied');
  });
});
