import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useBodyClass } from '../../hooks/useBodyClass';
import { useCampusPresence } from '../../hooks/useCampusPresence';
import { useCampusScene } from '../../hooks/useCampusScene';
import { usePassport } from '../../hooks/usePassport';
import { usePassportCount } from '../../hooks/usePassportCount';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { useToast } from '../../hooks/useToast';
import '../../styles/account.css';
import '../../styles/campus.css';
import type { BuildingLabel, LocationDef } from '../../types/campus';
import type { LayerId, SceneMode } from '../../types/scene';
import { LOCATIONS } from '../../utils/campusData';
import { LAYERS, applyLayerSettings, initialLayers } from '../../utils/layers';
import { AccountDialog } from '../account/AccountDialog';
import { Confetti } from '../common/Confetti';
import { LegalDialog } from '../common/LegalDialog';
import { ToastProvider } from '../common/Toasts';
import { PassportButton } from '../passport/PassportButton';
import { PassportPanel } from '../passport/PassportPanel';
import { CampusCanvas } from './CampusCanvas';
import { CampusLabels } from './CampusLabels';
import { Compass } from './Compass';
import { InfoCard } from './InfoCard';
import { LayerToggles } from './LayerToggles';
import { NameBubbles } from './NameBubbles';
import { PanoOverlay } from './PanoOverlay';
import { RoomTip, type TipState } from './RoomTip';
import { SidePanel } from './SidePanel';
import { StatsPanel } from './StatsPanel';
import { ThemePicker } from './ThemePicker';
import { WalkHud } from './WalkHud';
import type { SeatState } from '../../types/scene';
import type { MicState } from '../../types/voice';

