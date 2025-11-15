'use client';

import type { TFunction } from 'i18next';
import type { LandingCopy } from './landing-content';

export function landingCopy(t: TFunction): LandingCopy {
  return t('landing', { returnObjects: true }) as LandingCopy;
}
