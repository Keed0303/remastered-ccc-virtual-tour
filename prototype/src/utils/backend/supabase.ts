import type { User } from '@supabase/supabase-js';
import type { AdminUser, Backend, SiteSettings } from '../../types/backend';
import type { Look, Profile, PublicProfile } from '../../types/character';
import type { ProfileRow, SettingsRow } from '../../types/database';

const toProfile = (row: ProfileRow | null): Profile | null => row && {
  id: row.id,
  name: row.display_name,
  gender: row.gender,
  skin: row.skin_color,
  hair: row.hair_color,
  role: row.role,
};
// What other students may see. The role stays out of live presence.
const publicProfile = ({ id, name, gender, skin, hair }: PublicProfile): PublicProfile => ({ id, name, gender, skin, hair });
const fromSettingsRow = (row: SettingsRow): SiteSettings => ({ showWireframe: row.show_wireframe, showStudents: row.show_students, showVehicles: row.show_vehicles, showLabels: row.show_labels, npcCount: row.npc_count });
const toSettingsRow = (s: SiteSettings): SettingsRow => ({ show_wireframe: s.showWireframe, show_students: s.showStudents, show_vehicles: s.showVehicles, show_labels: s.showLabels, npc_count: s.npcCount, updated_at: new Date().toISOString() });
const toRow = (p: Look & { name: string }) => ({ display_name: p.name, gender: p.gender, skin_color: p.skin, hair_color: p.hair });

function friendlyError(error: { message?: string } | null) {
  const text = error?.message || '';
  if (/invalid login/i.test(text)) return 'That email or password is not correct.';
  if (/already registered|already exists/i.test(text)) return 'That email already has an account. Try logging in.';
  if (/email not confirmed/i.test(text)) return 'Please confirm your email first, using the link we sent you.';
  if (/rate limit|too many/i.test(text)) return 'Too many attempts. Please wait a moment and try again.';
  if (/password/i.test(text)) return text;
  return 'Something went wrong. Please check your connection and try again.';
}

export async function supabaseBackend(url: string, key: string): Promise<Backend> {
  const { createClient } = await import('@supabase/supabase-js');
  const client = createClient(url, key);

  // User management runs on the server, which checks the admin role on every request.
  async function adminCall(body: Record<string, unknown>) {
    const { data, error } = await client.functions.invoke('admin-users', { body });
    if (error) {
      let message = 'The request could not be completed.';
      try { message = (await error.context.json()).error || message; } catch { /* Keep the general message. */ }
      throw new Error(message);
    }
    return data;
  }

  async function profileFor(user: User) {
    const { data, error } = await client.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (error) throw new Error(friendlyError(error));
    return toProfile(data as ProfileRow | null);
  }

  const onlineList = (state: Record<string, unknown[]>) => Object.values(state).map((metas) => metas[0]);

  return {
    mode: 'supabase',
    async getSession() {
      const { data } = await client.auth.getSession();
      return data.session ? profileFor(data.session.user) : null;
    },
    async signUp({ email, password, profile }) {
      const { data, error } = await client.auth.signUp({ email, password, options: { data: toRow(profile), emailRedirectTo: location.origin } });
      if (error) throw new Error(friendlyError(error));
      // With email confirmation on, Supabase hides duplicates by returning a user with no identities.
      if (data.user && data.user.identities?.length === 0) throw new Error('That email already has an account. Try logging in.');
      if (!data.session || !data.user) return { needsConfirm: true };
      return { profile: await profileFor(data.user) };
    },
    async signIn({ email, password }) {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw new Error(friendlyError(error));
      return profileFor(data.user);
    },
    async signOut() {
      await client.auth.signOut();
    },
    async updateProfile(profile) {
      const { data, error } = await client.from('profiles').update(toRow(profile)).eq('id', profile.id).select().single();
      if (error) throw new Error(friendlyError(error));
      return toProfile(data as ProfileRow)!;
    },
    async passportCount() {
      const { data, error } = await client.rpc('passport_count');
      if (error) throw error;
      return Number(data);
    },
    async joinCampus(profile, { onUsers, onMove, onError }) {
      await client.realtime.setAuth();
      const channel = client.channel('campus', { config: { private: true, presence: { key: profile.id }, broadcast: { self: false } } });
      channel.on('presence', { event: 'sync' }, () => onUsers(onlineList(channel.presenceState())));
      channel.on('broadcast', { event: 'move' }, ({ payload }) => onMove(payload));
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') channel.track(publicProfile(profile));
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') onError?.(status);
      });
      return {
        sendMove: (move) => channel.send({ type: 'broadcast', event: 'move', payload: move }),
        update: (next) => channel.track(publicProfile(next)),
        leave: () => client.removeChannel(channel),
      };
    },
    async getSettings() {
      const { data, error } = await client.from('app_settings').select('*').eq('id', true).maybeSingle();
      if (error) throw error;
      return data ? fromSettingsRow(data as SettingsRow) : null;
    },
    onSettingsChange(callback) {
      const channel = client.channel('settings-changes')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'app_settings' }, ({ new: row }) => callback(fromSettingsRow(row as SettingsRow)))
        .subscribe();
      return () => client.removeChannel(channel);
    },
    async saveSettings(settings) {
      const { data, error } = await client.from('app_settings').update(toSettingsRow(settings)).eq('id', true).select().single();
      if (error) throw new Error(/row|permission/i.test(error.message) ? 'Admin permission is required.' : friendlyError(error));
      return fromSettingsRow(data as SettingsRow);
    },
    // Watches who is online without appearing in the list.
    async watchOnline(callback) {
      await client.realtime.setAuth();
      const channel = client.channel('campus', { config: { private: true } });
      channel.on('presence', { event: 'sync' }, () => callback(onlineList(channel.presenceState())));
      channel.subscribe();
      return () => client.removeChannel(channel);
    },
    async adminListUsers() {
      return (await adminCall({ action: 'list' })).users as AdminUser[];
    },
    adminCreateUser: (user) => adminCall({ action: 'create', ...user }),
    adminUpdateUser: (user) => adminCall({ action: 'update', ...user }),
    adminDeleteUser: (id) => adminCall({ action: 'delete', id }),
  };
}
