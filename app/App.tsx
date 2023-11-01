import { useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { Main } from './src/main'
import { useFonts } from 'expo-font'
import { ThemeContext, AppContext } from './src/context'
import { lightTheme } from './src/theme'

export default function App() {
  const [theme, setTheme] = useState<string>('light')
  const [fontsLoaded] = useFonts({
    'Geist-Regular': require('./assets/fonts/Geist-Regular.otf'),
    'Geist-Light': require('./assets/fonts/Geist-Light.otf'),
    'Geist-Bold': require('./assets/fonts/Geist-Bold.otf'),
    'Geist-Medium': require('./assets/fonts/Geist-Medium.otf'),
    'Geist-Black': require('./assets/fonts/Geist-Black.otf'),
    'Geist-SemiBold': require('./assets/fonts/Geist-SemiBold.otf'),
    'Geist-Thin': require('./assets/fonts/Geist-Thin.otf'),
    'Geist-UltraLight': require('./assets/fonts/Geist-UltraLight.otf'),
    'Geist-UltraBlack': require('./assets/fonts/Geist-UltraBlack.otf'),
  })
  if (!fontsLoaded) return null
  return (
    <AppContext.Provider value={{}}>
      <ThemeContext.Provider value={{
        theme: getTheme(theme),
        setTheme
        }}>
        <NavigationContainer>
          <Main />
        </NavigationContainer>
      </ThemeContext.Provider>
    </AppContext.Provider>
  )
}

function getTheme(theme: any) {
  switch (theme) {
    case 'light':
      return lightTheme
    default:
      return lightTheme
  }
}