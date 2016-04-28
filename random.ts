/// <reference path="seedrandom.d.ts" />

export function get_random_float(): number {
  return Math.random();
}

export function seed_random(seed: number): void {
  Math.seedrandom(''+seed);
}

export function get_random_init_weight(hidden_size: number) {
  return (get_random_float() - 0.5) / hidden_size;
}
