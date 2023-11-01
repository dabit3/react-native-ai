import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView
} from 'react-native'
import { useContext } from 'react'
import { ThemeContext } from '../context'

export function Chat() {
  const { theme } = useContext(ThemeContext)
  console.log('theme', theme)
  const styles = getStyles(theme)
  return (
    <View>
      <Text
        style={styles.mainText}
      >Chat</Text>
    </View>
  )
}

const getStyles = theme => StyleSheet.create({
  mainText: {
    fontFamily: 'Geist-Regular'
  },
})