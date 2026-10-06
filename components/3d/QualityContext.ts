'use client';
import { createContext, useContext } from 'react';
import type { QualityTier } from '@/lib/3d/quality';

export const QualityContext = createContext<QualityTier>('high');
export const useQuality = () => useContext(QualityContext);
