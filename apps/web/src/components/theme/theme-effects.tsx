'use client';

import React, { useEffect, useState } from 'react';
import Snowfall from 'react-snowfall';
import { motion } from 'framer-motion';

export type ThemeEffectType = 'none' | 'snow' | 'sakura' | 'glow';

interface ThemeEffectsProps {
  effect: ThemeEffectType;
}

const sakuraImage = typeof document !== 'undefined' ? new Image() : null;
if (sakuraImage) {
  sakuraImage.src =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAyMCI+PHBhdGggZmlsbD0iI2ZmYjdjNSIgZD0iTTEwIDBDNiA4IDIgMTAgMiAxNmMwIDMuMyAyLjcgNiA2IDZzNi0yLjcgNi02YzAtNi00LTgtNi0xNnoiIG9wYWNpdHk9IjAuOCIvPjwvc3ZnPg==';
}

const Firefly = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const width = window.innerWidth;
  const height = window.innerHeight;

  const randomX = Math.random() * width;
  const randomY = Math.random() * height;

  return (
    <motion.div
      initial={{
        x: randomX,
        y: randomY,
        opacity: 0,
        scale: 0.5,
      }}
      animate={{
        x: [
          Math.random() * width,
          Math.random() * width,
          Math.random() * width,
        ],
        y: [
          Math.random() * height,
          Math.random() * height,
          Math.random() * height,
        ],
        opacity: [0, 0.8, 0],
        scale: [0.5, 1.2, 0.5],
      }}
      transition={{
        duration: 15 + Math.random() * 20, // Slow movement (15-35s)
        repeat: Infinity,
        ease: 'linear',
        delay: Math.random() * 5,
      }}
      style={{
        position: 'fixed',
        width: '4px',
        height: '4px',
        borderRadius: '50%',
        backgroundColor: '#fbbf24', // Amber-400
        boxShadow: '0 0 8px 2px rgba(251, 191, 36, 0.4)',
        zIndex: 49,
        pointerEvents: 'none',
      }}
    />
  );
};

export function ThemeEffects({ effect }: ThemeEffectsProps) {
  const [images, setImages] = useState<HTMLImageElement[]>([]);

  useEffect(() => {
    if (effect === 'sakura' && sakuraImage) {
      setImages([sakuraImage]);
    } else {
      setImages([]);
    }
  }, [effect]);

  if (effect === 'none') return null;

  if (effect === 'snow') {
    return (
      <Snowfall
        snowflakeCount={150}
        radius={[0.5, 3.0]}
        speed={[0.5, 3.0]}
        wind={[-0.5, 2.0]}
        style={{
          position: 'fixed',
          width: '100vw',
          height: '100vh',
          zIndex: 50,
          pointerEvents: 'none',
        }}
      />
    );
  }

  if (effect === 'sakura') {
    return (
      <Snowfall
        snowflakeCount={50}
        radius={[5, 12]}
        speed={[0.5, 2.5]}
        wind={[-1, 3.0]}
        images={images}
        color="#ffb7b2"
        style={{
          position: 'fixed',
          width: '100vw',
          height: '100vh',
          zIndex: 50,
          pointerEvents: 'none',
        }}
      />
    );
  }

  if (effect === 'glow') {
    return (
      <>
        {Array.from({ length: 30 }).map((_, i) => (
          <Firefly key={i} />
        ))}
      </>
    );
  }

  return null;
}
