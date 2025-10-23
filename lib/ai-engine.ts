import { getMistralClient, type ContentGenerationRequest, type LearningPathRequest, type CoachingRequest } from './mistral-api';
import { configManager } from './config';
import { useXPStore, useSessionStore, useTaskStore, useJournalStore } from './store';
import { useUserProfileStore, useAnalyticsStore } from './user-profile';
import { useContentStore } from './content-management';
import { useCoachStore, type UserContext } from './ai-coach';

/**
 * AI Engine - Central orchestration system for all AI features
 * Integrates content generation, learning paths, coaching, and analytics
 */
class AIEngine {
  private static instance: AIEngine;
  
  private constructor() {}
  
  public static getInstance(): AIEngine {
    if (!AIEngine.instance) {
      AIEngine.instance = new AIEngine();
    }
    return AIEngine.instance;
  }

  /**
   * Generate personalized learning content based on user progress
   */
  async generatePersonalizedContent(topic: string, difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate') {
    try {
      const mistralClient = getMistralClient();
      if (!mistralClient || !configManager.isMistralEnabled()) {
        return this.generateFallbackContent(topic, difficulty);
      }

      const userProfile = useUserProfileStore.getState();
      const contentStore = useContentStore.getState();

      const request: ContentGenerationRequest = {
        topic,
        difficulty,
        format: 'explanation',
        userContext: {
          currentLevel: this.calculateUserLevel(),
          completedTopics: contentStore.getCompletedVideos(),
          strugglingAreas: this.identifyStruggleAreas(),
          learningStyle: userProfile.preferences.learning.difficulty === 'mixed' ? 'reading' : 'visual',
        },
        maxLength: 1000,
      };

      const content = await mistralClient.generateContent(request);
      
      // Track content generation
      this.trackAIUsage('content_generation', { topic, difficulty });
      
      return content;
    } catch (error) {
      console.error('Error generating personalized content:', error);
      return this.generateFallbackContent(topic, difficulty);
    }
  }

  /**
   * Create adaptive learning path based on user goals and progress
   */
  async createAdaptiveLearningPath(goalTopic: string, timeframe: string = '4 weeks') {
    try {
      const mistralClient = getMistralClient();
      if (!mistralClient || !configManager.isMistralEnabled()) {
        return this.generateFallbackLearningPath(goalTopic, timeframe);
      }

      const userProfile = useUserProfileStore.getState();
      const contentStore = useContentStore.getState();
      const xpStore = useXPStore.getState();

      const currentLevel = this.determineCurrentLevel(xpStore.totalXP);
      const targetLevel = currentLevel === 'beginner' ? 'intermediate' : 
                         currentLevel === 'intermediate' ? 'advanced' : 'expert';

      const request: LearningPathRequest = {
        goalTopic,
        currentLevel,
        targetLevel,
        timeframe,
        availableTime: `${userProfile.preferences.learning.dailyGoalMinutes} minutes daily`,
        userHistory: {
          completedTopics: contentStore.getCompletedVideos(),
          strugglingAreas: this.identifyStruggleAreas(),
          preferredCategories: userProfile.preferences.learning.preferredCategories,
        },
      };

      const learningPath = await mistralClient.generateLearningPath(request);
      
      // Store the learning path
      contentStore.addLearningPath({
        id: `ai_path_${Date.now()}`,
        title: learningPath.title,
        description: learningPath.description,
        icon: '🎯',
        color: '#6366F1',
        difficulty: currentLevel,
        estimatedHours: this.parseTimeToHours(learningPath.totalDuration),
        videoIds: [], // Will be populated as content is created
        prerequisites: learningPath.prerequisites,
        learningOutcomes: learningPath.skillsGained,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPublic: false,
      });

      this.trackAIUsage('learning_path_generation', { goalTopic, timeframe });
      
      return learningPath;
    } catch (error) {
      console.error('Error creating adaptive learning path:', error);
      return this.generateFallbackLearningPath(goalTopic, timeframe);
    }
  }

  /**
   * Generate intelligent coaching responses
   */
  async generateCoachingResponse(userMessage: string, sessionType: 'check-in' | 'guidance' | 'motivation' | 'problem-solving' = 'guidance') {
    try {
      const mistralClient = getMistralClient();
      if (!mistralClient || !configManager.isMistralEnabled()) {
        return this.generateFallbackCoachingResponse(userMessage);
      }

      const userProfile = useUserProfileStore.getState();
      const sessionStore = useSessionStore.getState();
      const coachStore = useCoachStore.getState();

      const request: CoachingRequest = {
        userMessage,
        context: {
          currentStreak: sessionStore.currentStreak,
          recentProgress: this.getRecentProgress(),
          moodHistory: this.getMoodHistory(),
          learningGoals: userProfile.goals.monthly.skillsToLearn,
          currentChallenges: this.identifyCurrentChallenges(),
        },
        coachingStyle: coachStore.coachPersonality,
        sessionType,
      };

      const response = await mistralClient.generateCoachingResponse(request);
      
      this.trackAIUsage('coaching_response', { sessionType, messageLength: userMessage.length });
      
      return response;
    } catch (error) {
      console.error('Error generating coaching response:', error);
      return this.generateFallbackCoachingResponse(userMessage);
    }
  }

