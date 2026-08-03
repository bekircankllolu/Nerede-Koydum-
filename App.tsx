import React from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from './src/theme';
import { CekmeceProvider, useCekmece } from './src/state/CekmeceContext';
import { Spinner } from './src/components/common';
import TabBar from './src/components/TabBar';
import Toast from './src/components/Toast';
import FindScreen from './src/screens/FindScreen';
import ItemsScreen from './src/screens/ItemsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import DetailScreen from './src/screens/DetailScreen';
import AddItemScreen from './src/screens/AddItemScreen';
import MoveSheet from './src/screens/MoveSheet';
import VoicePanel from './src/screens/VoicePanel';
import PaywallScreen from './src/screens/PaywallScreen';

function Root() {
  const { booting, screen, showOnboarding, selected, addOpen, moveOpen, voiceTarget, paywall } = useCekmece();

  if (booting) {
    return (
      <View style={styles.bootWrap}>
        <Spinner />
      </View>
    );
  }

  return (
    <View style={styles.app}>
      <StatusBar style={paywall ? 'light' : 'dark'} />

      <View style={styles.base}>
        {screen === 'find' && <FindScreen />}
        {screen === 'items' && <ItemsScreen />}
        {screen === 'settings' && <SettingsScreen />}
        <TabBar />
      </View>

      {selected && <DetailScreen />}
      {addOpen && <AddItemScreen />}
      {moveOpen && <MoveSheet />}
      {voiceTarget && <VoicePanel />}
      {paywall && <PaywallScreen />}
      {showOnboarding && <OnboardingScreen />}

      <Toast />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <CekmeceProvider>
        <Root />
      </CekmeceProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.appBg },
  base: { flex: 1 },
  bootWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.appBg },
});
