'use client';
import { useEffect, useState } from 'react';

/** Persisted client state (bag, wishlist) renders only after hydration. */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
