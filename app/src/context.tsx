import { createContext, SetStateAction, Dispatch  } from 'react'

interface IThemeContext {
  theme: any,
  setTheme: Dispatch<SetStateAction<string>>
}

interface IAppContext {
  chatType: string
  setChatType: Dispatch<SetStateAction<string>>
}

const ThemeContext = createContext<IThemeContext>({
  theme: {},
  setTheme: () => null
})

const AppContext = createContext<IAppContext>({
  chatType: '',
  setChatType: () => null
})

export {
  ThemeContext, AppContext
}