import { useMemo, useState } from 'react'
import { CapacitorGuide } from './CapacitorGuide'
import {
  CAP_UNIT_OPTIONS,
  decodeCapCode,
  encodeCapValue,
  unitToPicofarads,
  type CapUnit,
} from './codec'
import './CapacitorWizard.css'

type WizardMode = 'decode' | 'encode'

export function CapacitorWizard() {
  const [mode, setMode] = useState<WizardMode>('decode')
  const [codeText, setCodeText] = useState('105')
  const [magnitude, setMagnitude] = useState('1')
  const [unit, setUnit] = useState<CapUnit>('uF')

  const decodeResult = useMemo(() => {
    try {
      return { ok: true as const, value: decodeCapCode(codeText) }
    } catch (err) {
      return {
        ok: false as const,
        message: err instanceof Error ? err.message : 'Invalid capacitor code',
      }
    }
  }, [codeText])

  const encodeResult = useMemo(() => {
    const n = Number(magnitude.trim().replace(/,/g, ''))
    if (!Number.isFinite(n) || n < 0) {
      return { ok: false as const, message: 'Enter a numeric capacitance' }
    }
    try {
      return {
        ok: true as const,
        value: encodeCapValue(unitToPicofarads(n, unit)),
      }
    } catch (err) {
      return {
        ok: false as const,
        message: err instanceof Error ? err.message : 'Could not encode value',
      }
    }
  }, [magnitude, unit])

  function handleModeChange(next: WizardMode) {
    if (next === 'encode' && decodeResult.ok) {
      // Prefill encode from decoded pF using a friendly unit.
      const pf = decodeResult.value.picofarads
      if (pf >= 1_000_000) {
        setMagnitude(trimNum(pf / 1_000_000))
        setUnit('uF')
      } else if (pf >= 1_000) {
        setMagnitude(trimNum(pf / 1_000))
        setUnit('nF')
      } else {
        setMagnitude(trimNum(pf))
        setUnit('pF')
      }
    }
    if (next === 'decode' && encodeResult.ok) {
      setCodeText(encodeResult.value.code)
    }
    setMode(next)
  }

  return (
    <section className="cap-wizard" aria-labelledby="cap-wizard-title">
      <header className="cap-wizard-header">
        <p className="cap-wizard-kicker">Capacitor tool</p>
        <h1 id="cap-wizard-title" className="cap-wizard-title">
          Marking code
        </h1>
        <p className="cap-wizard-lede">
          Decode EIA codes like 105 → 1 µF, or encode a value back to digits.
        </p>
      </header>

      <div className="mode-toggle" role="group" aria-label="Wizard mode">
        {(['decode', 'encode'] as const).map((option) => (
          <button
            key={option}
            type="button"
            className={`mode-btn${mode === option ? ' is-active' : ''}`}
            aria-pressed={mode === option}
            onClick={() => handleModeChange(option)}
          >
            {option === 'decode' ? 'Decode' : 'Encode'}
          </button>
        ))}
      </div>

      {mode === 'decode' ? (
        <div className="field">
          <label className="field-label" htmlFor="cap-code">
            Marking code
          </label>
          <input
            id="cap-code"
            className="field-input"
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            placeholder="105"
            value={codeText}
            onChange={(e) => setCodeText(e.target.value)}
            aria-describedby="cap-code-hint"
          />
          <span id="cap-code-hint" className="field-hint">
            2–3 digits, optional tolerance letter — 105, 473J, 4R7
          </span>
        </div>
      ) : (
        <div className="field">
          <span className="field-label" id="cap-value-label">
            Capacitance
          </span>
          <div className="cap-value-row">
            <input
              className="field-input"
              type="text"
              inputMode="decimal"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="1"
              value={magnitude}
              onChange={(e) => setMagnitude(e.target.value)}
              aria-labelledby="cap-value-label"
            />
            <select
              className="field-input cap-unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value as CapUnit)}
              aria-label="Capacitance unit"
            >
              {CAP_UNIT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="cap-readout" aria-live="polite">
        {mode === 'decode' ? (
          decodeResult.ok ? (
            <>
              <p className="cap-readout-value">{decodeResult.value.formattedValue}</p>
              <p className="cap-readout-meta">
                code {decodeResult.value.code}
                {decodeResult.value.toleranceLabel ? (
                  <>
                    <span className="cap-readout-dot" aria-hidden="true">
                      ·
                    </span>
                    {decodeResult.value.toleranceLabel}
                  </>
                ) : null}
              </p>
              {decodeResult.value.multiplierDigit !== null ? (
                <p className="cap-readout-note">
                  {decodeResult.value.code.replace(/[A-Z]/gi, '').slice(0, 2)} × 10
                  <sup>{decodeResult.value.multiplierDigit}</sup> pF
                </p>
              ) : null}
            </>
          ) : (
            <p className="cap-readout-error">{decodeResult.message}</p>
          )
        ) : encodeResult.ok ? (
          <>
            <p className="cap-readout-value">{encodeResult.value.code}</p>
            <p className="cap-readout-meta">{encodeResult.value.formattedValue}</p>
            {!encodeResult.value.exact ? (
              <p className="cap-readout-note">Nearest standard marking code</p>
            ) : null}
          </>
        ) : (
          <p className="cap-readout-error">{encodeResult.message}</p>
        )}
      </div>

      <div className="cap-examples" aria-label="Common codes">
        {['102', '103', '104', '105', '473', '224'].map((code) => (
          <button
            key={code}
            type="button"
            className="cap-example"
            onClick={() => {
              setMode('decode')
              setCodeText(code)
            }}
          >
            <span className="cap-example-code">{code}</span>
            <span className="cap-example-value">
              {safeFormat(code)}
            </span>
          </button>
        ))}
      </div>

      <CapacitorGuide />
    </section>
  )
}

function safeFormat(code: string): string {
  try {
    return decodeCapCode(code).formattedValue
  } catch {
    return ''
  }
}

function trimNum(n: number): string {
  const rounded = Number(n.toPrecision(6))
  return Number.isInteger(rounded)
    ? String(rounded)
    : String(rounded).replace(/\.?0+$/, '')
}
