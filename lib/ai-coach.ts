import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getMistralClient } from './mistral-api';
import { configManager } from './config';

// AI Coach Types
export interface CoachMessage {
  id: string;
  type: 'coach' | 'user' | 'system';
  content: string;
  timestamp: string;
  mood?: 'encouraging' | 'supportive' | 'motivational' | 'empathetic' | 'informative';
  category?: 'learning' | 'mental-health' | 'career' | 'productivity' | 'general';
  metadata?: {
    videoId?: string;
    xpAwarded?: number;
    actionSuggested?: string;
    resources?: string[];
  };
}

export interface CoachSession {
  id: string;
  startedAt: string;
  endedAt?: string;
  type: 'check-in' | 'learning-guidance' | 'career-advice' | 'mental-health' | 'goal-setting';
  messages: CoachMessage[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  outcomes: string[];
  followUpScheduled?: string;
}

export interface CoachInsight {
  id: string;
  type: 'progress' | 'pattern' | 'recommendation' | 'concern';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  actionable: boolean;
  suggestedActions: string[];
  generatedAt: string;
  acknowledged: boolean;
}

export interface UserContext {
  recentActivities: any[];
  currentStreak: number;
  xpProgress: any;
  moodHistory: { date: string; mood: string }[];
  learningPatterns: {
    preferredTime: string;
    averageSessionLength: number;
    completionRate: number;
    strugglingAreas: string[];
  };
  goals: any;
  challenges: string[];
}

// Coach Personality Profiles
const COACH_PERSONALITIES = {
  encouraging: {
    name: 'Alex',
    description: 'Positive and motivating, celebrates your wins',
    prompts: {
      greeting: "Hey there! 🌟 Ready to crush some goals today?",
      encouragement: "You're doing amazing! Every small step counts.",
      challenge: "I believe in you! Let's tackle this challenge together.",
    }
  },
  supportive: {
    name: 'Sam',
    description: 'Empathetic and understanding, great listener',
    prompts: {
      greeting: "Hi! How are you feeling today? I'm here to help.",
      encouragement: "It's okay to take things at your own pace.",
      challenge: "What's been on your mind? Let's work through it.",
    }
  },
  analytical: {
    name: 'Taylor',
    description: 'Data-driven and strategic, focuses on optimization',
    prompts: {
      greeting: "Good day! Let's analyze your progress and optimize your learning.",
      encouragement: "Your metrics show consistent improvement!",
      challenge: "Based on your patterns, here's what I recommend...",
    }
  }
};

interface CoachState {
  sessions: CoachSession[];
  insights: CoachInsight[];
  activeSession: CoachSession | null;
  coachPersonality: keyof typeof COACH_PERSONALITIES;
  userPreferences: {
    coachingStyle: 'gentle' | 'direct' | 'balanced';
    focusAreas: string[];
    checkInFrequency: 'daily' | 'weekly' | 'as-needed';
    preferredTime: string;
  };
  lastInteraction: string | null;
  totalInteractions: number;
}

interface CoachStore extends CoachState {
  // Session Management
  startSession: (type: CoachSession['type']) => Promise<string>;
  endSession: (sessionId: string, outcomes: string[]) => Promise<void>;
  sendMessage: (content: string, category?: CoachMessage['category']) => Promise<void>;
  
  // AI Coach Interactions
  getCoachResponse: (userMessage: string, context: UserContext) => Promise<CoachMessage>;
  generateDailyCheckIn: (context: UserContext) => Promise<CoachMessage>;
  generateMotivationalMessage: (context: UserContext) => Promise<CoachMessage>;
  provideLearningGuidance: (topic: string, difficulty: string, context: UserContext) => Promise<CoachMessage>;
  offerMentalHealthSupport: (concern: string, context: UserContext) => Promise<CoachMessage>;
  
  // Insights and Analysis
  generateInsights: (context: UserContext) => Promise<CoachInsight[]>;
  acknowledgeInsight: (insightId: string) => void;
  getUnacknowledgedInsights: () => CoachInsight[];
  
  // Personalization
  updateCoachPersonality: (personality: keyof typeof COACH_PERSONALITIES) => void;
  updateUserPreferences: (preferences: Partial<CoachState['userPreferences']>) => void;
  
