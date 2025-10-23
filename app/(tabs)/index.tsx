import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import TechTokFeed from '@/components/TechTokFeed';
import UserDashboard from '@/components/UserDashboard';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [viewMode, setViewMode] = useState<'dashboard' | 'feed'>('dashboard');

  const toggleView = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewMode(prev => prev === 'dashboard' ? 'feed' : 'dashboard');
  };

  return (
    <>
      <StatusBar style={viewMode === 'feed' ? 'light' : 'auto'} backgroundColor={viewMode === 'feed' ? '#000' : colors.background} />
      
      {viewMode === 'dashboard' ? (
        <>
          <UserDashboard onNavigateToFeed={toggleView} />
          
          {/* Floating Action Button to switch to TechTok */}
          <Pressable 
            style={[styles.fab, { backgroundColor: colors.primary }]}
            onPress={toggleView}
          >
            <IconSymbol name="play.rectangle.fill" size={24} color="white" />
          </Pressable>
        </>
      ) : (
        <>
          <TechTokFeed />
          
          {/* Back to Dashboard Button */}
          <Pressable 
            style={[styles.backButton, { backgroundColor: 'rgba(0,0,0,0.7)' }]}
            onPress={toggleView}
          >
            <IconSymbol name="house.fill" size={20} color="white" />
          </Pressable>
        </>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 90, // Above tab bar
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
