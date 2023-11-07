import {
  Text, StyleSheet, TouchableOpacity, View
} from 'react-native'
import { useContext } from 'react'
import { Icon } from './Icon'
import { AppContext, ThemeContext } from '../context'

export function Header() {
  const { theme } = useContext(ThemeContext)
  const styles = getStyles(theme)

  return (
    <View style={styles.container}>
      <Icon size={34} />
    </View>
  )
}

function getStyles(theme:any) {
  return StyleSheet.create({
    container: {
      paddingVertical: 15,
      backgroundColor: theme.backgroundColor,
      justifyContent: 'center',
      alignItems: 'center',
    }
  })
}