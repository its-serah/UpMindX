import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persist, createJSONStorage } from 'zustand/middleware';

// User Profile & Preferences
export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  dateJoined: string;
  lastActive: string;
  timezone: string;
  preferences: UserPreferences;
  goals: UserGoals;
  achievements: Achievement[];
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    daily: boolean;
    streak: boolean;
    achievements: boolean;
    reminders: boolean;
    reminderTime: string; // HH:MM format
  };
  learning: {
    dailyGoalMinutes: number;
    preferredCategories: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
    autoPlay: boolean;
    questionFrequency: 'low' | 'medium' | 'high';
  };
  accessibility: {
    fontSize: 'small' | 'medium' | 'large';
    highContrast: boolean;
    reduceMotion: boolean;
  };
}

export interface UserGoals {
  daily: {
    videosWatched: number;
    targetVideos: number;
    minutesFocused: number;
    targetMinutes: number;
    questionsAnswered: number;
    targetQuestions: number;
  };
  weekly: {
    streakGoal: number;
    xpGoal: number;
    sessionGoal: number;
  };
  monthly: {
    skillsToLearn: string[];
    projectsToComplete: number;
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
  category: 'learning' | 'streak' | 'focus' | 'social' | 'milestone';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface UserProfileState extends UserProfile {}

interface UserProfileStore extends UserProfileState {
  updateProfile: (updates: Partial<UserProfile>) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  updateGoals: (updates: Partial<UserGoals>) => void;
  addAchievement: (achievement: Achievement) => void;
  hasAchievement: (achievementId: string) => boolean;
  updateLastActive: () => void;
  getDailyProgress: () => {
    videos: number;
    focus: number;
    questions: number;
  };
  reset: () => void;
}

const createInitialProfile = (): UserProfile => ({
  id: `user_${Date.now()}`,
  name: 'Learner',
  dateJoined: new Date().toISOString(),
  lastActive: new Date().toISOString(),
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  preferences: {
    theme: 'auto',
    notifications: {
      daily: true,
      streak: true,
      achievements: true,
      reminders: true,
      reminderTime: '09:00',
    },
    learning: {
      dailyGoalMinutes: 30,
      preferredCategories: ['coding', 'career', 'interview'],
      difficulty: 'mixed',
      autoPlay: true,
      questionFrequency: 'medium',
    },
    accessibility: {
      fontSize: 'medium',
      highContrast: false,
      reduceMotion: false,
    },
  },
  goals: {
    daily: {
      videosWatched: 0,
      targetVideos: 5,
      minutesFocused: 0,
      targetMinutes: 30,
      questionsAnswered: 0,
      targetQuestions: 10,
    },
    weekly: {
      streakGoal: 7,
      xpGoal: 1000,
      sessionGoal: 10,
    },
    monthly: {
      skillsToLearn: ['React Native', 'System Design'],
      projectsToComplete: 2,
    },
  },
  achievements: [],
});

export const useUserProfileStore = create<UserProfileStore>()(
  persist(
    (set, get) => ({
      ...createInitialProfile(),
      
      updateProfile: (updates) => {
        set((state) => ({
          ...state,
          ...updates,
          lastActive: new Date().toISOString(),
        }));
      },
      
      updatePreferences: (updates) => {
        set((state) => ({
          ...state,
          preferences: {
            ...state.preferences,
            ...updates,
          },
          lastActive: new Date().toISOString(),
        }));
      },
      
      updateGoals: (updates) => {
        set((state) => ({
          ...state,
          goals: {
            ...state.goals,
            ...updates,
          },
          lastActive: new Date().toISOString(),
        }));
      },
      
      addAchievement: (achievement) => {
        set((state) => {
          // Don't add duplicate achievements
          if (state.achievements.some(a => a.id === achievement.id)) {
            return state;
          }
          
          return {
            ...state,
            achievements: [...state.achievements, achievement],
            lastActive: new Date().toISOString(),
          };
        });
      },
      
      hasAchievement: (achievementId) => {
        return get().achievements.some(a => a.id === achievementId);
      },
      
      updateLastActive: () => {
        set((state) => ({
          ...state,
          lastActive: new Date().toISOString(),
        }));
      },
      
      getDailyProgress: () => {
        const state = get();
        return {
          videos: state.goals.daily.videosWatched,
          focus: state.goals.daily.minutesFocused,
          questions: state.goals.daily.questionsAnswered,
        };
      },
      
      reset: () => set(createInitialProfile()),
    }),
    {
      name: 'upmindx-profile',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Analytics Store for tracking user behavior and app performance
export interface AnalyticsEvent {
  id: string;
  event: string;
  properties: Record<string, any>;
  timestamp: string;
  sessionId: string;
}

interface AnalyticsState {
  events: AnalyticsEvent[];
  currentSessionId: string;
  sessionStartTime: string;
}

interface AnalyticsStore extends AnalyticsState {
  trackEvent: (event: string, properties?: Record<string, any>) => void;
  startSession: () => void;
  endSession: () => void;
  getEventsForPeriod: (startDate: string, endDate: string) => AnalyticsEvent[];
  getPopularContent: () => { videoId: string; views: number }[];
  getUserEngagement: () => {
    dailyActiveTime: number;
    averageSessionLength: number;
    completionRate: number;
  };
  clearOldEvents: (daysToKeep: number) => void;
}

const initialAnalyticsState: AnalyticsState = {
  events: [],
  currentSessionId: '',
  sessionStartTime: '',
};

export const useAnalyticsStore = create<AnalyticsStore>()(
  persist(
    (set, get) => ({
      ...initialAnalyticsState,
      
      trackEvent: (event, properties = {}) => {
        const analyticsEvent: AnalyticsEvent = {
          id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          event,
          properties,
          timestamp: new Date().toISOString(),
          sessionId: get().currentSessionId,
        };
        
        set((state) => ({
          ...state,
          events: [...state.events, analyticsEvent].slice(-1000), // Keep last 1000 events
        }));
      },
      
      startSession: () => {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();
        
        set({
          currentSessionId: sessionId,
          sessionStartTime: now,
        });
        
        get().trackEvent('session_start');
      },
      
      endSession: () => {
        const state = get();
        const duration = new Date().getTime() - new Date(state.sessionStartTime).getTime();
        
        get().trackEvent('session_end', {
          duration_ms: duration,
          duration_minutes: Math.round(duration / 60000),
        });
      },
      
      getEventsForPeriod: (startDate, endDate) => {
        const events = get().events;
        return events.filter(event => {
          const eventDate = event.timestamp;
          return eventDate >= startDate && eventDate <= endDate;
        });
      },
      
      getPopularContent: () => {
        const events = get().events.filter(e => e.event === 'video_view');
        const videoViews: { [key: string]: number } = {};
        
        events.forEach(event => {
          const videoId = event.properties.videoId;
          if (videoId) {
            videoViews[videoId] = (videoViews[videoId] || 0) + 1;
          }
        });
        
        return Object.entries(videoViews)
          .map(([videoId, views]) => ({ videoId, views }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 10);
      },
      
      getUserEngagement: () => {
        const events = get().events;
        const sessions = events.filter(e => e.event === 'session_end');
        const totalTime = sessions.reduce((acc, session) => 
          acc + (session.properties.duration_minutes || 0), 0);
        
        const dailyActiveTime = totalTime / 7; // Approximate daily average
        const averageSessionLength = sessions.length > 0 ? totalTime / sessions.length : 0;
        
        // Calculate completion rate based on video completion events
        const videoStarts = events.filter(e => e.event === 'video_start').length;
        const videoCompletions = events.filter(e => e.event === 'video_complete').length;
        const completionRate = videoStarts > 0 ? videoCompletions / videoStarts : 0;
        
        return {
          dailyActiveTime,
          averageSessionLength,
          completionRate,
        };
      },
      
      clearOldEvents: (daysToKeep) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const cutoffTimestamp = cutoffDate.toISOString();
        
        set((state) => ({
          ...state,
          events: state.events.filter(event => event.timestamp >= cutoffTimestamp),
        }));
      },
    }),
    {
      name: 'upmindx-analytics',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
