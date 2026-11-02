import type { Gender, Look, Profile, PublicProfile, Role } from './character';
import type { VoiceMessage } from './voice';

export interface SiteSettings { showWireframe: boolean; showStudents: boolean; showVehicles: boolean; showLabels: boolean; npcCount: number }
export interface Move { id: string; x: number; y: number; z: number; r: number; s?: number }

export interface AdminUser extends Profile { email: string | null; confirmed: boolean; lastSignIn: string | null; createdAt: string }
export interface AdminUserFields { name: string; email: string; gender: Gender; role: Role; skin: string; hair: string; password?: string }

export interface SignUpInput { email: string; password: string; profile: Look & { name: string } }
export type SignUpResult = { needsConfirm: true; profile?: undefined } | { needsConfirm?: false; profile: Profile | null };

// Everything arriving from other clients is untrusted until it has been cleaned.
export interface CampusHandlers { onUsers: (users: unknown[]) => void; onMove: (move: unknown) => void; onVoice: (message: unknown) => void; onError?: (status: string) => void }
export interface CampusConnection { sendMove: (move: Move) => unknown; sendVoice: (message: VoiceMessage) => unknown; update: (next: PublicProfile) => unknown; leave: () => unknown }
export type Unsubscribe = () => unknown;

export interface Backend {
  mode: 'supabase' | 'demo';
  getSession(): Promise<Profile | null>;
  signUp(input: SignUpInput): Promise<SignUpResult>;
  signIn(input: { email: string; password: string }): Promise<Profile | null>;
  signOut(): Promise<void>;
  updateProfile(profile: Profile): Promise<Profile>;
  passportCount(): Promise<number>;
  joinCampus(profile: PublicProfile, handlers: CampusHandlers): Promise<CampusConnection>;
  getSettings(): Promise<SiteSettings | null>;
  onSettingsChange(callback: (settings: SiteSettings) => void): Unsubscribe;
  saveSettings(settings: SiteSettings): Promise<SiteSettings>;
  watchOnline(callback: (users: unknown[]) => void): Promise<Unsubscribe>;
  adminListUsers(): Promise<AdminUser[]>;
  adminCreateUser(user: AdminUserFields & { password: string }): Promise<unknown>;
  adminUpdateUser(user: AdminUserFields & { id: string }): Promise<unknown>;
  adminDeleteUser(id: string): Promise<unknown>;
}
