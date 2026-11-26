export type Item = {
  id: string;
  name: string;
  price: number;
  column: string;
  image?: string;
};

export type Column = {
  id: string;
  label: string;
};

export type Board = {
  id: string;
  title: string;
  noun: string;
  source: "preset" | "generated";
  columns: Column[];
  items: Item[];
};

export type PickRule = "free" | "onePerColumn";

export type Settings = {
  budget: number;
  rule: PickRule;
  players: 1 | 2;
  autoGrade: boolean;
};

export const TEAM_SIZE = 5;

export const DEFAULT_SETTINGS: Settings = {
  budget: 15,
  rule: "free",
  players: 1,
  autoGrade: false,
};

export const BUDGET_MIN = 5;
export const BUDGET_MAX = 50;
