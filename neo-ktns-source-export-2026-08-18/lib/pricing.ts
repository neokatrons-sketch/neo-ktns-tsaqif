export function toPsychologicalPrice(value: number) {
  return Math.ceil((value + 100) / 10_000) * 10_000 - 100;
}
