import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  SafeAreaView,
  Animated,
  ImageBackground,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/ui/icon-symbol';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function WelcomeScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Animated entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
  }, []);

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=1200&fit=crop&crop=center' }}
        style={styles.backgroundImage}
        blurRadius={2}
      >
        <View style={styles.overlay}>
          <Animated.View 
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {/* Logo Section */}
            <Animated.View 
              style={[
                styles.logoContainer,
                { transform: [{ scale: logoScale }] }
              ]}
            >
              <View style={styles.logoBackground}>
                <Text style={styles.logoText}>UpMindX</Text>
                <View style={styles.logoUnderline} />
              </View>
            </Animated.View>

            {/* Tagline */}
            <Text style={styles.tagline}>
              Transform your screen time into{'\n'}
              <Text style={styles.taglineHighlight}>growth time</Text>
            </Text>

            {/* Features */}
            <View style={styles.featuresContainer}>
              <FeatureItem 
                icon="play.rectangle.fill"
                title="TechTok Feed"
                description="Learn through engaging vertical videos"
              />
              <FeatureItem 
                icon="questionmark.circle.fill"
                title="Smart Questions"
                description="AI-powered learning reinforcement"
              />
              <FeatureItem 
                icon="leaf.fill"
                title="Growth Zones"
                description="Focus, chill, and reflect zones"
              />
            </View>
          </Animated.View>

          {/* Get Started Button */}
          <Animated.View 
            style={[
              styles.buttonContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Pressable 
              style={styles.getStartedButton}
              onPress={handleGetStarted}
            >
              <Text style={styles.buttonText}>Get Started</Text>
              <IconSymbol name="arrow.right" size={20} color="white" />
            </Pressable>

            <Text style={styles.disclaimer}>
              Join the dopamine-driven learning revolution
            </Text>
          </Animated.View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

interface FeatureItemProps {
  icon: string;
  title: string;
  description: string;
}

function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <IconSymbol name={icon} size={24} color="#6366F1" />
      </View>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: screenWidth,
    height: screenHeight,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'space-between',
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoBackground: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 30,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
    textAlign: 'center',
  },
  logoUnderline: {
    width: 120,
    height: 4,
    backgroundColor: '#6366F1',
    borderRadius: 2,
    marginTop: 8,
  },
  tagline: {
    fontSize: 24,
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 50,
    lineHeight: 32,
  },
  taglineHighlight: {
    fontWeight: 'bold',
    color: '#6366F1',
  },
  featuresContainer: {
    width: '100%',
    maxWidth: 320,
    gap: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  featureIcon: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  buttonContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  getStartedButton: {
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginBottom: 16,
    gap: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 200,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disclaimer: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
