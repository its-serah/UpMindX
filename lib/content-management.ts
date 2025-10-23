import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persist, createJSONStorage } from 'zustand/middleware';

// Video Content Management
export interface Video {
  id: string;
  title: string;
  description: string;
  uri: string;
  thumbnail?: string;
  duration: number; // in seconds
  techStack: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'coding' | 'startup' | 'interview' | 'career' | 'mental-health';
  tags: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
  questions: string[];
  transcript?: string;
  prerequisites: string[];
  learningObjectives: string[];
  relatedVideos: string[];
}

export interface VideoProgress {
  videoId: string;
  watchedDuration: number; // in seconds
  completed: boolean;
  lastWatched: string;
  questionsAnswered: number;
  questionsCorrect: number;
  bookmarked: boolean;
  rating?: number; // 1-5 stars
  notes?: string;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  videoIds: string[];
  prerequisites: string[];
  learningOutcomes: string[];
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  authorId?: string;
}

export interface LearningPathProgress {
  pathId: string;
  startedAt: string;
  completedVideoIds: string[];
  currentVideoIndex: number;
  estimatedCompletionDate: string;
  completed: boolean;
  completedAt?: string;
}

interface ContentState {
  videos: Video[];
  videoProgress: VideoProgress[];
  learningPaths: LearningPath[];
  learningPathProgress: LearningPathProgress[];
  bookmarks: string[];
  recentlyWatched: string[];
  personalizedRecommendations: string[];
  lastRecommendationUpdate: string;
}

interface ContentStore extends ContentState {
  // Video Management
  addVideo: (video: Video) => void;
  updateVideo: (id: string, updates: Partial<Video>) => void;
  deleteVideo: (id: string) => void;
  getVideo: (id: string) => Video | undefined;
  getVideosByCategory: (category: string) => Video[];
  getVideosByDifficulty: (difficulty: string) => Video[];
  searchVideos: (query: string) => Video[];
  
  // Video Progress
  updateVideoProgress: (progress: Partial<VideoProgress> & { videoId: string }) => void;
  getVideoProgress: (videoId: string) => VideoProgress | undefined;
  markVideoCompleted: (videoId: string) => void;
  getCompletedVideos: () => string[];
  getWatchTime: (videoId: string) => number;
  
  // Bookmarks
  toggleBookmark: (videoId: string) => void;
  getBookmarkedVideos: () => Video[];
  
  // Learning Paths
  addLearningPath: (path: LearningPath) => void;
  updateLearningPath: (id: string, updates: Partial<LearningPath>) => void;
  deleteLearningPath: (id: string) => void;
  getLearningPath: (id: string) => LearningPath | undefined;
  
  // Learning Path Progress
  startLearningPath: (pathId: string) => void;
  updateLearningPathProgress: (pathId: string, updates: Partial<LearningPathProgress>) => void;
  completeLearningPath: (pathId: string) => void;
  getLearningPathProgress: (pathId: string) => LearningPathProgress | undefined;
  
  // Recommendations
  updateRecommendations: (videoIds: string[]) => void;
  getRecommendedVideos: () => Video[];
  getPersonalizedContent: (userId: string, preferences: any) => string[];
  
  // Recent Activity
  addToRecentlyWatched: (videoId: string) => void;
  getRecentlyWatched: () => Video[];
  
  // Analytics
  getMostWatchedVideos: (limit?: number) => { video: Video; watchCount: number }[];
  getAverageCompletionRate: () => number;
  getUserEngagementStats: () => {
    totalWatchTime: number;
    averageSessionLength: number;
    videoCompletionRate: number;
    pathCompletionRate: number;
  };
}

const initialContentState: ContentState = {
  videos: [],
  videoProgress: [],
  learningPaths: [],
  learningPathProgress: [],
  bookmarks: [],
  recentlyWatched: [],
  personalizedRecommendations: [],
  lastRecommendationUpdate: '',
};

