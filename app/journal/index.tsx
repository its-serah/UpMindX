import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  Animated,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useJournalStore, useXPStore } from '@/lib/store';
import { calculateTaskXP } from '@/lib/utils/xp';

type Mood = 'positive' | 'neutral' | 'negative';

export default function JournalScreen() {
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<Mood>('neutral');
  const [isSaving, setIsSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  
  const addEntry = useJournalStore(state => state.addEntry);
  const addXP = useXPStore(state => state.addXP);
  
  const saveAnim = useRef(new Animated.Value(0)).current;
  const textInputRef = useRef<TextInput>(null);

  const moods = [
    { 
      id: 'positive' as Mood, 
      emoji: '😊', 
      label: 'Good', 
      color: '#4CAF50',
      description: 'Feeling positive, happy, or energetic'
    },
    { 
      id: 'neutral' as Mood, 
      emoji: '😐', 
      label: 'Okay', 
      color: '#FF9800',
      description: 'Feeling calm, balanced, or neutral'
    },
    { 
      id: 'negative' as Mood, 
      emoji: '😔', 
      label: 'Tough', 
      color: '#E91E63',
      description: 'Feeling stressed, tired, or challenging'
    },
  ];

  const prompts = [
    "What's on your mind right now?",
    "How are you feeling about your progress today?",
    "What challenged you today and how did you handle it?",
    "What are you grateful for in this moment?",
    "What would make tomorrow better than today?",
    "What thoughts are taking up mental space?",
    "What small win can you celebrate today?",
    "How did you grow or learn something new recently?",
  ];

  const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

  const handleTextChange = (text: string) => {
    setContent(text);
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    setWordCount(words);
  };

  const handleMoodSelect = (mood: Mood) => {
    setSelectedMood(mood);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = async () => {
    if (content.trim().length < 10) {
      Alert.alert(
        'Add more content',
        'Please write at least a few words to save your journal entry.'
      );
      return;
    }

    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animation
    Animated.sequence([
      Animated.timing(saveAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(saveAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Save to store
    addEntry(content.trim(), selectedMood, []);
    
    // Award XP for journaling
    const xpEarned = calculateTaskXP('journal', 'easy');
    addXP('confidence', xpEarned);

    setTimeout(() => {
      Alert.alert(
        '✨ Journal Saved!',
        `Great work taking time to reflect. You earned +${xpEarned} Confidence XP!`,
        [
          {
            text: 'Continue Writing',
            style: 'cancel',
            onPress: () => {
              setContent('');
              setSelectedMood('neutral');
              setWordCount(0);
              textInputRef.current?.focus();
            },
          },
          {
            text: 'Done for now',
            onPress: () => router.back(),
          },
        ]
      );
      setIsSaving(false);
    }, 600);
  };

  const handlePromptPress = () => {
    const currentText = content.trim();
    const promptText = currentText ? `\n\n${randomPrompt} ` : `${randomPrompt} `;
    setContent(currentText + promptText);
    textInputRef.current?.focus();
    
    // Move cursor to end
    setTimeout(() => {
      textInputRef.current?.setSelection(
        content.length + promptText.length,
        content.length + promptText.length
      );
    }, 100);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <IconSymbol name="xmark" size={24} color="#666" />
        </Pressable>
        <Text style={styles.headerTitle}>Brain Dump</Text>
        <Pressable
          style={[styles.saveButton, isSaving && styles.saveButtonSaving]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Animated.View style={{ transform: [{ scale: saveAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.2]
          }) }] }}>
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </Animated.View>
        </Pressable>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Mood Selector */}
        <View style={styles.moodSection}>
          <Text style={styles.sectionTitle}>How are you feeling?</Text>
          <View style={styles.moodSelector}>
            {moods.map((mood) => (
              <Pressable
                key={mood.id}
                style={[
                  styles.moodOption,
                  selectedMood === mood.id && styles.moodOptionSelected,
                  { borderColor: mood.color }
                ]}
                onPress={() => handleMoodSelect(mood.id)}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={[
                  styles.moodLabel,
                  selectedMood === mood.id && styles.moodLabelSelected
                ]}>
                  {mood.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Writing Area */}
        <View style={styles.writingSection}>
          <View style={styles.writingHeader}>
            <Text style={styles.sectionTitle}>What's on your mind?</Text>
            <Text style={styles.wordCount}>{wordCount} words</Text>
          </View>
          
          <TextInput
            ref={textInputRef}
            style={styles.textInput}
            placeholder="Let your thoughts flow freely... No judgment, just pure expression."
            placeholderTextColor="#999"
            multiline
            value={content}
            onChangeText={handleTextChange}
            maxLength={2000}
            autoFocus
            textAlignVertical="top"
          />
        </View>

        {/* Prompt Suggestion */}
        <View style={styles.promptSection}>
          <Pressable
            style={styles.promptButton}
            onPress={handlePromptPress}
          >
            <IconSymbol name="lightbulb.fill" size={20} color="#FF9800" />
            <View style={styles.promptContent}>
              <Text style={styles.promptTitle}>Need a prompt?</Text>
              <Text style={styles.promptText}>{randomPrompt}</Text>
            </View>
          </Pressable>
        </View>

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 Journaling Tips</Text>
          <View style={styles.tipsList}>
            <Text style={styles.tip}>• Write whatever comes to mind - no editing needed</Text>
            <Text style={styles.tip}>• Focus on your feelings, not just events</Text>
            <Text style={styles.tip}>• This is your safe space - be honest</Text>
            <Text style={styles.tip}>• Even 2-3 sentences can be powerful</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonSaving: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  content: {
    padding: 20,
  },
  moodSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  moodSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  moodOption: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  moodOptionSelected: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  moodLabelSelected: {
    color: '#333',
  },
  writingSection: {
    marginBottom: 30,
  },
  writingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  wordCount: {
    fontSize: 14,
    color: '#666',
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    color: '#333',
    minHeight: 200,
    textAlignVertical: 'top',
    lineHeight: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  promptSection: {
    marginBottom: 30,
  },
  promptButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  promptContent: {
    flex: 1,
  },
  promptTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  promptText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  tipsSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  tipsList: {
    gap: 8,
  },
  tip: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
