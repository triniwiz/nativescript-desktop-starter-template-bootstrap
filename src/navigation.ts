import { ref } from 'nativescript-vue';
import type { IconName } from './icons';

export type ScreenId = 'home' | 'playground' | 'components';

export const screens: { id: ScreenId; label: string; icon: IconName }[] = [
  { id: 'home', label: 'Home', icon: 'house' },
  { id: 'playground', label: 'Playground', icon: 'sliders' },
  { id: 'components', label: 'Components', icon: 'grid-1x2' },
];

/** The screen the app shell shows. Set it to navigate. */
export const currentScreen = ref<ScreenId>('home');
