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

describe('validation suite: characterization snapshots', () => {
  it('captures current no-flip x-direction behavior for r_driver=1, r_driven=2', () => {
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
      throw new Error('Expected valid bearing vectors for characterization scenario.')
    }

    expect(Math.sign(open.driverBearing.total.x)).toBe(Math.sign(crossed.driverBearing.total.x))
  })

  it('captures current x-direction flip behavior for r_driver=2, r_driven=1', () => {
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
      throw new Error('Expected valid bearing vectors for characterization scenario.')
    }

    expect(Math.sign(open.driverBearing.total.x)).not.toBe(Math.sign(crossed.driverBearing.total.x))
  })
})
