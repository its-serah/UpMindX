import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LoadingSpinner, SkeletonLoader } from '@/components/ui/loading-states';
import { Colors, Spacing, BorderRadius, Animations } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { 
  useXPStore, 
  useSessionStore, 
  useTaskStore, 
  useJournalStore 
} from '@/lib/store';

const { width: screenWidth } = Dimensions.get('window');

interface DashboardStats {
  totalXP: number;
  currentStreak: number;
  sessionsToday: number;
  tasksCompleted: number;
  journalEntries: number;
}

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  route: string;
  color: string;
  gradient: string[];
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'techtok',
    title: 'Learn',
    subtitle: 'Watch TechTok videos',
    icon: 'play.rectangle.fill',
    route: '/techtok',
    color: '#6366F1',
    gradient: ['#6366F1', '#8B5CF6'],
  },
  {
    id: 'focus',
    title: 'Focus',
    subtitle: 'Start a session',
    icon: 'timer',
    route: '/pomodoro/session',
    color: '#FF6B35',
    gradient: ['#FF6B35', '#F59E0B'],
  },
  {
    id: 'chill',
    title: 'Chill',
    subtitle: 'Relax & recharge',
    icon: 'leaf.fill',
    route: '/chill',
    color: '#4CAF50',
    gradient: ['#4CAF50', '#22C55E'],
  },
  {
    id: 'journal',
    title: 'Journal',
    subtitle: 'Reflect & write',
    icon: 'book.fill',
    route: '/journal/index',
    color: '#9C27B0',
    gradient: ['#9C27B0', '#8B5CF6'],
  },
];

interface UserDashboardProps {
  onNavigateToFeed?: () => void;
}

export default function UserDashboard({ onNavigateToFeed }: UserDashboardProps = {}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [isLoading, setIsLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [stats, setStats] = useState<DashboardStats>({
    totalXP: 0,
    currentStreak: 0,
    sessionsToday: 0,
    tasksCompleted: 0,
    journalEntries: 0,
  });
  
  // Store hooks
  const xpStore = useXPStore();
  const sessionStore = useSessionStore();
  const taskStore = useTaskStore();
  const journalStore = useJournalStore();
  
  // Animations
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadDashboardData();
    setGreeting(getTimeBasedGreeting());
    
    // Animate entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: Animations.slow.duration,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: Animations.spring.tension,
        friction: Animations.spring.friction,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Simulate loading delay for smooth UX
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const dashboardStats: DashboardStats = {
        totalXP: xpStore.totalXP,
        currentStreak: sessionStore.currentStreak,
        sessionsToday: sessionStore.getTodaySessionCount(),
        tasksCompleted: taskStore.getTasksCompletedToday(),
        journalEntries: journalStore.getStreakDays(),
      };
      
      setStats(dashboardStats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeBasedGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning! ☀️';
    if (hour < 17) return 'Good afternoon! 🌤️';
    return 'Good evening! 🌙';
  };

  const handleQuickAction = (action: QuickAction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (action.id === 'techtok') {
      onNavigateToFeed?.();
    } else {
      router.push(action.route as any);
    }
  };

  const navigateToTechTokFeed = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNavigateToFeed?.();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" color={colors.primary} message="Loading your progress..." />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.ScrollView 
        style={[styles.scrollView, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.text }]}>{greeting}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Ready to level up your skills?
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Total XP"
            value={stats.totalXP.toLocaleString()}
            icon="star.fill"
            color={colors.primary}
            backgroundColor={colors.surface}
          />
          <StatCard
            title="Day Streak"
            value={stats.currentStreak.toString()}
            icon="flame.fill"
            color="#FF6B35"
            backgroundColor={colors.surface}
          />
        </View>

        <View style={styles.statsContainer}>
          <StatCard
            title="Today's Sessions"
            value={stats.sessionsToday.toString()}
            icon="timer"
            color={colors.success}
            backgroundColor={colors.surface}
          />
          <StatCard
            title="Tasks Done"
            value={stats.tasksCompleted.toString()}
            icon="checkmark.circle.fill"
            color="#9C27B0"
            backgroundColor={colors.surface}
          />
        </View>

        {/* Progress Section */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Progress</Text>
          
          <View style={styles.progressContainer}>
            <ProgressBar
              label="Resilience"
              current={xpStore.resilience.current}
              level={xpStore.resilience.level}
              color={colors.primary}
            />
            <ProgressBar
              label="Confidence"
              current={xpStore.confidence.current}
              level={xpStore.confidence.level}
              color={colors.success}
            />
            <ProgressBar
              label="Interview Skills"
              current={xpStore.interview.current}
              level={xpStore.interview.level}
              color="#FF6B35"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          
          <View style={styles.quickActionsGrid}>
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.id}
                style={[styles.quickActionCard, { backgroundColor: colors.background }]}
                onPress={() => handleQuickAction(action)}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                  <IconSymbol name={action.icon} size={24} color="white" />
                </View>
                <Text style={[styles.quickActionTitle, { color: colors.text }]}>
                  {action.title}
                </Text>
                <Text style={[styles.quickActionSubtitle, { color: colors.textSecondary }]}>
                  {action.subtitle}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Continue Learning CTA */}
        <Pressable
          style={[styles.ctaButton, { backgroundColor: colors.primary }]}
          onPress={navigateToTechTokFeed}
        >
          <View style={styles.ctaContent}>
            <View>
              <Text style={styles.ctaTitle}>Continue Learning</Text>
              <Text style={styles.ctaSubtitle}>Jump back into TechTok videos</Text>
            </View>
            <IconSymbol name="arrow.right.circle.fill" size={32} color="white" />
          </View>
        </Pressable>

        <View style={styles.bottomSpacing} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
  backgroundColor: string;
}

function StatCard({ title, value, icon, color, backgroundColor }: StatCardProps) {
  return (
    <View style={[styles.statCard, { backgroundColor }]}>
      <View style={styles.statHeader}>
        <IconSymbol name={icon} size={20} color={color} />
        <Text style={[styles.statTitle, { color: Colors.light.textSecondary }]}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color: Colors.light.text }]}>{value}</Text>
    </View>
  );
}

interface ProgressBarProps {
  label: string;
  current: number;
  level: number;
  color: string;
}

function ProgressBar({ label, current, level, color }: ProgressBarProps) {
  const nextLevelXP = level * 100;
  const progress = (current % 100) / 100;

  return (
    <View style={styles.progressItem}>
      <View style={styles.progressHeader}>
        <Text style={[styles.progressLabel, { color: Colors.light.text }]}>{label}</Text>
        <Text style={[styles.progressLevel, { color: Colors.light.textSecondary }]}>
          Level {level}
        </Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarBackground, { backgroundColor: Colors.light.border }]}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                backgroundColor: color,
                width: `${progress * 100}%` 
              }
            ]} 
          />
        </View>
        <Text style={[styles.progressText, { color: Colors.light.textSecondary }]}>
          {current % 100}/{100}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    margin: Spacing.lg,
    marginTop: 0,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: Spacing.lg,
  },
  progressContainer: {
    gap: Spacing.lg,
  },
  progressItem: {
    gap: Spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressLevel: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 40,
    textAlign: 'right',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  quickActionCard: {
    width: (screenWidth - Spacing.lg * 4) / 2,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  quickActionSubtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  ctaButton: {
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  ctaContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: Spacing.xs,
  },
  ctaSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  bottomSpacing: {
    height: Spacing.xl,
  },
});
