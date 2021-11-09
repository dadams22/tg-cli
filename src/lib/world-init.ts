import { World } from './world.js';
import { PlayerInfo } from './player-info.js';


export interface WorldInit extends World {
  userFirstName: string | null;
  players: PlayerInfo[];
  domains: string[];
  variables: string[]; // public/private variables to quickly allow indication of unfilled rules
}
