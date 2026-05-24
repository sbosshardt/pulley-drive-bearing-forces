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
  minLengthPx = 16,
): Vector2 {
  const dx = direction.x * pxPerNewton
  const dy = -direction.y * pxPerNewton
  const length = Math.hypot(dx, dy)
  if (length === 0) {
    return origin
  }
  const scale = length < minLengthPx ? minLengthPx / length : 1
  return {
    x: origin.x + dx * scale,
    y: origin.y + dy * scale,
  }
}

interface ArrowStyle {
  className: string
  markerId: string
  label: string
  textClassName: string
}

interface ArrowSpec {
  vector: Vector2
  style: ArrowStyle
}

interface RenderedArrow {
  arrowIndex: number
  tip: Vector2
  baseLabel: Vector2
  label: Vector2
  textAnchor: 'start' | 'end'
  unit: Vector2
  normal: Vector2
  style: ArrowStyle
}

interface LabelBox {
  left: number
  right: number
  top: number
  bottom: number
}

interface ArrowSegment {
  arrowIndex: number
  start: Vector2
  end: Vector2
}

function renderArrowSet(
  origin: Vector2,
  specs: ArrowSpec[],
  forceScalePx: number,
): RenderedArrow[] {
  return specs.map((spec, index) => {
    const tip = drawArrow(origin, spec.vector, forceScalePx)
    const vecX = tip.x - origin.x
    const vecY = tip.y - origin.y
    const vecLen = Math.hypot(vecX, vecY) || 1
    const unitX = vecX / vecLen
    const unitY = vecY / vecLen
    const normalX = -unitY
    const normalY = unitX
    const spread = (index - 1) * 18
    const labelDistance = Math.max(vecLen + 12, 42 + index * 18)
    const textAnchor = unitX >= 0 ? 'start' : 'end'
    const anchorNudge = textAnchor === 'start' ? 4 : -4
    const label = {
      x: origin.x + unitX * labelDistance + normalX * spread + anchorNudge,
      y: origin.y + unitY * labelDistance + normalY * spread,
    }

    return {
      arrowIndex: index,
      tip,
      baseLabel: label,
      label,
      textAnchor,
      unit: { x: unitX, y: unitY },
      normal: { x: normalX, y: normalY },
      style: spec.style,
    }
  })
}

function estimateLabelBox(
  anchor: Vector2,
  text: string,
  textAnchor: 'start' | 'end',
): LabelBox {
  const width = 8 * text.length + 8
  const height = 15
  const left = textAnchor === 'start' ? anchor.x : anchor.x - width
  const right = left + width
  const top = anchor.y - height / 2
  const bottom = anchor.y + height / 2
  return { left, right, top, bottom }
}

function boxesOverlap(a: LabelBox, b: LabelBox): boolean {
  return a.left <= b.right && a.right >= b.left && a.top <= b.bottom && a.bottom >= b.top
}

function pointInsideBox(point: Vector2, box: LabelBox, padding = 2): boolean {
  return (
    point.x >= box.left - padding &&
    point.x <= box.right + padding &&
    point.y >= box.top - padding &&
    point.y <= box.bottom + padding
  )
}

function segmentHitsBox(segment: ArrowSegment, box: LabelBox): boolean {
  for (let i = 0; i <= 10; i += 1) {
    const t = i / 10
    const point = {
      x: segment.start.x + (segment.end.x - segment.start.x) * t,
      y: segment.start.y + (segment.end.y - segment.start.y) * t,
    }
    if (pointInsideBox(point, box, 3)) {
      return true
    }
  }
  return false
}

