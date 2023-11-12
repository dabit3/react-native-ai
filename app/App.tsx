import 'react-native-gesture-handler'
import { useState, useRef, useCallback } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { Main } from './src/main'
import { useFonts } from 'expo-font'
import { ThemeContext, AppContext } from './src/context'
import { lightTheme, darkTheme } from './src/theme'
import { CHAT_TYPES, IMAGE_MODELS } from './constants'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import {
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet'
import { View, Text } from 'react-native'
import LogBox from 'react-native/Libraries/LogBox/LogBox'
// @ts-ignore
LogBox.ignoreLogs([
  'Key "cancelled" in the image picker result is deprecated and will be removed in SDK 48, use "canceled" instead',
  'No native splash screen registered'
])

export default function App() {
  const [theme, setTheme] = useState<string>('light')
  const [chatType, setChatType] = useState<string>(CHAT_TYPES.gptTurbo)
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
  const handlePresentModalPress = useCallback(() => {
    if (modalVisible) {
      bottomSheetModalRef.current?.dismiss()
      setModalVisible(false)
    } else {
      bottomSheetModalRef.current?.present()
      setModalVisible(true)
    }
  
  }, []);
  const handleSheetChanges = useCallback((index: number) => {
    console.log('handleSheetChanges', index);
  }, []);

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
        </ThemeContext.Provider>
      </AppContext.Provider>
      <BottomSheetModalProvider>
       <BottomSheetModal
          ref={bottomSheetModalRef}
          snapPoints={['50%']}
          onChange={handleSheetChanges}
        >
          <View>
            <Text>Awesome 🎉</Text>
          </View>
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  )
}

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