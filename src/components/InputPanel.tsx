import type { UserInputs } from '../types'

interface InputPanelProps {
  inputs: UserInputs
  onChange: (field: keyof UserInputs, value: number) => void
}

interface FieldDef {
  key: keyof UserInputs
  label: string
  symbol: string
  units: string
  min: number
  step: number
  description: string
}

const FIELDS: FieldDef[] = [
  {
    key: 'driverTorqueNm',
    label: 'Driver Torque',
    symbol: 'T_driver',
    units: 'N·m',
    min: 0,
    step: 0.1,
    description: 'Input torque applied to the top pulley.',
  },
  {
    key: 'driverRadiusM',
    label: 'Driver Radius',
    symbol: 'r_driver',
    units: 'm',
    min: 0.001,
    step: 0.001,
    description: 'Radius of the driving pulley (top).',
  },
  {
    key: 'drivenRadiusM',
    label: 'Driven Radius',
    symbol: 'r_driven',
    units: 'm',
    min: 0.001,
    step: 0.001,
    description: 'Radius of the driven pulley (bottom).',
  },
  {
    key: 'centerDistanceM',
    label: 'Center Distance',
    symbol: 'C',
    units: 'm',
    min: 0.001,
    step: 0.001,
    description: 'Distance between pulley centerpoints.',
  },
  {
    key: 'preloadN',
    label: 'Preload Tension',
    symbol: 'F_preload',
    units: 'N',
    min: 0,
    step: 1,
    description: 'Initial belt tension on both sides before torque transfer.',
  },
]

export function InputPanel({ inputs, onChange }: InputPanelProps) {
  return (
    <section className="panel">
      <h2>Inputs</h2>
      <p className="panel-subtitle">Engineering notation with user-friendly labels.</p>
      <div className="input-grid">
        {FIELDS.map((field) => (
          <label className="field" key={field.key}>
            <span className="field-title">
              {field.label} <em>({field.symbol})</em>
            </span>
            <span className="field-desc">{field.description}</span>
            <div className="field-row">
              <input
                type="number"
                min={field.min}
                step={field.step}
                value={inputs[field.key]}
                onChange={(event) => onChange(field.key, Number(event.target.value))}
              />
              <span className="units">{field.units}</span>
            </div>
          </label>
        ))}
      </div>
    </section>
  )
}