function resolveLabelCollisions(origin: Vector2, arrows: RenderedArrow[]): RenderedArrow[] {
  const segments: ArrowSegment[] = arrows.map((arrow) => ({
    arrowIndex: arrow.arrowIndex,
    start: origin,
    end: arrow.tip,
  }))
  const placed: LabelBox[] = []
  const labelPriority: Record<string, number> = {
    'F_b,tot': 0,
    'F_b,pre': 1,
    DeltaF_b: 2,
  }
  const prioritized = [...arrows].sort((a, b) => {
    const ap = labelPriority[a.style.label] ?? 3
    const bp = labelPriority[b.style.label] ?? 3
    return ap - bp
  })
  const resolvedByIndex = new Map<number, Vector2>()

  for (const arrow of prioritized) {
    const candidates: Vector2[] = []
    const normalOffsets = [0, 12, -12, 20, -20, 28, -28]
    const alongOffsets = [0, 8, 16, 24]
    for (const along of alongOffsets) {
      for (const normal of normalOffsets) {
        candidates.push({
          x: arrow.baseLabel.x + arrow.unit.x * along + arrow.normal.x * normal,
          y: arrow.baseLabel.y + arrow.unit.y * along + arrow.normal.y * normal,
        })
      }
    }

    let bestLabel = arrow.baseLabel
    let bestScore = Number.POSITIVE_INFINITY

    for (const candidate of candidates) {
      const candidateBox = estimateLabelBox(candidate, arrow.style.label, arrow.textAnchor)
      const labelOverlapCount = placed.filter((other) => boxesOverlap(candidateBox, other)).length
      const arrowOverlapCount = segments.filter((segment) => {
        if (segment.arrowIndex === arrow.arrowIndex) {
          return false
        }
        return segmentHitsBox(segment, candidateBox)
      }).length
      const distancePenalty = Math.hypot(
        candidate.x - arrow.baseLabel.x,
        candidate.y - arrow.baseLabel.y,
      )
      const score = labelOverlapCount * 1000 + arrowOverlapCount * 150 + distancePenalty
      if (score < bestScore) {
        bestScore = score
        bestLabel = candidate
      }
      if (labelOverlapCount === 0 && arrowOverlapCount === 0) {
        break
      }
    }

    const bestBox = estimateLabelBox(bestLabel, arrow.style.label, arrow.textAnchor)
    placed.push(bestBox)
    resolvedByIndex.set(arrow.arrowIndex, bestLabel)
  }

  return arrows.map((arrow) => ({
    ...arrow,
    label: resolvedByIndex.get(arrow.arrowIndex) ?? arrow.label,
  }))
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
          Geometry is currently invalid. Open belts require C &gt; |r_driver - r_driven|; crossed
          belts require C &gt; r_driver + r_driven.
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

  const driverArrowSpecs =
    result.driverBearing === null
      ? []
      : [
          {
            vector: result.driverBearing.preloadOnly,
            style: {
              className: 'preload-arrow',
              markerId: 'arrow-preload',
              label: 'F_b,pre',
              textClassName: 'preload-text',
            },
          },
          {
            vector: result.driverBearing.transmissionOnly,
            style: {
              className: 'transmission-arrow',
              markerId: 'arrow-transmission',
              label: 'DeltaF_b',
              textClassName: 'transmission-text',
            },
          },
          {
            vector: result.driverBearing.total,
            style: {
              className: 'total-arrow',
              markerId: 'arrow-total',
              label: 'F_b,tot',
              textClassName: 'total-text',
            },
          },
        ]
  const drivenArrowSpecs =
    result.drivenBearing === null
      ? []
      : [
          {
            vector: result.drivenBearing.preloadOnly,
            style: {
              className: 'preload-arrow',
              markerId: 'arrow-preload',
              label: 'F_b,pre',
              textClassName: 'preload-text',
            },
          },
          {
            vector: result.drivenBearing.transmissionOnly,
            style: {
              className: 'transmission-arrow',
              markerId: 'arrow-transmission',
              label: 'DeltaF_b',
              textClassName: 'transmission-text',
            },
          },
          {
            vector: result.drivenBearing.total,
            style: {
              className: 'total-arrow',
              markerId: 'arrow-total',
              label: 'F_b,tot',
              textClassName: 'total-text',
            },
          },
        ]

  const driverArrows = resolveLabelCollisions(
    dCenter,
    renderArrowSet(dCenter, driverArrowSpecs, forceScalePx),
  )
  const drivenArrows = resolveLabelCollisions(
    vCenter,
    renderArrowSet(vCenter, drivenArrowSpecs, forceScalePx),
  )

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

        {driverArrows.map(({ tip, label, textAnchor, style }, index) => {
          return (
            <g key={`driver-${style.markerId}-${index}`}>
              <line
                x1={dCenter.x}
                y1={dCenter.y}
                x2={tip.x}
                y2={tip.y}
                className={style.className}
                markerEnd={`url(#${style.markerId})`}
              />
              <text
                x={label.x}
                y={label.y}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                className={`force-label ${style.textClassName}`}
              >
                {style.label}
              </text>
            </g>
          )
        })}

        {drivenArrows.map(({ tip, label, textAnchor, style }, index) => (
          <g key={`driven-${style.markerId}-${index}`}>
            <line
              x1={vCenter.x}
              y1={vCenter.y}
              x2={tip.x}
              y2={tip.y}
              className={style.className}
              markerEnd={`url(#${style.markerId})`}
            />
            <text
              x={label.x}
              y={label.y}
              textAnchor={textAnchor}
              dominantBaseline="middle"
              className={`force-label ${style.textClassName}`}
            >
              {style.label}
            </text>
          </g>
        ))}
      </svg>
      <p className="small-note">
        Mode: {result.inputs.beltConfiguration}. Driver/Driven rotation: {result.rotation.driver} /{' '}
        {result.rotation.driven}. Coordinates use +x to the right, +y upward, and angles measured
        CCW from +x.
      </p>
    </section>
  )
}
