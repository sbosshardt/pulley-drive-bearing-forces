export function Legend() {
  return (
    <section className="panel legend">
      <h3>Legend</h3>
      <ul>
        <li>
          <span className="legend-line belt-line" />
          Belt span
        </li>
        <li>
          <span className="legend-line preload-arrow" />
          Preload-only bearing force
        </li>
        <li>
          <span className="legend-line transmission-arrow" />
          Transmission-only bearing force
        </li>
        <li>
          <span className="legend-line total-arrow" />
          Total bearing force
        </li>
      </ul>
    </section>
  )
}
