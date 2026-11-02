export type Gender = 'female' | 'male';
export type Role = 'student' | 'admin';

export interface Look { gender: Gender; skin: string; hair: string }
export interface PublicProfile extends Look { id: string; name: string }
export interface Profile extends PublicProfile { role: Role; createdAt?: string }
export interface Swatch { name: string; value: string }
