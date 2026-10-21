export const LIGHTS_SIZE = 5;
export const LIGHTS_SCRAMBLE = [0, 3, 6, 10, 14, 18];

export function affectedLights(index) {
  const row = Math.floor(index / LIGHTS_SIZE);
  const col = index % LIGHTS_SIZE;
  return [index,
    ...(row > 0 ? [index - LIGHTS_SIZE] : []),
    ...(row < LIGHTS_SIZE - 1 ? [index + LIGHTS_SIZE] : []),
    ...(col > 0 ? [index - 1] : []),
    ...(col < LIGHTS_SIZE - 1 ? [index + 1] : []),
  ];
}

export function createLightsExample() {
  const cells = Array(LIGHTS_SIZE ** 2).fill(true);
  LIGHTS_SCRAMBLE.forEach((press) => affectedLights(press).forEach((i) => { cells[i] = !cells[i]; }));
  return cells;
}
