import './CapacitorGuide.css'

const TYPES = [
  {
    id: 'ceramic',
    title: 'Ceramic disc',
    polarity: 'Non-polarized',
    range: '1 pF – ~1 µF (often 10 pF – 100 nF on pedals)',
    uses: 'High-frequency rolloff, RF snubbing, tiny coupling, power-pin bypass next to ICs/op-amps.',
    mark: 'Usually a 3-digit code (105 = 1 µF).',
  },
  {
    id: 'film',
    title: 'Film (polyester / polypropylene)',
    polarity: 'Non-polarized',
    range: '~1 nF – a few µF',
    uses: 'Tone stacks, coupling, timing, and filter caps where low distortion matters.',
    mark: 'Often printed in nF/µF, sometimes still coded.',
  },
  {
    id: 'electrolytic',
    title: 'Electrolytic (aluminum)',
    polarity: 'Polarized — observe anode (+)',
    range: '~1 µF – thousands of µF',
    uses: 'Power supply filtering, large AC coupling, bias bypass on emitters/cathodes.',
    mark: 'Value + voltage printed (10 µF 25 V). Stripe marks the cathode (−).',
  },
  {
    id: 'tantalum',
    title: 'Tantalum',
    polarity: 'Polarized — observe anode (+)',
    range: '~0.1 µF – tens of µF',
    uses: 'Compact polarized bypass/coupling where board space is tight.',
    mark: 'Printed value; longer lead or + mark is anode. Reverse voltage can destroy them.',
  },
] as const

