import { describe, expect, it } from 'vitest'
import { calculateSystem } from './beltForces'

const BASE = {
  driverTorqueNm: 4,
  driverRadiusM: 1,
  drivenRadiusM: 2,
  centerDistanceM: 5,
  preloadN: 2,
  efficiency: 1,
  beltConfiguration: 'open' as const,
}

describe('validation suite: reference-backed checks', () => {
  it('matches driven torque magnitude ratio for open belt', () => {
    const result = calculateSystem({
      ...BASE,
      beltConfiguration: 'open',
      driverTorqueNm: 10,
      efficiency: 0.9,
      driverRadiusM: 0.2,
      drivenRadiusM: 0.5,
    })

    const expected = 0.9 * 10 * (0.5 / 0.2)
    expect(result.torque.drivenTorqueNm).toBeCloseTo(expected, 8)
    expect(result.rotation.driver).toBe('CCW')
    expect(result.rotation.driven).toBe('CCW')
  })

  it('reverses driven torque sign for crossed belt', () => {
    const result = calculateSystem({
      ...BASE,
      beltConfiguration: 'crossed',
      driverTorqueNm: 10,
      efficiency: 0.9,
      driverRadiusM: 0.2,
      drivenRadiusM: 0.5,
      centerDistanceM: 0.8,
    })

    const expectedMagnitude = 0.9 * 10 * (0.5 / 0.2)
    expect(result.torque.drivenTorqueNm).toBeCloseTo(-expectedMagnitude, 8)
    expect(result.rotation.driver).toBe('CCW')
    expect(result.rotation.driven).toBe('CW')
  })

  it('supports negative driver torque with expected open-belt direction relation', () => {
    const result = calculateSystem({
      ...BASE,
      beltConfiguration: 'open',
      driverTorqueNm: -6,
      efficiency: 0.8,
      driverRadiusM: 0.3,
      drivenRadiusM: 0.15,
    })

    const expected = -0.8 * 6 * (0.15 / 0.3)
    expect(result.torque.drivenTorqueNm).toBeCloseTo(expected, 8)
    expect(result.rotation.driver).toBe('CW')
    expect(result.rotation.driven).toBe('CW')
  })
})

describe('validation suite: constraint checks', () => {
  it('enforces open-belt geometry bound C > |r_driver-r_driven|', () => {
    const valid = calculateSystem({
      ...BASE,
      beltConfiguration: 'open',
      driverRadiusM: 2,
      drivenRadiusM: 1,
      centerDistanceM: 1.01,
    })
    const invalid = calculateSystem({
      ...BASE,
      beltConfiguration: 'open',
      driverRadiusM: 2,
      drivenRadiusM: 1,
      centerDistanceM: 1.0,
    })

    expect(valid.warnings.geometryInvalid).toBe(false)
    expect(invalid.warnings.geometryInvalid).toBe(true)
  })

  it('enforces crossed-belt geometry bound C > r_driver+r_driven', () => {
    const valid = calculateSystem({
      ...BASE,
      beltConfiguration: 'crossed',
      driverRadiusM: 2,
      drivenRadiusM: 1,
      centerDistanceM: 3.01,
    })
    const invalid = calculateSystem({
      ...BASE,
      beltConfiguration: 'crossed',
      driverRadiusM: 2,
      drivenRadiusM: 1,
      centerDistanceM: 3.0,
    })

    expect(valid.warnings.geometryInvalid).toBe(false)
    expect(invalid.warnings.geometryInvalid).toBe(true)
  })

  it('flags invalid efficiency bounds', () => {
    const low = calculateSystem({
      ...BASE,
      efficiency: 0,
    })
    const high = calculateSystem({
      ...BASE,
      efficiency: 1.2,
    })

    expect(low.warnings.efficiencyInvalid).toBe(true)
    expect(high.warnings.efficiencyInvalid).toBe(true)
  })
})

