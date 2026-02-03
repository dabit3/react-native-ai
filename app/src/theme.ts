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
  matrixBlack: '#0d0d0d'
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

const lightTheme = {
  ...fonts,
  name: 'Light',
  label: 'light',
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

const darkTheme = {
  ...fonts,
  name: 'Dark',
  label: 'dark',
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

const hackerNews = {
  ...lightTheme,
  name: 'Hacker News',
  label: 'hackerNews',
  backgroundColor: '#e4e4e4',
  tintColor: '#ed702d',
}

const miami = {
  ...darkTheme,
  name: 'Miami',
  label: 'miami',
  backgroundColor: '#231F20',
  tintColor: colors.lightPink,
  tintTextColor: '#231F20',
  tabBarActiveTintColor: colors.lightPink
}

const vercel = {
  ...darkTheme,
  name: 'Vercel',
  label: 'vercel',
  backgroundColor: colors.black,
  tintColor: '#171717',
  tintTextColor: colors.white,
  tabBarActiveTintColor: colors.white,
  secondaryTextColor: colors.white,
}

const cyberpunk = {
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

const matrix = {
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

export {
  lightTheme, darkTheme, hackerNews, miami, vercel, cyberpunk, matrix
}
