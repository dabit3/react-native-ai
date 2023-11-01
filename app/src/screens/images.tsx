import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView
} from 'react-native'

export function Images() {
  const styles = getStyles(null)
  return (
    <View>
      <Text
        style={styles.mainText}
      >Images</Text>
    </View>
  )
}

const getStyles = theme => StyleSheet.create({
  mainText: {
    fontFamily: 'Geist-Regular'
  },
})