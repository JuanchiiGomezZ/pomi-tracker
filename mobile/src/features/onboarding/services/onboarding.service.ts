import { api } from '@/shared/lib/api';
import type { Block, CreateBlockDto, OnboardingUserSettings } from '../types';

// Helper to extract data from backend response wrapper
const extractData = <T>(response: any): T => {
  // Backend wraps responses in { success, data, timestamp }
  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return response.data.data as T;
  }
  return response.data;
};

export const onboardingApi = {
  // Update user profile (firstName)
  updateProfile: async (data: OnboardingUserSettings) => {
    const response = await api.patch('/users/me', {
      firstName: data.firstName,
      lastName: data.lastName,
    });
    return extractData(response);
  },

  // Update user settings (timezone, dayCutoffHour, reminders)
  updateSettings: async (data: {
    timezone?: string;
    dayCutoffHour?: number;
    dayCloseReminderEnabled?: boolean;
    dayCloseReminderHour?: number;
  }) => {
    const response = await api.patch('/users/me/settings', data);
    return extractData(response);
  },

  // Create a block
  createBlock: async (blockData: CreateBlockDto) => {
    const response = await api.post<Block>('/blocks', blockData);
    return extractData<Block>(response);
  },

  // Create multiple blocks
  createBlocks: async (blocks: CreateBlockDto[]): Promise<Block[]> => {
    const responses = await Promise.all(
      blocks.map((block, index) =>
        api.post<Block>('/blocks', { ...block, sortOrder: index })
      )
    );
    return responses.map((r) => extractData<Block>(r));
  },

  // Update a block
  updateBlock: async (id: string, data: Partial<CreateBlockDto>) => {
    const response = await api.patch<Block>(`/blocks/${id}`, data);
    return extractData<Block>(response);
  },

  // Delete a block
  deleteBlock: async (id: string) => {
    const response = await api.delete(`/blocks/${id}`);
    return extractData(response);
  },

  // Reorder blocks
  reorderBlocks: async (blockIds: string[]) => {
    const response = await api.post('/blocks/reorder', { blockIds });
    return extractData(response);
  },

  // Get all blocks
  getBlocks: async (): Promise<Block[]> => {
    const response = await api.get<Block[]>('/blocks');
    return extractData<Block[]>(response);
  },

  // Create a loop in a block
  createLoop: async (blockId: string, loopData: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    targetCount?: number;
  }) => {
    const response = await api.post(`/blocks/${blockId}/loops`, loopData);
    return extractData(response);
  },
};
