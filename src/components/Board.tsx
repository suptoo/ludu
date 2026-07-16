import type { CSSProperties, ReactNode } from 'react'
import {
  BOARD_SIZE,
  COLOR_META,
  CORNER_COLORS,
  HOME_COORDS,
  PATH_BY_RC,
  PATH_COORDS,
  SAFE_CELLS,
  YARD_ORIGIN,
  cellKind,
  toAbsolute,
  type CellKind,
} from '../game/constants'
import type { Color, PiecesState } from '../game/types'
import { FINISHED, YARD } from '../game/types'
import './Board.css'

type Props = {
  pieces: PiecesState
  highlight: number[]
  myColor: Color | null
  onSelectPiece: (index: number) => void
  currentTurn: Color
}

type BoardToken = {
  color: Color
  index: number
  row: number
  col: number
}

function StarIcon() {
  return (
    <svg className="star-svg" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 2.5l2.6 6.2 6.7.6-5.1 4.4 1.5 6.5L12 16.8 6.3 20.2l1.5-6.5-5.1-4.4 6.7-.6L12 2.5z"
      />
    </svg>
  )
}

function Pawn({
  color,
  pickable,
  onClick,
  label,
  small,
}: {
  color: Color
  pickable: boolean
  onClick: () => void
  label: string
  small?: boolean
}) {
  const meta = COLOR_META[color]
  return (
    <button
      type="button"
      className={`pawn${pickable ? ' pickable' : ''}${small ? ' pawn-sm' : ''}`}
      style={{ '--pawn': meta.css, '--pawn-deep': meta.deep } as CSSProperties}
      disabled={!pickable}
      onClick={onClick}
      aria-label={label}
    >
      <svg viewBox="0 0 40 52" className="pawn-svg" aria-hidden>
        <ellipse cx="20" cy="48" rx="13" ry="3" fill="rgba(0,0,0,0.25)" />
        <path
          d="M11 33c0-5.5 4-9.5 9-9.5s9 4 9 9.5v3c0 1.8-1.4 3.2-3.2 3.2H14.2c-1.8 0-3.2-1.4-3.2-3.2v-3z"
          fill="var(--pawn)"
          stroke="var(--pawn-deep)"
          strokeWidth="1.5"
        />
        <circle
          cx="20"
          cy="16"
          r="8.5"
          fill="var(--pawn)"
          stroke="var(--pawn-deep)"
          strokeWidth="1.5"
        />
        <circle cx="17.2" cy="13.2" r="2.8" fill="rgba(255,255,255,0.55)" />
        <ellipse cx="20" cy="39.5" rx="11" ry="4.5" fill="var(--pawn-deep)" />
      </svg>
    </button>
  )
}

/** Yard piece indexes in stable slot order 0–3. */
function yardSlots(pieces: PiecesState, color: Color): (number | null)[] {
  const slots: (number | null)[] = [null, null, null, null]
  let slot = 0
  pieces[color].forEach((pos, index) => {
    if (pos === YARD && slot < 4) {
      slots[slot] = index
      slot += 1
    }
  })
  return slots
}

/** Tokens on the path / home stretch / finish (not in yard). */
function pathTokens(pieces: PiecesState): BoardToken[] {
  const out: BoardToken[] = []
  ;(['red', 'yellow'] as Color[]).forEach((color) => {
    pieces[color].forEach((rel, index) => {
      if (rel === YARD) return
      if (rel === FINISHED) {
        // Sit on the matching center triangle tip cell
        out.push({
          color,
          index,
          row: color === 'red' ? 8 : 6,
          col: 7,
        })
        return
      }
      const abs = toAbsolute(color, rel)
      if (abs == null) return
      const coords = abs < 52 ? PATH_COORDS[abs] : HOME_COORDS[abs]
      if (!coords) return
      out.push({ color, index, row: coords[0], col: coords[1] })
    })
  })
  return out
}

function cellClass(kind: CellKind, r: number, c: number): string {
  const pathId = PATH_BY_RC.get(`${r},${c}`)
  let extra = ''
  if (pathId !== undefined) {
    if (pathId === 0) extra = ' start-red'
    else if (pathId === 26) extra = ' start-yellow'
    else if (pathId === 13) extra = ' start-green'
    else if (pathId === 39) extra = ' start-blue'
    else if (SAFE_CELLS.has(pathId)) extra = ' safe'
  }
  return `sq sq-${kind}${extra}`
}

