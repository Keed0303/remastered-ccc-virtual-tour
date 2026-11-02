import type { FormEvent } from 'react';
import type { Gender } from '../../types/character';
import { validateRegistration } from '../../utils/validation';

export interface RegisterDetails { name: string; email: string; password: string; gender: Gender | null }

interface RegisterFormProps {
  details: RegisterDetails;
  onChange: (details: RegisterDetails) => void;
  onValid: (details: RegisterDetails) => void;
  onError: (message: string) => void;
  onLogin: () => void;
}

export function RegisterForm({ details, onChange, onValid, onError, onLogin }: RegisterFormProps) {
  const set = (change: Partial<RegisterDetails>) => onChange({ ...details, ...change });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const problem = validateRegistration(details);
    if (problem) { onError(problem); return; }
    onValid(details);
  };
  return (
    <section id="step-register">
      <h2>Get your Student Passport</h2>
      <form id="form-register" noValidate onSubmit={submit}>
        <label>Name shown above your character<input id="reg-name" maxLength={24} autoComplete="nickname" required value={details.name} onChange={(e) => set({ name: e.target.value })} /></label>
        <label>Email<input id="reg-email" type="email" autoComplete="email" required value={details.email} onChange={(e) => set({ email: e.target.value })} /></label>
        <label>Password<input id="reg-password" type="password" autoComplete="new-password" required value={details.password} onChange={(e) => set({ password: e.target.value })} /></label>
        <div className="field-label" id="gender-label">Gender</div>
        <div id="reg-gender" className="choice-row" role="group" aria-labelledby="gender-label">
          {(['female', 'male'] as const).map((g) => (
            <button key={g} type="button" data-gender={g} className={details.gender === g ? 'on' : undefined} aria-pressed={details.gender === g} onClick={() => set({ gender: g })}>
              {g === 'female' ? 'Female' : 'Male'}
            </button>
          ))}
        </div>
        <p className="privacy">Your email is used only to log in. Your name and character are visible to other logged-in students.</p>
        <button className="primary wide" type="submit">Register</button>
      </form>
      <p className="switch">Already registered? <button id="to-login" type="button" className="text" onClick={onLogin}>Log in</button></p>
    </section>
  );
}
