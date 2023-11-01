import {
  Text, StyleSheet, TouchableOpacity, View
} from 'react-native'
import { Icon } from './Icon'
import { SafeAreaView } from 'react-native-safe-area-context';

export function Header() {
  const styles = getStyles()
  return (
    <SafeAreaView style={styles.container}>
      <Icon size={34} />
    </SafeAreaView>
  )
}

function getStyles() {
  return StyleSheet.create({
    container: {
      justifyContent: 'center',
      alignItems: 'center',
    }
  })
}