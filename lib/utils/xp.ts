// XP calculation utilities

export interface XPReward {
  type: 'resilience' | 'confidence' | 'interview';
  amount: number;
  reason: string;
}

export const XP_MULTIPLIERS = {
  easy: 1,
  medium: 1.5,
  hard: 2,
} as const;

export const TASK_TYPE_XP = {
  interview: 25,
  mindset: 15,
  rejection: 20,
  'mini-task': 30,
  pomodoro: 10,
  journal: 5,
  breathing: 8,
} as const;

export const BONUS_XP = {
  streak: {
    7: 50,   // Weekly streak bonus
    30: 200, // Monthly streak bonus
    100: 500, // 100-day streak bonus
  },
  completion: {
    dailyGoal: 25,
    weeklyGoal: 100,
    perfectDay: 50, // All daily goals met
  },
} as const;

/**
 * Calculate XP reward for a task completion
 */
export function calculateTaskXP(
  taskType: keyof typeof TASK_TYPE_XP,
  difficulty: keyof typeof XP_MULTIPLIERS = 'medium'
): number {
  const baseXP = TASK_TYPE_XP[taskType] || 15;
  const multiplier = XP_MULTIPLIERS[difficulty];
  return Math.floor(baseXP * multiplier);
}

/**
 * Calculate streak bonus XP
 */
export function calculateStreakBonus(streakDays: number): number {
  if (streakDays >= 100) return BONUS_XP.streak[100];
  if (streakDays >= 30) return BONUS_XP.streak[30];
  if (streakDays >= 7) return BONUS_XP.streak[7];
  return 0;
}

/**
 * Determine XP type based on task category
 */
export function getXPTypeFromTask(taskType: string): 'resilience' | 'confidence' | 'interview' {
  switch (taskType) {
    case 'interview':
      return 'interview';
    case 'rejection':
    case 'mindset':
      return 'resilience';
    case 'mini-task':
    case 'pomodoro':
    case 'journal':
      return 'confidence';
    default:
      return 'confidence';
  }
}

/**
 * Calculate level from XP amount
 */
export function calculateLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

/**
 * Calculate XP needed for next level
 */
export function getXPForNextLevel(currentXP: number): number {
  const currentLevel = calculateLevel(currentXP);
  return currentLevel * 100;
}

/**
 * Calculate progress percentage to next level
 */
export function getLevelProgress(currentXP: number): number {
  const levelStartXP = (calculateLevel(currentXP) - 1) * 100;
  const xpInCurrentLevel = currentXP - levelStartXP;
  return (xpInCurrentLevel / 100) * 100;
}

/**
 * Get achievement progress
 */
export function getAchievementProgress(
  totalXP: number,
  sessionsCompleted: number,
  streakDays: number
): Array<{
  id: string;
  title: string;
  description: string;
  progress: number;
  completed: boolean;
  icon: string;
}> {
  return [
    {
      id: 'first_steps',
      title: 'First Steps',
      description: 'Complete your first growth task',
      progress: totalXP > 0 ? 100 : 0,
      completed: totalXP > 0,
      icon: 'star.fill',
    },
    {
      id: 'focus_master',
      title: 'Focus Master',
      description: 'Complete 10 Pomodoro sessions',
      progress: Math.min((sessionsCompleted / 10) * 100, 100),
      completed: sessionsCompleted >= 10,
      icon: 'timer',
    },
    {
      id: 'resilience_builder',
      title: 'Resilience Builder',
      description: 'Reach Level 5 in any XP category',
      progress: totalXP >= 400 ? 100 : (totalXP / 400) * 100,
      completed: totalXP >= 400,
      icon: 'shield.fill',
    },
    {
      id: 'streak_warrior',
      title: 'Streak Warrior',
      description: 'Maintain a 7-day streak',
      progress: Math.min((streakDays / 7) * 100, 100),
      completed: streakDays >= 7,
      icon: 'flame.fill',
    },
    {
      id: 'xp_collector',
      title: 'XP Collector',
      description: 'Earn 1,000 total XP',
      progress: Math.min((totalXP / 1000) * 100, 100),
      completed: totalXP >= 1000,
      icon: 'star.circle.fill',
    },
  ];
}

/**
 * Format XP amount for display
 */
export function formatXP(xp: number): string {
  if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}k`;
  }
  return xp.toString();
}

/**
 * Get motivational message based on XP gained
 */
export function getMotivationalMessage(xpGained: number): string {
  if (xpGained >= 50) {
    return "🔥 Incredible work! You're on fire!";
  } else if (xpGained >= 30) {
    return "⭐ Amazing progress! Keep crushing it!";
  } else if (xpGained >= 20) {
    return "💪 Nice job! You're building momentum!";
  } else if (xpGained >= 10) {
    return "✨ Great work! Every step counts!";
  } else {
    return "🌟 Well done! You're moving forward!";
  }
}

/**
 * Check if user deserves a bonus based on daily activity
 */
export function checkDailyBonus(
  tasksCompletedToday: number,
  sessionsToday: number,
  hasJournaledToday: boolean
): { hasBonus: boolean; bonusXP: number; reason: string } {
  const dailyGoals = {
    tasks: tasksCompletedToday >= 3,
    sessions: sessionsToday >= 1,
    journal: hasJournaledToday,
  };

  const completedGoals = Object.values(dailyGoals).filter(Boolean).length;

  if (completedGoals === 3) {
    return {
      hasBonus: true,
      bonusXP: BONUS_XP.completion.perfectDay,
      reason: '🎯 Perfect Day Bonus! All daily goals completed!',
    };
  } else if (completedGoals >= 2) {
    return {
      hasBonus: true,
      bonusXP: BONUS_XP.completion.dailyGoal,
      reason: '🎉 Daily Goal Bonus! Great consistency!',
    };
  }

  return { hasBonus: false, bonusXP: 0, reason: '' };
}
