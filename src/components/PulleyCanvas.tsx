import type { BearingForces, CalculationResult, Vector2 } from '../types'

interface PulleyCanvasProps {
  result: CalculationResult
}

const WIDTH = 760
const HEIGHT = 520
const PADDING = 40

function toScreen(point: Vector2, scale: number, centerX: number, centerY: number): Vector2 {
  return {
    x: centerX + point.x * scale,
    y: centerY - point.y * scale,
  }
}

function extents(values: number[]) {
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  }
}

function drawArrow(
  origin: Vector2,
  direction: Vector2,
  pxPerNewton: number,
): Vector2 {
  return {
    x: origin.x + direction.x * pxPerNewton,
    y: origin.y - direction.y * pxPerNewton,
  }
}

function forceSpan(forces: BearingForces): number {
  return Math.max(
    forces.preloadOnly.magnitude,
    forces.transmissionOnly.magnitude,
    forces.total.magnitude,
  )
}

export function PulleyCanvas({ result }: PulleyCanvasProps) {
  if (!result.geometry) {
    return (
      <section className="panel panel-canvas">
        <h2>Pulley Layout</h2>
        <div className="placeholder">
          Geometry is currently invalid. Increase center distance so C &gt; |r_driver - r_driven|.
        </div>
      </section>
    )
  }

  const { geometry, inputs } = result

  const xValues = [
    geometry.driverCenter.x - inputs.driverRadiusM,
    geometry.driverCenter.x + inputs.driverRadiusM,
    geometry.drivenCenter.x - inputs.drivenRadiusM,
    geometry.drivenCenter.x + inputs.drivenRadiusM,
    geometry.leftDriverContact.x,
    geometry.rightDriverContact.x,
    geometry.leftDrivenContact.x,
    geometry.rightDrivenContact.x,
  ]
  const yValues = [
    geometry.driverCenter.y + inputs.driverRadiusM,
    geometry.driverCenter.y - inputs.driverRadiusM,
    geometry.drivenCenter.y + inputs.drivenRadiusM,
    geometry.drivenCenter.y - inputs.drivenRadiusM,
    geometry.leftDriverContact.y,
    geometry.rightDriverContact.y,
    geometry.leftDrivenContact.y,
    geometry.rightDrivenContact.y,
  ]

  const xRange = extents(xValues)
  const yRange = extents(yValues)
  const spanX = Math.max(0.01, xRange.max - xRange.min)
  const spanY = Math.max(0.01, yRange.max - yRange.min)
  const geometryScale = Math.min((WIDTH - 2 * PADDING) / spanX, (HEIGHT - 2 * PADDING) / spanY)

  const centerX = WIDTH / 2 - ((xRange.min + xRange.max) * geometryScale) / 2
  const centerY = HEIGHT / 2 + ((yRange.min + yRange.max) * geometryScale) / 2

  const dCenter = toScreen(geometry.driverCenter, geometryScale, centerX, centerY)
  const ldc = toScreen(geometry.leftDriverContact, geometryScale, centerX, centerY)
  const rdc = toScreen(geometry.rightDriverContact, geometryScale, centerX, centerY)
  const lvc = toScreen(geometry.leftDrivenContact, geometryScale, centerX, centerY)
  const rvc = toScreen(geometry.rightDrivenContact, geometryScale, centerX, centerY)
  const vCenter = toScreen(geometry.drivenCenter, geometryScale, centerX, centerY)

  const maxForce =
    result.driverBearing && result.drivenBearing
      ? Math.max(forceSpan(result.driverBearing), forceSpan(result.drivenBearing), 1)
      : 1
  const forceScalePx = 95 / maxForce

  const arrowData =
    result.driverBearing === null
      ? []
      : [
          {
            vector: result.driverBearing.preloadOnly,
            style: { className: 'preload-arrow', markerId: 'arrow-preload', label: 'F_b,preload' },
          },
          {
            vector: result.driverBearing.transmissionOnly,
            style: {
              className: 'transmission-arrow',
              markerId: 'arrow-transmission',
              label: 'DeltaF_b,trans',
            },
          },
          {
            vector: result.driverBearing.total,
            style: { className: 'total-arrow', markerId: 'arrow-total', label: 'F_b,total' },
          },
        ]

  const drivenTotalTip =
    result.drivenBearing === null
      ? null
      : drawArrow(vCenter, result.drivenBearing.total, forceScalePx)

  return (
    <section className="panel panel-canvas">
      <h2>Pulley Layout</h2>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="pulley-svg" role="img">
        <defs>
          <marker id="arrow-preload" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" className="preload-arrow" />
          </marker>
          <marker
            id="arrow-transmission"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="4"
            orient="auto"
          >
            <path d="M0,0 L8,4 L0,8 z" className="transmission-arrow" />
          </marker>
          <marker id="arrow-total" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" className="total-arrow" />
          </marker>
        </defs>

        <line x1={ldc.x} y1={ldc.y} x2={lvc.x} y2={lvc.y} className="belt-line" />
        <line x1={rdc.x} y1={rdc.y} x2={rvc.x} y2={rvc.y} className="belt-line" />

        <circle
          cx={dCenter.x}
          cy={dCenter.y}
          r={inputs.driverRadiusM * geometryScale}
          className="driver-pulley"
        />
        <circle
          cx={vCenter.x}
          cy={vCenter.y}
          r={inputs.drivenRadiusM * geometryScale}
          className="driven-pulley"
        />

        <circle cx={dCenter.x} cy={dCenter.y} r={3} className="center-dot" />
        <circle cx={vCenter.x} cy={vCenter.y} r={3} className="center-dot" />

        <text x={dCenter.x + 8} y={dCenter.y - 8} className="label-text">
          Driver
        </text>
        <text x={vCenter.x + 8} y={vCenter.y - 8} className="label-text">
          Driven
        </text>

        {arrowData.map(({ vector, style }) => {
          const tip = drawArrow(dCenter, vector, forceScalePx)
          return (
            <g key={style.markerId}>
              <line
                x1={dCenter.x}
                y1={dCenter.y}
                x2={tip.x}
                y2={tip.y}
                className={style.className}
                markerEnd={`url(#${style.markerId})`}
              />
              <text x={tip.x + 6} y={tip.y - 6} className="force-label">
                {style.label}
              </text>
            </g>
          )
        })}

        {drivenTotalTip && (
          <line
            x1={vCenter.x}
            y1={vCenter.y}
            x2={drivenTotalTip.x}
            y2={drivenTotalTip.y}
            className="driven-total"
            markerEnd="url(#arrow-total)"
          />
        )}
      </svg>
      <p className="small-note">
        Coordinates use +x to the right, +y upward, and angles measured CCW from +x.
      </p>
    </section>
  )
}