  // Analytics
  getInteractionStats: () => {
    totalSessions: number;
    averageSessionLength: number;
    mostCommonTopics: string[];
    sentimentTrend: string[];
  };
  
  // Utilities
  scheduleFollowUp: (sessionId: string, followUpTime: string) => void;
  getRecentMessages: (limit?: number) => CoachMessage[];
  clearHistory: () => void;
}

const initialCoachState: CoachState = {
  sessions: [],
  insights: [],
  activeSession: null,
  coachPersonality: 'encouraging',
  userPreferences: {
    coachingStyle: 'balanced',
    focusAreas: ['learning', 'productivity'],
    checkInFrequency: 'daily',
    preferredTime: '09:00',
  },
  lastInteraction: null,
  totalInteractions: 0,
};

export const useCoachStore = create<CoachStore>()(
  persist(
    (set, get) => ({
      ...initialCoachState,
      
      // Session Management
      startSession: async (type) => {
        const session: CoachSession = {
          id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          startedAt: new Date().toISOString(),
          type,
          messages: [],
          sentiment: 'neutral',
          outcomes: [],
        };
        
        set((state) => ({
          ...state,
          sessions: [...state.sessions, session],
          activeSession: session,
        }));
        
        // Generate initial coach message
        const personality = COACH_PERSONALITIES[get().coachPersonality];
        const initialMessage: CoachMessage = {
          id: `msg_${Date.now()}`,
          type: 'coach',
          content: personality.prompts.greeting,
          timestamp: new Date().toISOString(),
          mood: 'encouraging',
          category: 'general',
        };
        
        get().sendMessage(initialMessage.content, 'general');
        return session.id;
      },
      
      endSession: async (sessionId, outcomes) => {
        set((state) => ({
          ...state,
          sessions: state.sessions.map(s =>
            s.id === sessionId
              ? { ...s, endedAt: new Date().toISOString(), outcomes }
              : s
          ),
          activeSession: state.activeSession?.id === sessionId ? null : state.activeSession,
        }));
      },
      
      sendMessage: async (content, category = 'general') => {
        const state = get();
        if (!state.activeSession) return;
        
        const message: CoachMessage = {
          id: `msg_${Date.now()}`,
          type: 'user',
          content,
          timestamp: new Date().toISOString(),
          category,
        };
        
        // Update session with user message
        set((prevState) => ({
          ...prevState,
          sessions: prevState.sessions.map(s =>
            s.id === state.activeSession?.id
              ? { ...s, messages: [...s.messages, message] }
              : s
          ),
          totalInteractions: prevState.totalInteractions + 1,
          lastInteraction: new Date().toISOString(),
        }));
        
        // Generate AI response
        // This would typically call the AI service
        // For now, we'll simulate with a simple response
        setTimeout(async () => {
          const aiResponse = await get().getCoachResponse(content, {} as UserContext);
          
          set((prevState) => ({
            ...prevState,
            sessions: prevState.sessions.map(s =>
              s.id === state.activeSession?.id
                ? { ...s, messages: [...s.messages, aiResponse] }
                : s
            ),
          }));
        }, 1000);
      },
      
      // AI Coach Interactions
      getCoachResponse: async (userMessage, context) => {
        const state = get();
        const personality = COACH_PERSONALITIES[state.coachPersonality];
        
        try {
          const mistralClient = getMistralClient();
          if (mistralClient && configManager.isMistralEnabled()) {
            const systemPrompt = `You are ${personality.name}, an AI learning and mental health coach. 
              Your personality is ${personality.description}. 
              Respond in a ${state.userPreferences.coachingStyle} manner.
              Focus areas: ${state.userPreferences.focusAreas.join(', ')}.
              Keep responses concise and actionable.`;
            
            const prompt = `User message: "${userMessage}"
              Context: User has ${context.currentStreak} day streak, recent mood: ${context.moodHistory?.[0]?.mood || 'unknown'}
              
              Respond as the coach:`;
            
            // This would call the actual Mistral API
            // For now, return a structured response
          }
        } catch (error) {
          console.error('Error generating coach response:', error);
        }
        
        // Fallback response system
        const responses = [
          "That's a great question! Let me think about that...",
          "I appreciate you sharing that with me. Here's what I think...",
          "Based on what you've told me, I'd suggest...",
          "That sounds challenging. Here's how we can approach it...",
        ];
        
        const response: CoachMessage = {
          id: `msg_${Date.now()}`,
          type: 'coach',
          content: responses[Math.floor(Math.random() * responses.length)],
          timestamp: new Date().toISOString(),
          mood: 'supportive',
          category: 'general',
        };
        
        return response;
      },
      
      generateDailyCheckIn: async (context) => {
        const checkInMessages = [
          `Good morning! 🌅 How are you feeling about today's learning goals?`,
          `Hey there! Your ${context.currentStreak} day streak is impressive! What's on your learning agenda today?`,
          `Hi! I notice you've been consistent with your progress. How can I support you today?`,
          `Good day! Ready to build on yesterday's momentum? What would you like to focus on?`,
        ];
        
        return {
          id: `checkin_${Date.now()}`,
          type: 'coach',
          content: checkInMessages[Math.floor(Math.random() * checkInMessages.length)],
          timestamp: new Date().toISOString(),
          mood: 'encouraging',
          category: 'general',
        };
      },
      
      generateMotivationalMessage: async (context) => {
        const motivationalMessages = [
          `🚀 You're making real progress! Keep up the momentum!`,
          `💪 Every expert was once a beginner. You're on the right path!`,
          `🎯 Focus on progress, not perfection. You've got this!`,
          `⭐ Your dedication is inspiring! One step at a time!`,
        ];
        
        return {
          id: `motivation_${Date.now()}`,
          type: 'coach',
          content: motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)],
          timestamp: new Date().toISOString(),
          mood: 'motivational',
          category: 'learning',
        };
      },
      
      provideLearningGuidance: async (topic, difficulty, context) => {
        const guidance = `For ${topic} at ${difficulty} level, I recommend starting with the fundamentals and building up gradually. Based on your learning patterns, ${difficulty === 'beginner' ? 'take your time with each concept' : 'challenge yourself with practical projects'}.`;
        
        return {
          id: `guidance_${Date.now()}`,
          type: 'coach',
          content: guidance,
          timestamp: new Date().toISOString(),
          mood: 'informative',
          category: 'learning',
          metadata: {
            actionSuggested: `Study ${topic}`,
            resources: [`${topic} fundamentals`, `${topic} practice exercises`],
          },
        };
      },
      
      offerMentalHealthSupport: async (concern, context) => {
        const supportMessages = {
          stress: "It sounds like you're feeling overwhelmed. Remember, it's okay to take breaks. Have you tried any relaxation techniques?",
          burnout: "Burnout is real and valid. Let's focus on sustainable practices. What activities help you recharge?",
          imposter: "Imposter syndrome affects many learners. Remember, everyone starts somewhere and your progress is valid.",
          anxiety: "Learning anxiety is common. Let's break things down into smaller, manageable steps.",
        };
        
        const defaultSupport = "I hear you, and your feelings are valid. Let's work through this together. What specific support would be most helpful right now?";
        
        return {
          id: `support_${Date.now()}`,
          type: 'coach',
          content: supportMessages[concern as keyof typeof supportMessages] || defaultSupport,
          timestamp: new Date().toISOString(),
          mood: 'empathetic',
          category: 'mental-health',
        };
      },
      
      // Insights and Analysis
      generateInsights: async (context) => {
        const insights: CoachInsight[] = [];
        
        // Progress insight
        if (context.currentStreak >= 7) {
          insights.push({
            id: `insight_${Date.now()}_progress`,
            type: 'progress',
            title: 'Excellent Consistency!',
            description: `Your ${context.currentStreak}-day streak shows great dedication. Keep it up!`,
            severity: 'low',
            actionable: false,
            suggestedActions: ['Continue current routine', 'Consider setting a longer-term goal'],
            generatedAt: new Date().toISOString(),
            acknowledged: false,
          });
        }
        
        // Pattern insight
        if (context.learningPatterns.completionRate < 0.5) {
          insights.push({
            id: `insight_${Date.now()}_completion`,
            type: 'pattern',
            title: 'Low Completion Rate',
            description: 'You might be taking on too much at once. Consider smaller, focused sessions.',
            severity: 'medium',
            actionable: true,
            suggestedActions: ['Set smaller daily goals', 'Focus on one topic at a time', 'Track what causes interruptions'],
            generatedAt: new Date().toISOString(),
            acknowledged: false,
          });
        }
        
        set((state) => ({
          ...state,
          insights: [...state.insights, ...insights],
        }));
        
        return insights;
      },
      
      acknowledgeInsight: (insightId) => {
        set((state) => ({
          ...state,
          insights: state.insights.map(i =>
            i.id === insightId ? { ...i, acknowledged: true } : i
          ),
        }));
      },
      
      getUnacknowledgedInsights: () => {
        return get().insights.filter(i => !i.acknowledged);
      },
      
      // Personalization
      updateCoachPersonality: (personality) => {
        set((state) => ({
          ...state,
          coachPersonality: personality,
        }));
      },
      
      updateUserPreferences: (preferences) => {
        set((state) => ({
          ...state,
          userPreferences: {
            ...state.userPreferences,
            ...preferences,
          },
        }));
      },
      
      // Analytics
      getInteractionStats: () => {
        const state = get();
        const sessions = state.sessions.filter(s => s.endedAt);
        
        const totalSessions = sessions.length;
        const averageSessionLength = sessions.reduce((acc, session) => {
          const duration = new Date(session.endedAt!).getTime() - new Date(session.startedAt).getTime();
          return acc + duration;
        }, 0) / totalSessions || 0;
        
        const topicCounts: { [key: string]: number } = {};
        state.sessions.forEach(session => {
          session.messages.forEach(msg => {
            if (msg.category) {
              topicCounts[msg.category] = (topicCounts[msg.category] || 0) + 1;
            }
          });
        });
        
        const mostCommonTopics = Object.entries(topicCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([topic]) => topic);
        
        const sentimentTrend = sessions
          .slice(-7) // Last 7 sessions
          .map(s => s.sentiment);
        
        return {
          totalSessions,
          averageSessionLength,
          mostCommonTopics,
          sentimentTrend,
        };
      },
      
      // Utilities
      scheduleFollowUp: (sessionId, followUpTime) => {
        set((state) => ({
          ...state,
          sessions: state.sessions.map(s =>
            s.id === sessionId ? { ...s, followUpScheduled: followUpTime } : s
          ),
        }));
      },
      
      getRecentMessages: (limit = 10) => {
        const state = get();
        const allMessages = state.sessions
          .flatMap(s => s.messages)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        return allMessages.slice(0, limit);
      },
      
      clearHistory: () => {
        set(initialCoachState);
      },
    }),
    {
      name: 'upmindx-coach',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Utility functions for coach integration
export const coachUtils = {
  // Start a check-in session
  async startDailyCheckIn(userContext: UserContext): Promise<void> {
    const coachStore = useCoachStore.getState();
    await coachStore.startSession('check-in');
    const checkIn = await coachStore.generateDailyCheckIn(userContext);
    // This would typically trigger a notification or UI update
  },

  // Get personalized learning recommendations
  async getLearningRecommendations(userContext: UserContext): Promise<CoachMessage> {
    const coachStore = useCoachStore.getState();
    
    // Analyze user's learning patterns and provide recommendations
    if (userContext.learningPatterns.strugglingAreas.length > 0) {
      const topic = userContext.learningPatterns.strugglingAreas[0];
      return await coachStore.provideLearningGuidance(topic, 'beginner', userContext);
    }
    
    return await coachStore.generateMotivationalMessage(userContext);
  },

  // Handle mental health check-ins
  async handleMentalHealthConcern(concern: string, userContext: UserContext): Promise<CoachMessage> {
    const coachStore = useCoachStore.getState();
    return await coachStore.offerMentalHealthSupport(concern, userContext);
  },

  // Generate insights based on user data
  async generatePersonalizedInsights(userContext: UserContext): Promise<CoachInsight[]> {
    const coachStore = useCoachStore.getState();
    return await coachStore.generateInsights(userContext);
  },

  // Check if user needs coaching intervention
  shouldTriggerCoaching(userContext: UserContext): boolean {
    const { currentStreak, learningPatterns, moodHistory } = userContext;
    
    // Trigger coaching if streak is broken
    if (currentStreak === 0) return true;
    
    // Trigger if completion rate is very low
    if (learningPatterns.completionRate < 0.3) return true;
    
    // Trigger if recent mood is consistently negative
    const recentMoods = moodHistory.slice(0, 3);
    if (recentMoods.every(m => m.mood === 'negative')) return true;
    
    return false;
  }
};
