import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSessionStore, useXPStore } from '@/lib/store';
import { calculateTaskXP } from '@/lib/utils/xp';

type SessionPhase = 'breathing' | 'focus' | 'break' | 'completed';

export default function PomodoroSessionScreen() {
  const [phase, setPhase] = useState<SessionPhase>('breathing');
  const [timeRemaining, setTimeRemaining] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathCount, setBreathCount] = useState(0);
  
  const completeSession = useSessionStore(state => state.completeSession);
  const addXP = useXPStore(state => state.addXP);
  
  // Animations
  const breathScale = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Breathing animation cycle
  useEffect(() => {
    if (phase === 'breathing') {
      startBreathingCycle();
    }
  }, [phase]);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining]);

  // Progress animation
  useEffect(() => {
    if (phase === 'focus') {
      const totalTime = 25 * 60;
      const progress = (totalTime - timeRemaining) / totalTime;
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [timeRemaining, phase]);

  const startBreathingCycle = () => {
    let currentBreathCount = 0;
    const cycleBreathing = () => {
      // Inhale (4 seconds)
      setBreathPhase('inhale');
      Animated.timing(breathScale, {
        toValue: 1.3,
        duration: 4000,
        useNativeDriver: true,
      }).start(() => {
        // Hold (4 seconds)
        setBreathPhase('hold');
        setTimeout(() => {
          // Exhale (6 seconds)
          setBreathPhase('exhale');
          Animated.timing(breathScale, {
            toValue: 1,
            duration: 6000,
            useNativeDriver: true,
          }).start(() => {
            currentBreathCount++;
            setBreathCount(currentBreathCount);
            
            if (currentBreathCount < 4) {
              setTimeout(cycleBreathing, 1000);
            } else {
              // Breathing complete, transition to focus
              setTimeout(() => {
                setPhase('focus');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }, 1000);
            }
          });
        }, 4000);
      });
    };
    
    cycleBreathing();
  };

  const handleTimerComplete = () => {
    setIsRunning(false);
    setPhase('completed');
    
    // Celebrate with haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Pulse animation
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.2,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Update stores
    completeSession(25);
    const xpEarned = calculateTaskXP('pomodoro', 'medium');
    addXP('confidence', xpEarned);
  };

  const startFocusSession = () => {
    setIsRunning(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const pauseSession = () => {
    setIsRunning(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const resetSession = () => {
    Alert.alert(
      'Reset Session?',
      'This will cancel your current focus session.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setIsRunning(false);
            setTimeRemaining(25 * 60);
            setPhase('breathing');
            setBreathCount(0);
            progressAnim.setValue(0);
            breathScale.setValue(1);
          },
        },
      ]
    );
  };

  const finishSession = () => {
    router.back();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getBreathingInstruction = () => {
    switch (breathPhase) {
      case 'inhale': return 'Breathe In';
      case 'hold': return 'Hold';
      case 'exhale': return 'Breathe Out';
      default: return 'Breathe';
    }
  };

  if (phase === 'breathing') {
    return (
      <SafeAreaView style={[styles.container, styles.breathingContainer]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <IconSymbol name="xmark" size={24} color="white" />
          </Pressable>
        </View>

        <View style={styles.breathingContent}>
          <Text style={styles.breathingTitle}>Prepare Your Mind</Text>
          <Text style={styles.breathingSubtitle}>
            Take 4 deep breaths before we begin your focus session
          </Text>

          <View style={styles.breathingVisual}>
            <Animated.View 
              style={[
                styles.breathingCircle,
                { transform: [{ scale: breathScale }] }
              ]}
            >
              <Text style={styles.breathingText}>{getBreathingInstruction()}</Text>
            </Animated.View>
          </View>

          <View style={styles.breathCounter}>
            <Text style={styles.breathCountText}>{breathCount}/4</Text>
            <Text style={styles.breathCountLabel}>Deep Breaths</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'focus') {    
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={resetSession}>
            <IconSymbol name="arrow.left" size={24} color="#666" />
          </Pressable>
          <Text style={styles.headerTitle}>Focus Session</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.timerContainer}>
          <View style={styles.progressRing}>
            <View style={styles.timerInner}>
              <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
              <Text style={styles.timerLabel}>Focus Time</Text>
            </View>
          </View>
        </View>

        <View style={styles.controls}>
          {isRunning ? (
            <Pressable style={styles.pauseButton} onPress={pauseSession}>
              <IconSymbol name="pause.fill" size={32} color="white" />
              <Text style={styles.controlButtonText}>Pause</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.playButton} onPress={startFocusSession}>
              <IconSymbol name="play.fill" size={32} color="white" />
              <Text style={styles.controlButtonText}>Start</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.motivationContainer}>
          <Text style={styles.motivationText}>"Focus is your superpower."</Text>
          <Text style={styles.motivationSubtext}>Every minute of focus builds your mental strength</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'completed') {
    return (
      <SafeAreaView style={[styles.container, styles.completedContainer]}>
        <Animated.View 
          style={[styles.completedContent, { transform: [{ scale: pulseAnim }] }]}
        >
          <View style={styles.celebrationIcon}>
            <IconSymbol name="checkmark.circle.fill" size={80} color="#4CAF50" />
          </View>
          
          <Text style={styles.completedTitle}>🎉 Session Complete!</Text>
          <Text style={styles.completedSubtitle}>
            You just completed 25 minutes of focused work.
            Your mind is stronger than ever!
          </Text>

          <View style={styles.rewardsContainer}>
            <View style={styles.rewardItem}>
              <IconSymbol name="star.fill" size={24} color="#FFD700" />
              <Text style={styles.rewardText}>+15 Confidence XP</Text>
            </View>
            <View style={styles.rewardItem}>
              <IconSymbol name="flame.fill" size={24} color="#FF5722" />
              <Text style={styles.rewardText}>Focus Streak +1</Text>
            </View>
          </View>

          <Pressable style={styles.finishButton} onPress={finishSession}>
            <Text style={styles.finishButtonText}>Continue Growing</Text>
            <IconSymbol name="arrow.right" size={20} color="white" />
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  breathingContainer: {
    backgroundColor: '#2196F3',
  },
  completedContainer: {
    backgroundColor: '#E8F5E8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  breathingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  breathingTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  breathingSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 60,
    lineHeight: 24,
  },
  breathingVisual: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 60,
  },
  breathingCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  breathingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  breathCounter: {
    alignItems: 'center',
  },
  breathCountText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
  },
  breathCountLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  timerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRing: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  timerInner: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
  },
  timerLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  controls: {
    alignItems: 'center',
    padding: 40,
  },
  playButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  pauseButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  controlButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  motivationContainer: {
    alignItems: 'center',
    padding: 20,
  },
  motivationText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  motivationSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  completedContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  celebrationIcon: {
    marginBottom: 30,
  },
  completedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  completedSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  rewardsContainer: {
    gap: 16,
    marginBottom: 40,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rewardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  finishButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  finishButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});
