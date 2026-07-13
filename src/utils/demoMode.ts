export const DEMO_USER_IDS = new Set(['user-parent-1', 'user-teacher-1', 'user-child-1', 'user-child-2', 'user-child-3', 'user-child-4', 'user-child-5', 'user-child-6', 'user-child-7', 'user-child-8']);
export const isDemoUserId = (id?: string | null) => !!id && (id.startsWith('demo-') || DEMO_USER_IDS.has(id));
