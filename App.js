import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';
import { ThemeProvider, useTheme } from './config/ThemeContext';
import { SERVICES } from './config/services';
import WelcomeScreen from './screens/WelcomeScreen';
import HomeScreen from './screens/HomeScreen';
import ServiceScreen from './screens/ServiceScreen';
import PresensiScreen from './screens/PresensiScreen';
import JasaScreen from './screens/JasaScreen';

const Stack = createNativeStackNavigator();

const AppDarkTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: '#121212', card: '#1e1e1e', text: '#e0e0e0', border: '#333' },
};
const AppLightTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: '#f0f2f5', card: '#fff', text: '#1a1a2e', border: '#e0e0e0' },
};

function OfflineBanner({ isOffline }) {
  if (!isOffline) return null;
  return (
    <View style={bs.container}>
      <Text style={bs.text}>⚠️ Tidak ada koneksi internet</Text>
    </View>
  );
}
const bs = StyleSheet.create({
  container: { backgroundColor: '#d32f2f', paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center', zIndex: 999 },
  text: { color: '#fff', fontSize: 13, fontWeight: '600' },
});

function AppInner() {
  const { isDark } = useTheme();
  const [initialRoute, setInitialRoute] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const loggedIn = await SecureStore.getItemAsync('user_logged_in');
        setInitialRoute(loggedIn === 'true' ? 'Home' : 'Welcome');
      } catch { setInitialRoute('Welcome'); }
    })();
  }, []);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((s) => setIsOffline(!s.isConnected));
    return () => unsub();
  }, []);

  if (!initialRoute) return null;

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#0a0e1a' : '#1a237e' }}>
      <OfflineBanner isOffline={isOffline} />
      <NavigationContainer theme={isDark ? AppDarkTheme : AppLightTheme}>
        <Stack.Navigator initialRouteName={initialRoute}>
          <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Presensi" component={PresensiScreen} options={{
            title: 'Presensi',
            headerStyle: { backgroundColor: isDark ? '#004d40' : '#00838f' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold', fontSize: 17 },
            headerBackTitle: 'Kembali',
            animation: 'slide_from_right',
          }} />
          <Stack.Screen name="Jasa" component={JasaScreen} options={{
            title: 'Jasa Akademik',
            headerStyle: { backgroundColor: isDark ? '#1a1a2e' : '#1a237e' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold', fontSize: 17 },
            headerBackTitle: 'Kembali',
            animation: 'slide_from_bottom',
          }} />
          <Stack.Screen name="Service" component={ServiceScreen} options={({ route }) => {
            const service = SERVICES[route.params?.serviceKey] || {};
            return {
              title: route.params?.title || service.title || 'Layanan',
              headerStyle: { backgroundColor: isDark ? '#1a1a2e' : (service.color || '#1a237e') },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold', fontSize: 17 },
              headerBackTitle: 'Kembali',
              animation: 'slide_from_right',
            };
          }} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
