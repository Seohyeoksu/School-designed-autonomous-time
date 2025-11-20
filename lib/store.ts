import { create } from 'zustand';
import { ProjectData } from '@/types';

interface StoreState {
  currentStep: number;
  data: ProjectData;
  setStep: (step: number) => void;
  updateData: (newData: Partial<ProjectData>) => void;
  resetData: () => void;
}

const initialData: ProjectData = {
  school_type: '초등학교',
  grades: [],
  subjects: [],
  activity_name: '',
  requirements: '',
  total_hours: 34,
  semester: [],
};

export const useStore = create<StoreState>((set) => ({
  currentStep: 1,
  data: initialData,
  setStep: (step) => set({ currentStep: step }),
  updateData: (newData) =>
    set((state) => ({
      data: { ...state.data, ...newData },
    })),
  resetData: () => set({ data: initialData, currentStep: 1 }),
}));
