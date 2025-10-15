import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useXPStore } from '@/lib/store';
import { calculateTaskXP } from '@/lib/utils/xp';

type BreathingTechnique = {
  id: string;
  name: string;
  description: string;
  pattern: { inhale: number; hold: number; exhale: number; rest?: number };
  cycles: number;
  color: string;
};

const BREATHING_TECHNIQUES: BreathingTechnique[] = [
  {
    id: 'box',
    name: '4-7-8 Breathing',
    description: 'Proven technique to reduce anxiety and promote sleep',
    pattern: { inhale: 4, hold: 7, exhale: 8 },
    cycles: 4,
    color: '#2196F3'
  },
  {
    id: 'box_breathing',
    name: 'Box Breathing',
    description: 'Navy SEAL technique for stress management',
    pattern: { inhale: 4, hold: 4, exhale: 4, rest: 4 },
    cycles: 5,
    color: '#4CAF50'
  },
  {
    id: 'wim_hof',
    name: 'Energy Breathing',
    description: 'Energizing breath work for focus and alertness',
    pattern: { inhale: 2, hold: 0, exhale: 1 },
    cycles: 8,
    color: '#FF6B35'
  }
];

type BreathingPhase = 'inhale' | 'hold' | 'exhale' | 'rest';

export default function BreathingScreen() {
  const [selectedTechnique, setSelectedTechnique] = useState<BreathingTechnique | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<BreathingPhase>('inhale');
  const [cycleCount, setCycleCount] = useState(0);
  const [phaseTimeRemaining, setPhaseTimeRemaining] = useState(0);
  
  const addXP = useXPStore(state => state.addXP);
  
  // Animations
  const breathScale = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cycleRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (cycleRef.current) clearTimeout(cycleRef.current);
    };
  }, []);

  const startBreathingSession = (technique: BreathingTechnique) => {
    setSelectedTechnique(technique);
    setIsActive(true);
    setCycleCount(0);
    setCurrentPhase('inhale');
    startBreathingCycle(technique);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const startBreathingCycle = (technique: BreathingTechnique) => {
    const runPhase = (phase: BreathingPhase, duration: number) => {
      setCurrentPhase(phase);
      setPhaseTimeRemaining(duration);
      
      // Animate breathing circle based on phase
      const targetScale = phase === 'inhale' ? 1.4 : phase === 'exhale' ? 0.7 : 1.1;
      Animated.timing(breathScale, {
        toValue: targetScale,
        duration: duration * 1000,
        useNativeDriver: true,
      }).start();

      // Countdown timer for phase
      const countdown = setInterval(() => {
        setPhaseTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(countdown);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Schedule next phase
      cycleRef.current = setTimeout(() => {
        clearInterval(countdown);
        proceedToNextPhase(technique);
      }, duration * 1000);
    };

    const proceedToNextPhase = (tech: BreathingTechnique) => {
      if (currentPhase === 'inhale' && tech.pattern.hold > 0) {
        runPhase('hold', tech.pattern.hold);
      } else if ((currentPhase === 'inhale' && tech.pattern.hold === 0) || currentPhase === 'hold') {
        runPhase('exhale', tech.pattern.exhale);
      } else if (currentPhase === 'exhale' && tech.pattern.rest) {
        runPhase('rest', tech.pattern.rest);
      } else {
        // Cycle complete
        const newCycleCount = cycleCount + 1;
        setCycleCount(newCycleCount);
        
        if (newCycleCount >= tech.cycles) {
          completeSession();
        } else {
          // Start next cycle
          setCurrentPhase('inhale');
          setTimeout(() => runPhase('inhale', tech.pattern.inhale), 1000);
        }
      }
    };

    // Start first phase
    runPhase('inhale', technique.pattern.inhale);
  };

  const completeSession = () => {
    setIsActive(false);
    
    // Celebration animation
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

    // Award XP
    const xpEarned = calculateTaskXP('breathing', 'medium');
    addXP('confidence', xpEarned);
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const stopSession = () => {
    setIsActive(false);
    setSelectedTechnique(null);
    if (timerRef.current) clearInterval(timerRef.current);
    if (cycleRef.current) clearTimeout(cycleRef.current);
    breathScale.setValue(1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const getPhaseInstruction = () => {
    switch (currentPhase) {
      case 'inhale': return 'Breathe In';
      case 'hold': return 'Hold';
      case 'exhale': return 'Breathe Out';
      case 'rest': return 'Rest';
      default: return 'Breathe';
    }
  };

  if (selectedTechnique && isActive) {
    return (
      <SafeAreaView style={[styles.container, styles.activeContainer]}>
        <View style={styles.header}>
          <Pressable onPress={stopSession}>
            <IconSymbol name="xmark" size={24} color="white" />
          </Pressable>
          <Text style={styles.activeTitle}>{selectedTechnique.name}</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.breathingContent}>
          <View style={styles.progressContainer}>
            <Text style={styles.cycleText}>
              {cycleCount + 1} / {selectedTechnique.cycles}
            </Text>
            <Text style={styles.cycleLabel}>Cycles</Text>
          </View>

          <Animated.View 
            style={[
              styles.breathingCircle,
              { 
                backgroundColor: selectedTechnique.color + '30',
                borderColor: selectedTechnique.color,
                transform: [{ scale: breathScale }]
              }
            ]}
          >
            <Text style={[styles.instructionText, { color: selectedTechnique.color }]}>
              {getPhaseInstruction()}
            </Text>
            <Text style={styles.timerText}>{phaseTimeRemaining}s</Text>
          </Animated.View>

          <View style={styles.phaseIndicators}>
            {['inhale', 'hold', 'exhale', selectedTechnique.pattern.rest && 'rest'].filter(Boolean).map((phase) => (
              <View
                key={phase}
                style={[
                  styles.phaseIndicator,
                  currentPhase === phase && styles.activePhaseIndicator,
                  { borderColor: selectedTechnique.color }
                ]}
              >
                <Text style={[
                  styles.phaseText,
                  currentPhase === phase && { color: selectedTechnique.color }
                ]}>
                  {phase?.charAt(0).toUpperCase() + phase?.slice(1)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (selectedTechnique && !isActive) {
    return (
      <SafeAreaView style={[styles.container, styles.completedContainer]}>
        <Animated.View style={[styles.completedContent, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.celebrationIcon}>
            <IconSymbol name="checkmark.circle.fill" size={80} color="#4CAF50" />
          </View>
          
          <Text style={styles.completedTitle}>🧘‍♀️ Session Complete!</Text>
          <Text style={styles.completedSubtitle}>
            You completed {selectedTechnique.cycles} cycles of {selectedTechnique.name}.{'\n'}
            Your mind is calmer and more focused!
          </Text>

          <View style={styles.rewardItem}>
            <IconSymbol name="star.fill" size={24} color="#FFD700" />
            <Text style={styles.rewardText}>+{calculateTaskXP('breathing', 'medium')} Confidence XP</Text>
          </View>

          <Pressable 
            style={styles.finishButton} 
            onPress={() => {
              setSelectedTechnique(null);
              router.back();
            }}
          >
            <Text style={styles.finishButtonText}>Continue Growing</Text>
            <IconSymbol name="arrow.right" size={20} color="white" />
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={24} color="#333" />
        </Pressable>
        <Text style={styles.headerTitle}>Breathing Exercises</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Reset Your Mind</Text>
        <Text style={styles.subtitle}>
          Choose a breathing technique to calm your nervous system and improve focus
        </Text>

        <View style={styles.techniquesList}>
          {BREATHING_TECHNIQUES.map((technique) => (
            <Pressable
              key={technique.id}
              style={[styles.techniqueCard, { borderLeftColor: technique.color }]}
              onPress={() => startBreathingSession(technique)}
            >
              <View style={styles.techniqueContent}>
                <View style={[styles.techniqueIcon, { backgroundColor: technique.color + '20' }]}>
                  <IconSymbol name="lungs.fill" size={28} color={technique.color} />
                </View>
                <View style={styles.techniqueInfo}>
                  <Text style={styles.techniqueName}>{technique.name}</Text>
                  <Text style={styles.techniqueDescription}>{technique.description}</Text>
                  <View style={styles.patternInfo}>
                    <Text style={styles.patternText}>
                      {technique.pattern.inhale}s in • {technique.pattern.hold}s hold • {technique.pattern.exhale}s out
                      {technique.pattern.rest && ` • ${technique.pattern.rest}s rest`}
                    </Text>
                    <Text style={styles.cyclesText}>{technique.cycles} cycles</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  activeContainer: {
    backgroundColor: '#1E3A8A',
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
  activeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  techniquesList: {
    gap: 16,
  },
  techniqueCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  techniqueContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  techniqueIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  techniqueInfo: {
    flex: 1,
  },
  techniqueName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  techniqueDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  patternInfo: {
    gap: 4,
  },
  patternText: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'monospace',
  },
  cyclesText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  breathingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  cycleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  cycleLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  breathingCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    marginBottom: 40,
  },
  instructionText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
  },
  phaseIndicators: {
    flexDirection: 'row',
    gap: 12,
  },
  phaseIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  activePhaseIndicator: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  phaseText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
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
    marginBottom: 30,
    lineHeight: 24,
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
    marginBottom: 30,
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
