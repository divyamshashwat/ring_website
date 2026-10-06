'use client';

import { useProgress } from '@react-three/drei';
import { useEffect } from 'react';
import { useUI } from '@/lib/store/ui';

/** Forwards three.js loading progress to the DOM loader. */
export default function ProgressReporter() {
  const progress = useProgress((s) => s.progress);
  const setProgress = useUI((s) => s.setProgress);
  useEffect(() => setProgress(progress / 100), [progress, setProgress]);
  return null;
}
