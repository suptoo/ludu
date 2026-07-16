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
  type Corner,
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
  blueName?: string
  greenName?: string
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
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        d="M12 3.2l2.35 5.55 6.05.55-4.6 4.05 1.4 5.9L12 16.4l-5.2 2.85 1.4-5.9-4.6-4.05 6.05-.55L12 3.2z"
      />
    </svg>
  )
}

/** Map-pin / teardrop pawn matching classic mobile Ludu. */
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
      <svg viewBox="0 0 48 64" className="pawn-svg" aria-hidden>
        <ellipse cx="24" cy="58" rx="12" ry="3.5" fill="rgba(0,0,0,0.28)" />
        <path
          d="M24 4c-9.4 0-17 7.6-17 17 0 12.8 17 35 17 35s17-22.2 17-35c0-9.4-7.6-17-17-17z"
          fill="var(--pawn)"
          stroke="#111"
          strokeWidth="1.8"
        />
        <circle cx="24" cy="20" r="9.5" fill="#fff" stroke="#111" strokeWidth="1.4" />
        <circle cx="24" cy="20" r="6.2" fill="var(--pawn)" />
        <circle cx="21.5" cy="17.5" r="2" fill="rgba(255,255,255,0.55)" />
      </svg>
    </button>
  )
}

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

function pathTokens(pieces: PiecesState): BoardToken[] {
  const out: BoardToken[] = []
  ;(['blue', 'green'] as Color[]).forEach((color) => {
    pieces[color].forEach((rel, index) => {
      if (rel === YARD) return
      if (rel === FINISHED) {
        out.push({
          color,
          index,
          row: color === 'blue' ? 8 : 6,
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
    if (pathId === 0) extra = ' start-blue'
    else if (pathId === 26) extra = ' start-green'
    else if (pathId === 13) extra = ' start-red'
    else if (pathId === 39) extra = ' start-yellow'
    else if (SAFE_CELLS.has(pathId)) extra = ' safe'
  }
  return `sq sq-${kind}${extra}`
}

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

const CORNERS: Corner[] = ['red', 'green', 'yellow', 'blue']

export function Board({
  pieces,
  highlight,
  myColor,
  onSelectPiece,
  blueName = 'Player 1',
  greenName = 'Player 2',
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
          {pathId !== undefined && SAFE_CELLS.has(pathId) && pathId !== 0 && pathId !== 13 && pathId !== 26 && pathId !== 39 && (
            <StarIcon />
          )}
          {/* Entry arrows on colored start squares */}
          {pathId === 0 && <span className="arrow up blue-arrow" />}
          {pathId === 26 && <span className="arrow down green-arrow" />}
          {pathId === 13 && <span className="arrow right red-arrow" />}
          {pathId === 39 && <span className="arrow left yellow-arrow" />}
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
        group.length === 1 ? 0 : (stackIndex - (group.length - 1) / 2) * 22
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
      <p className="board-player-label top flipped">{greenName}</p>

      <div className="ludo-board" role="img" aria-label="Classic Ludu board">
        <div className="ludo-grid">
          {cells}

          <div className="center-home" aria-hidden>
            <div className="tri t-green" />
            <div className="tri t-yellow" />
            <div className="tri t-blue" />
            <div className="tri t-red" />
          </div>

          {CORNERS.map((corner) => {
            const o = YARD_ORIGIN[corner]
            const colors = CORNER_COLORS[corner]
            const activeColor: Color | null =
              corner === 'blue' || corner === 'green' ? corner : null
            const slots = activeColor
              ? yardSlots(pieces, activeColor)
              : [null, null, null, null]

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
                    '--yard-css': colors.css,
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
                      <div
                        key={i}
                        className="yard-circle"
                        style={{ background: colors.css }}
                      >
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

          {pathPieceNodes}
        </div>
      </div>

      <p className="board-player-label bottom">{blueName}</p>
    </div>
  )
}
