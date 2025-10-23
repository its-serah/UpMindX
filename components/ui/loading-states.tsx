import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width: screenWidth } = Dimensions.get('window');

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
}

export function LoadingSpinner({ size = 'large', color, message }: LoadingSpinnerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const spinnerColor = color || colors.primary;

  return (
    <View style={styles.spinnerContainer}>
      <ActivityIndicator size={size} color={spinnerColor} />
      {message && (
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {message}
        </Text>
      )}
    </View>
  );
}

interface PulseLoaderProps {
  size?: number;
  color?: string;
  count?: number;
}

export function PulseLoader({ size = 8, color, count = 3 }: PulseLoaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const pulseColor = color || colors.primary;
  
  const animations = useMemo(() => 
    Array.from({ length: count }, () => new Animated.Value(0.3)),
    [count]
  );

  useEffect(() => {
    const createPulse = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const pulseAnimations = animations.map((anim, index) =>
      createPulse(anim, index * 200)
    );

    Animated.parallel(pulseAnimations).start();

    return () => {
      pulseAnimations.forEach(anim => anim.stop());
    };
  }, []);

  return (
    <View style={styles.pulseContainer}>
      {animations.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.pulseDot,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: pulseColor,
              opacity: anim,
            },
          ]}
        />
      ))}
    </View>
  );
}

interface SkeletonLoaderProps {
  width?: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}

export function SkeletonLoader({ width = '100%', height, borderRadius = BorderRadius.md, style }: SkeletonLoaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    shimmer.start();

    return () => shimmer.stop();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

interface VideoLoadingProps {
  message?: string;
}

export function VideoLoading({ message = 'Loading video...' }: VideoLoadingProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    breathe.start();

    return () => breathe.stop();
  }, []);

  return (
    <View style={styles.videoLoadingContainer}>
      <View style={styles.videoLoadingOverlay}>
        <Animated.View
          style={[
            styles.videoLoadingIcon,
            {
              backgroundColor: colors.primary,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Text style={styles.videoLoadingIconText}>📹</Text>
        </Animated.View>
        <Text style={[styles.videoLoadingText, { color: colors.text }]}>
          {message}
        </Text>
        <PulseLoader color={colors.primary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
  },
  pulseContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseDot: {
    // Dynamic styles applied inline
  },
  videoLoadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoLoadingOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.lg,
    maxWidth: screenWidth * 0.8,
  },
  videoLoadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoLoadingIconText: {
    fontSize: 32,
  },
  videoLoadingText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
