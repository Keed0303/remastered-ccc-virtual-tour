export interface GameState { xp: number; stamps: string[]; quiz: string[]; badges: string[] }
export interface Badge { id: string; name: string; icon: string; test: (state: GameState) => boolean }
