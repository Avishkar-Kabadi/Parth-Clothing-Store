import { create } from 'zustand';
import type { UserDocType, SaleItemType } from '../lib/database';

interface AuthState {
  user: UserDocType | null;
  isAuthenticated: boolean;
  login: (user: UserDocType) => void;
  logout: () => void;
}


interface CartState {
  items: SaleItemType[];
  customerName: string;
  customerPhone: string;
  paymentMode: 'Cash' | 'UPI';
  taxPercentage: number;
  addItem: (item: SaleItemType) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setCustomerInfo: (name: string, phone: string) => void;
  setPaymentMode: (mode: 'Cash' | 'UPI') => void;
  setTaxPercentage: (percentage: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTax: () => number;
  getGrandTotal: () => number;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerName: '',
  customerPhone: '',
  paymentMode: 'Cash',
  taxPercentage: 0,
  addItem: (item) => set((state) => {
    const existing = state.items.find(i => i.product_id === item.product_id);
    if (existing) {
      return {
        items: state.items.map(i => i.product_id === item.product_id
          ? { ...i, quantity: i.quantity + item.quantity, total: (i.quantity + item.quantity) * i.price }
          : i)
      };
    }
    return { items: [...state.items, item] };
  }),
  removeItem: (productId) => set((state) => ({
    items: state.items.filter(i => i.product_id !== productId)
  })),
  updateQuantity: (productId, quantity) => set((state) => ({
    items: state.items.map(i => i.product_id === productId ? { ...i, quantity, total: quantity * i.price } : i)
  })),
  setCustomerInfo: (customerName, customerPhone) => set({ customerName, customerPhone }),
  setPaymentMode: (paymentMode) => set({ paymentMode }),
  setTaxPercentage: (taxPercentage) => set({ taxPercentage }),
  clearCart: () => set({ items: [], customerName: '', customerPhone: '', paymentMode: 'Cash', taxPercentage: 0 }),
  getSubtotal: () => get().items.reduce((sum, item) => sum + item.total, 0),
  getTax: () => get().getSubtotal() * (get().taxPercentage / 100),
  getGrandTotal: () => get().getSubtotal() + get().getTax(),
}));
