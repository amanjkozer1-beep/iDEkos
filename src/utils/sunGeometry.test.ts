import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSunRays,
  generateCombinedRaysPath,
  RAY_COUNT,
  RAY_STEP_DEG,
  RAY_STEP_RAD,
} from './sunGeometry.ts';

test('21-ray sun has exactly 21 rays', () => {
  assert.equal(RAY_COUNT, 21);
  const rays = calculateSunRays({
    cx: 50,
    cy: 50,
    innerRadius: 18,
    outerRadius: 36,
    discRadius: 16,
  });
  assert.equal(rays.length, 21);
});

test('angular separation is 360 / 21 degrees', () => {
  const expectedDeg = 360 / 21;
  assert.ok(Math.abs(RAY_STEP_DEG - expectedDeg) < 0.0001);

  const rays = calculateSunRays({
    cx: 100,
    cy: 100,
    innerRadius: 30,
    outerRadius: 70,
    discRadius: 28,
  });

  for (let i = 0; i < rays.length; i++) {
    const expectedAngle = (i * expectedDeg) % 360;
    assert.ok(
      Math.abs(rays[i].angleDeg - expectedAngle) < 0.001,
      `Ray ${i} angle mismatch`
    );
  }
});

test('ray geometry produces valid SVG path commands without NaN', () => {
  const raysPath = generateCombinedRaysPath({
    cx: 200,
    cy: 200,
    innerRadius: 60,
    outerRadius: 140,
    discRadius: 55,
  });

  assert.ok(raysPath.length > 0);
  assert.ok(!raysPath.includes('NaN'));
  assert.ok(!raysPath.includes('undefined'));
  assert.ok(raysPath.startsWith('M'));
});

test('tips are properly spaced radially further than base', () => {
  const rays = calculateSunRays({
    cx: 0,
    cy: 0,
    innerRadius: 20,
    outerRadius: 50,
    discRadius: 18,
  });

  for (const ray of rays) {
    const tipDist = Math.sqrt(ray.tipX * ray.tipX + ray.tipY * ray.tipY);
    const baseDist = Math.sqrt(
      ray.baseLeftX * ray.baseLeftX + ray.baseLeftY * ray.baseLeftY
    );
    assert.ok(Math.abs(tipDist - 50) < 0.1);
    assert.ok(Math.abs(baseDist - 20) < 0.1);
  }
});
