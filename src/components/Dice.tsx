import './Dice.css'

type Props = {
  value: number | null
  rolling: boolean
  disabled: boolean
  onRoll: () => void
  highlightSix?: boolean
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

export function Dice({ value, rolling, disabled, onRoll, highlightSix }: Props) {
  const show = value && value >= 1 && value <= 6 ? value : 1
  const pips = FACES[show]
  const isSix = value === 6 || highlightSix

  return (
    <div className={`dice-panel${isSix ? ' six-glow' : ''}`}>
      <button
        type="button"
        className={`dice${rolling ? ' rolling' : ''}${isSix ? ' is-six' : ''}`}
        onClick={onRoll}
        disabled={disabled || rolling}
        aria-label={disabled ? 'Waiting for turn' : 'Roll dice — need 6 to leave base'}
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
        {rolling
          ? 'Rolling…'
          : disabled
            ? 'Wait for your turn'
            : isSix
              ? 'SIX!'
              : 'Tap to roll · need 6'}
      </p>
    </div>
  )
}
