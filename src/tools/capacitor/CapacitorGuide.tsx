import './CapacitorGuide.css'

const asset = (file: string) => `${import.meta.env.BASE_URL}capacitor/${file}`

const TYPES = [
  {
    id: 'ceramic',
    title: 'Ceramic disc',
    image: 'ceramic-disc.jpg',
    imageAlt: 'Ceramic disc capacitor marked 104 with two radial leads',
    polarity: 'Non-polarized',
    range: '1 pF – ~1 µF (often 10 pF – 100 nF on pedals)',
    uses: 'High-frequency rolloff, RF snubbing, tiny coupling, power-pin bypass next to ICs/op-amps.',
    mark: 'Usually a 3-digit code (105 = 1 µF).',
  },
  {
    id: 'film',
    title: 'Film (polyester / polypropylene)',
    image: 'film-cap.jpg',
    imageAlt: 'Green box film capacitor marked 100nJ 100V with two radial leads',
    polarity: 'Non-polarized',
    range: '~1 nF – a few µF',
    uses: 'Tone stacks, coupling, timing, and filter caps where low distortion matters.',
    mark: 'Often printed in nF/µF, sometimes still coded.',
  },
  {
    id: 'electrolytic',
    title: 'Electrolytic (aluminum)',
    image: 'electrolytic.jpg',
    imageAlt:
      'Aluminum electrolytic capacitor marked 10µF 25V with cathode stripe and radial leads',
    polarity: 'Polarized — observe anode (+)',
    range: '~1 µF – thousands of µF',
    uses: 'Power supply filtering, large AC coupling, bias bypass on emitters/cathodes.',
    mark: 'Value + voltage printed (10 µF 25 V). Stripe marks the cathode (−).',
  },
  {
    id: 'tantalum',
    title: 'Tantalum',
    image: 'tantalum.jpg',
    imageAlt: 'Orange dipped tantalum capacitor marked + 1.0µF 16V with two radial leads',
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
            <div className="cap-type-art">
              <img
                className="cap-type-img"
                src={asset(type.image)}
                alt={type.imageAlt}
                loading="lazy"
                width={640}
                height={640}
              />
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
    <svg
      viewBox="0 0 280 136"
      className="cap-svg"
      role="img"
      aria-label="Electrolytic capacitor with cathode stripe on the left lead and anode on the right"
    >
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#2f6f62" />
        </marker>
      </defs>

      <rect x="115" y="12" width="50" height="72" rx="7" fill="#c5ccd3" />
      <rect x="115" y="12" width="12" height="72" fill="#1f1a14" />

      <text x="8" y="46" className="cap-svg-label">
        stripe
      </text>
      <text x="8" y="58" className="cap-svg-label">
        = cathode (−)
      </text>
      <path
        d="M78 48 H108"
        stroke="#2f6f62"
        strokeWidth="1.5"
        markerEnd="url(#arrow)"
      />

      <line x1="128" y1="84" x2="128" y2="108" stroke="#8a9299" strokeWidth="3" />
      <line x1="152" y1="84" x2="152" y2="108" stroke="#8a9299" strokeWidth="3" />

      <text x="98" y="122" textAnchor="end" className="cap-svg-label">
        − cathode
      </text>
      <text x="182" y="122" textAnchor="start" className="cap-svg-label">
        + anode
      </text>
      <line
        x1="102"
        y1="118"
        x2="122"
        y2="110"
        stroke="#8a9299"
        strokeWidth="1"
      />
      <line
        x1="178"
        y1="118"
        x2="158"
        y2="110"
        stroke="#8a9299"
        strokeWidth="1"
      />
    </svg>
  )
}
