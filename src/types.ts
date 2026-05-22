export interface UserInputs {
  driverTorqueNm: number
  driverRadiusM: number
  drivenRadiusM: number
  centerDistanceM: number
  preloadN: number
}

export interface Vector2 {
  x: number
  y: number
}

export interface ForceVector extends Vector2 {
  magnitude: number
  angleDeg: number
}

export interface BeltTensionState {
  circumferentialForceN: number
  tightTensionN: number
  slackTensionN: number
}

export interface PulleyGeometry {
  driverCenter: Vector2
  drivenCenter: Vector2
  rightDriverContact: Vector2
  rightDrivenContact: Vector2
  leftDriverContact: Vector2
  leftDrivenContact: Vector2
  rightSegmentUnit: Vector2
  leftSegmentUnit: Vector2
}

export interface BearingForces {
  preloadOnly: ForceVector
  transmissionOnly: ForceVector
  total: ForceVector
}

export interface CalculationWarnings {
  geometryInvalid: boolean
  preloadTooLow: boolean
}

export interface CalculationResult {
  inputs: UserInputs
  belt: BeltTensionState
  geometry: PulleyGeometry | null
  driverBearing: BearingForces | null
  drivenBearing: BearingForces | null
  warnings: CalculationWarnings
}
