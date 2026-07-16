import './Dice.css'

type Props = {
  value: number | null
  rolling: boolean
  disabled: boolean
  onRoll: () => void
}

const FACES: Record<number, number[][]> = {
  1: [[1, 1]],
  2: [
    [0, 0],
    [2, 2],
  ],
  3: [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  4: [
    [0, 0],
    [0, 2],
    [2, 0],
    [2, 2],
  ],
  5: [
    [0, 0],
    [0, 2],
    [1, 1],
    [2, 0],
    [2, 2],
  ],
  6: [
    [0, 0],
    [0, 2],
    [1, 0],
    [1, 2],
    [2, 0],
    [2, 2],
  ],
}

export function Dice({ value, rolling, disabled, onRoll }: Props) {
  const show = value && value >= 1 && value <= 6 ? value : 1
  const pips = FACES[show]

  return (
    <div className="dice-panel">
      <button
        type="button"
        className={`dice${rolling ? ' rolling' : ''}`}
        onClick={onRoll}
        disabled={disabled || rolling}
        aria-label={disabled ? 'Waiting for turn' : 'Roll dice'}
      >
        <span className="dice-face">
          {pips.map(([r, c], i) => (
            <span
              key={i}
              className="pip"
              style={{ gridRow: r + 1, gridColumn: c + 1 }}
            />
          ))}
        </span>
      </button>
      <p className="dice-hint">
        {rolling ? 'Rolling…' : disabled ? 'Wait for your turn' : 'Tap to roll'}
      </p>
    </div>
  )
}
