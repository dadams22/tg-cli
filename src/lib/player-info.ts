export interface PlayerInfo {
  id: string;
  alias: string;
  goals: PlayerGoal[]; // TODO: Do we really want the goals info? What for?
  variables: string[];
}

export interface PlayerGoal {
  type: 'Page' | 'API';
  value: string;
}
