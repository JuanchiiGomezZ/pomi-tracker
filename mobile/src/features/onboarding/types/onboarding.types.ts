// Onboarding Types
export interface Block {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder: number;
  activeDays: number[]; // 0-6, 0=Sunday, 6=Saturday
  reminderEnabled: boolean;
  reminderHour?: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBlockDto {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  activeDays?: number[];
  reminderEnabled?: boolean;
  reminderHour?: number;
  sortOrder?: number;
}

export interface UpdateBlockDto extends Partial<CreateBlockDto> {
  id: string;
}

export interface Loop {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  targetCount: number;
  userId: string;
  blockId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLoopDto {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  targetCount?: number;
  blockId: string;
}

export interface SuggestedLoop {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  targetCount: number;
}

// User settings for onboarding
export interface OnboardingUserSettings {
  firstName?: string;
  lastName?: string;
  timezone?: string;
  dayCutoffHour?: number;
  dayCloseReminderEnabled?: boolean;
  dayCloseReminderHour?: number;
}

// Onboarding state
export interface OnboardingState {
  step: number;
  totalSteps: number;
  userData: {
    firstName: string;
  };
  blocks: Block[];
  selectedLoops: SuggestedLoop[];
  reminders: {
    dayCloseEnabled: boolean;
    dayCloseHour: number;
    blockRemindersEnabled: boolean;
  };
  isCompleted: boolean;
}

export const SUGGESTED_LOOPS: SuggestedLoop[] = [
  {
    id: 'drink-water',
    name: 'Drink water',
    description: 'Stay hydrated throughout the day',
    icon: '💧',
    color: '#3B82F6',
    targetCount: 8,
  },
  {
    id: 'workout',
    name: 'Workout',
    description: 'Daily exercise or physical activity',
    icon: '💪',
    color: '#10B981',
    targetCount: 1,
  },
  {
    id: 'plan-top-task',
    name: 'Plan top task',
    description: 'Identify your most important task',
    icon: '📋',
    color: '#F59E0B',
    targetCount: 1,
  },
  {
    id: 'no-phone-sleep',
    name: 'No phone before sleep',
    description: 'Avoid screens 1 hour before bed',
    icon: '📵',
    color: '#8B5CF6',
    targetCount: 1,
  },
  {
    id: 'read',
    name: 'Read',
    description: 'Read for 15+ minutes',
    icon: '📚',
    color: '#EC4899',
    targetCount: 1,
  },
  {
    id: 'meditate',
    name: 'Meditate',
    description: 'Mindfulness or meditation session',
    icon: '🧘',
    color: '#06B6D4',
    targetCount: 1,
  },
];

export const DEFAULT_BLOCKS: Omit<CreateBlockDto, 'userId'>[] = [
  {
    name: 'Morning',
    description: 'Start your day right',
    icon: '🌅',
    color: '#F59E0B',
    activeDays: [0, 1, 2, 3, 4, 5, 6],
    sortOrder: 0,
  },
  {
    name: 'Workload',
    description: 'Your main tasks',
    icon: '💼',
    color: '#3B82F6',
    activeDays: [0, 1, 2, 3, 4, 5, 6],
    sortOrder: 1,
  },
  {
    name: 'Night',
    description: 'Wind down and reflect',
    icon: '🌙',
    color: '#8B5CF6',
    activeDays: [0, 1, 2, 3, 4, 5, 6],
    sortOrder: 2,
  },
];
