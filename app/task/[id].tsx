import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useXPStore } from '@/lib/store';
import { calculateTaskXP, getXPTypeFromTask, getMotivationalMessage } from '@/lib/utils/xp';

// Mock data for demo - in real app this would come from API or store
const mockTasks = {
  '1': {
    id: '1',
    type: 'interview',
    title: 'Practice: Tell me about yourself',
    content: 'Record a 2-minute elevator pitch about your background and goals. Focus on your unique value proposition.',
    xpReward: 25,
    difficulty: 'medium',
    category: 'Interview Prep',
    instructions: [
      'Set up a recording device (phone, computer)',
      'Practice your pitch out loud first',
      'Record yourself giving the full pitch',
      'Time yourself - aim for 1-2 minutes',
      'Review and note areas for improvement',
    ],
    prompts: [
      'What makes you unique in your field?',
      'What are your key achievements?',
      'What are your career goals?',
      'Why are you passionate about this work?',
    ],
  },
  '2': {
    id: '2',
    type: 'mindset',
    title: 'Confidence Boost',
    content: 'Write down 3 accomplishments from this week, no matter how small. Celebrate your progress.',
    xpReward: 15,
    difficulty: 'easy',
    category: 'Mindset',
    instructions: [
      'Think about your entire week',
      'Include both big and small wins',
      'Be specific about what you accomplished',
      'Write why each accomplishment matters',
      'Take a moment to feel proud',
    ],
    prompts: [
      'What did you complete this week?',
      'What new skills did you practice?',
      'What challenges did you overcome?',
      'How did you help others?',
    ],
  },
  // Add more tasks as needed
};

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [userInput, setUserInput] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));
  
  const addXP = useXPStore((state) => state.addXP);
  
  const task = mockTasks[id as keyof typeof mockTasks];

  if (!task) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Task not found</Text>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const getCardColor = (type: string) => {
    switch (type) {
      case 'interview': return '#2196F3';
      case 'mindset': return '#4CAF50';
      case 'rejection': return '#E91E63';
      case 'mini-task': return '#FF9800';
      default: return '#666';
    }
  };

  const handleComplete = async () => {
    if (userInput.trim().length < 20) {
      Alert.alert(
        'More details needed',
        'Please provide more details about your completion (at least 20 characters).'
      );
      return;
    }

    setIsCompleting(true);

    // Animate the completion
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

    // Calculate XP
    const xpType = getXPTypeFromTask(task.type);
    const xpAmount = calculateTaskXP(task.type as any, task.difficulty as any);
    
    // Add XP to store
    addXP(xpType, xpAmount);
    
    // Show success message
    const motivationalMsg = getMotivationalMessage(xpAmount);
    
    setTimeout(() => {
      Alert.alert(
        '🎉 Task Completed!',
        `${motivationalMsg}\n\n+${xpAmount} ${xpType.charAt(0).toUpperCase() + xpType.slice(1)} XP`,
        [
          {
            text: 'Continue Growing!',
            onPress: () => router.back(),
          },
        ]
      );
      setIsCompleting(false);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color="#666" />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </View>

        {/* Task Card */}
        <Animated.View 
          style={[
            styles.taskCard,
            { borderLeftColor: getCardColor(task.type) },
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <View style={styles.taskHeader}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{task.category}</Text>
            </View>
            <View style={styles.xpBadge}>
              <IconSymbol name="star.fill" size={16} color="#FFD700" />
              <Text style={styles.xpText}>+{task.xpReward} XP</Text>
            </View>
          </View>

          <Text style={styles.taskTitle}>{task.title}</Text>
          <Text style={styles.taskDescription}>{task.content}</Text>
        </Animated.View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Step-by-Step</Text>
          <View style={styles.instructionsList}>
            {task.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Prompts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Think About</Text>
          <View style={styles.promptsList}>
            {task.prompts.map((prompt, index) => (
              <View key={index} style={styles.promptItem}>
                <Text style={styles.promptBullet}>•</Text>
                <Text style={styles.promptText}>{prompt}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Completion Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ Your Completion</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Describe what you accomplished, what you learned, or how you felt..."
            placeholderTextColor="#999"
            multiline
            value={userInput}
            onChangeText={setUserInput}
            maxLength={500}
          />
          <Text style={styles.charCount}>{userInput.length}/500</Text>
        </View>

        {/* Complete Button */}
        <Pressable
          style={[
            styles.completeButton,
            { backgroundColor: getCardColor(task.type) },
            isCompleting && styles.buttonDisabled
          ]}
          onPress={handleComplete}
          disabled={isCompleting}
        >
          {isCompleting ? (
            <Text style={styles.completeButtonText}>Completing...</Text>
          ) : (
            <>
              <Text style={styles.completeButtonText}>Complete Task</Text>
              <IconSymbol name="checkmark.circle.fill" size={20} color="white" />
            </>
          )}
        </Pressable>
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
    marginBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: {
    fontSize: 16,
    color: '#666',
  },
  taskCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '600',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  xpText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  taskTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    lineHeight: 28,
  },
  taskDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  instructionsList: {
    gap: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  instructionText: {
    flex: 1,
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  promptsList: {
    gap: 12,
  },
  promptItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  promptBullet: {
    fontSize: 18,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  promptText: {
    flex: 1,
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
});
