import { create } from 'zustand';
interface Toast { id: number; message: string; tone: 'success' | 'error' | 'info' }
interface ToastState { items: Toast[]; add: (message: string, tone?: Toast['tone']) => void; dismiss: (id: number) => void }
let sequence = 0;
export const useToast = create<ToastState>()((set, get) => ({
  items: [], dismiss: (id) => set({ items: get().items.filter((item) => item.id !== id) }),
  add: (message, tone = 'success') => {
    const id = ++sequence;
    set({ items: [...get().items.slice(-3), { id, message, tone }] });
    setTimeout(() => get().dismiss(id), 6000);
  },
}));
