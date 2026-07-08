import 'react-native-gesture-handler'
import { useState, useEffect, useRef } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { Main } from './src/main'
import { useFonts } from 'expo-font'
import { ThemeContext, AppContext } from './src/context'
import { getTheme } from './src/theme'
import { IMAGE_MODELS, MODELS, fetchModels } from './constants'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { ChatModelModal } from './src/components/index'
import { Model, Theme } from './types'
import { ActionSheetProvider } from '@expo/react-native-action-sheet'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { StatusBar } from 'expo-status-bar'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import { StyleSheet, LogBox, useColorScheme } from 'react-native'

LogBox.ignoreLogs([
  'Key "cancelled" in the image picker result is deprecated and will be removed in SDK 48, use "canceled" instead',
  'No native splash screen registered'
])

export default function App() {
  const colorScheme = useColorScheme()
  const [theme, setTheme] = useState<string>('light')
  const [chatType, setChatType] = useState<Model>(MODELS.claudeOpus)
  const [imageModel, setImageModel] = useState<string>(IMAGE_MODELS.nanoBanana.label)
  const [models, setModels] = useState<Model[]>(Object.values(MODELS))
  const [systemPrompt, setSystemPrompt] = useState<string>('')
  const [modalVisible, setModalVisible] = useState<boolean>(false)
  const [fontsLoaded] = useFonts({
    'Geist-Regular': require('./assets/fonts/Geist-Regular.otf'),
    'Geist-Light': require('./assets/fonts/Geist-Light.otf'),
    'Geist-Bold': require('./assets/fonts/Geist-Bold.otf'),
    'Geist-Medium': require('./assets/fonts/Geist-Medium.otf'),
    'Geist-Black': require('./assets/fonts/Geist-Black.otf'),
    'Geist-SemiBold': require('./assets/fonts/Geist-SemiBold.otf'),
    'Geist-Thin': require('./assets/fonts/Geist-Thin.otf'),
    'Geist-UltraLight': require('./assets/fonts/Geist-UltraLight.otf'),
    'Geist-UltraBlack': require('./assets/fonts/Geist-UltraBlack.otf')
  })

  useEffect(() => {
    configureStorage()
    fetchModels().then(remoteModels => {
      setModels(remoteModels)
      setChatType(current => remoteModels.find(m => m.label === current.label) || current)
    })
  }, [])

  async function configureStorage() {
    try {
      const _theme = await AsyncStorage.getItem('rnai-theme')
      if (_theme) setTheme(_theme)
      const _chatType = await AsyncStorage.getItem('rnai-chatType')
      if (_chatType) {
        const parsed = JSON.parse(_chatType)
        const model = MODELS[parsed.label]
        if (model) setChatType(model)
      }
      const _imageModel = await AsyncStorage.getItem('rnai-imageModel')
      if (_imageModel) setImageModel(_imageModel)
      const _systemPrompt = await AsyncStorage.getItem('rnai-systemPrompt')
      if (_systemPrompt) setSystemPrompt(_systemPrompt)
    } catch (err) {
      console.log('error configuring storage', err)
    }
  }

  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  function closeModal() {
    bottomSheetModalRef.current?.dismiss()
    setModalVisible(false)
  }

  function handlePresentModalPress() {
    if (modalVisible) {
      closeModal()
    } else {
      bottomSheetModalRef.current?.present()
      setModalVisible(true)
    }
  }

  function _setChatType(type: Model) {
    setChatType(type)
    AsyncStorage.setItem('rnai-chatType', JSON.stringify({ label: type.label }))
  }

  function _setImageModel(model: string) {
    setImageModel(model)
    AsyncStorage.setItem('rnai-imageModel', model)
  }

  function _setTheme(theme: string) {
    setTheme(theme)
    AsyncStorage.setItem('rnai-theme', theme)
  }

  function _setSystemPrompt(prompt: string) {
    setSystemPrompt(prompt)
    AsyncStorage.setItem('rnai-systemPrompt', prompt)
  }

  const currentTheme = getTheme(theme, colorScheme)
  const bottomSheetStyles = getBottomsheetStyles(currentTheme)

  if (!fontsLoaded) return null
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppContext.Provider
        value={{
          chatType,
          setChatType: _setChatType,
          handlePresentModalPress,
          imageModel,
          setImageModel: _setImageModel,
          closeModal,
          models,
          systemPrompt,
          setSystemPrompt: _setSystemPrompt,
        }}
      >
        <ThemeContext.Provider value={{
          theme: currentTheme,
          themeName: theme,
          setTheme: _setTheme
          }}>
          <StatusBar style={currentTheme.statusBarStyle} />
          <ActionSheetProvider>
            <NavigationContainer>
              <Main />
            </NavigationContainer>
          </ActionSheetProvider>
          <BottomSheetModalProvider>
            <BottomSheetModal
                handleIndicatorStyle={bottomSheetStyles.handleIndicator}
                handleStyle={bottomSheetStyles.handle}
                backgroundStyle={bottomSheetStyles.background}
                ref={bottomSheetModalRef}
                enableDynamicSizing={true}
                backdropComponent={(props) => <BottomSheetBackdrop {...props}  disappearsOnIndex={-1}/>}
                enableDismissOnClose
                enablePanDownToClose
                onDismiss={() => setModalVisible(false)}
              >
                <BottomSheetView>
                  <ChatModelModal
                    handlePresentModalPress={handlePresentModalPress}
                  />
                </BottomSheetView>
              </BottomSheetModal>
            </BottomSheetModalProvider>
        </ThemeContext.Provider>
      </AppContext.Provider>
    </GestureHandlerRootView>
  )
}

const getBottomsheetStyles = (theme: Theme) => StyleSheet.create({
  background: {
    paddingHorizontal: 24,
    backgroundColor: theme.backgroundColor
  },
  handle: {
    marginHorizontal: 15,
    backgroundColor: theme.backgroundColor,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    backgroundColor: theme.mutedForegroundColor
  }
})
