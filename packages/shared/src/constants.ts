export const APP_NAME = 'Flow';

export const DEFAULT_TIMEZONE = 'Asia/Jerusalem';

export const USER_ROLES = ['provider', 'client'] as const;
export type UserRole = (typeof USER_ROLES)[number];
