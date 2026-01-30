import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/app/AppNavigator';

import { initDatabase } from './src/data/local/db';
import { View, ActivityIndicator } from 'react-native';

export default function App() {
  const [isDbReady, setIsDbReady] = React.useState(false);

  React.useEffect(() => {
    initDatabase();
    setIsDbReady(true);
  }, []);

  if (!isDbReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0B1020', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