  /**
   * Analyze user progress and provide insights
   */
  async analyzeUserProgress() {
    try {
      const mistralClient = getMistralClient();
      if (!mistralClient || !configManager.isMistralEnabled()) {
        return this.generateFallbackProgressAnalysis();
      }

      const progressData = this.collectProgressData();
      const analysis = await mistralClient.analyzeProgress(progressData);
      
      // Generate insights for the coach store
      const coachStore = useCoachStore.getState();
      const insights = analysis.insights.map((insight: string, index: number) => ({
        id: `ai_insight_${Date.now()}_${index}`,
        type: 'recommendation' as const,
        title: 'AI Analysis',
        description: insight,
        severity: 'medium' as const,
        actionable: true,
        suggestedActions: analysis.recommendations.slice(index, index + 2),
        generatedAt: new Date().toISOString(),
        acknowledged: false,
      }));

      // Add insights to coach store
      insights.forEach(insight => {
        if (!coachStore.insights.some(existing => existing.description === insight.description)) {
          coachStore.insights.push(insight);
        }
      });

      this.trackAIUsage('progress_analysis', { insightsGenerated: insights.length });
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing user progress:', error);
      return this.generateFallbackProgressAnalysis();
    }
  }

  /**
   * Generate contextual recommendations based on user activity
   */
  async generateContextualRecommendations(context: 'after_video' | 'daily_checkin' | 'streak_broken' | 'goal_achieved') {
    const userProfile = useUserProfileStore.getState();
    const sessionStore = useSessionStore.getState();
    const contentStore = useContentStore.getState();

    const recommendations = [];

    switch (context) {
      case 'after_video':
        if (Math.random() > 0.7) { // 30% chance
          const relatedContent = await this.generatePersonalizedContent(
            userProfile.preferences.learning.preferredCategories[0] || 'React Native',
            'intermediate'
          );
          recommendations.push({
            type: 'content',
            title: 'Continue Learning',
            description: `Explore: ${relatedContent.title}`,
            action: () => {/* Navigate to content */},
          });
        }
        break;

      case 'daily_checkin':
        if (sessionStore.currentStreak >= 7) {
          recommendations.push({
            type: 'milestone',
            title: 'Week Streak Achievement!',
            description: 'You\'re on fire! Consider setting a bigger challenge.',
            action: () => {/* Show achievement */},
          });
        }
        break;

      case 'streak_broken':
        const supportContent = await this.generateCoachingResponse(
          'I broke my learning streak and feeling discouraged',
          'motivation'
        );
        recommendations.push({
          type: 'support',
          title: 'Get Back on Track',
          description: supportContent.message,
          action: () => {/* Start coach session */},
        });
        break;

      case 'goal_achieved':
        const nextPath = await this.createAdaptiveLearningPath(
          'Advanced ' + userProfile.goals.monthly.skillsToLearn[0],
          '2 weeks'
        );
        recommendations.push({
          type: 'progression',
          title: 'Ready for More?',
          description: `Try: ${nextPath.title}`,
          action: () => {/* Start learning path */},
        });
        break;
    }

    this.trackAIUsage('contextual_recommendations', { context, count: recommendations.length });
    
    return recommendations;
  }

  /**
   * Smart question difficulty adjustment
   */
  adjustQuestionDifficulty(userAccuracy: number, currentDifficulty: 'easy' | 'medium' | 'hard') {
    if (userAccuracy > 0.8 && currentDifficulty !== 'hard') {
      return currentDifficulty === 'easy' ? 'medium' : 'hard';
    } else if (userAccuracy < 0.5 && currentDifficulty !== 'easy') {
      return currentDifficulty === 'hard' ? 'medium' : 'easy';
    }
    return currentDifficulty;
  }

