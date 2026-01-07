export function createSeededRandom(seed?: number): () => number {
  let currentSeed = seed ?? Math.floor(Math.random() * 2147483647);
  
  return () => {
    currentSeed = (currentSeed * 16807) % 2147483647;
    return (currentSeed - 1) / 2147483646;
  };
}

export function randomRange(random: () => number, min: number, max: number): number {
  return min + random() * (max - min);
}

export function randomInt(random: () => number, min: number, max: number): number {
  return Math.floor(randomRange(random, min, max + 1));
}

export function shuffleArray<T>(random: () => number, array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function pickRandom<T>(random: () => number, array: T[]): T {
  return array[Math.floor(random() * array.length)];
}
