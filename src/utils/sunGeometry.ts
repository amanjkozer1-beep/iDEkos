/**
 * Mathematical generation for the 21-ray sun symbol
 * Used in K.O.S (Kozer Operating System)
 * 21 rays represent the golden sun of the Kurdish visual identity (360/21 = ~17.143 deg)
 */

export interface SunRayGeometry {
  index: number;
  angleDeg: number;
  angleRad: number;
  tipX: number;
  tipY: number;
  baseLeftX: number;
  baseLeftY: number;
  baseRightX: number;
  baseRightY: number;
  pathData: string;
}

export interface SunConfig {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  discRadius: number;
  ringRadius?: number;
  raySpreadRatio?: number; // ratio of angular step for the ray base (e.g. 0.4)
}

export const RAY_COUNT = 21;
export const RAY_STEP_DEG = 360 / RAY_COUNT; // ~17.142857 deg
export const RAY_STEP_RAD = (2 * Math.PI) / RAY_COUNT;

export function calculateSunRays(config: SunConfig): SunRayGeometry[] {
  const { cx, cy, innerRadius, outerRadius, raySpreadRatio = 0.38 } = config;
  const halfSpreadRad = (RAY_STEP_RAD * raySpreadRatio) / 2;
  const rays: SunRayGeometry[] = [];

  for (let i = 0; i < RAY_COUNT; i++) {
    // Start pointing straight up at 12 o'clock (-PI / 2)
    const midAngle = -Math.PI / 2 + i * RAY_STEP_RAD;
    const leftAngle = midAngle - halfSpreadRad;
    const rightAngle = midAngle + halfSpreadRad;

    const tipX = cx + outerRadius * Math.cos(midAngle);
    const tipY = cy + outerRadius * Math.sin(midAngle);

    const baseLeftX = cx + innerRadius * Math.cos(leftAngle);
    const baseLeftY = cy + innerRadius * Math.sin(leftAngle);

    const baseRightX = cx + innerRadius * Math.cos(rightAngle);
    const baseRightY = cy + innerRadius * Math.sin(rightAngle);

    const pathData = `M ${round(baseLeftX)} ${round(baseLeftY)} L ${round(tipX)} ${round(tipY)} L ${round(baseRightX)} ${round(baseRightY)} Z`;

    rays.push({
      index: i,
      angleDeg: (i * RAY_STEP_DEG) % 360,
      angleRad: midAngle,
      tipX: round(tipX),
      tipY: round(tipY),
      baseLeftX: round(baseLeftX),
      baseLeftY: round(baseLeftY),
      baseRightX: round(baseRightX),
      baseRightY: round(baseRightY),
      pathData,
    });
  }

  return rays;
}

export function generateCombinedRaysPath(config: SunConfig): string {
  const rays = calculateSunRays(config);
  return rays.map((r) => r.pathData).join(' ');
}

function round(val: number): number {
  return Math.round(val * 1000) / 1000;
}
