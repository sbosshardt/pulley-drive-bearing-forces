import type { BearingForces } from '../types'
import { formatAngle, formatNumber, formatSigned } from '../utils/format'

interface ForceTableProps {
  title: string
  forces: BearingForces | null
}

export function ForceTable({ title, forces }: ForceTableProps) {
  return (
    <section className="panel">
      <h3>{title}</h3>
      {forces ? (
        <table className="force-table">
          <thead>
            <tr>
              <th>Load Case</th>
              <th>|F| [N]</th>
              <th>theta [deg]</th>
              <th>F_x [N]</th>
              <th>F_y [N]</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Preload only</td>
              <td>{formatNumber(forces.preloadOnly.magnitude)}</td>
              <td>{formatAngle(forces.preloadOnly.angleDeg)}</td>
              <td>{formatSigned(forces.preloadOnly.x)}</td>
              <td>{formatSigned(forces.preloadOnly.y)}</td>
            </tr>
            <tr>
              <td>Transmission only</td>
              <td>{formatNumber(forces.transmissionOnly.magnitude)}</td>
              <td>{formatAngle(forces.transmissionOnly.angleDeg)}</td>
              <td>{formatSigned(forces.transmissionOnly.x)}</td>
              <td>{formatSigned(forces.transmissionOnly.y)}</td>
            </tr>
            <tr>
              <td>Total</td>
              <td>{formatNumber(forces.total.magnitude)}</td>
              <td>{formatAngle(forces.total.angleDeg)}</td>
              <td>{formatSigned(forces.total.x)}</td>
              <td>{formatSigned(forces.total.y)}</td>
            </tr>
          </tbody>
        </table>
      ) : (
        <p className="small-note">No force table available until geometry is valid.</p>
      )}
    </section>
  )
}
