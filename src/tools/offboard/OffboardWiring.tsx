import { useState } from 'react'
import './OffboardWiring.css'

const asset = (file: string) => `${import.meta.env.BASE_URL}offboard/${file}`

type SectionId =
  | 'standard'
  | 'dual'
  | 'boost'
  | 'pots'
  | 'trimmer'

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'standard', label: 'Standard' },
  { id: 'dual', label: 'Dual effect' },
  { id: 'boost', label: 'Switchable boost' },
  { id: 'pots', label: 'Pots' },
  { id: 'trimmer', label: 'Level trim' },
]

export function OffboardWiring() {
  const [section, setSection] = useState<SectionId>('standard')

  return (
    <section className="offboard" aria-labelledby="offboard-title">
      <header className="offboard-header">
        <p className="offboard-kicker">Enclosure wiring</p>
        <h1 id="offboard-title" className="offboard-title">
          Offboard wiring
        </h1>
        <p className="offboard-lede">
          Where the wires on a layout go — jacks, DC, 3PDT bypass, LEDs, and
          pots. Diagrams adapted from Tagboard Effects (IvIark).
        </p>
      </header>

      <nav className="offboard-tabs" aria-label="Schematic sections">
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`offboard-tab${section === item.id ? ' is-active' : ''}`}
            onClick={() => setSection(item.id)}
            aria-pressed={section === item.id}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {section === 'standard' ? <StandardSection /> : null}
      {section === 'dual' ? <DualSection /> : null}
      {section === 'boost' ? <BoostSection /> : null}
      {section === 'pots' ? <PotsSection /> : null}
      {section === 'trimmer' ? <TrimmerSection /> : null}

      <p className="offboard-credit">
        Source:{' '}
        <a
          href="https://tagboardeffects.blogspot.com/2012/02/offboard-wiring.html"
          target="_blank"
          rel="noreferrer"
        >
          Tagboard Effects — Offboard wiring
        </a>
      </p>
    </section>
  )
}

function SchematicFigure({
  src,
  alt,
  caption,
}: {
  src: string
  alt: string
  caption: string
}) {
  return (
    <figure className="offboard-figure">
      <div className="offboard-figure-frame">
        <img className="offboard-figure-img" src={src} alt={alt} loading="lazy" />
      </div>
      <figcaption className="offboard-figure-cap">{caption}</figcaption>
    </figure>
  )
}

function StandardSection() {
  return (
    <article className="offboard-panel" aria-labelledby="standard-title">
      <h2 id="standard-title" className="offboard-section-title">
        Standard single effect
      </h2>
      <p className="offboard-copy">
        Daisy-chained supply builds often skip a battery snap unless the circuit
        is positive ground. This layout shows where the board pads connect to
        the DC jack, input/output jacks, LED, and 3PDT.
      </p>
      <SchematicFigure
        src={asset('wiring-standard.png')}
        alt="Offboard wiring schematic for a single effect with 3PDT, jacks, LED, and DC jack"
        caption="Board → 3PDT → jacks, with LED switched to ground"
      />
      <p className="offboard-copy">
        This switch wiring is less common, but it grounds the board input during
        bypass. That cuts noise bleedthrough on high-gain circuits.
      </p>
      <ul className="offboard-list">
        <li>
          <strong>Effect on:</strong> input tip → board in; board out → output
          tip; LED cathode → ground.
        </li>
        <li>
          <strong>Bypass:</strong> input tip jumpered to output tip; board input
          tied to ground.
        </li>
        <li>
          <strong>LED:</strong> 9 V through a 2K2 resistor to the LED anode; the
          switch grounds the cathode when engaged.
        </li>
      </ul>
    </article>
  )
}

function DualSection() {
  return (
    <article className="offboard-panel" aria-labelledby="dual-title">
      <h2 id="dual-title" className="offboard-section-title">
        Dual effect example
      </h2>
      <p className="offboard-copy">
        Two boards in one enclosure, each with its own 3PDT and LED, sharing one
        DC jack and a series signal path from input to output.
      </p>
      <SchematicFigure
        src={asset('wiring-dual.png')}
        alt="Dual offboard wiring schematic with two boards and two 3PDT footswitches"
        caption="Shared power/ground; signal chains through switch 1 then switch 2"
      />
      <ul className="offboard-list">
        <li>
          Both boards take the same 9 V and ground from the DC jack.
        </li>
        <li>
          Each footswitch independently bypasses its board and lights its LED.
        </li>
        <li>
          Jack sleeves and switch ground lugs share a common ground node.
        </li>
      </ul>
    </article>
  )
}

function BoostSection() {
  return (
    <article className="offboard-panel" aria-labelledby="boost-title">
      <h2 id="boost-title" className="offboard-section-title">
        Switchable pre-effect boost
      </h2>
      <p className="offboard-copy">
        Optional switchable stage (such as a booster) before the main board. The
        main stomp bypasses everything; the second stomp turns the booster on
        and off.
      </p>
      <SchematicFigure
        src={asset('wiring-boost.png')}
        alt="Offboard wiring with switchable pre-effect booster and two footswitches"
        caption="Boost in/out on the secondary stomp; main stomp still true-bypasses the whole chain"
      />
      <p className="offboard-copy">
        To put the booster after the main effect instead, wire the input side as
        usual and take the main board output into the second stomp.
      </p>
    </article>
  )
}

function PotsSection() {
  return (
    <article className="offboard-panel" aria-labelledby="pots-title">
      <h2 id="pots-title" className="offboard-section-title">
        Pot numbering &amp; soldering
      </h2>
      <p className="offboard-copy">
        Layouts follow this lug convention when looking at the back of the pot
        with the shaft away from you and the lugs facing you.
      </p>
      <SchematicFigure
        src={asset('pot-numbering.jpg')}
        alt="Potentiometer rear view with lugs numbered 1, 2, and 3 from left to right"
        caption="Lug 1 · Lug 2 (wiper) · Lug 3"
      />
      <p className="offboard-copy">
        PCB-pin pots are easier to wire if you solder a small piece of vero to
        the pins first — a 5 × 2 scrap works well.
      </p>
      <SchematicFigure
        src={asset('pot-vero.jpg')}
        alt="Potentiometer with a small strip of veroboard soldered to its PCB pins"
        caption="Vero daughter strip for links, extra parts, and cooler soldering"
      />
      <ul className="offboard-list">
        <li>Linking pins or adding a part next to the pot is simpler on vero.</li>
        <li>
          The board acts like a heat sink, so less heat reaches the pot body.
        </li>
      </ul>
    </article>
  )
}

function TrimmerSection() {
  return (
    <article className="offboard-panel" aria-labelledby="trimmer-title">
      <h2 id="trimmer-title" className="offboard-section-title">
        Volume trimmer daughterboard
      </h2>
      <p className="offboard-copy">
        Need to tame a loud pedal with no level control? Add a small trimmer
        daughterboard, set the level you want, and leave it. It fits most builds
        without crowding the enclosure.
      </p>
      <SchematicFigure
        src={asset('volume-trimmer.png')}
        alt="100K volume trimmer on a small stripboard with effect output, output, and ground wires"
        caption="100K trimmer: effect out → wiper network → output jack; bottom row to ground"
      />
      <p className="offboard-note">
        Battery snaps are covered well by other guides (for example Beavis
        Audio) if you need one for a positive-ground circuit.
      </p>
    </article>
  )
}
