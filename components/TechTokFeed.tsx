import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Animated,
  Modal,
} from 'react-native';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  TapGestureHandler,
  State,
} from 'react-native-gesture-handler';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';

// Add keyboard event listener interface
declare global {
  interface Window {
    addEventListener: (type: string, listener: (event: KeyboardEvent) => void) => void;
    removeEventListener: (type: string, listener: (event: KeyboardEvent) => void) => void;
  }
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;

interface TechVideo {
  id: string;
  title: string;
  uri: string;
  thumbnail?: string;
  description: string;
  techStack: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'coding' | 'startup' | 'interview' | 'career';
  questions: string[];
}

interface PopupQuestion {
  question: string;
  options: string[];
  correctAnswer?: number;
  explanation?: string;
}

interface ZoneAction {
  id: string;
  title: string;
  emoji: string;
  route: string;
  color: string;
  description: string;
}

// Mock tech videos for MVP
const MOCK_TECH_VIDEOS: TechVideo[] = [
  {
    id: '1',
    title: 'React Native Tutorial - Building Your First App',
    uri: require('../assets/videos/video1.mp4'),
    description: 'Learn the basics of React Native development',
    techStack: ['React Native', 'JavaScript', 'Mobile Development'],
    difficulty: 'beginner',
    category: 'coding',
    questions: [
      'What is the main advantage of React Native?',
      'Which companies use React Native in production?',
      'How does React Native differ from native development?',
      'What is JSX in React Native?',
      'How do you handle navigation in React Native?',
    ],
  },
  {
    id: '2',
    title: 'Startup Pitch Deck Breakdown',
    uri: require('../assets/videos/video1.mp4'),
    description: 'Analyzing successful startup pitch decks',
    techStack: ['Business', 'Fundraising', 'Strategy'],
    difficulty: 'intermediate',
    category: 'startup',
    questions: [
      'What are the key elements of a pitch deck?',
      'How much traction should you show investors?',
      'What\'s the ideal pitch deck length?',
      'When should you reveal your business model?',
      'How do you address market size effectively?',
    ],
  },
  {
    id: '3',
    title: 'System Design Interview - Scaling to 1M Users',
    uri: require('../assets/videos/video1.mp4'),
    description: 'System design interview preparation',
    techStack: ['System Design', 'Architecture', 'Scalability'],
    difficulty: 'advanced',
    category: 'interview',
    questions: [
      'How would you handle database scaling?',
      'What\'s the difference between vertical and horizontal scaling?',
      'When would you use a CDN?',
      'How do you design for high availability?',
      'What are the trade-offs of microservices vs monolith?',
    ],
  },
  {
    id: '4',
    title: 'JavaScript ES6+ Features Every Developer Should Know',
    uri: require('../assets/videos/video1.mp4'),
    description: 'Master modern JavaScript features and syntax',
    techStack: ['JavaScript', 'ES6', 'Frontend'],
    difficulty: 'intermediate',
    category: 'coding',
    questions: [
      'What is the difference between let, const, and var?',
      'How do arrow functions differ from regular functions?',
      'What are template literals and how do you use them?',
      'How does destructuring assignment work?',
      'What is the spread operator used for?',
    ],
  },
  {
    id: '5',
    title: 'Building Your Personal Brand as a Developer',
    uri: require('../assets/videos/video1.mp4'),
    description: 'Stand out in the competitive tech job market',
    techStack: ['Career', 'Branding', 'LinkedIn'],
    difficulty: 'beginner',
    category: 'career',
    questions: [
      'What should your GitHub profile showcase?',
      'How often should you post on LinkedIn?',
      'What makes a good developer portfolio project?',
      'How do you network effectively in tech?',
      'What content should you share to build authority?',
    ],
  },
  {
    id: '6',
    title: 'Mental Health in Tech - Avoiding Burnout',
    uri: require('../assets/videos/video1.mp4'),
    description: 'Maintaining wellness while building your career',
    techStack: ['Wellness', 'Mental Health', 'Work-Life Balance'],
    difficulty: 'beginner',
    category: 'career',
    questions: [
      'What are early signs of developer burnout?',
      'How do you set healthy boundaries with work?',
      'What\'s the importance of taking regular breaks?',
      'How can you manage imposter syndrome?',
      'What are effective stress management techniques?',
    ],
  },
  {
    id: '7',
    title: 'Docker Containers Explained Simply',
    uri: require('../assets/videos/video1.mp4'),
    description: 'Understanding containerization for modern development',
    techStack: ['Docker', 'DevOps', 'Containers'],
    difficulty: 'intermediate',
    category: 'coding',
    questions: [
      'What problem does Docker solve?',
      'How is a container different from a virtual machine?',
      'What is a Dockerfile and how do you write one?',
      'How do you manage multi-container applications?',
      'What are Docker volumes used for?',
    ],
  },
  {
    id: '8',
    title: 'Negotiating Your Tech Salary Like a Pro',
    uri: require('../assets/videos/video1.mp4'),
    description: 'Get paid what you\'re worth in the tech industry',
    techStack: ['Salary', 'Negotiation', 'Career'],
    difficulty: 'intermediate',
    category: 'career',
    questions: [
      'When is the best time to negotiate salary?',
      'What research should you do before negotiating?',
      'How do you counter a lowball offer professionally?',
      'What benefits should you consider beyond base salary?',
      'How do you negotiate remote work arrangements?',
    ],
  },
];

const ZONE_ACTIONS: ZoneAction[] = [
  {
    id: 'pomodoro',
    title: 'Focus Sprint',
    emoji: '🍅',
    route: '/pomodoro/session',
    color: '#FF6B35',
    description: 'Time to deep focus',
  },
  {
    id: 'chill',
    title: 'Chill Zone',
    emoji: '🧘‍♀️',
    route: '/chill',
    color: '#4CAF50',
    description: 'Reset your mind',
  },
  {
    id: 'journal',
    title: 'Brain Dump',
    emoji: '📝',
    route: '/journal/index',
    color: '#9C27B0',
    description: 'Process your thoughts',
  },
  {
    id: 'tasks',
    title: 'Growth Tasks',
    emoji: '🚀',
    route: '/tasks',
    color: '#2196F3',
    description: 'Level up your skills',
  },
];

interface TechTokFeedProps {
  videos?: TechVideo[];
}

export default function TechTokFeed({ videos = MOCK_TECH_VIDEOS }: TechTokFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [showRedLock, setShowRedLock] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<PopupQuestion | null>(null);
  const [isMuted, setIsMuted] = useState(true); // Start muted
  const [showZoneActions, setShowZoneActions] = useState(false);
  
  // Animations
  const translateY = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const popupScale = useRef(new Animated.Value(0)).current;
  const zoneActionsAnim = useRef(new Animated.Value(0)).current;
  const redLockAnim = useRef(new Animated.Value(0)).current;
  
  // Video player
  const player = useVideoPlayer(videos[currentIndex]?.uri, (player) => {
    player.loop = true;
    player.play();
    player.muted = isMuted;
  });
  
  // Update player when video changes
  useEffect(() => {
    if (player && videos[currentIndex]) {
      player.replace(videos[currentIndex].uri);
      player.muted = isMuted;
      player.play();
    }
  }, [currentIndex, isMuted, player, videos]);
  
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Start question timer for current video
    startQuestionTimer();
    return () => {
      if (questionTimerRef.current) {
        clearTimeout(questionTimerRef.current);
      }
    };
  }, [currentIndex]);

  // Keyboard controls for laptop
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
          handleSwipeUp();
          break;
        case 'ArrowDown':
          handleSwipeDown();
          break;
        case ' ': // Spacebar to toggle mute
          event.preventDefault();
          toggleMute();
          break;
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyPress);
      return () => {
        window.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, [currentIndex]);

  const startQuestionTimer = () => {
    if (questionTimerRef.current) {
      clearTimeout(questionTimerRef.current);
    }
    
    // Show question after 10-30 seconds of watching
    const delay = Math.random() * 20000 + 10000;
    questionTimerRef.current = setTimeout(() => {
      showRandomQuestion();
    }, delay);
  };

  const showRandomQuestion = () => {
    const currentVideo = videos[currentIndex];
    const randomQuestion = currentVideo.questions[
      Math.floor(Math.random() * currentVideo.questions.length)
    ];
    
    const popup: PopupQuestion = {
      question: randomQuestion,
      options: generateQuestionOptions(randomQuestion, currentVideo),
    };
    
    // First show red lock screen
    setShowRedLock(true);
    Animated.timing(redLockAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      // After 1.5 seconds, show the question
      setTimeout(() => {
        setCurrentQuestion(popup);
        setShowPopup(true);
        setShowRedLock(false);
        redLockAnim.setValue(0);
        
        Animated.spring(popupScale, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
      }, 1500);
    });
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const generateQuestionOptions = (question: string, video: TechVideo): string[] => {
    // Mock options - in real app, AI would generate these
    const genericOptions = [
      'Option A - This could be right',
      'Option B - Maybe this one',
      'Option C - Or perhaps this',
      'Skip Question',
    ];
    return genericOptions;
  };

  const handleQuestionAnswer = (optionIndex: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (optionIndex === 3) { // Skip option
      closePopup();
      return;
    }
    
    // Show zone actions after answering
    closePopup();
    setTimeout(() => {
      showZoneActionsPopup();
    }, 500);
  };

  const goToChillZone = () => {
    closeZoneActions();
    router.push('/chill');
  };

  const showZoneActionsPopup = () => {
    setShowZoneActions(true);
    Animated.spring(zoneActionsAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const closePopup = () => {
    Animated.timing(popupScale, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowPopup(false);
      setCurrentQuestion(null);
    });
  };

  const closeZoneActions = () => {
    Animated.timing(zoneActionsAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowZoneActions(false);
      startQuestionTimer(); // Start timer for next question
    });
  };

  const handleZoneAction = (action: ZoneAction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    closeZoneActions();
    router.push(action.route as any);
  };

  const handleSwipeUp = () => {
    if (currentIndex < videos.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -screenHeight,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentIndex(prev => prev + 1);
        translateY.setValue(screenHeight);
        
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  };

  const handleSwipeDown = () => {
    if (currentIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: screenHeight,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentIndex(prev => prev - 1);
        translateY.setValue(-screenHeight);
        
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  };

  const onPanGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onPanHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationY, velocityY } = event.nativeEvent;
      
      if (translationY < -SWIPE_THRESHOLD || velocityY < -500) {
        handleSwipeUp();
      } else if (translationY > SWIPE_THRESHOLD || velocityY > 500) {
        handleSwipeDown();
      } else {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    if (player) {
      player.muted = newMutedState;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const currentVideo = videos[currentIndex];

  return (
    <GestureHandlerRootView style={styles.container}>
      <PanGestureHandler
        onGestureEvent={onPanGestureEvent}
        onHandlerStateChange={onPanHandlerStateChange}
      >
        <Animated.View
          style={[
            styles.videoContainer,
            {
              transform: [
                { translateY },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <VideoView
            style={styles.video}
            player={player}
            contentFit="cover"
            allowsFullscreen={false}
            allowsPictureInPicture={false}
          />
          
          {/* Clean Video Overlay */}
          <View style={styles.overlay}>
            {/* Just a mute button in corner */}
            <Pressable style={styles.muteButton} onPress={toggleMute}>
              <IconSymbol 
                name={isMuted ? "speaker.slash.fill" : "speaker.wave.2.fill"} 
                size={20} 
                color="white" 
              />
            </Pressable>
            
            {/* Progress Indicators */}
            <View style={styles.progressContainer}>
              {videos.map((_, index) => (
                <View 
                  key={index}
                  style={[
                    styles.progressDot,
                    index === currentIndex && styles.progressDotActive
                  ]}
                />
              ))}
            </View>
          </View>
        </Animated.View>
      </PanGestureHandler>

      {/* Red Lock Screen */}
      <Modal transparent visible={showRedLock} animationType="none">
        <Animated.View 
          style={[
            styles.redLockOverlay,
            { opacity: redLockAnim }
          ]}
        >
          <View style={styles.lockContainer}>
            <IconSymbol name="lock.fill" size={80} color="white" />
            <Text style={styles.lockText}>Question Coming Up...</Text>
          </View>
        </Animated.View>
      </Modal>

      {/* Question Popup */}
      <Modal transparent visible={showPopup} animationType="none">
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.questionPopup,
              { transform: [{ scale: popupScale }] }
            ]}
          >
            <Text style={styles.questionTitle}>Quick Question! 🤔</Text>
            <Text style={styles.questionText}>{currentQuestion?.question}</Text>
            
            <View style={styles.optionsContainer}>
              {currentQuestion?.options.map((option, index) => (
                <Pressable
                  key={index}
                  style={[
                    styles.optionButton,
                    index === 3 && styles.skipButton
                  ]}
                  onPress={() => handleQuestionAnswer(index)}
                >
                  <Text style={[
                    styles.optionText,
                    index === 3 && styles.skipText
                  ]}>
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Zone Actions Popup */}
      <Modal transparent visible={showZoneActions} animationType="none">
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.zoneActionsPopup,
              { transform: [{ scale: zoneActionsAnim }] }
            ]}
          >
            <Text style={styles.zoneTitle}>What do you want to do next? 🚀</Text>
            
            <View style={styles.twoButtonContainer}>
              <Pressable style={styles.continueButton} onPress={closeZoneActions}>
                <Text style={styles.continueText}>Continue Watching 📹</Text>
              </Pressable>
              
              <Pressable style={styles.chillButton} onPress={goToChillZone}>
                <Text style={styles.chillText}>Go to Chill Zone 🧘‍♀️</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    width: screenWidth,
    height: screenHeight,
  },
  video: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 20,
  },
  muteButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 20,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressDotActive: {
    backgroundColor: 'white',
    width: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  redLockOverlay: {
    flex: 1,
    backgroundColor: '#FF0000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockContainer: {
    alignItems: 'center',
  },
  lockText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
  },
  questionPopup: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 350,
  },
  questionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  questionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 12,
  },
  skipButton: {
    backgroundColor: '#E0E0E0',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  skipText: {
    color: '#666',
  },
  zoneActionsPopup: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 350,
  },
  zoneTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  twoButtonContainer: {
    gap: 16,
  },
  continueButton: {
    backgroundColor: '#2196F3',
    padding: 18,
    borderRadius: 12,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  chillButton: {
    backgroundColor: '#4CAF50',
    padding: 18,
    borderRadius: 12,
  },
  chillText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
});
