export function StatsPanel() {
  return (
    <section id="stats" className="panel-light">
      <p className="eyebrow dark">Model data (estimated)</p>
      <dl>
        <div><dt>Campus block</dt><dd>~65 × 140 m</dd></div>
        <div><dt>Main buildings</dt><dd>3</dd></div>
        <div><dt>Floors shown</dt><dd>5</dd></div>
        <div><dt>360° photos here</dt><dd>12 of 52</dd></div>
      </dl>
      <p className="note">Layout estimated from satellite, Street View, and the original floor plans and photos. Not surveyed.</p>
    </section>
  );
}
