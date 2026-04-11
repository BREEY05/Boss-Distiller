import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BossSkill {
  id: string;
  name: string;
  modelName: string; // The ollama model name, e.g. "boss_skill_1"
  template: string;
  description: string;
  createdAt: number;
}

export interface Task {
  id: string;
  skillName: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  files: number;
  createdAt: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  intent?: string; // AI analysis intent
  suggestion?: string; // AI suggestion for reply
}

export interface ChatSession {
  id: string;
  skillId: string;
  messages: ChatMessage[];
  updatedAt: number;
}

interface AppState {
  // Settings
  ollamaUrl: string;
  setOllamaUrl: (url: string) => void;
  baseModel: string;
  setBaseModel: (model: string) => void;

  // Skills
  skills: BossSkill[];
  addSkill: (skill: BossSkill) => void;
  removeSkill: (id: string) => void;

  // Tasks
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTaskProgress: (id: string, progress: number, status: Task['status']) => void;
  removeTask: (id: string) => void;

  // Chats
  sessions: ChatSession[];
  activeSessionId: string | null;
  setActiveSession: (id: string | null) => void;
  createSession: (skillId: string) => string;
  addMessage: (sessionId: string, message: ChatMessage) => void;
  updateLastMessageAnalysis: (sessionId: string, intent: string, suggestion: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      ollamaUrl: 'http://localhost:11434',
      setOllamaUrl: (url) => set({ ollamaUrl: url }),
      baseModel: 'llama3.2', // default base model
      setBaseModel: (model) => set({ baseModel: model }),

      skills: [],
      addSkill: (skill) => set((state) => ({ skills: [...state.skills, skill] })),
      removeSkill: (id) => set((state) => ({ skills: state.skills.filter((s) => s.id !== id) })),

      tasks: [],
      addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
      updateTaskProgress: (id, progress, status) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, progress, status } : t
          ),
        })),
      removeTask: (id) => set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),

      sessions: [],
      activeSessionId: null,
      setActiveSession: (id) => set({ activeSessionId: id }),
      createSession: (skillId) => {
        const id = Date.now().toString();
        set((state) => ({
          sessions: [
            ...state.sessions,
            { id, skillId, messages: [], updatedAt: Date.now() },
          ],
          activeSessionId: id,
        }));
        return id;
      },
      addMessage: (sessionId, message) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  messages: [...s.messages, message],
                  updatedAt: Date.now(),
                }
              : s
          ),
        })),
      updateLastMessageAnalysis: (sessionId, intent, suggestion) =>
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id === sessionId) {
              const newMessages = [...s.messages];
              const lastMsgIndex = newMessages.length - 1;
              if (lastMsgIndex >= 0) {
                newMessages[lastMsgIndex] = {
                  ...newMessages[lastMsgIndex],
                  intent,
                  suggestion,
                };
              }
              return { ...s, messages: newMessages };
            }
            return s;
          }),
        })),
    }),
    {
      name: 'boss-distillation-storage',
    }
  )
);
