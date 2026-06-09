// Design tokens shared across all screens.

export const colors = {
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  primaryLight: '#eef2ff',
  accent: '#f59e0b',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  dangerLight: '#fef2f2',

  background: '#f6f7fb',
  card: '#ffffff',
  border: '#e5e7eb',
  inputBackground: '#f3f4f6',

  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  textOnPrimary: '#ffffff',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const shadows = {
  card: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  raised: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
};

const AVATAR_PALETTE = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#f43f5e', '#0ea5e9'];

// Deterministic per-name avatar color so lists feel personal but stable
export const avatarColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 997;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
};

// Urgency color for a "days until" badge
export const daysUntilColor = (daysUntil: number): string => {
  if (daysUntil === 0) return colors.danger;
  if (daysUntil <= 3) return colors.warning;
  if (daysUntil <= 7) return colors.primary;
  return colors.textMuted;
};
