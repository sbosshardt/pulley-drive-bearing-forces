import type { BeltConfiguration, PulleyGeometry, Vector2 } from '../types'
import { normalize, perp, scaleVector, subtractVectors } from './vector'

function add(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x + b.x, y: a.y + b.y }
}

export function hasValidTangency(
  driverRadiusM: number,
  drivenRadiusM: number,
  centerDistanceM: number,
  beltConfiguration: BeltConfiguration,
): boolean {
  if (beltConfiguration === 'crossed') {
    return centerDistanceM > driverRadiusM + drivenRadiusM
  }
  return centerDistanceM > Math.abs(driverRadiusM - drivenRadiusM)
}

export function computePulleyGeometry(
  driverRadiusM: number,
  drivenRadiusM: number,
  centerDistanceM: number,
  beltConfiguration: BeltConfiguration,
): PulleyGeometry | null {
  const driverCenter = { x: 0, y: 0 }
  const drivenCenter = { x: 0, y: -centerDistanceM }

  const centerDelta = subtractVectors(drivenCenter, driverCenter)
  const centerDistance = Math.hypot(centerDelta.x, centerDelta.y)
  if (
    centerDistance === 0 ||
    !hasValidTangency(
      driverRadiusM,
      drivenRadiusM,
      centerDistanceM,
      beltConfiguration,
    )
  ) {
    return null
  }

  const isCrossed = beltConfiguration === 'crossed'
  const k = isCrossed
    ? (driverRadiusM + drivenRadiusM) / centerDistance
    : (driverRadiusM - drivenRadiusM) / centerDistance
  const drivenNormalSign = isCrossed ? -1 : 1
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
  const rightDrivenContact = add(
    drivenCenter,
    scaleVector(rightNormal, drivenRadiusM * drivenNormalSign),
  )
  const leftDriverContact = add(driverCenter, scaleVector(leftNormal, driverRadiusM))
  const leftDrivenContact = add(
    drivenCenter,
    scaleVector(leftNormal, drivenRadiusM * drivenNormalSign),
  )

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
