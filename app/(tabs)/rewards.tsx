import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function RewardsScreen() {
  const xpData = {
    resilience: { current: 750, max: 1000, level: 3 },
    confidence: { current: 450, max: 800, level: 2 },
    interview: { current: 200, max: 500, level: 1 },
  };

  const streaks = {
    daily: 7,
    focus: 12,
    growth: 5,
  };

  const achievements = [
    { id: 1, title: 'First Steps', description: 'Complete your first growth task', earned: true, icon: 'star.fill', color: '#FFD700' },
    { id: 2, title: 'Focus Master', description: 'Complete 10 Pomodoro sessions', earned: true, icon: 'timer', color: '#4CAF50' },
    { id: 3, title: 'Resilience Builder', description: 'Reach Level 3 in Resilience XP', earned: true, icon: 'shield.fill', color: '#2196F3' },
    { id: 4, title: 'Interview Ace', description: 'Complete 50 interview drills', earned: false, icon: 'person.fill', color: '#9E9E9E' },
    { id: 5, title: 'Mindful Warrior', description: 'Journal for 30 days straight', earned: false, icon: 'book.fill', color: '#9E9E9E' },
  ];

  const XPBar = ({ title, current, max, level, color }: any) => {
    const progress = (current / max) * 100;
    return (
      <View style={styles.xpContainer}>
        <View style={styles.xpHeader}>
          <Text style={styles.xpTitle}>{title}</Text>
          <Text style={styles.xpLevel}>Level {level}</Text>
        </View>
        <View style={styles.xpBarBackground}>
          <View style={[styles.xpBarFill, { width: `${progress}%`, backgroundColor: color }]} />
        </View>
        <Text style={styles.xpText}>{current} / {max} XP</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Rewards</Text>
          <Text style={styles.subtitle}>Track your growth and celebrate wins</Text>
        </View>

        {/* XP Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience Points</Text>
          <XPBar title="Resilience XP" {...xpData.resilience} color="#E91E63" />
          <XPBar title="Confidence XP" {...xpData.confidence} color="#FF9800" />
          <XPBar title="Interview XP" {...xpData.interview} color="#2196F3" />
        </View>

        {/* Streaks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Streaks</Text>
          <View style={styles.streaksContainer}>
            <View style={styles.streakCard}>
              <IconSymbol name="flame.fill" size={32} color="#FF5722" />
              <Text style={styles.streakNumber}>{streaks.daily}</Text>
              <Text style={styles.streakLabel}>Day Streak</Text>
            </View>
            <View style={styles.streakCard}>
              <IconSymbol name="timer" size={32} color="#4CAF50" />
              <Text style={styles.streakNumber}>{streaks.focus}</Text>
              <Text style={styles.streakLabel}>Focus Sessions</Text>
            </View>
            <View style={styles.streakCard}>
              <IconSymbol name="arrow.up.circle.fill" size={32} color="#2196F3" />
              <Text style={styles.streakNumber}>{streaks.growth}</Text>
              <Text style={styles.streakLabel}>Growth Tasks</Text>
            </View>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievementsContainer}>
            {achievements.map((achievement) => (
              <View key={achievement.id} style={[
                styles.achievementCard,
                !achievement.earned && styles.achievementLocked
              ]}>
                <View style={[styles.achievementIcon, { backgroundColor: achievement.color + '20' }]}>
                  <IconSymbol 
                    name={achievement.icon as any} 
                    size={24} 
                    color={achievement.color} 
                  />
                </View>
                <View style={styles.achievementText}>
                  <Text style={[
                    styles.achievementTitle,
                    !achievement.earned && styles.lockedText
                  ]}>
                    {achievement.title}
                  </Text>
                  <Text style={[
                    styles.achievementDescription,
                    !achievement.earned && styles.lockedText
                  ]}>
                    {achievement.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
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
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  xpContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  xpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  xpLevel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  xpBarBackground: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  xpText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  streaksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  streakCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  streakNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  achievementsContainer: {
    gap: 12,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementLocked: {
    opacity: 0.6,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  achievementText: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  lockedText: {
    color: '#999',
  },
});
