import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useStore } from '../src/store/useStore';
import { colors } from '../src/theme';

export default function Index() {
  const { authState, user } = useStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Give time for checkAuth to complete
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Show loading while checking auth
  if (!isReady || authState === 'idle' || authState === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // If authenticated
  if (authState === 'authenticated' && user) {
    // Check if onboarding is complete
    if (!user.isOnboarded) {
      // Go to welcome page where user can choose to continue onboarding
      return <Redirect href="/(auth)/welcome" />;
    }
    // Go to dashboard
    return <Redirect href="/(tabs)" />;
  }

  // Otherwise, go to welcome
  return <Redirect href="/(auth)/welcome" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
