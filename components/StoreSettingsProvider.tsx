'use client';

import React, { createContext, useContext } from 'react';
import type { Setting } from '@/lib/store-types';

const StoreSettingsContext = createContext<Setting | null>(null);

export function StoreSettingsProvider({
  settings,
  children,
}: {
  settings: Setting;
  children: React.ReactNode;
}) {
  return (
    <StoreSettingsContext.Provider value={settings}>{children}</StoreSettingsContext.Provider>
  );
}

export function useStoreSettings(fallback: Setting): Setting {
  return useContext(StoreSettingsContext) ?? fallback;
}
