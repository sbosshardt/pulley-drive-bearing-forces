import type { ForceVector, Vector2 } from '../types'

const RAD_TO_DEG = 180 / Math.PI

export function addVectors(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x + b.x, y: a.y + b.y }
}

export function subtractVectors(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x - b.x, y: a.y - b.y }
}

export function scaleVector(v: Vector2, scalar: number): Vector2 {
  return { x: v.x * scalar, y: v.y * scalar }
}

export function dot(a: Vector2, b: Vector2): number {
  return a.x * b.x + a.y * b.y
}

export function magnitude(v: Vector2): number {
  return Math.hypot(v.x, v.y)
}

export function normalize(v: Vector2): Vector2 {
  const len = magnitude(v)
  if (len === 0) {
    return { x: 0, y: 0 }
  }
  return { x: v.x / len, y: v.y / len }
}

export function perp(v: Vector2): Vector2 {
  return { x: -v.y, y: v.x }
}

export function toForceVector(v: Vector2): ForceVector {
  return {
    x: v.x,
    y: v.y,
    magnitude: magnitude(v),
    angleDeg: Math.atan2(v.y, v.x) * RAD_TO_DEG,
  }
}
