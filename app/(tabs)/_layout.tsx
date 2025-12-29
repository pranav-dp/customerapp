import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';

const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 85 : 65;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray500,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.gray100,
          height: TAB_BAR_HEIGHT,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        },
        tabBarLabelStyle: {
          ...textStyles.labelSmall,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
