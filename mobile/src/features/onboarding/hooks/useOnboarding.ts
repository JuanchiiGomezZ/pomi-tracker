import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { onboardingApi } from '../services/onboarding.service';
import type { Block, CreateBlockDto, OnboardingUserSettings, SuggestedLoop, DEFAULT_BLOCKS } from '../types';

// Hook to update user profile during onboarding
export function useUpdateOnboardingProfile() {
  return useMutation({
    mutationFn: (data: OnboardingUserSettings) => onboardingApi.updateProfile(data),
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.response?.data?.message || 'Failed to save profile',
      });
    },
  });
}

// Hook to update user settings during onboarding
export function useUpdateOnboardingSettings() {
  return useMutation({
    mutationFn: (data: {
      timezone?: string;
      dayCutoffHour?: number;
      dayCloseReminderEnabled?: boolean;
      dayCloseReminderHour?: number;
    }) => onboardingApi.updateSettings(data),
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.response?.data?.message || 'Failed to save settings',
      });
    },
  });
}

// Hook to create a block during onboarding
export function useCreateOnboardingBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (blockData: CreateBlockDto) => onboardingApi.createBlock(blockData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
      Toast.show({
        type: 'success',
        text1: 'Block created',
      });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.response?.data?.message || 'Failed to create block',
      });
    },
  });
}

// Hook to create default blocks during onboarding
export function useCreateOnboardingBlocks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (blocks: CreateBlockDto[]) => onboardingApi.createBlocks(blocks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
      Toast.show({
        type: 'success',
        text1: 'Blocks created',
      });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.response?.data?.message || 'Failed to create blocks',
      });
    },
  });
}

// Hook to create loops for suggested habits
export function useCreateOnboardingLoop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ blockId, loop }: { blockId: string; loop: SuggestedLoop }) =>
      onboardingApi.createLoop(blockId, {
        name: loop.name,
        description: loop.description,
        icon: loop.icon,
        color: loop.color,
        targetCount: loop.targetCount,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
      Toast.show({
        type: 'success',
        text1: 'Loop created',
      });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.response?.data?.message || 'Failed to create loop',
      });
    },
  });
}

// Hook to complete onboarding - creates all defaults at once
export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  const createProfile = useUpdateOnboardingProfile();
  const createSettings = useUpdateOnboardingSettings();
  const createBlocks = useCreateOnboardingBlocks();
  const createLoops = useCreateOnboardingLoop();

  return useMutation({
    mutationFn: async ({
      firstName,
      settings,
      defaultBlocks,
      selectedLoops,
      targetBlockName = 'Morning',
    }: {
      firstName: string;
      settings: {
        timezone?: string;
        dayCutoffHour?: number;
        dayCloseReminderEnabled?: boolean;
        dayCloseReminderHour?: number;
      };
      defaultBlocks: CreateBlockDto[];
      selectedLoops: SuggestedLoop[];
      targetBlockName?: string;
    }) => {
      // 1. Update profile
      await createProfile.mutateAsync({ firstName });

      // 2. Update settings
      await createSettings.mutateAsync(settings);

      // 3. Create blocks
      const blocks = await createBlocks.mutateAsync(defaultBlocks) as Block[];

      // 4. Find target block for loops
      const targetBlock = blocks.find((b: Block) => b.name === targetBlockName) || blocks[0];

      // 5. Create selected loops in target block
      if (selectedLoops.length > 0 && targetBlock) {
        await Promise.all(
          selectedLoops.map((loop) =>
            createLoops.mutateAsync({ blockId: targetBlock.id, loop })
          )
        );
      }

      return blocks;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      Toast.show({
        type: 'success',
        text1: 'Onboarding completed!',
      });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.response?.data?.message || 'Failed to complete onboarding',
      });
    },
  });
}
