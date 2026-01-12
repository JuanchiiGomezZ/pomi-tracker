import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/shared/utils/storage';
import type { Block, SuggestedLoop, DEFAULT_BLOCKS, CreateBlockDto } from '../types';

interface OnboardingStoreState {
  // Current step (0-indexed, total steps = 4)
  currentStep: number;
  totalSteps: number;

  // Step 1: Name
  firstName: string;

  // Step 2: Blocks
  blocks: Block[];
  originalDefaultBlocks: typeof DEFAULT_BLOCKS;

  // Step 3: Loops
  selectedLoops: SuggestedLoop[];

  // Step 4: Reminders
  dayCloseEnabled: boolean;
  dayCloseHour: number;
  blockRemindersEnabled: boolean;

  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  setFirstName: (name: string) => void;

  updateBlock: (id: string, updates: Partial<Block>) => void;
  addBlock: (block: Block) => void;
  removeBlock: (id: string) => void;
  resetBlocks: () => void;

  toggleLoop: (loop: SuggestedLoop) => void;
  setSelectedLoops: (loops: SuggestedLoop[]) => void;

  setDayCloseEnabled: (enabled: boolean) => void;
  setDayCloseHour: (hour: number) => void;
  setBlockRemindersEnabled: (enabled: boolean) => void;

  reset: () => void;

  // Computed
  canProceed: () => boolean;
  getProgress: () => number;
}

const initialState = {
  currentStep: 0,
  totalSteps: 4,
  firstName: '',
  blocks: [],
  originalDefaultBlocks: [] as typeof DEFAULT_BLOCKS,
  selectedLoops: [],
  dayCloseEnabled: true,
  dayCloseHour: 21,
  blockRemindersEnabled: true,
};

export const useOnboardingStore = create<OnboardingStoreState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStep: (step) => set({ currentStep: step }),

      nextStep: () => {
        const { currentStep, totalSteps, canProceed } = get();
        if (canProceed() && currentStep < totalSteps - 1) {
          set({ currentStep: currentStep + 1 });
        }
      },

      prevStep: () => {
        const { currentStep } = get();
        if (currentStep > 0) {
          set({ currentStep: currentStep - 1 });
        }
      },

      setFirstName: (firstName) => set({ firstName }),

      updateBlock: (id, updates) => {
        const { blocks } = get();
        set({
          blocks: blocks.map((block) =>
            block.id === id ? { ...block, ...updates } : block
          ),
        });
      },

      addBlock: (block) => {
        const { blocks } = get();
        set({ blocks: [...blocks, block] });
      },

      removeBlock: (id) => {
        const { blocks } = get();
        set({ blocks: blocks.filter((block) => block.id !== id) });
      },

      resetBlocks: () => {
        const { originalDefaultBlocks } = get();
        // Convert default blocks to temporary blocks with temp IDs
        const tempBlocks: Block[] = originalDefaultBlocks.map((defaultBlock: CreateBlockDto, index: number) => ({
          id: `temp-${index}`,
          name: defaultBlock.name || '',
          description: defaultBlock.description,
          icon: defaultBlock.icon,
          color: defaultBlock.color,
          sortOrder: defaultBlock.sortOrder ?? index,
          activeDays: defaultBlock.activeDays ?? [0, 1, 2, 3, 4, 5, 6],
          reminderEnabled: defaultBlock.reminderEnabled ?? false,
          reminderHour: defaultBlock.reminderHour,
          userId: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        set({ blocks: tempBlocks });
      },

      toggleLoop: (loop) => {
        const { selectedLoops } = get();
        const exists = selectedLoops.some((l) => l.id === loop.id);
        if (exists) {
          set({ selectedLoops: selectedLoops.filter((l) => l.id !== loop.id) });
        } else {
          set({ selectedLoops: [...selectedLoops, loop] });
        }
      },

      setSelectedLoops: (loops) => set({ selectedLoops: loops }),

      setDayCloseEnabled: (enabled) => set({ dayCloseEnabled: enabled }),
      setDayCloseHour: (hour) => set({ dayCloseHour: hour }),
      setBlockRemindersEnabled: (enabled) => set({ blockRemindersEnabled: enabled }),

      reset: () => set(initialState),

      canProceed: () => {
        const { currentStep, firstName, blocks } = get();
        switch (currentStep) {
          case 0: // Name step
            return firstName.trim().length > 0;
          case 1: // Blocks step
            return blocks.length >= 1;
          case 2: // Loops step
            return true; // Optional, can proceed with empty
          case 3: // Reminders step
            return true; // Can proceed with defaults
          default:
            return true;
        }
      },

      getProgress: () => {
        const { currentStep, totalSteps } = get();
        return ((currentStep + 1) / totalSteps) * 100;
      },
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        currentStep: state.currentStep,
        firstName: state.firstName,
        blocks: state.blocks,
        selectedLoops: state.selectedLoops,
        dayCloseEnabled: state.dayCloseEnabled,
        dayCloseHour: state.dayCloseHour,
        blockRemindersEnabled: state.blockRemindersEnabled,
      }),
    }
  )
);
