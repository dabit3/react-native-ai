import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Chat, Images } from './screens'
import { Header } from './components'
import MaterialIcons from '@expo/vector-icons/MaterialCommunityIcons';

const Tab = createBottomTabNavigator()

export function Main() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: 'black',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          borderTopWidth: 0
        }
      }}
    >
      <Tab.Screen
        name="Chat"
        component={Chat}
        options={{
          header: () => <Header />,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons
              name="message-text"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Images"
        component={Images}
        options={{
          header: () => <Header />,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons
              name="palette"
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
})
