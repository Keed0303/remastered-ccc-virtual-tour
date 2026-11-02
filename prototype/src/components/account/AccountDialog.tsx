import { useEffect, useState } from 'react';
import type { Backend } from '../../types/backend';
import type { Gender, Look, Profile } from '../../types/character';
import { DEFAULT_LOOK } from '../../utils/campusData';
import { Dialog } from '../common/Dialog';
import { AccountMenu } from './AccountMenu';
import { CharacterCustomizer } from './CharacterCustomizer';
import { LoginForm } from './LoginForm';
import { RegisterForm, type RegisterDetails } from './RegisterForm';

type Step = 'login' | 'register' | 'customize' | 'account' | 'confirm';

interface AccountDialogProps {
  isOpen: boolean;
  backend: Backend;
  profile: Profile | null;
  onDismiss: () => void;
  onSignedIn: (profile: Profile, isNew?: boolean) => void;
  onSignedOut: () => void;
  onLookSaved: (profile: Profile) => void;
}

const NO_DETAILS: RegisterDetails = { name: '', email: '', password: '', confirm: '', gender: null };

export function AccountDialog({ isOpen, backend, profile, onDismiss, onSignedIn, onSignedOut, onLookSaved }: AccountDialogProps) {
  const [step, setStep] = useState<Step>('login');
  const [error, setError] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [details, setDetails] = useState(NO_DETAILS);
  const [look, setLook] = useState<Look>(DEFAULT_LOOK);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');

  const show = (next: Step) => { setStep(next); setError(''); };

  useEffect(() => {
    if (isOpen) { setStep(profile ? 'account' : 'login'); setError(''); }
    // Passwords never stay in memory after the dialog closes.
    else setDetails((d) => ({ ...d, password: '', confirm: '' }));
    // Only opening or closing resets the step, not a profile change while open.
  }, [isOpen]);

  const logIn = async (email: string, password: string) => {
    setError('');
    setBusy(true);
    try {
      const signedIn = await backend.signIn({ email, password });
      if (!signedIn) throw new Error('Your character could not be loaded. Please try again.');
      onDismiss();
      onSignedIn(signedIn);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const startCustomizing = (next: RegisterDetails) => {
    setDetails(next);
    setEditing(false);
    setLook((l) => ({ ...l, gender: next.gender as Gender }));
    show('customize');
  };

  const editCharacter = () => {
    if (!profile) return;
    setLook({ gender: profile.gender, skin: profile.skin, hair: profile.hair });
    setEditing(true);
    show('customize');
  };

  const finish = async () => {
    setError('');
    setBusy(true);
    try {
      if (editing && profile) {
        const saved = await backend.updateProfile({ ...profile, ...look });
        onDismiss();
        onLookSaved(saved);
        return;
      }
      const email = details.email.trim();
      const result = await backend.signUp({ email, password: details.password, profile: { name: details.name.trim(), ...look } });
      setDetails((d) => ({ ...d, password: '', confirm: '' }));
      if (result.needsConfirm) {
        setConfirmEmail(email);
        show('confirm');
        return;
      }
      if (!result.profile) throw new Error('Your character could not be loaded. Please try logging in.');
      onDismiss();
      onSignedIn(result.profile, true);
    } catch (err) {
      // Back to the details so the problem can be fixed. The chosen look is kept.
      if (!editing) setStep('register');
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const logOut = async () => {
    await backend.signOut();
    onDismiss();
    onSignedOut();
  };

  return (
    <Dialog id="account-dialog" aria-label="Account" isOpen={isOpen} onDismiss={onDismiss}>
      <button id="account-close" className="dialog-x" aria-label="Close" onClick={onDismiss}>✕</button>
      <p id="demo-note" className="demo-note" hidden={backend.mode !== 'demo'}>Demo mode: accounts stay on this device, and passwords are not saved. Connect Supabase for real accounts.</p>
      <p id="account-error" className="account-error" role="alert" hidden={!error}>{error}</p>
      {isOpen && step === 'login' && (
        <LoginForm email={loginEmail} onEmail={setLoginEmail} busy={busy} onSubmit={logIn} onRegister={() => show('register')} />
      )}
      {isOpen && step === 'register' && (
        <RegisterForm details={details} onChange={setDetails} onValid={startCustomizing} onError={setError} onLogin={() => show('login')} />
      )}
      {isOpen && step === 'customize' && (
        <CharacterCustomizer
          title={editing ? 'Customize your character' : `Create your character, ${details.name.trim()}`}
          showGender={editing}
          finishLabel={editing ? 'Save' : 'Finish'}
          backLabel={editing ? 'Cancel' : 'Back'}
          look={look}
          busy={busy}
          onLook={setLook}
          onBack={() => (editing ? onDismiss() : show('register'))}
          onFinish={finish}
        />
      )}
      {isOpen && step === 'account' && profile && (
        <AccountMenu name={profile.name} isAdmin={profile.role === 'admin'} onCustomize={editCharacter} onLogOut={logOut} />
      )}
      {isOpen && step === 'confirm' && (
        <section id="step-confirm">
          <h2>Check your email</h2>
          <p>We sent a confirmation link to <strong id="confirm-email">{confirmEmail}</strong>. After confirming, come back and log in.</p>
          <button id="confirm-done" type="button" className="primary wide" onClick={() => show('login')}>Go to log in</button>
        </section>
      )}
    </Dialog>
  );
}