function Campus() {
  const toast = useToast();
  const host = useRef<HTMLDivElement>(null);
  const labels = useRef<HTMLDivElement>(null);
  const bubbles = useRef<HTMLDivElement>(null);
  const compass = useRef<HTMLDivElement>(null);
  const refs = useRef({ host, labels, bubbles, compass }).current;

  const [view, setView] = useState('overview');
  const [mode, setMode] = useState<SceneMode>('orbit');
  const [walking, setWalking] = useState(false);
  const [mouseLocked, setMouseLocked] = useState(false);
  const [selected, setSelected] = useState<LocationDef | null>(null);
  const [nearby, setNearby] = useState<LocationDef | null>(null);
  const [panoName, setPanoName] = useState('');
  const [theme, setTheme] = useState('day');
  const [tip, setTip] = useState<TipState | null>(null);
  const [layers, setLayers] = useState(initialLayers);
  const [passportOpen, setPassportOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const passport = usePassport();
  const { backend, profile, setProfile, status } = useAuth();
  const [micState, setMicState] = useState<MicState>('off');
  const [seat, setSeat] = useState<SeatState>({ seated: false, canSit: false });
  const micAnnounced = useRef(false);
  const { count: passportCount, refresh: refreshCount } = usePassportCount(backend, status === 'unavailable' || status === 'error');
  const settings = useSiteSettings(backend);

  const checkInNearby = useCallback((location: LocationDef | null) => {
    if (!location) return;
    setSelected(location);
    passport.checkIn(location.id);
  }, [passport]);

  const scene = useCampusScene(refs, {
    onViewChange: setView,
    onModeChange: (nextMode, nextWalking) => { setMode(nextMode); setWalking(nextWalking); },
    onNearbyChange: setNearby,
    onRoomClick: (text, x, y) => setTip({ text, x, y, at: Date.now() }),
    onPanoError: () => toast('Could not load this 360° photo.'),
    onMouseLockChange: setMouseLocked,
    onEscape: () => setSelected(null),
    onSeatChange: setSeat,
    onMicChange: (state) => {
      setMicState(state);
      if (state === 'off') micAnnounced.current = false;
      if (state === 'live' && !micAnnounced.current) {
        micAnnounced.current = true;
        toast(`Mic on, using ${createdScene.current?.online.voice.micLabel}. Students near you can hear you.`);
      }
    },
    onMicError: toast,
    onMicNotice: toast,
    onCheckInKey: () => {
      createdScene.current?.follow.releaseMouse();
      checkInNearby(createdScene.current?.walk.nearby ?? null);
    },
  });
  const createdScene = useRef(scene);
  createdScene.current = scene;

  const onlineCount = useCampusPresence(scene, backend, profile, { onUsersChanged: refreshCount, onError: toast });

  useBodyClass('walking', walking);
  useBodyClass('in-pano', mode === 'pano');
  useBodyClass('mouse-locked', mouseLocked);
  useBodyClass('passport-open', passportOpen);

  useEffect(() => {
    if (status === 'error') toast('Accounts could not be loaded right now.');
  }, [status, toast]);

  useEffect(() => { if (settings) setLayers((state) => applyLayerSettings(state, settings)); }, [settings]);
  useEffect(() => { if (scene && settings) scene.setNpcCount(settings.npcCount); }, [scene, settings]);
  useEffect(() => { for (const l of LAYERS) scene?.setLayer(l.id, layers[l.id].on); }, [scene, layers]);
  useEffect(() => { scene?.setTheme(theme); }, [scene, theme]);

  const selectLocation = (id: string, fly: boolean) => {
    const l = LOCATIONS.find((x) => x.id === id);
    if (!l) return;
    setSelected(l);
    scene?.focusLocation(l, fly);
  };
  const clickBuilding = (b: BuildingLabel) => {
    if (b.view) scene?.setView(b.view);
    else if (b.note) toast(b.note);
  };
  const toggleWalk = () => {
    if (!scene) return;
    if (scene.walking) { scene.stopWalk(); return; }
    setSelected(null);
    scene.startWalk();
  };
  const openPano = (l: LocationDef) => {
    setPanoName(l.name);
    scene?.openPano(l);
  };
  const toggleLayer = (id: LayerId) => setLayers((state) => ({ ...state, [id]: { ...state[id], on: !state[id].on } }));
  const openAccount = () => {
    if (backend) setAccountOpen(true);
    else if (status === 'loading') toast('Accounts are still loading. Please try again in a moment.');
    else if (status === 'error') toast('Accounts could not load. Please check your connection and reload.');
    else toast('Accounts are not set up on this site yet.');
  };

  return (
    <>
      <CampusCanvas ref={host} />
      <CampusLabels ref={labels} game={passport.game} selectedId={selected?.id} onLocation={(id) => selectLocation(id, true)} onBuilding={clickBuilding} />
      <NameBubbles ref={bubbles} />

      <SidePanel
        view={view}
        accountName={profile?.name ?? null}
        onView={(id) => scene?.chooseView(id)}
        onWalk={toggleWalk}
        onAccount={openAccount}
        onLegal={() => setLegalOpen(true)}
      />
      <ThemePicker theme={theme} onTheme={setTheme} />
      <PassportButton game={passport.game} open={passportOpen} onToggle={() => setPassportOpen((v) => !v)} />
      <PassportPanel
        game={passport.game}
        passportCount={passportCount}
        onlineCount={onlineCount}
        onClose={() => setPassportOpen(false)}
        onStamp={(id) => { setPassportOpen(false); selectLocation(id, true); }}
        onReset={passport.reset}
      />
      <LayerToggles layers={layers} onToggle={toggleLayer} />
      <StatsPanel />
      <Compass ref={compass} />

      {selected && (
        <InfoCard
          key={selected.id}
          location={selected}
          game={passport.game}
          onClose={() => setSelected(null)}
          onPano={openPano}
          onCheckIn={passport.checkIn}
          onCorrect={passport.answerQuiz}
        />
      )}
      {mode === 'pano' && <PanoOverlay name={panoName} onClose={() => scene?.closePano()} />}
      {walking && scene && (
        <WalkHud
          canTalk={!!profile}
          micState={micState}
          seat={seat}
          scene={scene}
          nearby={nearby}
          game={passport.game}
          onCheckIn={() => { scene.follow.releaseMouse(); checkInNearby(nearby); }}
        />
      )}

      {backend && (
        <AccountDialog
          isOpen={accountOpen}
          backend={backend}
          profile={profile}
          onDismiss={() => setAccountOpen(false)}
          onSignedIn={(next, isNew) => {
            setProfile(next);
            void refreshCount();
            toast(isNew ? `Welcome, ${next.name}! Your Student Passport is ready.` : `Welcome back, ${next.name}!`);
          }}
          onSignedOut={() => {
            setProfile(null);
            void refreshCount();
            toast('Logged out.');
          }}
          onLookSaved={(saved) => {
            setProfile(saved);
            toast('Character saved.');
          }}
        />
      )}
      <LegalDialog isOpen={legalOpen} onDismiss={() => setLegalOpen(false)} />
      <RoomTip tip={tip} />
      <Confetti burst={passport.burst} />
      {!scene && <div id="loading"><span>Building the campus…</span></div>}
    </>
  );
}

export default function CampusPage() {
  return (
    <ToastProvider>
      <title>CCC Campus 3D</title>
      <Campus />
    </ToastProvider>
  );
}
