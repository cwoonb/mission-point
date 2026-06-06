import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Coupon, CouponExchange } from '../types';
import { initialCoupons } from '../data/mockData';

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

interface ShopState {
  coupons: Coupon[];
  exchanges: CouponExchange[];

  initializeData: () => void;
  exchangeCoupon: (
    couponId: string,
    userId: string
  ) => { success: boolean; message: string };
  getExchangesForUser: (userId: string) => CouponExchange[];
  getCoupon: (couponId: string) => Coupon | undefined;
}

export const useShopStore = create<ShopState>()(
  persist(
    (set, get) => ({
      coupons: [],
      exchanges: [],

      initializeData: () => {
        if (get().coupons.length === 0) {
          set({ coupons: initialCoupons });
        }
      },

      exchangeCoupon: (couponId, userId) => {
        const coupon = get().coupons.find((c) => c.id === couponId);
        if (!coupon) return { success: false, message: '쿠폰을 찾을 수 없습니다.' };
        if (!coupon.enabled) return { success: false, message: '사용 불가능한 쿠폰입니다.' };
        if (coupon.stock <= 0) return { success: false, message: '재고가 부족합니다.' };

        const exchange: CouponExchange = {
          id: genId(),
          couponId,
          userId,
          usedPoint: coupon.requiredPoint,
          createdAt: new Date().toISOString(),
        };

        set((s) => ({
          exchanges: [...s.exchanges, exchange],
          coupons: s.coupons.map((c) =>
            c.id === couponId ? { ...c, stock: c.stock - 1 } : c
          ),
        }));

        return { success: true, message: '쿠폰 교환 완료! 🎉' };
      },

      getExchangesForUser: (userId) =>
        get()
          .exchanges.filter((e) => e.userId === userId)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),

      getCoupon: (couponId) => get().coupons.find((c) => c.id === couponId),
    }),
    { name: 'mp-shop' }
  )
);
