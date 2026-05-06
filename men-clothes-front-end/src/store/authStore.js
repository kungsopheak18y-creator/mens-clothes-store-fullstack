import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  isLoading: true,
  setUser: (user, token) => {
    if (token) localStorage.setItem('token', token);
    set({ user, isLoading: false });
  },
  clearUser: () => {
    localStorage.removeItem('token');
    set({ user: null, isLoading: false });
  },
  setLoading: (loading) => set({ isLoading: loading }),
}));

export default useAuthStore;