import type { SiteSettings } from '../types/backend';
import type { Gender, PublicProfile } from '../types/character';
import { DEFAULT_LOOK, DEFAULT_SETTINGS, NPC_MAX } from './campusData';

export const isHexColor = (value: unknown): value is string => typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

// Colours and names from other users always pass through here first.
export function cleanProfile(raw: unknown): PublicProfile | null {
  const r = raw as Partial<Record<keyof PublicProfile, unknown>> | null | undefined;
  if (!r || typeof r.id !== 'string' || !r.id) return null;
  const name = typeof r.name === 'string' ? r.name.trim().slice(0, 24) : '';
  return {
    id: r.id.slice(0, 64),
    name: name.length >= 2 ? name : 'Student',
    gender: r.gender === 'female' ? 'female' : 'male',
    skin: isHexColor(r.skin) ? r.skin : DEFAULT_LOOK.skin,
    hair: isHexColor(r.hair) ? r.hair : DEFAULT_LOOK.hair,
  };
}

export function cleanSettings(raw: unknown): SiteSettings {
  const s = (raw || {}) as Partial<Record<keyof SiteSettings, unknown>>;
  const flag = (value: unknown, fallback: boolean) => (typeof value === 'boolean' ? value : fallback);
  const npc = Number(s.npcCount);
  return {
    showWireframe: flag(s.showWireframe, DEFAULT_SETTINGS.showWireframe),
    showStudents: flag(s.showStudents, DEFAULT_SETTINGS.showStudents),
    showVehicles: flag(s.showVehicles, DEFAULT_SETTINGS.showVehicles),
    showLabels: flag(s.showLabels, DEFAULT_SETTINGS.showLabels),
    npcCount: Number.isFinite(npc) ? Math.min(NPC_MAX, Math.max(0, Math.round(npc))) : DEFAULT_SETTINGS.npcCount,
  };
}

export interface RegistrationForm { name: string; email: string; password: string; gender?: Gender | null }

export function validateRegistration({ name, email, password, gender }: RegistrationForm): string | null {
  if (name.trim().length < 2 || name.trim().length > 24) return 'Enter a name between 2 and 24 characters.';
  if (!isEmail(email.trim())) return 'Enter a valid email address.';
  if (password.length < 8) return 'Use a password with at least 8 characters.';
  if (gender !== 'female' && gender !== 'male') return 'Choose Female or Male for your character.';
  return null;
}
