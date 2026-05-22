import type { PulleyGeometry, Vector2 } from '../types'
import { normalize, perp, scaleVector, subtractVectors } from './vector'

function add(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x + b.x, y: a.y + b.y }
}

export function hasValidExternalTangency(
  driverRadiusM: number,
  drivenRadiusM: number,
  centerDistanceM: number,
): boolean {
  return centerDistanceM > Math.abs(driverRadiusM - drivenRadiusM)
}

export function computePulleyGeometry(
  driverRadiusM: number,
  drivenRadiusM: number,
  centerDistanceM: number,
): PulleyGeometry | null {
  const driverCenter = { x: 0, y: 0 }
  const drivenCenter = { x: 0, y: -centerDistanceM }

  const centerDelta = subtractVectors(drivenCenter, driverCenter)
  const centerDistance = Math.hypot(centerDelta.x, centerDelta.y)
  if (
    centerDistance === 0 ||
    !hasValidExternalTangency(driverRadiusM, drivenRadiusM, centerDistanceM)
  ) {
    return null
  }

  const k = (driverRadiusM - drivenRadiusM) / centerDistance
  const n = normalize(centerDelta)
  const t = perp(n)
  const hSquared = 1 - k * k
  if (hSquared < 0) {
    return null
  }
  const h = Math.sqrt(hSquared)

  const rightNormal = add(scaleVector(n, k), scaleVector(t, h))
  const leftNormal = add(scaleVector(n, k), scaleVector(t, -h))

  const rightDriverContact = add(driverCenter, scaleVector(rightNormal, driverRadiusM))
  const rightDrivenContact = add(drivenCenter, scaleVector(rightNormal, drivenRadiusM))
  const leftDriverContact = add(driverCenter, scaleVector(leftNormal, driverRadiusM))
  const leftDrivenContact = add(drivenCenter, scaleVector(leftNormal, drivenRadiusM))

  const rightSegmentUnit = normalize(subtractVectors(rightDrivenContact, rightDriverContact))
  const leftSegmentUnit = normalize(subtractVectors(leftDrivenContact, leftDriverContact))

  return {
    driverCenter,
    drivenCenter,
    rightDriverContact,
    rightDrivenContact,
    leftDriverContact,
    leftDrivenContact,
    rightSegmentUnit,
    leftSegmentUnit,
  }
}
