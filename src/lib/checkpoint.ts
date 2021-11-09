export interface PlayerCheckpoint {
  action: string;
  hook: string;
  pattern: string;
  operator: keyof typeof Operators;
}

export const Operators = {
  Equals: "is",
  Regex: "contains",
  Glob: "matches",
  Contains: "contains"
}