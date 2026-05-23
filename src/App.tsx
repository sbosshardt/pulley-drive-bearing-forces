import { useEffect, useMemo, useState } from 'react'
import { ForceTable } from './components/ForceTable'
import { InputPanel } from './components/InputPanel'
import { Legend } from './components/Legend'
import { PulleyCanvas } from './components/PulleyCanvas'
import { calculateSystem } from './physics/beltForces'
import type { UserInputs } from './types'
import { formatNumber } from './utils/format'

const DEFAULT_INPUTS: UserInputs = {
  driverTorqueNm: 40,
  driverRadiusM: 0.12,
  drivenRadiusM: 0.2,
  centerDistanceM: 0.9,
  preloadN: 350,
}

const URL_PARAM_TO_FIELD: Record<string, keyof UserInputs> = {
  T_driver: 'driverTorqueNm',
  r_driver: 'driverRadiusM',
  r_driven: 'drivenRadiusM',
  C: 'centerDistanceM',
  F_preload: 'preloadN',
}

const FIELD_TO_URL_PARAM: Record<keyof UserInputs, string> = {
  driverTorqueNm: 'T_driver',
  driverRadiusM: 'r_driver',
  drivenRadiusM: 'r_driven',
  centerDistanceM: 'C',
  preloadN: 'F_preload',
}

function clampInput(field: keyof UserInputs, rawValue: number): number {
  if (!Number.isFinite(rawValue)) {
    return 0
  }

  const minByField: Record<keyof UserInputs, number> = {
    driverTorqueNm: 0,
    driverRadiusM: 0.001,
    drivenRadiusM: 0.001,
    centerDistanceM: 0.001,
    preloadN: 0,
  }

  return Math.max(minByField[field], rawValue)
}

function parseInputsFromSearch(): UserInputs {
  if (typeof window === 'undefined') {
    return DEFAULT_INPUTS
  }

  const params = new URLSearchParams(window.location.search)
  const next: UserInputs = { ...DEFAULT_INPUTS }

  for (const [queryKey, field] of Object.entries(URL_PARAM_TO_FIELD)) {
    const value = params.get(queryKey)
    if (value === null) {
      continue
    }

    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      next[field] = clampInput(field, parsed)
    }
  }

  return next
}

function App() {
  const [inputs, setInputs] = useState<UserInputs>(() => parseInputsFromSearch())
  const [shareStatus, setShareStatus] = useState('')
  const result = useMemo(() => calculateSystem(inputs), [inputs])

  const updateInput = (field: keyof UserInputs, value: number) => {
    setInputs((previous) => ({
      ...previous,
      [field]: clampInput(field, value),
    }))
  }

  useEffect(() => {
    const url = new URL(window.location.href)
    for (const [field, queryKey] of Object.entries(FIELD_TO_URL_PARAM)) {
      const key = field as keyof UserInputs
      url.searchParams.set(queryKey, String(inputs[key]))
    }
    window.history.replaceState({}, '', url)
  }, [inputs])

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShareStatus('Share link copied.')
      window.setTimeout(() => setShareStatus(''), 2000)
    } catch {
      setShareStatus('Could not copy automatically. Copy the URL from your browser.')
      window.setTimeout(() => setShareStatus(''), 3000)
    }
  }

  return (
    <main className="app-shell">
      <header className="header">
        <h1>Two-Pulley Bearing Force Visualizer</h1>
        <p>
          No-slip belt model for bearing loads on driver and driven pulleys with engineering
          vector outputs.
        </p>
        <div className="share-row">
          <button type="button" className="share-btn" onClick={copyShareLink}>
            Copy share link
          </button>
          <span className="share-note">
            URL parameters auto-update ({`T_driver, r_driver, r_driven, C, F_preload`}).
          </span>
        </div>
        {shareStatus && <p className="share-status">{shareStatus}</p>}
      </header>

      <section className="layout-grid">
        <InputPanel inputs={inputs} onChange={updateInput} />
        <PulleyCanvas result={result} />
      </section>

      {(result.warnings.geometryInvalid || result.warnings.preloadTooLow) && (
        <section className="warning-list">
          {result.warnings.geometryInvalid && (
            <p className="warning-item">
              Geometry constraint violated: center distance must satisfy C &gt; |r_driver -
              r_driven|.
            </p>
          )}
          {result.warnings.preloadTooLow && (
            <p className="warning-item">
              Practical warning: F_slack is below zero. Increase preload or reduce driver torque.
            </p>
          )}
        </section>
      )}

      <section className="output-grid">
        <section className="panel">
          <h2>Primary Outputs</h2>
          <div className="metrics">
            <p>
              Circumferential Force <strong>(F_t)</strong>: {formatNumber(result.belt.circumferentialForceN)} N
            </p>
            <p>
              Tight-Side Tension <strong>(F_tight)</strong>: {formatNumber(result.belt.tightTensionN)} N
            </p>
            <p>
              Slack-Side Tension <strong>(F_slack)</strong>: {formatNumber(result.belt.slackTensionN)} N
            </p>
          </div>
        </section>
        <Legend />
      </section>

      <section className="tables-grid">
        <ForceTable title="Driver Bearing Force Components" forces={result.driverBearing} />
        <ForceTable title="Driven Bearing Force Components" forces={result.drivenBearing} />
      </section>
    </main>
  )
}

export default App