/** Group tokens sharing a cell so we can offset stacks. */
function groupByCell(tokens: BoardToken[]) {
  const map = new Map<string, BoardToken[]>()
  tokens.forEach((t) => {
    const key = `${t.row},${t.col}`
    const list = map.get(key) ?? []
    list.push(t)
    map.set(key, list)
  })
  return map
}

export function Board({
  pieces,
  highlight,
  myColor,
  onSelectPiece,
}: Props) {
  const onPath = pathTokens(pieces)
  const byCell = groupByCell(onPath)

  const cells: ReactNode[] = []
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const kind = cellKind(r, c)
      const pathId = PATH_BY_RC.get(`${r},${c}`)
      cells.push(
        <div
          key={`${r}-${c}`}
          className={cellClass(kind, r, c)}
          style={{ gridRow: r + 1, gridColumn: c + 1 }}
        >
          {pathId !== undefined && SAFE_CELLS.has(pathId) && <StarIcon />}
          {pathId === 0 && <span className="arrow up" />}
          {pathId === 26 && <span className="arrow down" />}
          {pathId === 13 && <span className="arrow right" />}
          {pathId === 39 && <span className="arrow left" />}
        </div>,
      )
    }
  }

  const pathPieceNodes: ReactNode[] = []
  byCell.forEach((group, key) => {
    const [rs, cs] = key.split(',').map(Number)
    group.forEach((t, stackIndex) => {
      const canPick = myColor === t.color && highlight.includes(t.index)
      const offset =
        group.length === 1
          ? 0
          : (stackIndex - (group.length - 1) / 2) * 22
      pathPieceNodes.push(
        <div
          key={`${t.color}-${t.index}`}
          className="cell-piece"
          style={{
            gridRow: rs + 1,
            gridColumn: cs + 1,
            transform: offset ? `translateX(${offset}%)` : undefined,
          }}
        >
          <Pawn
            color={t.color}
            pickable={canPick}
            onClick={() => canPick && onSelectPiece(t.index)}
            label={`${COLOR_META[t.color].label} piece ${t.index + 1}`}
          />
        </div>,
      )
    })
  })

  return (
    <div className="board-wrap">
      <div className="ludo-board" role="img" aria-label="Classic Ludu board">
        <div className="board-bezel" aria-hidden />
        <div className="ludo-grid">
          {cells}

          <div className="center-home" aria-hidden>
            <div className="tri t-red" />
            <div className="tri t-green" />
            <div className="tri t-yellow" />
            <div className="tri t-blue" />
          </div>

          {/* Yard nests — pawns live INSIDE the circles */}
          {(['green', 'yellow', 'red', 'blue'] as const).map((corner) => {
            const o = YARD_ORIGIN[corner]
            const colors = CORNER_COLORS[corner]
            const activeColor: Color | null =
              corner === 'red' || corner === 'yellow' ? corner : null
            const slots = activeColor ? yardSlots(pieces, activeColor) : [null, null, null, null]

            return (
              <div
                key={`pad-${corner}`}
                className="yard-pad"
                style={
                  {
                    gridRow: `${o[0] + 2} / ${o[0] + 6}`,
                    gridColumn: `${o[1] + 2} / ${o[1] + 6}`,
                    '--yard-deep': colors.deep,
                    '--yard-soft': colors.soft,
                    '--yard': colors.yard,
                  } as CSSProperties
                }
              >
                <div className="yard-circles">
                  {slots.map((pieceIndex, i) => {
                    const canPick =
                      activeColor != null &&
                      pieceIndex != null &&
                      myColor === activeColor &&
                      highlight.includes(pieceIndex)

                    return (
                      <div key={i} className="yard-circle">
                        {activeColor != null && pieceIndex != null && (
                          <Pawn
                            color={activeColor}
                            pickable={canPick}
                            small
                            onClick={() =>
                              canPick && onSelectPiece(pieceIndex)
                            }
                            label={`${COLOR_META[activeColor].label} piece ${pieceIndex + 1}`}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Path / home pieces — locked to CSS grid cells */}
          {pathPieceNodes}
        </div>
      </div>
    </div>
  )
}
