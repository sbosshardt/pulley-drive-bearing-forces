import type { UserInputs } from '../types'

type NumericInputField = Exclude<keyof UserInputs, 'beltConfiguration'>

interface InputPanelProps {
  inputs: UserInputs
  onChange: (field: NumericInputField, value: number) => void
  onBeltConfigurationChange: (value: UserInputs['beltConfiguration']) => void
}

interface FieldDef {
  key: NumericInputField
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
    min: -1000000,
    step: 0.1,
    description: 'Signed input torque at the top pulley (+CCW, -CW).',
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
    key: 'efficiency',
    label: 'Drive Efficiency',
    symbol: 'eta',
    units: '-',
    min: 0.01,
    step: 0.01,
    description: 'Mechanical efficiency from driver shaft torque to driven shaft torque (0 to 1).',
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

export function InputPanel({
  inputs,
  onChange,
  onBeltConfigurationChange,
}: InputPanelProps) {
  return (
    <section className="panel">
      <h2>Inputs</h2>
      <p className="panel-subtitle">Engineering notation with user-friendly labels.</p>
      <label className="field belt-config">
        <span className="field-title">
          Belt Configuration <em>(mode)</em>
        </span>
        <span className="field-desc">Open = same rotation direction, crossed = opposite direction.</span>
        <div className="field-row">
          <select
            value={inputs.beltConfiguration}
            onChange={(event) =>
              onBeltConfigurationChange(event.target.value as UserInputs['beltConfiguration'])
            }
          >
            <option value="open">Open</option>
            <option value="crossed">Crossed</option>
          </select>
        </div>
      </label>
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
