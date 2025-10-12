import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ChillScreen() {
  const features = [
    {
      id: 'pomodoro',
      title: 'Focus Sprints',
      description: 'Structured Pomodoro sessions with breathing intro',
      icon: 'timer',
      route: '/pomodoro/session',
      color: '#4CAF50'
    },
    {
      id: 'breath',
      title: 'Breathe',
      description: 'Animated breathing exercises with haptic feedback',
      icon: 'lungs.fill',
      route: '/breath',
      color: '#2196F3'
    },
    {
      id: 'sounds',
      title: 'Soundscape',
      description: 'ASMR and ambient sounds for focus',
      icon: 'speaker.wave.3.fill',
      route: '/sounds',
      color: '#9C27B0'
    },
    {
      id: 'journal',
      title: 'Brain Dump',
      description: 'Quick journal for clearing your mind',
      icon: 'book.fill',
      route: '/journal/index',
      color: '#FF9800'
    },
    {
      id: 'garden',
      title: 'Focus Garden',
      description: 'Watch your garden grow with each session',
      icon: 'leaf.fill',
      route: '/garden',
      color: '#4CAF50'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Chill Zone</Text>
          <Text style={styles.subtitle}>Reset your mind, refocus your energy</Text>
        </View>

        <View style={styles.grid}>
          {features.map((feature) => (
            <Pressable
              key={feature.id}
              style={[styles.card, { borderLeftColor: feature.color }]}
              onPress={() => router.push(feature.route as any)}
            >
              <View style={styles.cardContent}>
                <View style={[styles.iconContainer, { backgroundColor: feature.color + '20' }]}>
                  <IconSymbol 
                    name={feature.icon as any} 
                    size={32} 
                    color={feature.color} 
                  />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.cardTitle}>{feature.title}</Text>
                  <Text style={styles.cardDescription}>{feature.description}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  grid: {
    gap: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
