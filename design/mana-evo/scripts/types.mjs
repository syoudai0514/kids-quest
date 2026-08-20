// マナエボの18タイプと相性表。攻撃タイプ → {2倍, 0.5倍, 0倍}

export const TYPES = [
  { id: 'normal',   name: 'ノーマル', emoji: '⚪', color: '#B7B7A8' },
  { id: 'fire',     name: 'ほのお',   emoji: '🔥', color: '#EE7F30' },
  { id: 'water',    name: 'みず',     emoji: '💧', color: '#678FEE' },
  { id: 'electric', name: 'でんき',   emoji: '⚡', color: '#F7CF2E' },
  { id: 'grass',    name: 'くさ',     emoji: '🌿', color: '#78C84F' },
  { id: 'ice',      name: 'こおり',   emoji: '❄️', color: '#98D8D8' },
  { id: 'fight',    name: 'かくとう', emoji: '🥊', color: '#C03028' },
  { id: 'poison',   name: 'どく',     emoji: '☠️', color: '#A040A0' },
  { id: 'ground',   name: 'じめん',   emoji: '⛰️', color: '#DFBF6F' },
  { id: 'flying',   name: 'ひこう',   emoji: '🪽', color: '#A98FF0' },
  { id: 'psychic',  name: 'エスパー', emoji: '🔮', color: '#F65687' },
  { id: 'bug',      name: 'むし',     emoji: '🐛', color: '#A8B820' },
  { id: 'rock',     name: 'いわ',     emoji: '🪨', color: '#B8A038' },
  { id: 'ghost',    name: 'ゴースト', emoji: '👻', color: '#705898' },
  { id: 'dragon',   name: 'ドラゴン', emoji: '🐉', color: '#7038F8' },
  { id: 'dark',     name: 'あく',     emoji: '🌑', color: '#705848' },
  { id: 'steel',    name: 'はがね',   emoji: '⚙️', color: '#B8B8D0' },
  { id: 'fairy',    name: 'フェアリー', emoji: '🧚', color: '#EE99AC' }
]

export const TYPE_BY_ID = Object.fromEntries(TYPES.map((t) => [t.id, t]))

// 攻撃側から見た相性
export const CHART = {
  normal:   { x2: [],                                           x05: ['rock', 'steel'],                                                              x0: ['ghost'] },
  fire:     { x2: ['grass', 'ice', 'bug', 'steel'],             x05: ['fire', 'water', 'rock', 'dragon'],                                            x0: [] },
  water:    { x2: ['fire', 'ground', 'rock'],                   x05: ['water', 'grass', 'dragon'],                                                   x0: [] },
  electric: { x2: ['water', 'flying'],                          x05: ['electric', 'grass', 'dragon'],                                                x0: ['ground'] },
  grass:    { x2: ['water', 'ground', 'rock'],                  x05: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'],                x0: [] },
  ice:      { x2: ['grass', 'ground', 'flying', 'dragon'],      x05: ['fire', 'water', 'ice', 'steel'],                                              x0: [] },
  fight:    { x2: ['normal', 'ice', 'rock', 'dark', 'steel'],   x05: ['poison', 'flying', 'psychic', 'bug', 'fairy'],                                x0: ['ghost'] },
  poison:   { x2: ['grass', 'fairy'],                           x05: ['poison', 'ground', 'rock', 'ghost'],                                          x0: ['steel'] },
  ground:   { x2: ['fire', 'electric', 'poison', 'rock', 'steel'], x05: ['grass', 'bug'],                                                            x0: ['flying'] },
  flying:   { x2: ['grass', 'fight', 'bug'],                    x05: ['electric', 'rock', 'steel'],                                                  x0: [] },
  psychic:  { x2: ['fight', 'poison'],                          x05: ['psychic', 'steel'],                                                           x0: ['dark'] },
  bug:      { x2: ['grass', 'psychic', 'dark'],                 x05: ['fire', 'fight', 'poison', 'flying', 'ghost', 'steel', 'fairy'],               x0: [] },
  rock:     { x2: ['fire', 'ice', 'flying', 'bug'],             x05: ['fight', 'ground', 'steel'],                                                   x0: [] },
  ghost:    { x2: ['psychic', 'ghost'],                         x05: ['dark'],                                                                       x0: ['normal'] },
  dragon:   { x2: ['dragon'],                                   x05: ['steel'],                                                                      x0: ['fairy'] },
  dark:     { x2: ['psychic', 'ghost'],                         x05: ['fight', 'dark', 'fairy'],                                                     x0: [] },
  steel:    { x2: ['ice', 'rock', 'fairy'],                     x05: ['fire', 'water', 'electric', 'steel'],                                         x0: [] },
  fairy:    { x2: ['fight', 'dragon', 'dark'],                  x05: ['fire', 'poison', 'steel'],                                                    x0: [] }
}

export function effectiveness(atk, def) {
  const row = CHART[atk]
  if (!row) return 1
  if (row.x0.includes(def)) return 0
  if (row.x2.includes(def)) return 2
  if (row.x05.includes(def)) return 0.5
  return 1
}
