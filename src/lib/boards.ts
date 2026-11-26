import type { Board, Column, Item } from "./types";

export const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/ /g, "-");

type Grid = { columns: string[]; tiers: Record<number, string[]> };

function gridBoard(id: string, title: string, noun: string, grid: Grid): Board {
  const columns: Column[] = grid.columns.map((label) => ({ id: slug(label), label }));
  const items: Item[] = Object.entries(grid.tiers).flatMap(([price, names]) =>
    names.map((name, i) => ({
      id: `${id}-${slug(name)}`,
      name,
      price: Number(price),
      column: columns[i].id,
      image: `/images/${id}/${slug(name)}.jpg`,
    })),
  );
  return { id, title, noun, source: "preset", columns, items };
}

export function tiersOf(board: Board): number[] {
  return [...new Set(board.items.map((i) => i.price))].sort((a, b) => b - a);
}

export function itemsAt(board: Board, columnId: string, price: number): Item[] {
  return board.items.filter((i) => i.column === columnId && i.price === price);
}

export const PRESET_BOARDS: Board[] = [
  gridBoard("nba", "NBA", "starting five", {
    columns: ["PG", "SG", "SF", "PF", "C"],
    tiers: {
      5: ["Shai Gilgeous-Alexander", "Anthony Edwards", "Jayson Tatum", "Giannis Antetokounmpo", "Nikola Jokic"],
      4: ["Luka Doncic", "Donovan Mitchell", "LeBron James", "Evan Mobley", "Victor Wembanyama"],
      3: ["Stephen Curry", "Devin Booker", "Kevin Durant", "Paolo Banchero", "Anthony Davis"],
      2: ["Jalen Brunson", "Jalen Williams", "Jaylen Brown", "Jaren Jackson Jr.", "Alperen Sengun"],
      1: ["Cade Cunningham", "Tyler Herro", "Kawhi Leonard", "Scottie Barnes", "Chet Holmgren"],
    },
  }),
  gridBoard("nfl", "NFL", "team", {
    columns: ["QB", "RB", "WR", "TE", "Defense"],
    tiers: {
      5: ["Josh Allen", "Saquon Barkley", "Ja'Marr Chase", "Trey McBride", "Myles Garrett"],
      4: ["Patrick Mahomes", "Jahmyr Gibbs", "Justin Jefferson", "Brock Bowers", "Micah Parsons"],
      3: ["Lamar Jackson", "Bijan Robinson", "Puka Nacua", "George Kittle", "T. J. Watt"],
      2: ["Joe Burrow", "Derrick Henry", "CeeDee Lamb", "Travis Kelce", "Aidan Hutchinson"],
      1: ["Jayden Daniels", "Christian McCaffrey", "Amon-Ra St. Brown", "Sam LaPorta", "Nick Bosa"],
    },
  }),
  gridBoard("fastfood", "Fast food", "food court", {
    columns: ["Burgers", "Chicken", "Mexican", "Pizza", "Subs"],
    tiers: {
      5: ["In-N-Out Burger", "Chick-fil-A", "Chipotle", "Domino's", "Jersey Mike's"],
      4: ["Five Guys", "Raising Cane's", "Taco Bell", "Pizza Hut", "Jimmy John's"],
      3: ["Shake Shack", "Popeyes", "Qdoba", "Papa John's", "Firehouse Subs"],
      2: ["McDonald's", "Wingstop", "Moe's Southwest Grill", "Little Caesars", "Subway"],
      1: ["Wendy's", "KFC", "Del Taco", "Marco's Pizza", "Potbelly"],
    },
  }),
];
