export interface Lobby {
  id: string;
  game: string;
  host: string;
  ping: number;
  players: number;
  maxPlayers: number;
  status: 'open' | 'playing' | 'joined';
  region: string;
  controller: 'Arcade Stick' | 'Cabinet' | 'Gamepad' | 'Keyboard';
  rollbackFrames?: number;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'Connettività' | 'Hardware' | 'Software & Core' | 'Licenza';
}

export interface CabinetSetupStep {
  id: number;
  title: string;
  subtitle: string;
  code?: string;
  description: string;
  fileTarget?: string;
}
