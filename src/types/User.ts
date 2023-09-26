export const UserRoles = ["admin", "user"] as const;
export type UserRole = (typeof UserRoles)[number];
