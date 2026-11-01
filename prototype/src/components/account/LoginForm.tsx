import { type FormEvent, useState } from 'react';

interface LoginFormProps {
  email: string;
  busy: boolean;
  onEmail: (email: string) => void;
  onSubmit: (email: string, password: string) => void;
  onRegister: () => void;
}

export function LoginForm({ email, busy, onEmail, onSubmit, onRegister }: LoginFormProps) {
  const [password, setPassword] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(email.trim(), password);
  };
  return (
    <section id="step-login">
      <h2>Welcome back</h2>
      <form id="form-login" onSubmit={submit}>
        <label>Email<input id="login-email" type="email" autoComplete="email" required value={email} onChange={(e) => onEmail(e.target.value)} /></label>
        <label>Password<input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <button className="primary wide" type="submit" disabled={busy}>Log in</button>
      </form>
      <p className="switch">New to CCC? <button id="to-register" type="button" className="text" onClick={onRegister}>Create your Student Passport</button></p>
    </section>
  );
}
