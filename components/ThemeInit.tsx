'use client';

import { StoreInit } from 'flowbite-react/store/init';

export const CONFIG = {
  dark: true,
  prefix: '',
  version: 4 as const,
};

export function ThemeInit() {
  return <StoreInit {...CONFIG} />;
}
