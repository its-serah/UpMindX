import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LoadingSpinner, PulseLoader } from '@/components/ui/loading-states';
import { Colors, Spacing, BorderRadius, Animations } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  useCoachStore,
  type CoachMessage,
  type CoachInsight,
  type UserContext,
  coachUtils,
} from '@/lib/ai-coach';

interface AICoachChatProps {
  onClose?: () => void;
  initialTopic?: string;
  userContext: UserContext;
}

export default function AICoachChat({ onClose, initialTopic, userContext }: AICoachChatProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  
  const coachStore = useCoachStore();
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Get current session messages
  const messages = coachStore.activeSession?.messages || [];
  const insights = coachStore.getUnacknowledgedInsights();
  
  useEffect(() => {
    // Initialize chat if needed
    if (!coachStore.activeSession) {
      initializeChat();
    }
    
    // Animate in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: Animations.timing.duration,
      useNativeDriver: true,
    }).start();
    
    // Check if coaching intervention is needed
    if (coachUtils.shouldTriggerCoaching(userContext)) {
      generateCoachingIntervention();
    }
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    scrollToBottom();
  }, [messages.length]);

  const initializeChat = async () => {
    const sessionType = initialTopic ? 'learning-guidance' : 'check-in';
    await coachStore.startSession(sessionType);
    
    if (initialTopic) {
      // Generate topic-specific guidance
      const guidance = await coachStore.provideLearningGuidance(
        initialTopic, 
        'intermediate', 
        userContext
      );
      await coachStore.sendMessage(guidance.content, 'learning');
    }
  };

  const generateCoachingIntervention = async () => {
    if (userContext.currentStreak === 0) {
      const support = await coachStore.offerMentalHealthSupport('motivation', userContext);
      await coachStore.sendMessage(support.content, 'mental-health');
    } else if (userContext.learningPatterns.completionRate < 0.3) {
      const guidance = await coachStore.provideLearningGuidance(
        'time management', 
        'beginner', 
        userContext
      );
      await coachStore.sendMessage(guidance.content, 'productivity');
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    const userMessage = message.trim();
    setMessage('');
    setIsTyping(true);
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Send user message
    await coachStore.sendMessage(userMessage);
    
    // Simulate AI thinking time
    setTimeout(() => {
      setIsTyping(false);
    }, 2000);
    
    scrollToBottom();
  };

  const handleQuickResponse = async (response: string) => {
    setIsTyping(true);
    await coachStore.sendMessage(response);
    setTimeout(() => setIsTyping(false), 1500);
  };

  const generateInsights = async () => {
    const newInsights = await coachStore.generateInsights(userContext);
    if (newInsights.length > 0) {
      setShowInsights(true);
    }
  };

  const acknowledgeInsight = (insightId: string) => {
    coachStore.acknowledgeInsight(insightId);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const endChat = async () => {
    if (coachStore.activeSession) {
      await coachStore.endSession(coachStore.activeSession.id, ['chat-completed']);
    }
    onClose?.();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.coachAvatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.coachAvatarText}>🤖</Text>
            </View>
            <View>
              <Text style={[styles.coachName, { color: colors.text }]}>
                AI Coach Alex
              </Text>
              <Text style={[styles.coachStatus, { color: colors.textSecondary }]}>
                Here to help you grow
              </Text>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            {insights.length > 0 && (
              <Pressable 
                style={[styles.insightBadge, { backgroundColor: colors.primary }]}
                onPress={() => setShowInsights(true)}
              >
                <IconSymbol name="lightbulb.fill" size={16} color="white" />
                <Text style={styles.insightBadgeText}>{insights.length}</Text>
              </Pressable>
            )}
            
            <Pressable style={styles.closeButton} onPress={endChat}>
              <IconSymbol name="xmark" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* Chat Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg, index) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isUser={msg.type === 'user'}
              colors={colors}
              showTimestamp={index === 0 || messages[index - 1].type !== msg.type}
            />
          ))}
          
          {isTyping && (
            <View style={[styles.typingIndicator, { backgroundColor: colors.surface }]}>
              <PulseLoader size={6} color={colors.primary} count={3} />
              <Text style={[styles.typingText, { color: colors.textSecondary }]}>
                Coach is typing...
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Quick Responses */}
        {messages.length > 0 && !isTyping && (
          <View style={styles.quickResponses}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {getQuickResponses(messages[messages.length - 1]).map((response, index) => (
                <Pressable
                  key={index}
                  style={[styles.quickResponseButton, { backgroundColor: colors.surface }]}
                  onPress={() => handleQuickResponse(response)}
                >
                  <Text style={[styles.quickResponseText, { color: colors.text }]}>
                    {response}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inputContainer}
        >
          <View style={[styles.inputRow, { backgroundColor: colors.surface }]}>
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              value={message}
              onChangeText={setMessage}
              placeholder="Type your message..."
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={500}
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
            />
            
            <Pressable
              style={[
                styles.sendButton,
                { 
                  backgroundColor: message.trim() ? colors.primary : colors.border,
                  opacity: message.trim() ? 1 : 0.5,
                }
              ]}
              onPress={handleSendMessage}
              disabled={!message.trim()}
            >
              <IconSymbol name="arrow.up" size={20} color="white" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>

      {/* Insights Modal */}
      {showInsights && (
        <InsightsModal
          insights={insights}
          colors={colors}
          onClose={() => setShowInsights(false)}
          onAcknowledge={acknowledgeInsight}
        />
      )}
    </SafeAreaView>
  );
}

interface MessageBubbleProps {
  message: CoachMessage;
  isUser: boolean;
  colors: any;
  showTimestamp: boolean;
}

function MessageBubble({ message, isUser, colors, showTimestamp }: MessageBubbleProps) {
  const getMoodEmoji = (mood?: string) => {
    switch (mood) {
      case 'encouraging': return '🌟';
      case 'supportive': return '🤗';
      case 'motivational': return '💪';
      case 'empathetic': return '💙';
      case 'informative': return '📚';
      default: return '💭';
    }
  };

  return (
    <View style={[styles.messageContainer, isUser && styles.userMessageContainer]}>
      {showTimestamp && (
        <Text style={[styles.timestamp, { color: colors.textTertiary }]}>
          {new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      )}
      
      <View
        style={[
          styles.messageBubble,
          isUser 
            ? { backgroundColor: colors.primary }
            : { backgroundColor: colors.surface },
        ]}
      >
        {!isUser && message.mood && (
          <Text style={styles.moodEmoji}>
            {getMoodEmoji(message.mood)}
          </Text>
        )}
        
        <Text
          style={[
            styles.messageText,
            { color: isUser ? 'white' : colors.text },
          ]}
        >
          {message.content}
        </Text>
        
        {message.metadata?.actionSuggested && (
          <View style={styles.actionSuggestion}>
            <Text style={[styles.actionText, { color: colors.primary }]}>
              💡 {message.metadata.actionSuggested}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

interface InsightsModalProps {
  insights: CoachInsight[];
  colors: any;
  onClose: () => void;
  onAcknowledge: (id: string) => void;
}

function InsightsModal({ insights, colors, onClose, onAcknowledge }: InsightsModalProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return colors.error;
      case 'medium': return colors.warning;
      default: return colors.success;
    }
  };

  return (
    <View style={styles.modalOverlay}>
      <View style={[styles.insightsModal, { backgroundColor: colors.background }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            💡 Your Insights
          </Text>
          <Pressable onPress={onClose}>
            <IconSymbol name="xmark" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView style={styles.insightsList}>
          {insights.map((insight) => (
            <View 
              key={insight.id} 
              style={[styles.insightCard, { backgroundColor: colors.surface }]}
            >
              <View style={styles.insightHeader}>
                <Text style={[styles.insightTitle, { color: colors.text }]}>
                  {insight.title}
                </Text>
                <View 
                  style={[
                    styles.severityBadge, 
                    { backgroundColor: getSeverityColor(insight.severity) }
                  ]}
                >
                  <Text style={styles.severityText}>{insight.severity}</Text>
                </View>
              </View>
              
              <Text style={[styles.insightDescription, { color: colors.textSecondary }]}>
                {insight.description}
              </Text>
              
              {insight.actionable && (
                <View style={styles.actionsContainer}>
                  {insight.suggestedActions.map((action, index) => (
                    <Text key={index} style={[styles.actionItem, { color: colors.primary }]}>
                      • {action}
                    </Text>
                  ))}
                </View>
              )}
              
              <Pressable
                style={[styles.acknowledgeButton, { backgroundColor: colors.primary }]}
                onPress={() => onAcknowledge(insight.id)}
              >
                <Text style={styles.acknowledgeButtonText}>Got it!</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

// Quick response suggestions based on last message
function getQuickResponses(lastMessage: CoachMessage): string[] {
  if (lastMessage.category === 'learning') {
    return ['Tell me more', "What's next?", 'I need help with this'];
  }
  
  if (lastMessage.category === 'mental-health') {
    return ['That helps', "I'm struggling", 'What should I do?'];
  }
  
  return ['Thanks!', 'Tell me more', 'What else?', 'I understand'];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  coachAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coachAvatarText: {
    fontSize: 20,
  },
  coachName: {
    fontSize: 16,
    fontWeight: '600',
  },
  coachStatus: {
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  insightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  insightBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  messageContainer: {
    alignItems: 'flex-start',
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  timestamp: {
    fontSize: 11,
    marginBottom: 4,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  moodEmoji: {
    fontSize: 16,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  actionSuggestion: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: BorderRadius.sm,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    maxWidth: '60%',
  },
  typingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  quickResponses: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  quickResponseButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  quickResponseText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    padding: Spacing.lg,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.sm,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    fontSize: 16,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  insightsModal: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  insightsList: {
    gap: Spacing.md,
  },
  insightCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  severityText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  insightDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  actionsContainer: {
    marginBottom: Spacing.md,
  },
  actionItem: {
    fontSize: 14,
    marginBottom: 4,
  },
  acknowledgeButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
  },
  acknowledgeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