export const useContentStore = create<ContentStore>()(
  persist(
    (set, get) => ({
      ...initialContentState,
      
      // Video Management
      addVideo: (video) => {
        set((state) => ({
          ...state,
          videos: [...state.videos, video],
        }));
      },
      
      updateVideo: (id, updates) => {
        set((state) => ({
          ...state,
          videos: state.videos.map(v => 
            v.id === id ? { ...v, ...updates, updatedAt: new Date().toISOString() } : v
          ),
        }));
      },
      
      deleteVideo: (id) => {
        set((state) => ({
          ...state,
          videos: state.videos.filter(v => v.id !== id),
          videoProgress: state.videoProgress.filter(vp => vp.videoId !== id),
          bookmarks: state.bookmarks.filter(b => b !== id),
          recentlyWatched: state.recentlyWatched.filter(r => r !== id),
        }));
      },
      
      getVideo: (id) => {
        return get().videos.find(v => v.id === id);
      },
      
      getVideosByCategory: (category) => {
        return get().videos.filter(v => v.category === category);
      },
      
      getVideosByDifficulty: (difficulty) => {
        return get().videos.filter(v => v.difficulty === difficulty);
      },
      
      searchVideos: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().videos.filter(v => 
          v.title.toLowerCase().includes(lowerQuery) ||
          v.description.toLowerCase().includes(lowerQuery) ||
          v.techStack.some(tech => tech.toLowerCase().includes(lowerQuery)) ||
          v.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
      },
      
      // Video Progress
      updateVideoProgress: (progress) => {
        set((state) => {
          const existingIndex = state.videoProgress.findIndex(vp => vp.videoId === progress.videoId);
          const updatedProgress = {
            ...progress,
            lastWatched: new Date().toISOString(),
          };
          
          if (existingIndex >= 0) {
            const newProgress = [...state.videoProgress];
            newProgress[existingIndex] = { ...newProgress[existingIndex], ...updatedProgress };
            return { ...state, videoProgress: newProgress };
          } else {
            return {
              ...state,
              videoProgress: [...state.videoProgress, updatedProgress as VideoProgress],
            };
          }
        });
      },
      
      getVideoProgress: (videoId) => {
        return get().videoProgress.find(vp => vp.videoId === videoId);
      },
      
      markVideoCompleted: (videoId) => {
        get().updateVideoProgress({
          videoId,
          completed: true,
          lastWatched: new Date().toISOString(),
        });
        get().addToRecentlyWatched(videoId);
      },
      
      getCompletedVideos: () => {
        return get().videoProgress.filter(vp => vp.completed).map(vp => vp.videoId);
      },
      
      getWatchTime: (videoId) => {
        const progress = get().getVideoProgress(videoId);
        return progress?.watchedDuration || 0;
      },
      
      // Bookmarks
      toggleBookmark: (videoId) => {
        set((state) => {
          const isBookmarked = state.bookmarks.includes(videoId);
          return {
            ...state,
            bookmarks: isBookmarked
              ? state.bookmarks.filter(b => b !== videoId)
              : [...state.bookmarks, videoId],
          };
        });
        
        // Update video progress
        get().updateVideoProgress({
          videoId,
          bookmarked: !get().bookmarks.includes(videoId),
        });
      },
      
      getBookmarkedVideos: () => {
        const state = get();
        return state.bookmarks.map(id => state.videos.find(v => v.id === id)).filter(Boolean) as Video[];
      },
      
      // Learning Paths
      addLearningPath: (path) => {
        set((state) => ({
          ...state,
          learningPaths: [...state.learningPaths, path],
        }));
      },
      
      updateLearningPath: (id, updates) => {
        set((state) => ({
          ...state,
          learningPaths: state.learningPaths.map(lp =>
            lp.id === id ? { ...lp, ...updates, updatedAt: new Date().toISOString() } : lp
          ),
        }));
      },
      
      deleteLearningPath: (id) => {
        set((state) => ({
          ...state,
          learningPaths: state.learningPaths.filter(lp => lp.id !== id),
          learningPathProgress: state.learningPathProgress.filter(lpp => lpp.pathId !== id),
        }));
      },
      
      getLearningPath: (id) => {
        return get().learningPaths.find(lp => lp.id === id);
      },
      
      // Learning Path Progress
      startLearningPath: (pathId) => {
        const path = get().getLearningPath(pathId);
        if (!path) return;
        
        const progress: LearningPathProgress = {
          pathId,
          startedAt: new Date().toISOString(),
          completedVideoIds: [],
          currentVideoIndex: 0,
          estimatedCompletionDate: new Date(Date.now() + path.estimatedHours * 60 * 60 * 1000).toISOString(),
          completed: false,
        };
        
        set((state) => ({
          ...state,
          learningPathProgress: [...state.learningPathProgress, progress],
        }));
      },
      
      updateLearningPathProgress: (pathId, updates) => {
        set((state) => ({
          ...state,
          learningPathProgress: state.learningPathProgress.map(lpp =>
            lpp.pathId === pathId ? { ...lpp, ...updates } : lpp
          ),
        }));
      },
      
      completeLearningPath: (pathId) => {
        get().updateLearningPathProgress(pathId, {
          completed: true,
          completedAt: new Date().toISOString(),
        });
      },
      
      getLearningPathProgress: (pathId) => {
        return get().learningPathProgress.find(lpp => lpp.pathId === pathId);
      },
      
      // Recommendations
      updateRecommendations: (videoIds) => {
        set((state) => ({
          ...state,
          personalizedRecommendations: videoIds,
          lastRecommendationUpdate: new Date().toISOString(),
        }));
      },
      
      getRecommendedVideos: () => {
        const state = get();
        return state.personalizedRecommendations
          .map(id => state.videos.find(v => v.id === id))
          .filter(Boolean) as Video[];
      },
      
      getPersonalizedContent: (userId, preferences) => {
        const state = get();
        const { preferredCategories, difficulty } = preferences.learning || {};
        
        // Simple recommendation algorithm based on preferences and progress
        const availableVideos = state.videos.filter(video => {
          const isPreferredCategory = preferredCategories?.includes(video.category) ?? true;
          const isAppropiateDifficulty = difficulty === 'mixed' || video.difficulty === difficulty;
          const notCompleted = !get().getCompletedVideos().includes(video.id);
          
          return isPreferredCategory && isAppropiateDifficulty && notCompleted;
        });
        
        // Sort by relevance (this could be more sophisticated)
        return availableVideos
          .sort((a, b) => {
            // Prioritize videos in preferred categories
            const aScore = preferredCategories?.includes(a.category) ? 2 : 1;
            const bScore = preferredCategories?.includes(b.category) ? 2 : 1;
            return bScore - aScore;
          })
          .slice(0, 20)
          .map(v => v.id);
      },
      
      // Recent Activity
      addToRecentlyWatched: (videoId) => {
        set((state) => ({
          ...state,
          recentlyWatched: [
            videoId,
            ...state.recentlyWatched.filter(id => id !== videoId)
          ].slice(0, 10), // Keep last 10
        }));
      },
      
      getRecentlyWatched: () => {
        const state = get();
        return state.recentlyWatched
          .map(id => state.videos.find(v => v.id === id))
          .filter(Boolean) as Video[];
      },
      
      // Analytics
      getMostWatchedVideos: (limit = 10) => {
        const state = get();
        const watchCounts: { [videoId: string]: number } = {};
        
        state.videoProgress.forEach(progress => {
          watchCounts[progress.videoId] = (watchCounts[progress.videoId] || 0) + 1;
        });
        
        return Object.entries(watchCounts)
          .map(([videoId, watchCount]) => ({
            video: state.videos.find(v => v.id === videoId),
            watchCount,
          }))
          .filter(item => item.video)
          .sort((a, b) => b.watchCount - a.watchCount)
          .slice(0, limit) as { video: Video; watchCount: number }[];
      },
      
      getAverageCompletionRate: () => {
        const progress = get().videoProgress;
        if (progress.length === 0) return 0;
        
        const completed = progress.filter(p => p.completed).length;
        return completed / progress.length;
      },
      
      getUserEngagementStats: () => {
        const state = get();
        const progress = state.videoProgress;
        
        const totalWatchTime = progress.reduce((acc, p) => acc + p.watchedDuration, 0);
        const averageSessionLength = progress.length > 0 ? totalWatchTime / progress.length : 0;
        
        const completedVideos = progress.filter(p => p.completed).length;
        const videoCompletionRate = progress.length > 0 ? completedVideos / progress.length : 0;
        
        const completedPaths = state.learningPathProgress.filter(lpp => lpp.completed).length;
        const pathCompletionRate = state.learningPathProgress.length > 0 
          ? completedPaths / state.learningPathProgress.length : 0;
        
        return {
          totalWatchTime,
          averageSessionLength,
          videoCompletionRate,
          pathCompletionRate,
        };
      },
    }),
    {
      name: 'upmindx-content',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