describe('validation suite: bearing-force direction checks', () => {
  // Closed-form reference (driver center at origin, driven at (0, -C),
  // CCW driver torque -> right span is the tight side in both belt configs).
  //
  // Open belt with r_d=1, r_n=2, C=5:
  //   k = (r_d - r_n)/C = -0.2, h = sqrt(1 - k^2) = sqrt(0.96)
  //   rightSegmentUnit = (h, k) = ( sqrt(0.96), -0.2 ) when expressed along
  //   the local (right-perpendicular, axis-along) basis, i.e. in world coords
  //   here that becomes ( -k, -h ) reflected... easier to just plug numbers:
  //     rightSegmentUnit  = ( 0.2, -sqrt(0.96) )
  //     leftSegmentUnit   = (-0.2, -sqrt(0.96) )
  //   T=4, F_pre=2 -> F_circ = 4, F_tight=4, F_slack=0; right is tight.
  //     driverBearing.total = 4*( 0.2, -sqrt(0.96) ) = ( 0.8, -4*sqrt(0.96) )
  //
  // Crossed belt with r_d=1, r_n=2, C=5:
  //   k = (r_d + r_n)/C = 0.6, h = sqrt(1 - 0.36) = 0.8
  //   rightSegmentUnit = (-0.6, -0.8), leftSegmentUnit = (0.6, -0.8)
  //     driverBearing.total = 4*(-0.6, -0.8) = (-2.4, -3.2)

  const SQRT_0_96 = Math.sqrt(0.96)

  it('matches closed-form driver-bearing total for open belt (r_d=1, r_n=2)', () => {
    const open = calculateSystem({
      ...BASE,
      beltConfiguration: 'open',
      driverRadiusM: 1,
      drivenRadiusM: 2,
      centerDistanceM: 5,
      preloadN: 2,
      driverTorqueNm: 4,
      efficiency: 1,
    })

    if (!open.driverBearing) {
      throw new Error('Expected valid bearing vectors for open scenario.')
    }

    expect(open.driverBearing.total.x).toBeCloseTo(0.8, 8)
    expect(open.driverBearing.total.y).toBeCloseTo(-4 * SQRT_0_96, 8)
  })

  it('matches closed-form driver-bearing total for crossed belt (r_d=1, r_n=2)', () => {
    const crossed = calculateSystem({
      ...BASE,
      beltConfiguration: 'crossed',
      driverRadiusM: 1,
      drivenRadiusM: 2,
      centerDistanceM: 5,
      preloadN: 2,
      driverTorqueNm: 4,
      efficiency: 1,
    })

    if (!crossed.driverBearing) {
      throw new Error('Expected valid bearing vectors for crossed scenario.')
    }

    expect(crossed.driverBearing.total.x).toBeCloseTo(-2.4, 8)
    expect(crossed.driverBearing.total.y).toBeCloseTo(-3.2, 8)
  })

  it('flips driver-bearing x sign when toggling open<->crossed for r_d=1, r_n=2', () => {
    const open = calculateSystem({
      ...BASE,
      beltConfiguration: 'open',
      driverRadiusM: 1,
      drivenRadiusM: 2,
      centerDistanceM: 5,
      preloadN: 2,
      driverTorqueNm: 4,
      efficiency: 1,
    })
    const crossed = calculateSystem({
      ...BASE,
      beltConfiguration: 'crossed',
      driverRadiusM: 1,
      drivenRadiusM: 2,
      centerDistanceM: 5,
      preloadN: 2,
      driverTorqueNm: 4,
      efficiency: 1,
    })

    if (!open.driverBearing || !crossed.driverBearing) {
      throw new Error('Expected valid bearing vectors for scenario.')
    }

    expect(Math.sign(open.driverBearing.total.x)).not.toBe(Math.sign(crossed.driverBearing.total.x))
  })

  it('keeps driver-bearing x sign when toggling open<->crossed for r_d=2, r_n=1', () => {
    const open = calculateSystem({
      ...BASE,
      beltConfiguration: 'open',
      driverRadiusM: 2,
      drivenRadiusM: 1,
      centerDistanceM: 5,
      preloadN: 2,
      driverTorqueNm: 4,
      efficiency: 1,
    })
    const crossed = calculateSystem({
      ...BASE,
      beltConfiguration: 'crossed',
      driverRadiusM: 2,
      drivenRadiusM: 1,
      centerDistanceM: 5,
      preloadN: 2,
      driverTorqueNm: 4,
      efficiency: 1,
    })

    if (!open.driverBearing || !crossed.driverBearing) {
      throw new Error('Expected valid bearing vectors for scenario.')
    }

    expect(Math.sign(open.driverBearing.total.x)).toBe(Math.sign(crossed.driverBearing.total.x))
  })
})
