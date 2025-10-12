import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Animated,
  Alert,
} from 'react-native';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  TapGestureHandler,
  State,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_HEIGHT = screenHeight * 0.85;
const SWIPE_THRESHOLD = 120;

interface GrowthCard {
  id: string;
  type: 'interview' | 'mindset' | 'rejection' | 'mini-task';
  title: string;
  content: string;
  xpReward: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

interface TikTokFeedProps {
  cards: GrowthCard[];
  onCardComplete: (cardId: string) => void;
  onLoadMore: () => void;
}

export default function TikTokFeed({ cards, onCardComplete, onLoadMore }: TikTokFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showXPBurst, setShowXPBurst] = useState(false);
  
  // Animations
  const translateY = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const likeScale = useRef(new Animated.Value(0)).current;
  const xpBurstAnim = useRef(new Animated.Value(0)).current;
  const floatingXP = useRef(new Animated.Value(0)).current;

  const getCardColor = (type: string) => {
    switch (type) {
      case 'interview': return '#2196F3';
      case 'mindset': return '#4CAF50';
      case 'rejection': return '#E91E63';
      case 'mini-task': return '#FF9800';
      default: return '#666';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#F44336';
      default: return '#666';
    }
  };

  const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'medium') => {
    const hapticMap = {
      light: Haptics.ImpactFeedbackStyle.Light,
      medium: Haptics.ImpactFeedbackStyle.Medium,
      heavy: Haptics.ImpactFeedbackStyle.Heavy,
    };
    Haptics.impactAsync(hapticMap[type]);
  };

  const animateXPBurst = () => {
    setShowXPBurst(true);
    
    // Animate floating XP
    Animated.sequence([
      Animated.parallel([
        Animated.timing(xpBurstAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(floatingXP, {
          toValue: -100,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(xpBurstAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowXPBurst(false);
      floatingXP.setValue(0);
    });
  };

  const handleDoubleTap = () => {
    setIsLiked(true);
    triggerHapticFeedback('heavy');
    
    // Animate heart scale
    Animated.sequence([
      Animated.timing(likeScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(800),
      Animated.timing(likeScale, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setIsLiked(false));
  };

  const handleSwipeUp = () => {
    if (currentIndex < cards.length - 1) {
      triggerHapticFeedback('light');
      
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -CARD_HEIGHT,
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
        translateY.setValue(CARD_HEIGHT);
        
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

      // Load more cards when approaching end
      if (currentIndex >= cards.length - 3) {
        onLoadMore();
      }
    }
  };

  const handleSwipeDown = () => {
    if (currentIndex > 0) {
      triggerHapticFeedback('light');
      
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: CARD_HEIGHT,
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
        translateY.setValue(-CARD_HEIGHT);
        
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

  const handleSwipeToGrow = (card: GrowthCard) => {
    triggerHapticFeedback('heavy');
    animateXPBurst();
    
    setTimeout(() => {
      router.push(`/task/${card.id}` as any);
    }, 500);
  };

  const onPanGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onPanHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationY, velocityY } = event.nativeEvent;
      
      if (translationY < -SWIPE_THRESHOLD || velocityY < -500) {
        // Swipe up - next card
        handleSwipeUp();
      } else if (translationY > SWIPE_THRESHOLD || velocityY > 500) {
        // Swipe down - previous card
        handleSwipeDown();
      } else {
        // Snap back
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  if (!cards.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Loading growth cards...</Text>
      </View>
    );
  }

  const currentCard = cards[currentIndex];
  if (!currentCard) return null;

  return (
    <GestureHandlerRootView style={styles.container}>
      <PanGestureHandler
        onGestureEvent={onPanGestureEvent}
        onHandlerStateChange={onPanHandlerStateChange}
      >
        <Animated.View
          style={[
            styles.cardContainer,
            {
              transform: [
                { translateY },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <TapGestureHandler
            numberOfTaps={2}
            onHandlerStateChange={(e) => 
              e.nativeEvent.state === State.ACTIVE && handleDoubleTap()
            }
          >
            <Animated.View style={styles.card}>
              {/* Background Gradient */}
              <View style={[styles.cardBackground, { backgroundColor: getCardColor(currentCard.type) + '15' }]} />
              
              {/* Card Content */}
              <View style={styles.cardContent}>
                {/* Category Badge */}
                <View style={styles.topSection}>
                  <View style={[styles.categoryBadge, { backgroundColor: getCardColor(currentCard.type) }]}>
                    <Text style={styles.categoryText}>{currentCard.category}</Text>
                  </View>
                  <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(currentCard.difficulty) }]}>
                    <Text style={styles.difficultyText}>{currentCard.difficulty.toUpperCase()}</Text>
                  </View>
                </View>

                {/* Main Content */}
                <View style={styles.mainContent}>
                  <Text style={styles.cardTitle}>{currentCard.title}</Text>
                  <Text style={styles.cardDescription}>{currentCard.content}</Text>
                </View>

                {/* Action Section */}
                <View style={styles.actionSection}>
                  <View style={styles.xpContainer}>
                    <IconSymbol name="star.fill" size={24} color="#FFD700" />
                    <Text style={styles.xpText}>+{currentCard.xpReward} XP</Text>
                  </View>
                  
                  <Pressable 
                    style={[styles.growButton, { backgroundColor: getCardColor(currentCard.type) }]}
                    onPress={() => handleSwipeToGrow(currentCard)}
                  >
                    <Text style={styles.growButtonText}>Swipe to Grow</Text>
                    <IconSymbol name="arrow.up" size={20} color="white" />
                  </Pressable>
                </View>

                {/* Progress Indicators */}
                <View style={styles.progressContainer}>
                  {cards.slice(Math.max(0, currentIndex - 1), currentIndex + 3).map((_, index) => (
                    <View 
                      key={index}
                      style={[
                        styles.progressDot,
                        index === 1 && styles.progressDotActive
                      ]}
                    />
                  ))}
                </View>
              </View>

              {/* Double Tap Heart Animation */}
              {isLiked && (
                <Animated.View 
                  style={[
                    styles.likeHeart,
                    { transform: [{ scale: likeScale }] }
                  ]}
                >
                  <IconSymbol name="heart.fill" size={80} color="#FF1744" />
                </Animated.View>
              )}

              {/* XP Burst Animation */}
              {showXPBurst && (
                <Animated.View 
                  style={[
                    styles.xpBurst,
                    { 
                      opacity: xpBurstAnim,
                      transform: [{ translateY: floatingXP }]
                    }
                  ]}
                >
                  <Text style={styles.xpBurstText}>+{currentCard.xpReward} XP!</Text>
                  <View style={styles.sparkles}>
                    <Text style={styles.sparkle}>✨</Text>
                    <Text style={styles.sparkle}>⭐</Text>
                    <Text style={styles.sparkle}>💫</Text>
                  </View>
                </Animated.View>
              )}

              {/* Swipe Hint */}
              <View style={styles.swipeHint}>
                <Text style={styles.swipeHintText}>👆 Swipe up for next</Text>
              </View>
            </Animated.View>
          </TapGestureHandler>
        </Animated.View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
  },
  cardContainer: {
    flex: 1,
    width: screenWidth,
    height: CARD_HEIGHT,
    alignSelf: 'center',
  },
  card: {
    flex: 1,
    margin: 20,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  cardBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  cardTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 38,
  },
  cardDescription: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  actionSection: {
    alignItems: 'center',
    gap: 20,
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  xpText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  growButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  growButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  progressDotActive: {
    backgroundColor: '#333',
    width: 24,
  },
  likeHeart: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -40,
    marginLeft: -40,
    zIndex: 10,
  },
  xpBurst: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  xpBurstText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  sparkles: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  sparkle: {
    fontSize: 24,
  },
  swipeHint: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  swipeHintText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
});
