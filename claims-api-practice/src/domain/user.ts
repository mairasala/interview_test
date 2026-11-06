export type Role = 'member' | 'reviewer';

export interface AuthUser {
  id: string;
  role: Role;
}
