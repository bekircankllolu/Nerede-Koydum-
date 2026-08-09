import React from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colors } from './src/theme';
import { DepoProvider, useDepo } from './src/state/DepoContext';
import { Spinner } from './src/components/common';
import TabBar from './src/components/TabBar';
import Toast from './src/components/Toast';
import FindScreen from './src/screens/FindScreen';
import ItemsScreen from './src/screens/ItemsScreen';
import LostItemsScreen from './src/screens/LostItemsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import DetailScreen from './src/screens/DetailScreen';
import ItemFormScreen from './src/screens/ItemFormScreen';
import MoveSheet from './src/screens/MoveSheet';
import FoundSheet from './src/screens/FoundSheet';
import VoicePanel from './src/screens/VoicePanel';
import PaywallScreen from './src/screens/PaywallScreen';
import PrivacyScreen from './src/screens/PrivacyScreen';
import HelpScreen from './src/screens/HelpScreen';

function Root() {
  const {
    booting, screen, showOnboarding, selected, formOpen, moveOpen, foundSheetOpen,
    voiceTarget, paywall, privacyOpen, helpOpen,
  } = useDepo();

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

      {/* The tab screens draw to the top of the window, so without this the
          status bar sits on top of each screen's title. */}
      <SafeAreaView style={styles.base} edges={['top']}>
        {screen === 'find' && <FindScreen />}
        {screen === 'items' && <ItemsScreen />}
        {screen === 'lost' && <LostItemsScreen />}
        {screen === 'settings' && <SettingsScreen />}
        <TabBar />
      </SafeAreaView>

      {selected && <DetailScreen />}
      {formOpen && <ItemFormScreen />}
      {moveOpen && <MoveSheet />}
      {foundSheetOpen && <FoundSheet />}
      {voiceTarget && <VoicePanel />}
      {paywall && <PaywallScreen />}
      {privacyOpen && <PrivacyScreen />}
      {helpOpen && <HelpScreen />}
      {showOnboarding && <OnboardingScreen />}

      <Toast />
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <DepoProvider>
          <Root />
        </DepoProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  app: { flex: 1, backgroundColor: colors.appBg },
  base: { flex: 1 },
  bootWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.appBg },
});
