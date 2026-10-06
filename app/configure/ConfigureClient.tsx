'use client';

import { useState } from 'react';
import Configurator from '@/components/configurator/Configurator';
import { configFromSearch } from '@/lib/store/configurator';

/** Reads the shared configuration from the URL (?stone=moonga&metal=…) on the client. */
export default function ConfigureClient() {
  const [initial] = useState(() => (typeof window === 'undefined' ? undefined : configFromSearch(new URLSearchParams(window.location.search))));
  return <Configurator initial={initial} syncUrl headingLevel="h1" />;
}
