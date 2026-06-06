import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PointTransaction, AdRewardLog, PointTransactionType } from '../types';

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const AD_REWARD = 10;
const MAX_ADS_PER_DAY = 5;

interface PointState {
  transactions: PointTransaction[];
  adLogs: AdRewardLog[];

  addTransaction: (
    userId: string,
    amount: number,
    type: PointTransactionType,
    description: string
  ) => void;
  recordAdWatch: (userId: string) => { success: boolean; message: string; points: number };
  getTodayAdCount: (userId: string) => number;
  getTransactionsForUser: (userId: string) => PointTransaction[];
}

export const usePointStore = create<PointState>()(
  persist(
    (set, get) => ({
      transactions: [],
      adLogs: [],

      addTransaction: (userId, amount, type, description) => {
        const tx: PointTransaction = {
          id: genId(),
          userId,
          amount,
          type,
          description,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ transactions: [...s.transactions, tx] }));
      },

      recordAdWatch: (userId) => {
        const count = get().getTodayAdCount(userId);
        if (count >= MAX_ADS_PER_DAY) {
          return {
            success: false,
            message: `오늘 광고 시청 횟수(${MAX_ADS_PER_DAY}회)를 모두 사용했어요!`,
            points: 0,
          };
        }
        const log: AdRewardLog = {
          id: genId(),
          userId,
          rewardPoint: AD_REWARD,
          watchedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ adLogs: [...s.adLogs, log] }));
        return { success: true, message: `+${AD_REWARD}P 획득!`, points: AD_REWARD };
      },

      getTodayAdCount: (userId) => {
        const today = new Date().toDateString();
        return get().adLogs.filter(
          (l) => l.userId === userId && new Date(l.watchedAt).toDateString() === today
        ).length;
      },

      getTransactionsForUser: (userId) =>
        get()
          .transactions.filter((t) => t.userId === userId)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),
    }),
    { name: 'mp-points' }
  )
);
