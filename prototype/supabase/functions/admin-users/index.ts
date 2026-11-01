// Admin-only user management. Runs on the server, so it can safely use the service role key.
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const HEX = /^#[0-9a-fA-F]{6}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const refuse = (status: number, error: string) => reply(status, { error });

// Returns only the allowed profile fields, or an error message.
function readProfile(input: Record<string, unknown>) {
  const out: Record<string, string> = {};
  if (input.name !== undefined) {
    const name = String(input.name).trim();
    if (name.length < 2 || name.length > 24) return { error: 'Name must be 2 to 24 characters.' };
    out.display_name = name;
  }
  if (input.gender !== undefined) {
    if (input.gender !== 'female' && input.gender !== 'male') return { error: 'Gender must be female or male.' };
    out.gender = input.gender;
  }
  if (input.skin !== undefined) {
    if (!HEX.test(String(input.skin))) return { error: 'Skin color is not valid.' };
    out.skin_color = String(input.skin);
  }
  if (input.hair !== undefined) {
    if (!HEX.test(String(input.hair))) return { error: 'Hair color is not valid.' };
    out.hair_color = String(input.hair);
  }
  if (input.role !== undefined) {
    if (input.role !== 'student' && input.role !== 'admin') return { error: 'Role must be student or admin.' };
    out.role = input.role;
  }
  return { fields: out };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return refuse(405, 'Method not allowed.');

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Every request proves who is calling and that they are an admin.
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: auth, error: authError } = await admin.auth.getUser(token);
  if (authError || !auth.user) return refuse(401, 'Please log in.');
  const callerId = auth.user.id;
  const { data: caller } = await admin.from('profiles').select('role').eq('id', callerId).maybeSingle();
  if (caller?.role !== 'admin') return refuse(403, 'Admin permission is required.');

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return refuse(400, 'Invalid request.');
  }

  try {
    if (body.action === 'list') {
      const users = [];
      for (let page = 1; page <= 50; page++) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
        if (error) throw error;
        users.push(...data.users);
        if (data.users.length < 200) break;
      }
      const { data: profiles, error } = await admin.from('profiles').select('*');
      if (error) throw error;
      const byId = new Map(profiles.map((p) => [p.id, p]));
      return reply(200, {
        users: users.map((u) => {
          const p = byId.get(u.id);
          return {
            id: u.id,
            email: u.email,
            confirmed: Boolean(u.email_confirmed_at),
            lastSignIn: u.last_sign_in_at ?? null,
            createdAt: u.created_at,
            name: p?.display_name ?? '(no profile)',
            gender: p?.gender ?? 'male',
            skin: p?.skin_color ?? '#e0ac84',
            hair: p?.hair_color ?? '#2a2118',
            role: p?.role ?? 'student',
          };
        }),
      });
    }

    if (body.action === 'create') {
      const email = String(body.email ?? '').trim();
      const password = String(body.password ?? '');
      if (!EMAIL.test(email)) return refuse(400, 'Enter a valid email address.');
      if (password.length < 8) return refuse(400, 'Use a password with at least 8 characters.');
      const parsed = readProfile({ name: body.name, gender: body.gender, skin: body.skin, hair: body.hair, role: body.role ?? 'student' });
      if (parsed.error) return refuse(400, parsed.error);
      const { role, ...metadata } = parsed.fields!;
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: metadata });
      if (error) return refuse(400, error.message);
      if (role !== 'student') {
        const { error: roleError } = await admin.from('profiles').update({ role }).eq('id', data.user.id);
        if (roleError) throw roleError;
      }
      return reply(200, { id: data.user.id });
    }

    if (body.action === 'update') {
      const id = String(body.id ?? '');
      if (!id) return refuse(400, 'User is required.');
      const parsed = readProfile(body);
      if (parsed.error) return refuse(400, parsed.error);
      if (id === callerId && parsed.fields!.role === 'student') return refuse(400, 'You cannot remove your own admin role.');
      const attributes: Record<string, unknown> = {};
      if (body.email !== undefined) {
        const email = String(body.email).trim();
        if (!EMAIL.test(email)) return refuse(400, 'Enter a valid email address.');
        attributes.email = email;
        attributes.email_confirm = true;
      }
      if (body.password) {
        if (String(body.password).length < 8) return refuse(400, 'Use a password with at least 8 characters.');
        attributes.password = String(body.password);
      }
      if (Object.keys(attributes).length) {
        const { error } = await admin.auth.admin.updateUserById(id, attributes);
        if (error) return refuse(400, error.message);
      }
      if (Object.keys(parsed.fields!).length) {
        const { error } = await admin.from('profiles').update(parsed.fields!).eq('id', id);
        if (error) throw error;
      }
      return reply(200, { ok: true });
    }

    if (body.action === 'delete') {
      const id = String(body.id ?? '');
      if (!id) return refuse(400, 'User is required.');
      if (id === callerId) return refuse(400, 'You cannot delete your own account.');
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) return refuse(400, error.message);
      return reply(200, { ok: true });
    }

    return refuse(400, 'Unknown action.');
  } catch (err) {
    console.error(err);
    return refuse(500, 'The server could not complete that request.');
  }
});
