let next_random: number = 1;

export function get_random(): number {
  next_random = (next_random * 25214903917 + 11) & 0xffff;
  return next_random;
}

export function seed_random(seed: number): void {
  next_random = seed;
}

export function get_random_init_weight(hidden_size: number) {
  let random_float = get_random() / 65536;
  return (random_float - 0.5) / hidden_size;
}
