import type { Gender, Role } from './character';

export interface ProfileRow { id: string; display_name: string; gender: Gender; skin_color: string; hair_color: string; role: Role }
export interface SettingsRow { show_wireframe: boolean; show_students: boolean; show_vehicles: boolean; show_labels: boolean; npc_count: number; updated_at?: string }