  /**
   * Predict optimal learning times based on user activity
   */
  predictOptimalLearningTimes() {
    const analyticsStore = useAnalyticsStore.getState();
    const events = analyticsStore.events.filter(e => e.event === 'session_start');
    
    if (events.length < 5) {
      return ['09:00', '19:00']; // Default suggestions
    }

    // Analyze patterns in session start times
    const hourCounts: { [hour: number]: number } = {};
    events.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    // Find top 3 most active hours
    const topHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour.padStart(2, '0')}:00`);

    return topHours;
  }

  // Private helper methods
  private calculateUserLevel(): number {
    const xpStore = useXPStore.getState();
    return Math.min(Math.floor(xpStore.totalXP / 1000) + 1, 10);
  }

  private identifyStruggleAreas(): string[] {
    const contentStore = useContentStore.getState();
    const analyticsStore = useAnalyticsStore.getState();

    // Analyze completion rates by category
    const completionByCategory: { [key: string]: { total: number; completed: number } } = {};
    
    contentStore.videoProgress.forEach(progress => {
      const video = contentStore.getVideo(progress.videoId);
      if (video) {
        const category = video.category;
        if (!completionByCategory[category]) {
          completionByCategory[category] = { total: 0, completed: 0 };
        }
        completionByCategory[category].total++;
        if (progress.completed) {
          completionByCategory[category].completed++;
        }
      }
    });

    // Find categories with low completion rates
    return Object.entries(completionByCategory)
      .filter(([, stats]) => stats.total >= 3 && stats.completed / stats.total < 0.6)
      .map(([category]) => category);
  }

  private determineCurrentLevel(totalXP: number): 'beginner' | 'intermediate' | 'advanced' {
    if (totalXP < 500) return 'beginner';
    if (totalXP < 2000) return 'intermediate';
    return 'advanced';
  }

  private parseTimeToHours(duration: string): number {
    const match = duration.match(/(\d+)\s*(week|month|day)/i);
    if (!match) return 20; // Default

    const [, num, unit] = match;
    const number = parseInt(num);
    
    switch (unit.toLowerCase()) {
      case 'week': return number * 10; // 10 hours per week
      case 'month': return number * 40; // 40 hours per month
      case 'day': return number * 2; // 2 hours per day
      default: return 20;
    }
  }

  private getRecentProgress() {
    const taskStore = useTaskStore.getState();
    const sessionStore = useSessionStore.getState();
    
    return [
      ...taskStore.taskHistory.slice(-5),
      { type: 'session', data: { currentStreak: sessionStore.currentStreak } },
    ];
  }

  private getMoodHistory() {
    const journalStore = useJournalStore.getState();
    return journalStore.entries.slice(0, 7).map(entry => ({
      date: entry.createdAt.split('T')[0],
      mood: entry.mood,
    }));
  }

  private identifyCurrentChallenges(): string[] {
    const strugglingAreas = this.identifyStruggleAreas();
    const sessionStore = useSessionStore.getState();
    
    const challenges = [...strugglingAreas];
    
    if (sessionStore.currentStreak === 0) {
      challenges.push('Maintaining consistency');
    }
    
    if (sessionStore.getTodaySessionCount() === 0) {
      challenges.push('Starting daily sessions');
    }
    
    return challenges;
  }

  private collectProgressData() {
    const xpStore = useXPStore.getState();
    const sessionStore = useSessionStore.getState();
    const taskStore = useTaskStore.getState();
    const contentStore = useContentStore.getState();

    return {
      xp: xpStore,
      sessions: sessionStore,
      tasks: taskStore.getTasksCompletedToday(),
      videoProgress: contentStore.videoProgress.slice(-10),
      strugglingAreas: this.identifyStruggleAreas(),
      completionRate: contentStore.getAverageCompletionRate(),
    };
  }

  private trackAIUsage(feature: string, metadata: any) {
    const analyticsStore = useAnalyticsStore.getState();
    analyticsStore.trackEvent('ai_feature_used', {
      feature,
      ...metadata,
      timestamp: new Date().toISOString(),
    });
  }

  // Fallback generators
  private generateFallbackContent(topic: string, difficulty: string) {
    return {
      title: `Understanding ${topic}`,
      content: `Here's a ${difficulty} level overview of ${topic}...`,
      keyPoints: [`Key concepts of ${topic}`, 'Practical applications', 'Best practices'],
      nextSteps: ['Practice with examples', 'Build a project', 'Join community discussions'],
      relatedTopics: ['Related topic 1', 'Related topic 2'],
      estimatedReadTime: 5,
    };
  }

  private generateFallbackLearningPath(goalTopic: string, timeframe: string) {
    return {
      title: `${goalTopic} Learning Path`,
      description: `Master ${goalTopic} in ${timeframe}`,
      totalDuration: timeframe,
      milestones: [
        {
          week: 1,
          topic: 'Fundamentals',
          description: 'Build strong foundation',
          resources: ['Documentation', 'Tutorials'],
          practiceExercises: ['Basic exercises'],
          successCriteria: ['Understand core concepts'],
        },
      ],
      prerequisites: ['Basic programming knowledge'],
      skillsGained: [goalTopic],
    };
  }

  private generateFallbackCoachingResponse(userMessage: string) {
    return {
      message: 'I understand what you\'re saying. Let\'s work through this together!',
      mood: 'supportive' as const,
      actionItems: ['Break it into smaller steps', 'Focus on progress over perfection'],
      resources: ['Learning resources'],
      followUpQuestions: ['What specific area would you like to focus on?'],
      moodAssessment: 'neutral' as const,
      recommendedActivities: ['Take a short break', 'Review your recent progress'],
    };
  }

  private generateFallbackProgressAnalysis() {
    return {
      insights: ['You\'re making consistent progress', 'Your dedication is showing results'],
      recommendations: ['Keep up the momentum', 'Consider tackling more challenging content'],
      nextGoals: ['Set a new milestone', 'Explore advanced topics'],
      strengths: ['Consistency', 'Completion rate'],
      improvementAreas: ['Time management', 'Deep focus'],
    };
  }
}

// Export singleton instance
export const aiEngine = AIEngine.getInstance();
export default aiEngine;
