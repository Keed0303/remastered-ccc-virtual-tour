import { type FormEvent, useState } from 'react';
import type { AuthStatus } from '../../hooks/useAuth';
import type { Backend } from '../../types/backend';
import type { Profile } from '../../types/character';

interface AdminGateProps {
  status: AuthStatus;
  backend: Backend | null;
  profile: Profile | null;
  onSignedIn: (profile: Profile | null) => void;
  onLogOut: () => void;
}

export function AdminGate({ status, backend, profile, onSignedIn, onLogOut }: AdminGateProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (!backend) throw new Error('Accounts could not be loaded right now.');
      const signedIn = await backend.signIn({ email: email.trim(), password });
      setPassword('');
      onSignedIn(signedIn);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div id="gate" className="gate">
      {status === 'loading' && <section id="gate-loading" className="gate-card"><p>Checking your permission…</p></section>}
      {status === 'unavailable' && (
        <section id="gate-unavailable" className="gate-card">
          <h1>Accounts are not set up</h1>
          <p>This site isn't connected to its account service yet.</p>
          <a className="btn primary wide" href="/">Back to campus</a>
        </section>
      )}
      {(status === 'ready' || status === 'error') && profile && (
        <section id="gate-denied" className="gate-card">
          <h1>No permission</h1>
          <p>This page is only for accounts with the admin role.</p>
          <a className="btn primary wide" href="/">Back to campus</a>
          <button id="denied-logout" className="btn ghost wide" onClick={onLogOut}>Log out</button>
        </section>
      )}
      {(status === 'ready' || status === 'error') && !profile && (
        <form id="gate-login" className="gate-card" onSubmit={submit}>
          <span className="brand-mark">CCC</span>
          <h1>Admin login</h1>
          <p id="gate-login-error" className="error" role="alert" hidden={!error}>{error}</p>
          <label>Email<input id="admin-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label>Password<input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          <button className="btn primary wide" type="submit">Log in</button>
          <a className="back" href="/">Back to campus</a>
        </form>
      )}
    </div>
  );
}
