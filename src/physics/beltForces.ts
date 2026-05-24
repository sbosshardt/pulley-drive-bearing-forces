import type {
  BearingForces,
  BeltTensionState,
  CalculationResult,
  RotationDirection,
  UserInputs,
  Vector2,
} from '../types'
import { computePulleyGeometry } from './geometry'
import {
  addVectors,
  scaleVector,
  subtractVectors,
  toForceVector,
} from './vector'

function pulleyLoadFromSegments(
  rightUnit: Vector2,
  leftUnit: Vector2,
  rightTensionN: number,
  leftTensionN: number,
): Vector2 {
  return addVectors(scaleVector(rightUnit, rightTensionN), scaleVector(leftUnit, leftTensionN))
}

function computeBearingForces(
  preloadLoad: Vector2,
  totalLoad: Vector2,
): BearingForces {
  const transmissionOnly = subtractVectors(totalLoad, preloadLoad)
  return {
    preloadOnly: toForceVector(preloadLoad),
    transmissionOnly: toForceVector(transmissionOnly),
    total: toForceVector(totalLoad),
  }
}

function computeTensions(inputs: UserInputs): BeltTensionState {
  const safeRadius = inputs.driverRadiusM > 0 ? inputs.driverRadiusM : Number.NaN
  const circumferentialForceSignedN = inputs.driverTorqueNm / safeRadius
  const circumferentialForceN = Math.abs(circumferentialForceSignedN)
  const tightTensionN = inputs.preloadN + circumferentialForceN / 2
  const slackTensionN = inputs.preloadN - circumferentialForceN / 2

  return {
    circumferentialForceN,
    circumferentialForceSignedN,
    tightTensionN,
    slackTensionN,
  }
}

function rightSpanIsTight(driverTorqueNm: number): boolean {
  // The driver sits above the driven pulley (centers on the y-axis).
  // For positive (CCW) driver torque, the surface speed at the right contact
  // points such that the belt enters the driver's wrap on the right side; per
  // capstan/Eytelwein analysis, the entry side of a driving pulley carries the
  // higher tension. This relationship depends only on torque sign, not on
  // whether the belt is open or crossed.
  if (driverTorqueNm === 0) {
    return true
  }

  return driverTorqueNm > 0
}

function toRotationDirection(torqueNm: number): RotationDirection {
  if (torqueNm > 0) {
    return 'CCW'
  }
  if (torqueNm < 0) {
    return 'CW'
  }
  return 'stationary'
}

function computeDrivenTorqueNm(inputs: UserInputs, tensions: BeltTensionState): number {
  const boundedEfficiency = Math.min(1, Math.max(0, inputs.efficiency))
  const directionFactor = inputs.beltConfiguration === 'open' ? 1 : -1
  const driverDirection = Math.sign(inputs.driverTorqueNm)

  if (driverDirection === 0) {
    return 0
  }

  const drivenMagnitude = tensions.circumferentialForceN * inputs.drivenRadiusM * boundedEfficiency
  return drivenMagnitude * driverDirection * directionFactor
}

export function calculateSystem(inputs: UserInputs): CalculationResult {
  const tensions = computeTensions(inputs)
  const hasInvalidGeometryInputs =
    inputs.driverRadiusM <= 0 ||
    inputs.drivenRadiusM <= 0 ||
    inputs.centerDistanceM <= 0 ||
    inputs.preloadN < 0
  const geometry = computePulleyGeometry(
    inputs.driverRadiusM,
    inputs.drivenRadiusM,
    inputs.centerDistanceM,
    inputs.beltConfiguration,
  )
  const drivenTorqueNm = computeDrivenTorqueNm(inputs, tensions)
  const rotation = {
    driver: toRotationDirection(inputs.driverTorqueNm),
    driven: toRotationDirection(drivenTorqueNm),
  }
  const torque = {
    driverTorqueNm: inputs.driverTorqueNm,
    drivenTorqueNm,
  }

  const warnings = {
    geometryInvalid: hasInvalidGeometryInputs || geometry === null,
    preloadTooLow: tensions.slackTensionN < 0,
    efficiencyInvalid: inputs.efficiency <= 0 || inputs.efficiency > 1,
  }

  if (!geometry) {
    return {
      inputs,
      belt: tensions,
      torque,
      rotation,
      geometry: null,
      driverBearing: null,
      drivenBearing: null,
      warnings,
    }
  }

  const rightIsTight = rightSpanIsTight(inputs.driverTorqueNm)
  const rightTensionN = rightIsTight ? tensions.tightTensionN : tensions.slackTensionN
  const leftTensionN = rightIsTight ? tensions.slackTensionN : tensions.tightTensionN

  const driverPreloadLoad = pulleyLoadFromSegments(
    geometry.rightSegmentUnit,
    geometry.leftSegmentUnit,
    inputs.preloadN,
    inputs.preloadN,
  )
  const driverTotalLoad = pulleyLoadFromSegments(
    geometry.rightSegmentUnit,
    geometry.leftSegmentUnit,
    rightTensionN,
    leftTensionN,
  )

  const drivenRightUnit = scaleVector(geometry.rightSegmentUnit, -1)
  const drivenLeftUnit = scaleVector(geometry.leftSegmentUnit, -1)
  const drivenPreloadLoad = pulleyLoadFromSegments(
    drivenRightUnit,
    drivenLeftUnit,
    inputs.preloadN,
    inputs.preloadN,
  )
  const drivenTotalLoad = pulleyLoadFromSegments(
    drivenRightUnit,
    drivenLeftUnit,
    rightTensionN,
    leftTensionN,
  )

  return {
    inputs,
    belt: tensions,
    torque,
    rotation,
    geometry,
    driverBearing: computeBearingForces(driverPreloadLoad, driverTotalLoad),
    drivenBearing: computeBearingForces(drivenPreloadLoad, drivenTotalLoad),
    warnings,
  }
}
