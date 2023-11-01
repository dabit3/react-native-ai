import React, { createContext, SetStateAction, Dispatch  } from 'react'

interface IThemeContext {
  theme: {},
  setTheme: Dispatch<SetStateAction<string>>
}

const ThemeContext = createContext<IThemeContext>({
  theme: {},
  setTheme: () => null
})

const AppContext = createContext({})

export {
  ThemeContext, AppContext
}