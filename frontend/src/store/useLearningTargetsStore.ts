import { create } from 'zustand';
import { LearningTarget, LearningTargetStatus } from '../types/learning-target.types';

// Mock data for learning targets
const mockLearningTargets: LearningTarget[] = [
  {
    id: '1',
    userId: 'current-user',
    courseId: 'course-1',
    topicName: 'JavaScript Promises',
    status: LearningTargetStatus.NOT_STARTED,
    isNewTopic: true,
    source: 'ai_proposal',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    userId: 'current-user',
    courseId: 'course-1',
    topicName: 'React Hooks',
    status: LearningTargetStatus.IN_PROGRESS,
    isNewTopic: false,
    source: 'manual',
    notes: 'Focus on useEffect and useMemo',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    userId: 'current-user',
    courseId: 'course-1',
    topicName: 'TypeScript Generics',
    status: LearningTargetStatus.COMPLETED,
    isNewTopic: false,
    source: 'manual',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    userId: 'current-user',
    courseId: 'course-2',
    topicName: 'CSS Grid Layout',
    status: LearningTargetStatus.NOT_STARTED,
    isNewTopic: false,
    source: 'manual',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

interface LearningTargetsState {
  targets: LearningTarget[];
  isLoading: boolean;
  error: string | null;
  selectedCourseId: string | null;
  
  // Actions
  fetchTargets: (userId: string, courseId?: string) => Promise<void>;
  createTarget: (target: Omit<LearningTarget, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTarget: (id: string, updates: Partial<LearningTarget>) => Promise<void>;
  deleteTarget: (id: string) => Promise<void>;
  setSelectedCourseId: (courseId: string | null) => void;
  getTargetsByCourseId: (courseId: string) => LearningTarget[];
  getTargetsByStatus: (status: LearningTargetStatus) => LearningTarget[];
}

export const useLearningTargetsStore = create<LearningTargetsState>((set, get) => ({
  targets: [],
  isLoading: false,
  error: null,
  selectedCourseId: null,

  fetchTargets: async (userId: string, courseId?: string) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Filter mock data based on courseId if provided
      const filteredTargets = courseId 
        ? mockLearningTargets.filter(t => t.courseId === courseId)
        : mockLearningTargets;
      
      set({ targets: filteredTargets, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch learning targets', isLoading: false });
      console.error('Error fetching learning targets:', error);
    }
  },

  createTarget: async (target) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newTarget: LearningTarget = {
        ...target,
        id: Date.now().toString(), // Generate a temporary ID
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      set(state => ({ 
        targets: [...state.targets, newTarget],
        isLoading: false 
      }));
    } catch (error) {
      set({ error: 'Failed to create learning target', isLoading: false });
      console.error('Error creating learning target:', error);
    }
  },

  updateTarget: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      set(state => ({ 
        targets: state.targets.map(target => 
          target.id === id ? { ...target, ...updates, updatedAt: new Date() } : target
        ),
        isLoading: false 
      }));
    } catch (error) {
      set({ error: 'Failed to update learning target', isLoading: false });
      console.error('Error updating learning target:', error);
    }
  },

  deleteTarget: async (id) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      set(state => ({ 
        targets: state.targets.filter(target => target.id !== id),
        isLoading: false 
      }));
    } catch (error) {
      set({ error: 'Failed to delete learning target', isLoading: false });
      console.error('Error deleting learning target:', error);
    }
  },

  setSelectedCourseId: (courseId) => {
    set({ selectedCourseId: courseId });
  },

  getTargetsByCourseId: (courseId) => {
    return get().targets.filter(target => target.courseId === courseId);
  },

  getTargetsByStatus: (status) => {
    const { targets, selectedCourseId } = get();
    
    let filteredTargets = targets.filter(target => target.status === status);
    
    if (selectedCourseId) {
      filteredTargets = filteredTargets.filter(target => target.courseId === selectedCourseId);
    }
    
    return filteredTargets;
  },
}));
