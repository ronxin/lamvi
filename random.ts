let next_random: number = 1;

// An integer between 0 and 65535 (inclusive)
export function get_random(): number {
  next_random = (next_random * 25214903917 + 11) & 0xffff;
  return next_random;
}

export function get_random_float(): number {
  return get_random() / 0xffff;
}

export function seed_random(seed: number): void {
  next_random = seed;
}

export function get_random_init_weight(hidden_size: number) {
  let random_float = get_random() / 65536;
  return (random_float - 0.5) / hidden_size;
}
