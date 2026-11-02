import { describe, expect, it } from 'vitest';
import { MAX_VOICE_PEERS, SPEAK_LEVEL, VOICE_KEEP_RANGE, VOICE_RANGE, chooseVoicePeers, cleanVoiceMessage, isInitiator, micLevel, voiceBadge, voiceVolume } from './voice';

describe('voiceVolume', () => {
  it('is full up close', () => expect(voiceVolume(2, true)).toBe(1));
  it('fades with distance', () => {
    const mid = voiceVolume(VOICE_RANGE / 2, true);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
    expect(voiceVolume(VOICE_RANGE - 2, true)).toBeLessThan(mid);
  });
  it('is silent at the edge and beyond', () => {
    expect(voiceVolume(VOICE_RANGE, true)).toBe(0);
    expect(voiceVolume(VOICE_RANGE + 50, true)).toBe(0);
  });
  it('is silent between indoors and outdoors', () => expect(voiceVolume(1, false)).toBe(0));
  it('treats a bad distance as silent', () => expect(voiceVolume(Number.NaN, true)).toBe(0));
});

describe('isInitiator', () => {
  it('gives exactly one side the offer', () => {
    expect(isInitiator('a', 'b')).toBe(true);
    expect(isInitiator('b', 'a')).toBe(false);
  });
});

describe('chooseVoicePeers', () => {
  it('opens a new connection only inside the range', () => {
    expect(chooseVoicePeers([{ id: 'near', distance: VOICE_RANGE - 1, connected: false }, { id: 'far', distance: VOICE_RANGE + 1, connected: false }])).toEqual(new Set(['near']));
  });
  it('keeps a connection in the margin, and drops it beyond', () => {
    expect(chooseVoicePeers([{ id: 'edge', distance: VOICE_KEEP_RANGE - 1, connected: true }, { id: 'gone', distance: VOICE_KEEP_RANGE + 1, connected: true }])).toEqual(new Set(['edge']));
  });
  it('takes the nearest when too many are close', () => {
    const crowd = Array.from({ length: MAX_VOICE_PEERS + 3 }, (_, i) => ({ id: `p${i}`, distance: 20 - i, connected: false }));
    const chosen = chooseVoicePeers(crowd);
    expect(chosen.size).toBe(MAX_VOICE_PEERS);
    expect(chosen.has(`p${MAX_VOICE_PEERS + 2}`)).toBe(true);
    expect(chosen.has('p0')).toBe(false);
  });
});

describe('voiceBadge', () => {
  it.each([
    ['off', 'connected', null],
    [undefined, 'connected', null],
    ['muted', 'connected', 'muted'],
    ['muted', 'failed', 'muted'],
    ['live', 'connected', 'live'],
    ['live', 'connecting', 'wait'],
    ['live', 'none', 'wait'],
    ['live', 'failed', 'failed'],
  ] as const)('mic %s with link %s shows %s', (mic, link, badge) => {
    expect(voiceBadge(mic, link)).toBe(badge);
  });
});

describe('cleanVoiceMessage', () => {
  it('accepts a state', () => {
    expect(cleanVoiceMessage({ kind: 'state', id: 'a', mic: 'live', speaking: true, onFoot: true, extra: '<b>' })).toEqual({ kind: 'state', id: 'a', mic: 'live', speaking: true, onFoot: true });
  });
  it('accepts signals and keeps only known fields', () => {
    expect(cleanVoiceMessage({ kind: 'offer', from: 'a', to: 'b', sdp: 'v=0', extra: 1 })).toEqual({ kind: 'offer', from: 'a', to: 'b', sdp: 'v=0' });
    expect(cleanVoiceMessage({ kind: 'bye', from: 'a', to: 'b', sdp: 'ignored' })).toEqual({ kind: 'bye', from: 'a', to: 'b' });
  });
  it('turns odd flags into false', () => {
    expect(cleanVoiceMessage({ kind: 'state', id: 'a', mic: 'off', speaking: 'yes', onFoot: 1 })).toEqual({ kind: 'state', id: 'a', mic: 'off', speaking: false, onFoot: false });
  });
  it.each([
    [null],
    ['offer'],
    [{ kind: 'nope', from: 'a', to: 'b' }],
    [{ kind: 'state', id: 'a', mic: 'asking' }],
    [{ kind: 'state', id: 5, mic: 'live' }],
    [{ kind: 'state', id: 'x'.repeat(65), mic: 'live' }],
    [{ kind: 'offer', from: 'a', to: 'b' }],
    [{ kind: 'answer', from: 'a', to: 'b', sdp: 7 }],
    [{ kind: 'offer', from: 'a', to: 'b', sdp: 'x'.repeat(20001) }],
    [{ kind: 'bye', from: 'a' }],
  ])('refuses %j', (raw) => expect(cleanVoiceMessage(raw)).toBeNull());
});

describe('micLevel', () => {
  it('is zero for silence', () => expect(micLevel(new Uint8Array(32).fill(128))).toBe(0));
  it('passes the speaking level for a signal', () => {
    const wave = Uint8Array.from({ length: 32 }, (_, i) => (i % 2 ? 168 : 88));
    expect(micLevel(wave)).toBeGreaterThan(SPEAK_LEVEL);
  });
  it('stays under the speaking level for faint noise', () => {
    const hiss = Uint8Array.from({ length: 32 }, (_, i) => (i % 2 ? 129 : 127));
    expect(micLevel(hiss)).toBeLessThan(SPEAK_LEVEL);
  });
});
