import { Theme } from '../types'

const colors = {
  white: '#fff',
  black: '#000',
  gray: 'rgba(0, 0, 0, .5)',
  lightWhite: 'rgba(255, 255, 255, .5)',
  blueTintColor: '#0281ff',
  lightPink: '#F7B5CD',
  neonCyan: '#00f0ff',
  neonMagenta: '#ff00ff',
  cyberpunkDark: '#0d0221',
  matrixGreen: '#00ff41',
  matrixDarkGreen: '#003b00',
  matrixBlack: '#0d0d0d',
  pinkPrimary: '#e91e8c',
  pinkBackground: '#fff0f6',
  pinkMuted: 'rgba(233, 30, 140, .4)'
}

const fonts = {
  ultraLightFont: 'Geist-Ultralight',
  thinFont: 'Geist-Thin',
  regularFont: 'Geist-Regular',
  lightFont: 'Geist-Light',
  mediumFont: 'Geist-Medium',
  semiBoldFont: 'Geist-SemiBold',
  boldFont: 'Geist-Bold',
  blackFont: 'Geist-Black',
  ultraBlackFont: 'Geist-Ultrablack',
}

const lightTheme: Theme = {
  ...fonts,
  name: 'Light',
  label: 'light',
  quoteBackgroundColor: 'rgba(0, 0, 0, .05)',
  codeBorderColor: 'rgba(0, 0, 0, .15)',
  statusBarStyle: 'dark',
  textColor: colors.black,
  secondaryTextColor: colors.white,
  mutedForegroundColor: colors.gray,
  backgroundColor: colors.white,
  placeholderTextColor: colors.gray,
  secondaryBackgroundColor: colors.black,
  borderColor: 'rgba(0, 0, 0, .15)',
  tintColor: '#0281ff',
  tintTextColor: colors.white,
  tabBarActiveTintColor: colors.black,
  tabBarInactiveTintColor: colors.gray,
}

const darkTheme: Theme = {
  ...fonts,
  name: 'Dark',
  label: 'dark',
  quoteBackgroundColor: 'rgba(255, 255, 255, .06)',
  codeBorderColor: 'rgba(255, 255, 255, .2)',
  statusBarStyle: 'light',
  textColor: colors.white,
  secondaryTextColor: colors.black,
  mutedForegroundColor: colors.lightWhite,
  backgroundColor: colors.black,
  placeholderTextColor: colors.lightWhite,
  secondaryBackgroundColor: colors.white,
  borderColor: 'rgba(255, 255, 255, .2)',
  tintColor: '#0281ff',
  tintTextColor: colors.white,
  tabBarActiveTintColor: colors.blueTintColor,
  tabBarInactiveTintColor: colors.lightWhite,
}

const hackerNews: Theme = {
  ...lightTheme,
  name: 'Hacker News',
  label: 'hackerNews',
  backgroundColor: '#e4e4e4',
  tintColor: '#ed702d',
}

const miami: Theme = {
  ...darkTheme,
  name: 'Miami',
  label: 'miami',
  backgroundColor: '#231F20',
  tintColor: colors.lightPink,
  tintTextColor: '#231F20',
  tabBarActiveTintColor: colors.lightPink
}

const vercel: Theme = {
  ...darkTheme,
  name: 'Vercel',
  label: 'vercel',
  backgroundColor: colors.black,
  tintColor: '#171717',
  tintTextColor: colors.white,
  tabBarActiveTintColor: colors.white,
  secondaryTextColor: colors.white,
}

const cyberpunk: Theme = {
  ...darkTheme,
  name: 'Cyberpunk',
  label: 'cyberpunk',
  backgroundColor: colors.cyberpunkDark,
  tintColor: colors.neonCyan,
  tintTextColor: colors.cyberpunkDark,
  tabBarActiveTintColor: colors.neonCyan,
  tabBarInactiveTintColor: colors.neonMagenta,
  borderColor: 'rgba(0, 240, 255, .3)',
}

const matrix: Theme = {
  ...darkTheme,
  name: 'Matrix',
  label: 'matrix',
  backgroundColor: colors.matrixBlack,
  tintColor: colors.matrixGreen,
  tintTextColor: colors.matrixBlack,
  tabBarActiveTintColor: colors.matrixGreen,
  tabBarInactiveTintColor: colors.matrixDarkGreen,
  borderColor: 'rgba(0, 255, 65, .3)',
}

const pink: Theme = {
  ...lightTheme,
  name: 'Pink',
  label: 'pink',
  backgroundColor: colors.pinkBackground,
  tintColor: colors.pinkPrimary,
  tintTextColor: colors.white,
  tabBarActiveTintColor: colors.pinkPrimary,
  tabBarInactiveTintColor: colors.pinkMuted,
  borderColor: 'rgba(233, 30, 140, .2)',
}

const THEMES: Record<string, Theme> = {
  light: lightTheme,
  dark: darkTheme,
  hackerNews,
  miami,
  vercel,
  cyberpunk,
  matrix,
  pink
}

function getTheme(label: string, systemColorScheme?: 'light' | 'dark' | null): Theme {
  if (label === 'system') {
    return systemColorScheme === 'dark' ? darkTheme : lightTheme
  }
  return THEMES[label] || lightTheme
}

export {
  lightTheme, darkTheme, hackerNews, miami, vercel, cyberpunk, matrix, pink, THEMES, getTheme
}
