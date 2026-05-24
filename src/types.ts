export type BeltConfiguration = 'open' | 'crossed'
export type RotationDirection = 'CCW' | 'CW' | 'stationary'

export interface UserInputs {
  driverTorqueNm: number
  driverRadiusM: number
  drivenRadiusM: number
  centerDistanceM: number
  preloadN: number
  efficiency: number
  beltConfiguration: BeltConfiguration
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
  circumferentialForceSignedN: number
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
  efficiencyInvalid: boolean
}

export interface RotationState {
  driver: RotationDirection
  driven: RotationDirection
}

export interface TorqueState {
  driverTorqueNm: number
  drivenTorqueNm: number
}

export interface CalculationResult {
  inputs: UserInputs
  belt: BeltTensionState
  torque: TorqueState
  rotation: RotationState
  geometry: PulleyGeometry | null
  driverBearing: BearingForces | null
  drivenBearing: BearingForces | null
  warnings: CalculationWarnings
}
