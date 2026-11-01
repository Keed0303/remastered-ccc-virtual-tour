// Log in, register, and character customization screens.
import * as THREE from 'three';
import { DEFAULT_LOOK, HAIR_SWATCHES, SKIN_SWATCHES } from './utils/campusData';
import { isHexColor, validateRegistration } from './utils/validation';
import { createPlayerFigure, disposeFigure, setFigureLook } from './world.js';

const $ = (id) => document.getElementById(id);

export function createAccountUI({ backend, getProfile, onSignedIn, onSignedOut, onLookSaved }) {
  const dialog = $('account-dialog');
  const steps = ['step-login', 'step-register', 'step-customize', 'step-account', 'step-confirm'];
  let details = null;
  let look = { ...DEFAULT_LOOK };
  let editing = false;
  let preview = null;

  const showError = (text) => {
    const el = $('account-error');
    el.textContent = text || '';
    el.hidden = !text;
  };
  const busy = (button, on) => { button.disabled = on; };

  function showStep(id) {
    for (const s of steps) $(s).hidden = s !== id;
    showError('');
    if (id === 'step-customize') startPreview(); else stopPreview();
  }

  /* ---------- 3D preview ---------- */
  function startPreview() {
    if (preview) { setFigureLook(preview.figure, look); return; }
    const canvas = $('char-preview');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth || 260, canvas.clientHeight || 260, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight('#ffffff', '#b7bdc4', 1.5));
    const sun = new THREE.DirectionalLight('#ffffff', 2.2);
    sun.position.set(2, 4, 4);
    scene.add(sun);
    const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    cam.position.set(0, 1.25, 5.1);
    cam.lookAt(0, 1.02, 0);
    const figure = createPlayerFigure(look);
    scene.add(figure);
    let raf = 0;
    const frame = (t) => {
      figure.rotation.y = Math.sin(t / 1400) * 0.75;
      renderer.render(scene, cam);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    preview = {
      figure,
      stop() {
        cancelAnimationFrame(raf);
        disposeFigure(figure);
        renderer.dispose();
      },
    };
  }
  function stopPreview() {
    preview?.stop();
    preview = null;
  }

  /* ---------- Colour pickers ---------- */
  function renderSwatches(rootId, customId, colors, key) {
    const root = $(rootId);
    root.replaceChildren(...colors.map((color) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `swatch${look[key].toLowerCase() === color.value.toLowerCase() ? ' on' : ''}`;
      b.style.background = color.value;
      b.title = color.name;
      b.setAttribute('aria-label', color.name);
      b.setAttribute('aria-pressed', String(look[key].toLowerCase() === color.value.toLowerCase()));
      b.onclick = () => setColor(key, color.value);
      return b;
    }));
    $(customId).value = look[key];
  }
  function renderPickers() {
    renderSwatches('skin-swatches', 'skin-custom', SKIN_SWATCHES, 'skin');
    renderSwatches('hair-swatches', 'hair-custom', HAIR_SWATCHES, 'hair');
    document.querySelectorAll('#custom-gender button').forEach((b) => {
      const on = b.dataset.gender === look.gender;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    if (preview) setFigureLook(preview.figure, look);
  }
  function setColor(key, value) {
    if (!isHexColor(value)) return;
    look = { ...look, [key]: value };
    renderPickers();
  }
  $('skin-custom').oninput = (e) => setColor('skin', e.target.value);
  $('hair-custom').oninput = (e) => setColor('hair', e.target.value);
  document.querySelectorAll('#custom-gender button').forEach((b) => {
    b.onclick = () => { look = { ...look, gender: b.dataset.gender }; renderPickers(); };
  });
  document.querySelectorAll('#reg-gender button').forEach((b) => {
    b.onclick = () => {
      details = { ...(details || {}), gender: b.dataset.gender };
      document.querySelectorAll('#reg-gender button').forEach((o) => {
        const on = o === b;
        o.classList.toggle('on', on);
        o.setAttribute('aria-pressed', String(on));
      });
    };
  });

  /* ---------- Flows ---------- */
  $('form-login').onsubmit = async (e) => {
    e.preventDefault();
    const button = e.target.querySelector('button[type=submit]');
    showError('');
    busy(button, true);
    try {
      const profile = await backend.signIn({ email: $('login-email').value.trim(), password: $('login-password').value });
      $('login-password').value = '';
      if (!profile) throw new Error('Your character could not be loaded. Please try again.');
      dialog.close();
      onSignedIn(profile);
    } catch (err) {
      showError(err.message);
    } finally {
      busy(button, false);
    }
  };

  $('form-register').onsubmit = (e) => {
    e.preventDefault();
    const form = {
      name: $('reg-name').value,
      email: $('reg-email').value,
      password: $('reg-password').value,
      confirm: $('reg-confirm').value,
      gender: details?.gender,
    };
    const problem = validateRegistration(form);
    if (problem) { showError(problem); return; }
    details = form;
    editing = false;
    look = { ...look, gender: form.gender };
    $('customize-title').textContent = `Create your character, ${form.name.trim()}`;
    $('customize-finish').textContent = 'Finish';
    $('customize-back').textContent = 'Back';
    $('custom-gender-row').hidden = true;
    showStep('step-customize');
    renderPickers();
  };

  $('customize-back').onclick = () => {
    if (editing) { dialog.close(); return; }
    showStep('step-register');
  };

  $('customize-finish').onclick = async () => {
    const button = $('customize-finish');
    showError('');
    busy(button, true);
    try {
      if (editing) {
        const saved = await backend.updateProfile({ ...getProfile(), ...look });
        dialog.close();
        onLookSaved(saved);
        return;
      }
      const result = await backend.signUp({
        email: details.email.trim(),
        password: details.password,
        profile: { name: details.name.trim(), ...look },
      });
      $('reg-password').value = '';
      $('reg-confirm').value = '';
      if (result.needsConfirm) {
        $('confirm-email').textContent = details.email.trim();
        showStep('step-confirm');
        return;
      }
      dialog.close();
      onSignedIn(result.profile, true);
    } catch (err) {
      // Back to the details so the problem can be fixed. The chosen look is kept.
      if (!editing) showStep('step-register');
      showError(err.message);
    } finally {
      busy(button, false);
    }
  };

  $('to-register').onclick = () => showStep('step-register');
  $('to-login').onclick = () => showStep('step-login');
  $('confirm-done').onclick = () => showStep('step-login');
  $('account-close').onclick = () => dialog.close();
  dialog.addEventListener('close', () => {
    stopPreview();
    $('login-password').value = '';
    $('reg-password').value = '';
    $('reg-confirm').value = '';
  });

  $('account-customize').onclick = () => {
    const p = getProfile();
    look = { gender: p.gender, skin: p.skin, hair: p.hair };
    editing = true;
    $('customize-title').textContent = 'Customize your character';
    $('customize-finish').textContent = 'Save';
    $('customize-back').textContent = 'Cancel';
    $('custom-gender-row').hidden = false;
    showStep('step-customize');
    renderPickers();
  };
  $('account-logout').onclick = async () => {
    await backend.signOut();
    dialog.close();
    onSignedOut();
  };

  $('demo-note').hidden = backend.mode !== 'demo';

  return {
    open() {
      const profile = getProfile();
      if (profile) {
        $('account-name').textContent = profile.name;
        $('account-admin').hidden = profile.role !== 'admin';
        showStep('step-account');
      } else {
        showStep('step-login');
      }
      if (!dialog.open) dialog.showModal();
    },
  };
}
