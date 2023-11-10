import { createContext, SetStateAction, Dispatch  } from 'react'

interface IThemeContext {
  theme: any
  setTheme: Dispatch<SetStateAction<string>>
  themeName: string
}

interface IAppContext {
  chatType: string
  setChatType: Dispatch<SetStateAction<string>>,
  handlePresentModalPress: () => void
}

const ThemeContext = createContext<IThemeContext>({
  theme: {},
  setTheme: () => null,
  themeName: ''
})

const AppContext = createContext<IAppContext>({
  chatType: '',
  setChatType: () => null,
  handlePresentModalPress: () => null
})

export {
  ThemeContext, AppContext
}