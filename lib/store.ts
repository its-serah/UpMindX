import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persist, createJSONStorage } from 'zustand/middleware';

// XP Store - manages all experience points and levels
interface XPState {
  resilience: { current: number; level: number };
  confidence: { current: number; level: number };
  interview: { current: number; level: number };
  totalXP: number;
}

interface XPStore extends XPState {
  addXP: (type: keyof Omit<XPState, 'totalXP'>, amount: number) => void;
  getXPForNextLevel: (currentXP: number) => number;
  calculateLevel: (xp: number) => number;
  reset: () => void;
}

const initialXPState: XPState = {
  resilience: { current: 0, level: 1 },
  confidence: { current: 0, level: 1 },
  interview: { current: 0, level: 1 },
  totalXP: 0,
};

export const useXPStore = create<XPStore>()(
  persist(
    (set, get) => ({
      ...initialXPState,
      
      addXP: (type, amount) => {
        set((state) => {
          const newXP = state[type].current + amount;
          const newLevel = get().calculateLevel(newXP);
          const newTotalXP = state.totalXP + amount;
          
          return {
            ...state,
            [type]: {
              current: newXP,
              level: newLevel,
            },
            totalXP: newTotalXP,
          };
        });
      },
      
      getXPForNextLevel: (currentXP) => {
        const currentLevel = get().calculateLevel(currentXP);
        return currentLevel * 100; // Each level requires 100 more XP than the previous
      },
      
      calculateLevel: (xp) => {
        return Math.floor(xp / 100) + 1; // Level up every 100 XP
      },
      
      reset: () => set(initialXPState),
    }),
    {
      name: 'upmindx-xp',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Session Store - manages focus sessions, streaks, and session data
interface SessionState {
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  totalFocusTime: number; // in minutes
  lastSessionDate: string | null;
  sessionsToday: number;
}

interface SessionStore extends SessionState {
  completeSession: (durationMinutes: number) => void;
  updateDailyStreak: () => void;
  resetStreaks: () => void;
  getTodaySessionCount: () => number;
}

const initialSessionState: SessionState = {
  currentStreak: 0,
  longestStreak: 0,
  totalSessions: 0,
  totalFocusTime: 0,
  lastSessionDate: null,
  sessionsToday: 0,
};

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      ...initialSessionState,
      
      completeSession: (durationMinutes) => {
        set((state) => {
          const today = new Date().toISOString().split('T')[0];
          const isToday = state.lastSessionDate === today;
          
          return {
            ...state,
            totalSessions: state.totalSessions + 1,
            totalFocusTime: state.totalFocusTime + durationMinutes,
            lastSessionDate: today,
            sessionsToday: isToday ? state.sessionsToday + 1 : 1,
          };
        });
        get().updateDailyStreak();
      },
      
      updateDailyStreak: () => {
        set((state) => {
          const today = new Date().toISOString().split('T')[0];
          const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          
          if (state.lastSessionDate === today) {
            // Session completed today, maintain or start streak
            const newStreak = state.lastSessionDate === yesterday ? state.currentStreak : state.currentStreak + 1;
            return {
              ...state,
              currentStreak: newStreak,
              longestStreak: Math.max(state.longestStreak, newStreak),
            };
          } else if (state.lastSessionDate === yesterday) {
            // Last session was yesterday, continue streak
            return state;
          } else {
            // Streak broken
            return {
              ...state,
              currentStreak: 0,
            };
          }
        });
      },
      
      resetStreaks: () => set((state) => ({
        ...state,
        currentStreak: 0,
        longestStreak: 0,
      })),
      
      getTodaySessionCount: () => {
        const today = new Date().toISOString().split('T')[0];
        const state = get();
        return state.lastSessionDate === today ? state.sessionsToday : 0;
      },
    }),
    {
      name: 'upmindx-sessions',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Task Store - manages completed tasks and task history
interface TaskState {
  completedTasks: string[];
  taskHistory: Array<{
    id: string;
    completedAt: string;
    xpEarned: number;
    type: string;
  }>;
}

interface TaskStore extends TaskState {
  completeTask: (taskId: string, xpEarned: number, type: string) => void;
  isTaskCompleted: (taskId: string) => boolean;
  getTasksCompletedToday: () => number;
  reset: () => void;
}

const initialTaskState: TaskState = {
  completedTasks: [],
  taskHistory: [],
};

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      ...initialTaskState,
      
      completeTask: (taskId, xpEarned, type) => {
        set((state) => ({
          ...state,
          completedTasks: [...state.completedTasks, taskId],
          taskHistory: [
            ...state.taskHistory,
            {
              id: taskId,
              completedAt: new Date().toISOString(),
              xpEarned,
              type,
            },
          ],
        }));
      },
      
      isTaskCompleted: (taskId) => {
        return get().completedTasks.includes(taskId);
      },
      
      getTasksCompletedToday: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().taskHistory.filter(
          (task) => task.completedAt.split('T')[0] === today
        ).length;
      },
      
      reset: () => set(initialTaskState),
    }),
    {
      name: 'upmindx-tasks',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Journal Store - manages journal entries
interface JournalEntry {
  id: string;
  content: string;
  mood: 'positive' | 'neutral' | 'negative';
  createdAt: string;
  tags: string[];
}

interface JournalStore {
  entries: JournalEntry[];
  addEntry: (content: string, mood: JournalEntry['mood'], tags: string[]) => void;
  getEntriesForDate: (date: string) => JournalEntry[];
  getTotalEntries: () => number;
  getStreakDays: () => number;
}

export const useJournalStore = create<JournalStore>()(
  persist(
    (set, get) => ({
      entries: [],
      
      addEntry: (content, mood, tags = []) => {
        const newEntry: JournalEntry = {
          id: Date.now().toString(),
          content,
          mood,
          tags,
          createdAt: new Date().toISOString(),
        };
        
        set((state) => ({
          entries: [newEntry, ...state.entries],
        }));
      },
      
      getEntriesForDate: (date) => {
        return get().entries.filter(
          (entry) => entry.createdAt.split('T')[0] === date
        );
      },
      
      getTotalEntries: () => get().entries.length,
      
      getStreakDays: () => {
        const entries = get().entries;
        const dates = new Set(
          entries.map((entry) => entry.createdAt.split('T')[0])
        );
        
        let streak = 0;
        const today = new Date();
        
        for (let i = 0; i < 365; i++) {
          const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
          const dateString = checkDate.toISOString().split('T')[0];
          
          if (dates.has(dateString)) {
            streak++;
          } else if (i === 0) {
            // If no entry today, check yesterday
            continue;
          } else {
            break;
          }
        }
        
        return streak;
      },
    }),
    {
      name: 'upmindx-journal',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
