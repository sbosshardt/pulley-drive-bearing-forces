import { describe, expect, it } from 'vitest'
import { calculateSystem } from './beltForces'

describe('calculateSystem', () => {
  it('converts torque to circumferential force', () => {
    const result = calculateSystem({
      driverTorqueNm: 24,
      driverRadiusM: 0.12,
      drivenRadiusM: 0.12,
      centerDistanceM: 0.8,
      preloadN: 300,
    })

    expect(result.belt.circumferentialForceN).toBeCloseTo(200, 8)
    expect(result.belt.tightTensionN).toBeCloseTo(400, 8)
    expect(result.belt.slackTensionN).toBeCloseTo(200, 8)
  })

  it('flags preload-too-low condition when slack goes negative', () => {
    const result = calculateSystem({
      driverTorqueNm: 100,
      driverRadiusM: 0.1,
      drivenRadiusM: 0.1,
      centerDistanceM: 0.7,
      preloadN: 200,
    })

    expect(result.warnings.preloadTooLow).toBe(true)
  })

  it('supports unequal pulley radii when center distance is valid', () => {
    const result = calculateSystem({
      driverTorqueNm: 30,
      driverRadiusM: 0.15,
      drivenRadiusM: 0.08,
      centerDistanceM: 0.5,
      preloadN: 250,
    })

    expect(result.warnings.geometryInvalid).toBe(false)
    expect(result.geometry).not.toBeNull()
    expect(result.driverBearing).not.toBeNull()
  })

  it('rejects invalid geometry where C <= |r_driver-r_driven|', () => {
    const result = calculateSystem({
      driverTorqueNm: 20,
      driverRadiusM: 0.2,
      drivenRadiusM: 0.08,
      centerDistanceM: 0.12,
      preloadN: 300,
    })

    expect(result.warnings.geometryInvalid).toBe(true)
    expect(result.geometry).toBeNull()
    expect(result.driverBearing).toBeNull()
  })

  it('creates opposite preload vectors on driver and driven pulleys', () => {
    const result = calculateSystem({
      driverTorqueNm: 0,
      driverRadiusM: 0.1,
      drivenRadiusM: 0.1,
      centerDistanceM: 0.6,
      preloadN: 180,
    })

    if (!result.driverBearing || !result.drivenBearing) {
      throw new Error('Expected valid bearing force outputs for equal pulley case.')
    }

    expect(result.driverBearing.preloadOnly.x).toBeCloseTo(
      -result.drivenBearing.preloadOnly.x,
      8,
    )
    expect(result.driverBearing.preloadOnly.y).toBeCloseTo(
      -result.drivenBearing.preloadOnly.y,
      8,
    )
  })
})
