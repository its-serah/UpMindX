import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  emoji: string;
  color: string;
}

interface ParticleEffectProps {
  trigger: boolean;
  type?: 'success' | 'xp' | 'celebration' | 'love';
  onComplete?: () => void;
}

const PARTICLE_CONFIGS = {
  success: {
    emojis: ['✨', '⭐', '🌟', '💫', '✅'],
    colors: ['#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B'],
    count: 12,
  },
  xp: {
    emojis: ['💎', '⚡', '🔥', '💥', '✨'],
    colors: ['#FFD700', '#FFA500', '#FF6B35', '#FF1744'],
    count: 15,
  },
  celebration: {
    emojis: ['🎉', '🎊', '🎈', '🥳', '🌟', '✨', '🎆'],
    colors: ['#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3'],
    count: 20,
  },
  love: {
    emojis: ['❤️', '💖', '💕', '💝', '🌹'],
    colors: ['#FF1744', '#E91E63', '#F06292', '#F48FB1'],
    count: 10,
  },
};

export default function ParticleEffect({ 
  trigger, 
  type = 'success', 
  onComplete 
}: ParticleEffectProps) {
  const particlesRef = useRef<Particle[]>([]);
  const config = PARTICLE_CONFIGS[type];

  useEffect(() => {
    if (trigger) {
      createParticles();
    }
  }, [trigger]);

  const createParticles = () => {
    const particles: Particle[] = [];
    
    for (let i = 0; i < config.count; i++) {
      const particle: Particle = {
        id: i,
        x: new Animated.Value(screenWidth / 2),
        y: new Animated.Value(screenHeight / 2),
        scale: new Animated.Value(0),
        opacity: new Animated.Value(1),
        emoji: config.emojis[Math.floor(Math.random() * config.emojis.length)],
        color: config.colors[Math.floor(Math.random() * config.colors.length)],
      };
      particles.push(particle);
    }
    
    particlesRef.current = particles;
    animateParticles();
  };

  const animateParticles = () => {
    const animations = particlesRef.current.map((particle) => {
      const angle = (Math.PI * 2 * particle.id) / config.count;
      const distance = 100 + Math.random() * 150;
      const finalX = screenWidth / 2 + Math.cos(angle) * distance;
      const finalY = screenHeight / 2 + Math.sin(angle) * distance - Math.random() * 200;

      return Animated.parallel([
        // Scale up then down
        Animated.sequence([
          Animated.timing(particle.scale, {
            toValue: 0.8 + Math.random() * 0.6,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(particle.scale, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        // Move outward
        Animated.timing(particle.x, {
          toValue: finalX,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(particle.y, {
          toValue: finalY,
          duration: 1000,
          useNativeDriver: true,
        }),
        // Fade out
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(animations).start(() => {
      onComplete?.();
    });
  };

  if (!trigger) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particlesRef.current.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { scale: particle.scale },
              ],
              opacity: particle.opacity,
            },
          ]}
        >
          <Animated.Text style={[styles.emoji, { color: particle.color }]}>
            {particle.emoji}
          </Animated.Text>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  particle: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
