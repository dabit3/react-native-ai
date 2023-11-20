import 'react-native-gesture-handler'
import { useState, useRef, useCallback } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { Main } from './src/main'
import { useFonts } from 'expo-font'
import { ThemeContext, AppContext } from './src/context'
import { lightTheme, darkTheme } from './src/theme'
import { IMAGE_MODELS, MODELS } from './constants'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { ChatModelModal } from './src/components/index'
import { Model } from './types'
import {
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet'
import { StyleSheet } from 'react-native'
import LogBox from 'react-native/Libraries/LogBox/LogBox'
// @ts-ignore
LogBox.ignoreLogs([
  'Key "cancelled" in the image picker result is deprecated and will be removed in SDK 48, use "canceled" instead',
  'No native splash screen registered'
])

export default function App() {
  const [theme, setTheme] = useState<string>('light')
  const [chatType, setChatType] = useState<Model>(MODELS.gptTurbo)
  const [imageModel, setImageModel] = useState<string>(IMAGE_MODELS.fastImage)
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

  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const handlePresentModalPress = () => {
    if (modalVisible) {
      bottomSheetModalRef.current?.dismiss()
      setModalVisible(false)
    } else {
      bottomSheetModalRef.current?.present()
      setModalVisible(true)
    }
  }
  console.log('chatType: ', chatType)

  const bottomSheetStyles = getBottomsheetStyles(theme)

  if (!fontsLoaded) return null
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppContext.Provider
        value={{
          chatType,
          setChatType,
          handlePresentModalPress,
          imageModel,
          setImageModel
        }}
      >
        <ThemeContext.Provider value={{
          theme: getTheme(theme),
          themeName: theme,
          setTheme
          }}>
          <NavigationContainer>
            <Main />
          </NavigationContainer>
          <BottomSheetModalProvider>
            <BottomSheetModal
                handleIndicatorStyle={bottomSheetStyles.handleIndicator}
                handleStyle={bottomSheetStyles.handle}
                backgroundStyle={bottomSheetStyles.background}
                ref={bottomSheetModalRef}
                snapPoints={['50%']}
              >
                <ChatModelModal
                  handlePresentModalPress={handlePresentModalPress}
                />
              </BottomSheetModal>
            </BottomSheetModalProvider>
        </ThemeContext.Provider>
      </AppContext.Provider>
    </GestureHandlerRootView>
  )
}

const getBottomsheetStyles = theme => StyleSheet.create({
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
    backgroundColor: 'rgba(255, 255, 255, .3)'
  }
})

function getTheme(theme: any) {
  switch (theme) {
    case 'light':
      return lightTheme
    case 'dark':
      return darkTheme
    default:
      return lightTheme
  }
}