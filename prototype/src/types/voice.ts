export type MicState = 'off' | 'asking' | 'live' | 'muted';
export type SharedMic = 'off' | 'live' | 'muted';
export type VoiceBadge = 'live' | 'muted' | 'wait' | 'failed';
export type LinkStatus = 'none' | 'connecting' | 'connected' | 'failed';

// What each student shares on the campus channel.
export interface VoiceState { kind: 'state'; id: string; mic: SharedMic; speaking: boolean; onFoot: boolean }
export interface VoiceSignal { kind: 'offer' | 'answer' | 'bye'; from: string; to: string; sdp?: string }
export type VoiceMessage = VoiceState | VoiceSignal;

export interface VoiceCandidate { id: string; distance: number; connected: boolean }
