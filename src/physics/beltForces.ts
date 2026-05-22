import type {
  BearingForces,
  BeltTensionState,
  CalculationResult,
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
  const circumferentialForceN = inputs.driverTorqueNm / safeRadius
  const tightTensionN = inputs.preloadN + circumferentialForceN / 2
  const slackTensionN = inputs.preloadN - circumferentialForceN / 2

  return {
    circumferentialForceN,
    tightTensionN,
    slackTensionN,
  }
}

export function calculateSystem(inputs: UserInputs): CalculationResult {
  const tensions = computeTensions(inputs)
  const hasInvalidInputs =
    inputs.driverRadiusM <= 0 ||
    inputs.drivenRadiusM <= 0 ||
    inputs.centerDistanceM <= 0 ||
    inputs.preloadN < 0
  const geometry = computePulleyGeometry(
    inputs.driverRadiusM,
    inputs.drivenRadiusM,
    inputs.centerDistanceM,
  )

  const warnings = {
    geometryInvalid: hasInvalidInputs || geometry === null,
    preloadTooLow: tensions.slackTensionN < 0,
  }

  if (!geometry) {
    return {
      inputs,
      belt: tensions,
      geometry: null,
      driverBearing: null,
      drivenBearing: null,
      warnings,
    }
  }

  const driverPreloadLoad = pulleyLoadFromSegments(
    geometry.rightSegmentUnit,
    geometry.leftSegmentUnit,
    inputs.preloadN,
    inputs.preloadN,
  )
  const driverTotalLoad = pulleyLoadFromSegments(
    geometry.rightSegmentUnit,
    geometry.leftSegmentUnit,
    tensions.tightTensionN,
    tensions.slackTensionN,
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
    tensions.tightTensionN,
    tensions.slackTensionN,
  )

  return {
    inputs,
    belt: tensions,
    geometry,
    driverBearing: computeBearingForces(driverPreloadLoad, driverTotalLoad),
    drivenBearing: computeBearingForces(drivenPreloadLoad, drivenTotalLoad),
    warnings,
  }
}