export function CapacitorGuide() {
  return (
    <section className="cap-guide" aria-labelledby="cap-guide-title">
      <header className="cap-guide-header">
        <h2 id="cap-guide-title" className="cap-guide-title">
          Stompbox capacitor guide
        </h2>
        <p className="cap-guide-lede">
          Typical parts, polarity marks, schematics, and where they show up on
          pedal boards.
        </p>
      </header>

      <div className="cap-type-grid">
        {TYPES.map((type) => (
          <article key={type.id} className="cap-type-card">
            <div className="cap-type-art" aria-hidden="true">
              {type.id === 'ceramic' ? <CeramicArt /> : null}
              {type.id === 'film' ? <FilmArt /> : null}
              {type.id === 'electrolytic' ? <ElectrolyticArt /> : null}
              {type.id === 'tantalum' ? <TantalumArt /> : null}
            </div>
            <h3 className="cap-type-name">{type.title}</h3>
            <dl className="cap-type-meta">
              <div>
                <dt>Polarity</dt>
                <dd>{type.polarity}</dd>
              </div>
              <div>
                <dt>Typical range</dt>
                <dd>{type.range}</dd>
              </div>
              <div>
                <dt>Pedal uses</dt>
                <dd>{type.uses}</dd>
              </div>
              <div>
                <dt>Marking</dt>
                <dd>{type.mark}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      <section className="cap-symbols" aria-labelledby="cap-symbols-title">
        <h3 id="cap-symbols-title" className="cap-section-title">
          Schematic symbols
        </h3>
        <div className="cap-symbol-row">
          <figure className="cap-symbol">
            <NonPolarSymbol />
            <figcaption>Non-polarized</figcaption>
          </figure>
          <figure className="cap-symbol">
            <PolarSymbol />
            <figcaption>Polarized (+ anode)</figcaption>
          </figure>
        </div>
        <p className="cap-symbol-note">
          On polarized caps the curved plate (or “+” mark) is the anode. The
          cathode connects to the more negative DC potential.
        </p>
      </section>

      <section className="cap-polarity" aria-labelledby="cap-polarity-title">
        <h3 id="cap-polarity-title" className="cap-section-title">
          Finding anode &amp; cathode
        </h3>
        <div className="cap-polarity-art" aria-hidden="true">
          <PolarityCallout />
        </div>
        <ul className="cap-polarity-list">
          <li>
            <strong>Electrolytic can:</strong> the printed stripe marks the
            cathode (−). The opposite lead is the anode (+).
          </li>
          <li>
            <strong>Board footprint:</strong> silkscreen usually shades or marks
            the cathode pad; the “+” pad is the anode.
          </li>
          <li>
            <strong>Tantalum / polymer:</strong> a “+” bar or longer lead is the
            anode — reverse them and they can fail short.
          </li>
          <li>
            <strong>Ceramic &amp; film:</strong> either way around; no
            anode/cathode.
          </li>
        </ul>
      </section>

      <section className="cap-cheat" aria-labelledby="cap-cheat-title">
        <h3 id="cap-cheat-title" className="cap-section-title">
          Quick stompbox ranges
        </h3>
        <table className="cap-cheat-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Ballpark</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Op-amp / IC bypass</td>
              <td>100 nF</td>
              <td>Ceramic</td>
            </tr>
            <tr>
              <td>Input / tone film</td>
              <td>1–47 nF</td>
              <td>Film</td>
            </tr>
            <tr>
              <td>Coupling</td>
              <td>100 nF – 10 µF</td>
              <td>Film / electrolytic</td>
            </tr>
            <tr>
              <td>Power filter</td>
              <td>47–470 µF</td>
              <td>Electrolytic</td>
            </tr>
            <tr>
              <td>Emitter / cathode bypass</td>
              <td>10–100 µF</td>
              <td>Electrolytic</td>
            </tr>
          </tbody>
        </table>
      </section>
    </section>
  )
}

function CeramicArt() {
  return (
    <svg viewBox="0 0 160 100" className="cap-svg" role="img">
      <ellipse cx="80" cy="48" rx="36" ry="28" fill="#c4a574" stroke="#6b5230" />
      <ellipse cx="80" cy="48" rx="28" ry="20" fill="#d8b88a" />
      <text x="80" y="52" textAnchor="middle" className="cap-svg-mark">
        104
      </text>
      <line x1="20" y1="48" x2="44" y2="48" stroke="#8a9299" strokeWidth="3" />
      <line x1="116" y1="48" x2="140" y2="48" stroke="#8a9299" strokeWidth="3" />
    </svg>
  )
}

function FilmArt() {
  return (
    <svg viewBox="0 0 160 100" className="cap-svg" role="img">
      <rect x="48" y="28" width="64" height="44" rx="4" fill="#2f6f62" />
      <rect x="52" y="32" width="56" height="36" rx="2" fill="#3d8a7a" />
      <text x="80" y="54" textAnchor="middle" className="cap-svg-mark light">
        100n
      </text>
      <line x1="20" y1="50" x2="48" y2="50" stroke="#8a9299" strokeWidth="3" />
      <line x1="112" y1="50" x2="140" y2="50" stroke="#8a9299" strokeWidth="3" />
    </svg>
  )
}

function ElectrolyticArt() {
  return (
    <svg viewBox="0 0 160 110" className="cap-svg" role="img">
      <rect x="58" y="18" width="44" height="58" rx="6" fill="#c5ccd3" />
      <rect x="58" y="18" width="10" height="58" fill="#1f1a14" />
      <text x="88" y="48" textAnchor="middle" className="cap-svg-mark dark">
        10µF
      </text>
      <text x="63" y="70" className="cap-svg-tiny light">
        −
      </text>
      <line x1="70" y1="76" x2="70" y2="98" stroke="#8a9299" strokeWidth="3" />
      <line x1="90" y1="76" x2="90" y2="98" stroke="#8a9299" strokeWidth="3" />
      <text x="70" y="108" textAnchor="middle" className="cap-svg-tiny">
        −
      </text>
      <text x="90" y="108" textAnchor="middle" className="cap-svg-tiny">
        +
      </text>
    </svg>
  )
}

function TantalumArt() {
  return (
    <svg viewBox="0 0 160 100" className="cap-svg" role="img">
      <rect x="55" y="34" width="50" height="32" rx="3" fill="#c0392b" />
      <rect x="55" y="34" width="10" height="32" fill="#1f1a14" />
      <text x="88" y="54" textAnchor="middle" className="cap-svg-mark light">
        1µ
      </text>
      <text x="60" y="54" className="cap-svg-tiny light">
        +
      </text>
      <line x1="20" y1="50" x2="55" y2="50" stroke="#8a9299" strokeWidth="3" />
      <line x1="105" y1="50" x2="140" y2="50" stroke="#8a9299" strokeWidth="3" />
    </svg>
  )
}

function NonPolarSymbol() {
  return (
    <svg viewBox="0 0 120 60" className="cap-svg symbol" role="img">
      <line x1="10" y1="30" x2="48" y2="30" stroke="currentColor" strokeWidth="2" />
      <line x1="48" y1="12" x2="48" y2="48" stroke="currentColor" strokeWidth="2.5" />
      <line x1="72" y1="12" x2="72" y2="48" stroke="currentColor" strokeWidth="2.5" />
      <line x1="72" y1="30" x2="110" y2="30" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function PolarSymbol() {
  return (
    <svg viewBox="0 0 120 60" className="cap-svg symbol" role="img">
      <line x1="10" y1="30" x2="48" y2="30" stroke="currentColor" strokeWidth="2" />
      <line x1="48" y1="12" x2="48" y2="48" stroke="currentColor" strokeWidth="2.5" />
      <path
        d="M72 12 C62 22, 62 38, 72 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <line x1="72" y1="30" x2="110" y2="30" stroke="currentColor" strokeWidth="2" />
      <text x="38" y="10" className="cap-svg-tiny">
        +
      </text>
    </svg>
  )
}

function PolarityCallout() {
  return (
    <svg viewBox="0 0 280 120" className="cap-svg" role="img">
      <rect x="100" y="16" width="50" height="70" rx="7" fill="#c5ccd3" />
      <rect x="100" y="16" width="12" height="70" fill="#1f1a14" />
      <text x="118" y="40" className="cap-svg-tiny light">
        stripe
      </text>
      <text x="118" y="54" className="cap-svg-tiny light">
        = cathode
      </text>
      <line x1="114" y1="86" x2="114" y2="108" stroke="#8a9299" strokeWidth="3" />
      <line x1="136" y1="86" x2="136" y2="108" stroke="#8a9299" strokeWidth="3" />
      <text x="114" y="118" textAnchor="middle" className="cap-svg-tiny">
        − cathode
      </text>
      <text x="136" y="118" textAnchor="middle" className="cap-svg-tiny">
        + anode
      </text>
      <path
        d="M88 50 H70"
        stroke="#2f6f62"
        strokeWidth="1.5"
        markerEnd="url(#arrow)"
      />
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#2f6f62" />
        </marker>
      </defs>
      <text x="18" y="54" className="cap-svg-tiny">
        band / stripe
      </text>
    </svg>
  )
}
