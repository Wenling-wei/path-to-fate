import cardsRaw from '../data/cards.json'
import erasRaw from '../data/eras.json'
import originsRaw from '../data/origins.json'

export type Line = 'home' | 'self' | 'edu' | 'trade' | 'asset' | 'net' | 'love' | 'kid' | 'city' | 'gov'
export const LINE_NAME: Record<Line, string> = {
  home: '家庭', self: '自身', edu: '教育', trade: '行当', asset: '资产', net: '关系网', love: '情感', kid: '子女', city: '城市', gov: '官场',
}
export const LINES: Line[] = ['home', 'self', 'edu', 'trade', 'gov', 'asset', 'net', 'love', 'kid', 'city']
export const CUTTABLE: Line[] = ['trade', 'net', 'love', 'city']

export interface Mods { cash?: number; fd?: number; od?: number; dFace?: number; dCash?: number; upE?: number; upC?: number }
export interface CardDef {
  id: string; name: string; line: Line; tags: string[]; flavor: string
  upE: number; upC: number; cash: number; fd: number; od: number; vol: number
  dFace: number; dCash: number; dRel: number; relOpt: number
  needs: string[]; needsTag: string[]; needBond: number; minTurn: number; maxTurn: number; cost: number; refFace: number
  life: number; expireTo?: string; expireCash: number; emits?: { id: string; every: number }
  kEdu: number; kBond: number; kSelf: number; accBond: number; refBond: number
  slot: number; needCash: number; needGov: number; needAll: string[]; minDirty: number
  instant: boolean; iCash: number; iRank: boolean; iTies: number; iDirty: number; iMerit: number; refTies: number
  gMerit: number; gTies: number; risk?: { p: number; ev: string }
  locked: boolean; bad: boolean; entry: boolean; upgrade: boolean; cn: boolean; ab: boolean
  entryReq?: { tag?: string; cash?: number; maxTurn?: number; minTurn?: number }
}
export interface EraDef { id: string; act: number; name: string; text: string; rule: string; mods: Record<string, Mods>; boost: string[]; template?: string; living?: number; retire?: number; death?: number; caught?: number }
export interface OriginDef { id: string; name: string; cash: number; face: number; opt: number; hand: string[]; taste: string; win: string; bust: string }

const DEFAULTS = {
  tags: [] as string[], flavor: '', upE: 0, upC: 0, cash: 0, fd: 0, od: 0, vol: 0, dFace: 0, dCash: 0, dRel: 0, relOpt: 0,
  needs: [] as string[], needsTag: [] as string[], needBond: 0, minTurn: 1, maxTurn: 99, cost: 0, refFace: 0, life: 0, expireCash: 0,
  kEdu: 0, kBond: 0, kSelf: 0, accBond: 0, refBond: 0, slot: 0.5, needCash: 0, needGov: 0, needAll: [] as string[], minDirty: 0,
  instant: false, iCash: 0, iRank: false, iTies: 0, iDirty: 0, iMerit: 0, refTies: 0, gMerit: 0, gTies: 0, locked: false, bad: false, entry: false, upgrade: false, cn: false, ab: false,
}
export const CARDS: CardDef[] = (cardsRaw as unknown as Partial<CardDef>[]).map((c) => ({ ...DEFAULTS, ...c }) as CardDef)
export const CARD: Record<string, CardDef> = Object.fromEntries(CARDS.map((c) => [c.id, c]))
export const ERAS = erasRaw as unknown as EraDef[]
export const ERA: Record<string, EraDef> = Object.fromEntries(ERAS.map((e) => [e.id, e]))
export const ORIGINS = originsRaw as unknown as OriginDef[]

export const BUST_BODY = 10
/** 仓位上限：每过一幕 +2（阅历） */
export const slotCap = (s: State) => 6 + (actOf(Math.max(1, s.turn)) - 1)
/** 一张牌拿满这么多回合就「驾轻就熟」，负荷 −1 */
export const SEASONED = 4
const STAGE_START = [1, 4, 7, 10, 14, 19, 24, 29]
export const STAGE_NAME = ['', '开荒', '成形', '结算前夜', '经营', '中年', '退场', '晚年', '尽头']
const LIVING = [0, 1, 2, 2, 3, 3, 3, 2, 2]
export const ageOf = (t: number) => 18 + (Math.max(1, t) - 1) * 2
export const turnOfAge = (age: number) => (age - 18) / 2 + 1
export const actOf = (t: number) => { let a = 1; STAGE_START.forEach((st, i) => { if (t >= st) a = i + 1 }); return a }
const isStageEnd = (t: number) => STAGE_START.includes(t + 1)

export interface Inst { uid: number; id: string; parent: number | null; withered: boolean; late: boolean; age: number; source: 'dealt' | 'grown' | 'emitted' | 'entry' }
export interface LogLine { turn: number; text: string; kind: 'era' | 'good' | 'bad' | 'info' | 'gossip' }
export interface Flash { title: string; lines: string[]; tone: 'release' | 'cut' | 'bad' }
export interface Gov { merit: number; ties: number; dirty: number }
export interface Kid { edu: number; bond: number; self: number; result: string }
export interface Stats {
  discards: number; cuts: number; refuses: number; accepts: number; lifeChose: number
  stuffed: number; structural: number; notFolded: number; withered: number; fullparent: boolean; emigrated: boolean; caught: boolean; exposed: boolean; topRank: number
}
export interface State {
  phase: 'pick' | 'offer' | 'action' | 'cutpick' | 'end'
  originId: string; hard: boolean
  turn: number; cash: number; face: number; opt: number; bodyDebt: number; relDebt: number
  holdings: Inst[]; uidSeq: number
  eraId: string | null; aiOn: boolean; delay: boolean; retired: boolean; parentsGone: boolean
  kid: Kid | null; gov: Gov | null; jail: number; abroad: boolean; abroadSince: number; landing: boolean
  offer: { id: string; parentUid: number } | null
  queue: { id: string; parentUid: number }[]
  cool: Record<string, number>
  cutLine: Line | null; entries: string[]
  log: LogLine[]; flash: Flash | null
  stats: Stats; endCause: null | 'body' | 'cash' | 'death'
}

export const initial: State = {
  phase: 'pick', originId: '', hard: false, turn: 0, cash: 0, face: 0, opt: 0, bodyDebt: 0, relDebt: 0,
  holdings: [], uidSeq: 0, eraId: null, aiOn: false, delay: false, retired: false, parentsGone: false, kid: null, gov: null, jail: 0, abroad: false, abroadSince: 0, landing: false,
  offer: null, queue: [], cool: {}, cutLine: null, entries: [], log: [], flash: null,
  stats: { discards: 0, cuts: 0, refuses: 0, accepts: 0, lifeChose: 0, stuffed: 0, structural: 0, notFolded: 0, withered: 0, fullparent: false, emigrated: false, caught: false, exposed: false, topRank: 0 },
  endCause: null,
}

export type Action =
  | { type: 'start'; origin: string; hard: boolean }
  | { type: 'accept' } | { type: 'refuse' }
  | { type: 'discard'; uid: number }
  | { type: 'cut'; line: Line }
  | { type: 'emigrate' }
  | { type: 'entry'; id: string | null }
  | { type: 'endTurn' } | { type: 'restart' }

// ---------- 读状态 ----------
const sgn = (n: number) => (n > 0 ? `+${n}` : `−${Math.abs(n)}`)
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
const has = (s: State, id: string) => s.holdings.some((h) => h.id === id)
export const hasTag = (s: State, tag: string) => s.holdings.some((h) => !h.withered && CARD[h.id].tags.includes(tag))

export function activeEras(s: State): EraDef[] {
  const list: EraDef[] = []
  if (s.eraId) list.push(ERA[s.eraId])
  if (s.aiOn && s.eraId !== 'era_ai') list.push(ERA.era_ai)
  if (s.abroad) list.push(ERA.era_abroad)
  return list
}
export function capE(s: State): number {
  const age = ageOf(s.turn)
  return (age < 50 ? 6 : age < 66 ? 5 : 4) + (hasTag(s, 'fit') ? 1 : 0)
}
export const livingCost = (s: State) => LIVING[actOf(Math.max(1, s.turn))] + activeEras(s).reduce((a, e) => a + (e.living ?? 0), 0)

export interface HStat { seasoned: boolean; upE: number; upC: number; cash: number; fd: number; od: number; dFace: number; dCash: number; dRel: number; relOpt: number; eraNote: string[] }
export function hstat(s: State, h: Inst): HStat {
  const d = CARD[h.id]
  const st: HStat = { seasoned: false, upE: d.upE, upC: d.upC, cash: d.cash, fd: d.fd, od: d.od, dFace: d.dFace, dCash: d.dCash, dRel: d.dRel, relOpt: d.relOpt, eraNote: [] }
  for (const era of activeEras(s)) {
    for (const tag of d.tags) {
      const m = era.mods[tag]
      if (!m) continue
      st.cash += m.cash ?? 0; st.fd += m.fd ?? 0; st.od += m.od ?? 0; st.dFace += m.dFace ?? 0; st.dCash += m.dCash ?? 0
      st.upE += m.upE ?? 0; st.upC += m.upC ?? 0
      if (!st.eraNote.includes(era.name)) st.eraNote.push(era.name)
    }
  }
  if (d.cash >= 0 && !d.vol) st.cash = Math.max(0, st.cash)
  if (!d.bad && !h.withered && st.upE > 0 && h.age >= SEASONED) { st.upE -= 1; st.seasoned = true }
  if (d.upE >= 0) st.upE = Math.max(0, st.upE)
  st.upC = Math.max(0, st.upC)
  if (h.late) st.cash = Math.max(0, st.cash - 1)
  if (d.tags.includes('body') && hasTag(s, 'insured')) { st.upC = 0; st.dCash = 0 }
  if (h.withered) { st.cash = Math.min(st.cash, 0); st.fd = Math.min(st.fd, 0); st.od = Math.min(st.od, 0); st.dFace = Math.floor(st.dFace / 2) }
  st.dFace = Math.max(0, st.dFace)
  return st
}
/** 净值粗估：< −1 视为吸血牌 */
export function netValue(s: State, h: Inst): number {
  const st = hstat(s, h), d = CARD[h.id]
  const kid = s.kid && hasTag(s, 'minor') ? d.kEdu + d.kBond + d.kSelf : 0
  return st.cash - st.upC - 1.5 * st.upE + 0.5 * st.fd + st.od + 1.5 * kid + (s.gov ? d.gMerit + d.gTies : 0)
}
export const slotCount = (s: State) => Math.round(s.holdings.reduce((a, h) => a + CARD[h.id].slot, 0) * 10) / 10
export const RANK_NAME = ['', '科员', '科长', '处长', '厅局级']
export const rankOf = (s: State) => (hasTag(s, 'power3') ? 4 : hasTag(s, 'power2') ? 3 : hasTag(s, 'power') ? 2 : hasTag(s, 'stable') ? 1 : 0)
export const govScore = (s: State) => (s.gov ? Math.floor(s.gov.merit + s.gov.ties) : 0)
/** 每回合落马概率 */
export function caughtChance(s: State): number {
  if (!s.gov || s.gov.dirty <= 0) return 0
  const mul = activeEras(s).reduce((a, e) => a * (e.caught ?? 1), 1) * (hasTag(s, 'glove') ? 0.5 : 1) * (s.retired ? 0.5 : 1)
  return Math.min(0.6, s.gov.dirty * 0.012 * mul)
}
export function load(s: State): number {
  let e = 0
  for (const h of s.holdings) e += hstat(s, h).upE
  return e + Math.max(0, Math.ceil(slotCount(s) - slotCap(s)))
}
export function income(s: State): number {
  let c = 0
  for (const h of s.holdings) { const st = hstat(s, h); c += st.cash - st.upC }
  return c - livingCost(s)
}
/** 偏离同龄模板的程度：每幕末按此扣体面（60 岁以后没人管你了） */
export function deviation(s: State): number {
  const age = ageOf(s.turn)
  if (age >= 60 || s.abroad) return 0
  const era = s.eraId ? ERA[s.eraId] : null
  let n = 0
  if (age >= 26 && !hasTag(s, 'templ')) n++
  if (age >= 30 && !hasTag(s, 'partner')) n++
  if ((age >= 30 || era?.template === 'house') && !hasTag(s, 'house')) n++
  if (age >= 36 && !hasTag(s, 'child')) n++
  if (hasTag(s, 'distance')) n--
  return Math.max(0, n)
}
/** 这张牌现在还能长出什么（窗口未关的） */
export function growsFrom(id: string, turn: number, abroad = false): { open: CardDef[]; closed: number } {
  const tags = CARD[id].tags
  const all = CARDS.filter((c) => (abroad ? !c.cn : !c.ab) && (c.needs.includes(id) || c.needsTag.some((t) => tags.includes(t))))
  return { open: all.filter((c) => c.maxTurn >= turn), closed: all.filter((c) => c.maxTurn < turn).length }
}
export function descendants(s: State, uid: number): Inst[] {
  const out: Inst[] = []
  const walk = (p: number) => { for (const h of s.holdings) if (h.parent === p) { out.push(h); walk(h.uid) } }
  walk(uid)
  return out
}
const witherable = (k: Inst) => !k.withered && !CARD[k.id].locked
export function discardPreview(s: State, h: Inst): string {
  const st = hstat(s, h)
  const parts: string[] = []
  if (st.dFace) parts.push(`体面 −${st.dFace}`)
  if (st.dCash) parts.push(`钱 ${sgn(st.dCash)}`)
  if (st.dRel) parts.push(`关系债 +${st.dRel}`)
  if (st.relOpt) parts.push(`可选性 +${st.relOpt}`)
  if (st.upE > 0) parts.push(`负荷 −${st.upE}`)
  const kids = descendants(s, h.uid).filter(witherable)
  if (kids.length) parts.push(`连带枯萎：${kids.map((k) => CARD[k.id].name).join('、')}`)
  return parts.length ? parts.join(' · ') : '无代价'
}
export const cutCost = (s: State) => ({ cash: 1 + Math.min(5, actOf(s.turn)), face: 2, rel: 1, opt: 2 })
export function cutPreview(s: State, line: Line): { gone: Inst[]; wither: Inst[] } {
  const gone = s.holdings.filter((h) => CARD[h.id].line === line && !CARD[h.id].locked)
  const goneSet = new Set(gone.map((g) => g.uid))
  const wither: Inst[] = []
  for (const g of gone) for (const k of descendants(s, g.uid)) if (!goneSet.has(k.uid) && witherable(k) && !wither.includes(k)) wither.push(k)
  return { gone, wither }
}

// ---------- 改状态 ----------
function log(s: State, text: string, kind: LogLine['kind'] = 'info') { s.log.push({ turn: s.turn, text, kind }) }
function clamp(s: State) {
  s.face = Math.max(0, Math.min(10, s.face)); s.opt = Math.max(0, Math.min(10, s.opt))
  s.bodyDebt = Math.max(0, s.bodyDebt); s.relDebt = Math.max(0, s.relDebt)
  if (!s.gov && hasTag(s, 'stable')) s.gov = { merit: 0, ties: 0, dirty: 0 }
  if (s.gov) { s.gov.merit = Math.max(0, s.gov.merit); s.gov.ties = Math.max(0, s.gov.ties); s.gov.dirty = Math.max(0, s.gov.dirty) }
  s.stats.topRank = Math.max(s.stats.topRank, rankOf(s))
  if (s.kid) for (const k of ['edu', 'bond', 'self'] as const) s.kid[k] = Math.max(0, Math.min(10, s.kid[k]))
}
function add(s: State, id: string, parent: number | null, source: Inst['source'], late = false): Inst {
  const inst: Inst = { uid: ++s.uidSeq, id, parent, withered: false, late, age: 0, source }
  s.holdings.push(inst)
  return inst
}
/** 移除一张牌，长在它上面的牌一起枯（弃不掉的牌不会枯）。返回枯掉的牌名。 */
function removeAndWither(s: State, uid: number): string[] {
  const names: string[] = []
  for (const k of descendants(s, uid)) if (witherable(k)) { k.withered = true; s.stats.withered++; names.push(CARD[k.id].name) }
  s.holdings = s.holdings.filter((h) => h.uid !== uid)
  return names
}

function flipEra(s: State) {
  const era = pick(ERAS.filter((e) => e.act === actOf(s.turn)))
  s.eraId = era.id
  if (era.id === 'era_ai') s.aiOn = true
  if (era.retire) s.delay = true
  log(s, `进入「${STAGE_NAME[actOf(s.turn)]}」。时代牌翻开：【${era.name}】${era.text} ${era.rule}`, 'era')
}

const GOSSIP = [
  '楼下阿姨已经替你规划好了后半生。',
  '家族群里出现了一篇《致不听话的孩子》。',
  '同学群有人问你“现在在哪高就”，没人等你回答。',
  '亲戚说：“我不是说你，我是说现在的年轻人。”',
  '“都这个年纪了”——这句话今年你听了十一次。',
]

function emit(s: State, id: string, from: string) {
  if (has(s, id)) { s.relDebt += 1; log(s, `「${CARD[id].name}」又来了，上一张还没处理。关系债 +1。`, 'bad'); return }
  add(s, id, null, 'emitted'); s.stats.stuffed++
  log(s, `${from}发来一张烂牌：「${CARD[id].name}」。${CARD[id].flavor}`, 'bad')
}

// ----- 孩子 -----
const KID_NEXT: Record<string, string> = { k_baby: 'k_primary', k_primary: 'k_middle' }
function kidExpire(s: State, h: Inst): boolean {
  const kid = s.kid
  if (!kid) return false
  if (KID_NEXT[h.id]) {
    h.id = KID_NEXT[h.id]; h.age = 0; kid.edu += 1; kid.self += 1
    log(s, `孩子长大了：${CARD[h.id].name}。`, 'info')
    return true
  }
  if (h.id === 'k_middle') {
    const score = kid.edu + (s.abroad ? 2 : 0) + (hasTag(s, 'donor') ? 2 : 0) + (hasTag(s, 'degree') ? 1 : 0) + (s.cash >= 10 ? 1 : 0) + Math.floor(Math.random() * 3)
    h.id = score >= 8 ? 'k_college_top' : score >= 4 ? 'k_college' : 'k_work'
    h.age = 0
    const gone = s.holdings.filter((x) => CARD[x.id].line === 'kid' && !CARD[x.id].locked && !CARD[x.id].bad)
    for (const g of gone) removeAndWither(s, g.uid)
    log(s, `高考。学业 ${kid.edu}，加上你手里的牌（文凭、存款）和一点运气：${CARD[h.id].name}。${gone.length ? `${gone.map((g) => CARD[g.id].name).join('、')}用不上了。` : ''}`, 'era')
    if (has(s, 't_fullparent')) log(s, '孩子走了。「全职培养孩子」这张牌还在你手里，但它已经没有对象了。', 'bad')
    return true
  }
  if (['k_college_top', 'k_college', 'k_work'].includes(h.id)) {
    const indep = kid.self >= 4
    const next = h.id === 'k_college_top' ? (indep ? 'k_adult_good' : 'k_adult_std')
      : h.id === 'k_college' ? (indep ? 'k_adult_plain' : kid.edu < 5 ? 'k_adult_home' : 'k_adult_plain')
        : indep ? 'k_adult_craft' : 'k_adult_home'
    h.id = next; h.age = 0; kid.result = CARD[next].name
    log(s, `孩子成年了：${CARD[next].name}。${CARD[next].flavor}（学业 ${kid.edu} · 亲密 ${Math.round(kid.bond)} · 自主 ${kid.self}）`, 'era')
    return true
  }
  return false
}

function drawOffer(s: State) {
  s.offer = null; s.queue = []
  const boost = new Set(activeEras(s).flatMap((e) => e.boost))
  const noJob = !hasTag(s, 'job') && !s.retired
  const minor = hasTag(s, 'minor')
  const shunned = s.face <= 2
  let cands: { def: CardDef; parent: Inst; w: number }[] = []
  for (const def of CARDS) {
    if ((!def.needs.length && !def.needsTag.length) || has(s, def.id)) continue
    if (s.turn < def.minTurn || s.turn > def.maxTurn) continue
    if ((s.cool[def.id] ?? 0) > s.turn) continue
    if (def.id === 'k_baby' && s.kid) continue
    if (s.abroad ? def.cn : def.ab) continue
    if (def.needBond && (!s.kid || s.kid.bond < def.needBond)) continue
    if (def.needCash && s.cash < def.needCash) continue
    if (def.cost > 0 && def.needCash === 0 && def.instant && s.cash < def.cost) continue
    if (def.needGov && govScore(s) < def.needGov) continue
    if (def.minDirty && (!s.gov || s.gov.dirty < def.minDirty)) continue
    if (def.needAll.some((t) => !hasTag(s, t))) continue
    const parent = s.holdings.find((h) => !h.withered && (def.needs.includes(h.id) || def.needsTag.some((t) => CARD[h.id].tags.includes(t))))
    if (!parent) continue
    if (shunned && (def.line === 'net' || def.line === 'love')) continue
    let w = 1
    if (def.tags.some((t) => boost.has(t))) w *= 3
    if (noJob && def.tags.includes('job')) w *= 5
    if (minor && (def.line === 'kid' || def.kEdu > 0)) w *= 2
    if (def.tags.includes('partner') || def.id === 'k_baby') w *= 3
    if (def.line === 'gov' || def.needGov) w *= 2
    if (def.needCash) w *= 2
    cands.push({ def, parent, w })
  }
  if (s.turn === 1) { const jobs = cands.filter((c) => c.def.tags.includes('job')); if (jobs.length) cands = jobs }
  if (shunned) log(s, '体面太低：关系和感情这两条线上，暂时没人给你递牌。', 'gossip')
  if (!cands.length) { log(s, '这两年，这条路上没有新牌递过来。'); return }
  for (let i = 0; i < 2 && cands.length; i++) {
    let r = Math.random() * cands.reduce((a, c) => a + c.w, 0)
    const c = cands.find((x) => (r -= x.w) < 0) ?? cands[0]
    s.queue.push({ id: c.def.id, parentUid: c.parent.uid })
    cands = cands.filter((x) => x !== c && !(x.def.upgrade && c.def.upgrade && x.parent === c.parent))
  }
  s.offer = s.queue.shift() ?? null
}

function nextOffer(s: State) {
  s.offer = null
  while (s.queue.length && !s.offer) {
    const q = s.queue.shift()!
    if (!has(s, q.id) && s.holdings.some((h) => h.uid === q.parentUid && !h.withered)) s.offer = q
  }
  s.phase = s.offer ? 'offer' : 'action'
}

function accept(s: State, auto = false) {
  if (!s.offer) return
  const def = CARD[s.offer.id]
  const parent = s.holdings.find((h) => h.uid === s.offer!.parentUid)
  const head = auto ? '可选性归零，生活替你接了：' : '顺势接下：'
  s.cash -= def.cost
  if (def.instant) {
    const k = def.iRank ? Math.max(1, rankOf(s)) : 1
    s.cash += def.iCash * k; s.cool[def.id] = s.turn + 2
    if (s.gov) { s.gov.ties += def.iTies; s.gov.dirty += def.iDirty; s.gov.merit += def.iMerit }
    const bits = [def.cost ? `钱 −${def.cost}` : '', def.iCash ? `钱 +${def.iCash * k}` : '', def.iTies ? `关系 ${sgn(def.iTies)}` : '', def.iMerit ? `政绩 ${sgn(def.iMerit)}` : '', def.iDirty ? `问题 ${sgn(def.iDirty)}` : ''].filter(Boolean)
    log(s, `${auto ? '可选性归零，生活替你做了：' : ''}「${def.name}」。${bits.join('，')}。`, def.iDirty > 0 ? 'gossip' : 'info')
  } else if (def.upgrade && parent) {
    const old = CARD[parent.id].name
    parent.id = def.id; parent.age = 0; parent.source = 'grown'
    log(s, `${head}「${old}」长成了「${def.name}」。`, auto ? 'bad' : 'info')
  } else {
    add(s, def.id, parent?.uid ?? null, 'grown')
    log(s, `${head}「${def.name}」${parent ? `（长自「${CARD[parent.id].name}」）` : ''}${def.cost ? `，钱 −${def.cost}` : ''}。`, auto ? 'bad' : 'info')
  }
  if (def.id === 'k_baby') { s.kid = { edu: 0, bond: 2, self: 0, result: '' }; log(s, '多了一条脉络：「子女」。从现在起，你发的每张牌都有人接着。', 'era') }
  if (s.kid && def.accBond) s.kid.bond += def.accBond
  s.stats.accepts++
  if (auto) s.stats.lifeChose++
  nextOffer(s); clamp(s)
  if (auto && s.offer) accept(s, true)
}

// ----- 官场与有钱人的事 -----
function caught(s: State) {
  if (!s.gov) return
  const fine = Math.round(s.gov.dirty * 5)
  const gone = s.holdings.filter((h) => { const d = CARD[h.id]; return d.line === 'gov' || d.tags.includes('stable') || d.id === 'p_good' || d.id === 't_rehire' })
  const withered = gone.flatMap((g) => removeAndWither(s, g.uid))
  if (gone.some((g) => g.id === 'p_good')) add(s, 'p_base', null, 'grown')
  s.cash = Math.max(-4, s.cash - fine)
  s.face = 0; s.relDebt += 3; s.bodyDebt += 2; s.opt -= 3
  if (s.kid) s.kid.bond -= 2
  s.jail = 2; s.stats.caught = true
  s.gov = { merit: 0, ties: 0, dirty: 0 }
  s.flash = { title: '落马', lines: [`双开：${gone.map((g) => CARD[g.id].name).join('、') || '无'}`, `追缴 ${fine}`, '体面清零 · 关系债 +3 · 身体债 +2 · 可选性 −3', withered.length ? `树倒猢狲散：${withered.join('、')}` : '', '里面四年'].filter(Boolean), tone: 'bad' }
  log(s, `落马。${s.flash.lines.join('；')}。`, 'era')
}

function worldEvents(s: State) {
  // 官场：政绩与关系
  if (s.gov && hasTag(s, 'stable')) {
    for (const h of s.holdings) if (!h.withered) { s.gov.merit += CARD[h.id].gMerit; s.gov.ties += CARD[h.id].gTies }
    if (load(s) <= capE(s)) s.gov.merit += 0.5
  }
  // 带风险的牌
  for (const h of [...s.holdings]) {
    const d = CARD[h.id]
    if (!d.risk || h.withered || h.age === 0 || Math.random() >= d.risk.p) continue
    if (d.risk.ev === 'patronFall') {
      removeAndWither(s, h.uid)
      if (s.gov) { s.gov.ties -= 4; log(s, '靠山倒了。「站队」这张牌没了，官场关系 −4。你是他的人，这件事所有人都记得。', 'bad'); if (s.gov.dirty >= 3 && Math.random() < 0.3) { caught(s); return } }
    } else if (d.risk.ev === 'exposed') {
      removeAndWither(s, h.uid)
      s.stats.exposed = true; s.face -= 3; s.relDebt += 2
      if (s.kid) s.kid.bond -= 2
      const m = s.holdings.find((x) => CARD[x.id].tags.includes('marriage'))
      let tail = ''
      if (m && Math.random() < 0.5) { const half = Math.max(0, Math.floor(s.cash / 2)); removeAndWither(s, m.uid); s.cash -= half; tail = `离婚，分走一半：钱 −${half}。` }
      else if (m) { emit(s, 'b_cold', '被发现之后'); tail = '婚还在，日子不一样了。' }
      if (s.gov && rankOf(s) >= 2) { s.gov.dirty += 2; tail += '作风问题记进了档案：问题 +2。' }
      log(s, `东窗事发。体面 −3，关系债 +2${s.kid ? '，孩子亲密 −2' : ''}。${tail}`, 'era')
    }
  }
  // 落马
  if (Math.random() < caughtChance(s)) { caught(s); return }
  // 有钱人的事
  if (s.cash >= 40 && s.turn % 3 === 0) emit(s, 'b_borrow', '你的存款')
  if (s.cash >= 60 && hasTag(s, 'bigmoney') && !has(s, 'b_tax') && Math.random() < 0.12) emit(s, 'b_tax', '你的生意')
  clamp(s)
}

function lifeEvents(s: State) {
  const age = ageOf(s.turn)
  // 父母
  if (!s.parentsGone && s.turn >= 22) {
    s.parentsGone = true
    const gone = s.holdings.filter((h) => ['b_care', 'b_expect', 'b_money'].includes(h.id))
    for (const g of gone) removeAndWither(s, g.uid)
    const home = s.holdings.find((h) => CARD[h.id].tags.includes('home'))
    const gift = home?.id === 'h_metro' ? 8 : 2
    if (home) home.id = 'h_gone'
    s.cash += gift
    log(s, `父母走了。${gone.length ? `${gone.map((g) => CARD[g.id].name).join('、')}一起没了。` : ''}留下的：钱 +${gift}。`, 'era')
  }
  // 退休
  if (!s.retired && s.turn >= 22 + (s.delay ? 2 : 0)) {
    s.retired = true
    const jobs = s.holdings.filter((h) => CARD[h.id].tags.includes('templ'))
    const withered = jobs.flatMap((j) => removeAndWither(s, j.uid))
    add(s, jobs.length ? 'p_good' : 'p_base', null, 'grown')
    log(s, jobs.length
      ? `退休。${jobs.map((j) => CARD[j.id].name).join('、')}换成了「职工退休金」。${withered.length ? `人走茶凉：${withered.join('、')}枯了。` : ''}`
      : '到年纪了。没有单位给你办退休，只有一张「基础养老金」。手上的活可以接着干。', 'era')
  }
  // 老伴
  if (age >= 70) {
    const p = s.holdings.find((h) => CARD[h.id].tags.includes('partner'))
    if (p && Math.random() < 0.12) { removeAndWither(s, p.uid); log(s, '老伴走了。', 'bad') }
    if (s.turn % 2 === 0) s.bodyDebt += 1
  }
}

function openTurn(s: State, blank: boolean) {
  s.turn++
  if (STAGE_START.includes(s.turn)) flipEra(s)
  lifeEvents(s)
  // 保质期
  for (const h of [...s.holdings]) {
    h.age++
    const d = CARD[h.id]
    if (d.life && h.age >= d.life) {
      if (kidExpire(s, h)) continue
      if (h.id === 'a_deal') {
        removeAndWither(s, h.uid)
        if (Math.random() < 0.4) { s.cash += 40; log(s, '「熟人投资局」成了。钱 +40。', 'good') }
        else log(s, '「熟人投资局」没了下文。牵头的人电话打不通了。', 'bad')
        continue
      }
      if (d.expireTo) { log(s, `「${d.name}」到期，变成「${CARD[d.expireTo].name}」。`, d.line === 'edu' && d.locked ? 'bad' : 'info'); h.id = d.expireTo; h.age = 0 }
      else {
        removeAndWither(s, h.uid)
        if (d.expireCash) { s.cash += d.expireCash; log(s, `「${d.name}」暴雷了。钱 ${sgn(d.expireCash)}。`, 'bad') }
        else log(s, `「${d.name}」用完了。`, 'bad')
      }
      s.stats.structural++
    }
  }
  // 烂牌源头
  const l0 = load(s)
  for (const h of [...s.holdings]) {
    const d = CARD[h.id]
    if (h.withered || h.age === 0) continue
    const em = d.tags.includes('home') && s.turn >= 14 ? { id: 'b_care', every: 3 } : d.emits
    if (em && h.age % em.every === 0) emit(s, em.id, `「${d.name}」`)
    if (d.tags.includes('marriage') && h.age % 4 === 0 && l0 >= capE(s)) emit(s, 'b_cold', '太累的日子')
  }
  if (s.abroad && s.turn > s.abroadSince + 1 && (s.turn - s.abroadSince) % 4 === 0) emit(s, 'b_homesick', '异乡的日子')
  if (s.bodyDebt >= 3 && s.turn % 2 === 0) {
    if (s.turn >= 15 && !has(s, 'b_chronic')) emit(s, 'b_chronic', '身体')
    else if (!has(s, 'b_body')) emit(s, 'b_body', '身体')
  }
  // 孩子
  if (s.kid && hasTag(s, 'minor')) {
    for (const h of s.holdings) if (!h.withered) { const d = CARD[h.id]; s.kid.edu += d.kEdu; s.kid.bond += d.kBond; s.kid.self += d.kSelf }
    if (load(s) > capE(s)) { s.kid.bond -= 1; log(s, '你太累了，回家只剩下脾气。孩子亲密 −1。', 'bad') }
    else if (load(s) < capE(s)) s.kid.bond += 0.5
  }
  worldEvents(s)
  // 维持费
  const l = load(s), cap = capE(s)
  if (l > cap) { const over = l - cap >= 6 ? 2 : 1; s.bodyDebt += over; log(s, `负荷 ${l}/${cap}，硬扛：身体债 +${over}。`, 'bad') }
  else if (cap - l >= 2 && s.bodyDebt > 0) { s.bodyDebt -= 1; log(s, '手上松，缓过来一点：身体债 −1。', 'good') }
  let inc = income(s)
  for (const h of s.holdings) {
    const d = CARD[h.id]
    if (d.vol && !h.withered) { const r = Math.floor(Math.random() * (2 * d.vol + 2)) - d.vol; inc += r; log(s, `「${d.name}」这两年 ${r === 0 ? '持平' : sgn(r)}。`, r >= 0 ? 'good' : 'bad') }
    if (!d.locked && netValue(s, h) < -1) s.stats.notFolded++
  }
  s.cash += inc
  if (s.cash < 0 && hasTag(s, 'trust')) { s.cash = 0; log(s, '家族信托兜住了底：现金回到 0。', 'good') }
  if (s.cash < 0) { s.face -= 1; s.opt -= 1; log(s, `入不敷出（这两年 ${sgn(inc)}），借钱周转：体面 −1，可选性 −1。`, 'bad') }
  clamp(s)
  if (s.jail > 0) { s.jail--; s.offer = null; s.queue = []; s.phase = 'action'; log(s, '里面的两年。没有牌递进来。', 'bad'); return }
  if (blank) { log(s, '空白的两年。切牌的代价之一，是这段时间什么都长不出来。', 'info'); return }
  drawOffer(s)
  s.phase = s.offer ? 'offer' : 'action'
  if (s.offer && s.opt <= 0) accept(s, true)
}

/** 回合收尾。返回是否终局。 */
function closeTurn(s: State): boolean {
  const age = ageOf(s.turn)
  if (isStageEnd(s.turn)) {
    let fd = 0, od = 0
    for (const h of s.holdings) { const st = hstat(s, h); fd += st.fd; od += st.od }
    const dev = Math.min(2, deviation(s))
    od = Math.max(-3, Math.min(2, od - (actOf(s.turn) <= 5 ? 1 : 0)))
    s.face += fd - dev; s.opt += od
    s.stats.structural += 1 + dev
    log(s, `「${STAGE_NAME[actOf(s.turn)]}」结算：持仓带来体面 ${sgn(fd)}；年纪和持仓让可选性 ${sgn(od)}。`, 'info')
    if (dev > 0) log(s, `偏离同龄模板，闲话扣体面 −${dev}。${pick(GOSSIP)}`, 'gossip')
    if (hasTag(s, 'fit') && s.bodyDebt > 0) { s.bodyDebt -= 1; log(s, '运动习惯：身体债 −1。', 'good') }
    if (hasTag(s, 'vip')) { s.bodyDebt -= 2; log(s, '高端医疗：身体债 −2。', 'good') }
    if (hasTag(s, 'drink')) { s.bodyDebt += 1; log(s, '应酬酒量：身体债 +1。', 'bad') }
    if (age >= 60) s.bodyDebt += 1
    if (s.relDebt > 0) s.relDebt -= 1
    if (s.kid && hasTag(s, 'adultchild') && age >= 56) {
      if (s.kid.bond >= 5) { s.bodyDebt -= 1; log(s, '孩子常回来看你：身体债 −1。', 'good') }
      else if (s.kid.bond <= 1) emit(s, 'b_alone', '多年的疏远')
    }
    clamp(s)
  }
  if (s.cash <= -8) s.endCause = 'cash'
  else if (s.bodyDebt >= BUST_BODY) s.endCause = age < 60 ? 'body' : 'death'
  else if (age >= 66) {
    const p = Math.max(0.01, 0.02 + 0.03 * s.bodyDebt + 0.012 * (age - 66) + activeEras(s).reduce((a, e) => a + (e.death ?? 0), 0))
    if (age >= 94 || Math.random() < p) s.endCause = 'death'
  }
  if (s.endCause) {
    log(s, s.endCause === 'death' ? `${age} 岁。牌局到这里结束了。` : s.endCause === 'body' ? `${age} 岁，身体先垮了。` : `${age} 岁，现金流断了。`, 'era')
    s.phase = 'end'; return true
  }
  return false
}

function discard(s: State, uid: number) {
  const h = s.holdings.find((x) => x.uid === uid)
  if (!h || CARD[h.id].locked) return
  const d = CARD[h.id], st = hstat(s, h)
  s.face -= st.dFace; s.cash += st.dCash; s.relDebt += st.dRel; s.opt += st.relOpt
  if (d.tags.includes('body')) s.bodyDebt -= 2
  if (d.tags.includes('mend') && s.kid) s.kid.bond += 2
  const kids = removeAndWither(s, uid)
  s.stats.discards++
  const lines: string[] = []
  if (st.upE > 0) lines.push(`负荷 −${st.upE}`)
  if (st.upC > 0) lines.push(`每年少付 ${st.upC}`)
  if (st.relOpt) lines.push(`可选性 +${st.relOpt}`)
  if (d.tags.includes('body')) lines.push('身体债 −2')
  if (d.tags.includes('mend')) lines.push('亲密 +2')
  if (st.dFace) lines.push(`体面 −${st.dFace}`)
  if (st.dCash) lines.push(`钱 ${sgn(st.dCash)}`)
  if (st.dRel) lines.push(`关系债 +${st.dRel}`)
  if (kids.length) lines.push(`连根枯萎：${kids.join('、')}`)
  s.flash = { title: d.bad ? `处理掉了「${d.name}」` : `仓位松开：弃掉「${d.name}」`, lines, tone: 'release' }
  log(s, `${d.bad ? '处理掉' : '弃牌'}：「${d.name}」。${lines.join('，')}。`, 'good')
  checkAbroad(s); clamp(s)
}

/** 人在海外却没了身份牌：回流 */
function checkAbroad(s: State) {
  if (!s.abroad || hasTag(s, 'abroadstatus')) return
  s.abroad = false
  if (!hasTag(s, 'city')) add(s, 'c_backhome', null, 'entry')
  log(s, '身份没了，你回来了。旧牌的面值按老规矩重新算；走之前清掉的那些牌，不会自己长回来。', 'era')
}

export const EMI_NEED = 20
export const EMI_COST = 18
export const canEmigrate = (s: State) => !s.abroad && s.cash >= EMI_NEED && s.turn <= 21
export const emigrateGone = (s: State) => s.holdings.filter((h) => !CARD[h.id].locked && !CARD[h.id].tags.includes('marriage'))

function emigrate(s: State) {
  if (!canEmigrate(s)) return
  const gone = emigrateGone(s)
  const goneIds = new Set(gone.map((g) => g.uid))
  s.holdings = s.holdings.filter((h) => !goneIds.has(h.uid))
  for (const h of s.holdings) if (h.parent && goneIds.has(h.parent)) h.parent = null
  s.cash -= EMI_COST; s.relDebt += 2; s.opt += 4
  s.abroad = true; s.abroadSince = s.turn; s.stats.emigrated = true; s.stats.cuts++
  add(s, 'c_ab_visa', null, 'entry')
  const lines = [`清空手牌：${gone.map((g) => CARD[g.id].name).join('、') || '无'}`, `钱 −${EMI_COST} · 关系债 +2 · 可选性 +4`, '空白两年', '从此按「另一张牌桌」的规则算牌面']
  s.flash = { title: '移民：换一张牌桌', lines, tone: 'cut' }
  log(s, `移民。${lines.join('；')}。弃不掉的牌（家、学历、孩子）跟着你走。`, 'era')
  clamp(s)
  if (closeTurn(s)) return
  openTurn(s, true)
  if (closeTurn(s)) return
  s.cutLine = 'trade'; s.landing = true
  s.entries = entriesFor(s, 'trade')
  s.phase = 'cutpick'
}

function entriesFor(s: State, line: Line): string[] {
  return CARDS.filter((c) => {
    if (!c.entry || c.line !== line || has(s, c.id)) return false
    if (s.abroad ? c.cn || (!c.ab && c.line === 'trade' && c.id !== 't_fullparent') : c.ab) return false
    const r = c.entryReq
    if (!r) return true
    if (r.tag && !hasTag(s, r.tag)) return false
    if (r.maxTurn && s.turn > r.maxTurn) return false
    if (r.minTurn && s.turn < r.minTurn) return false
    if (r.cash && s.cash < r.cash) return false
    return true
  }).map((c) => c.id)
}

function cut(s: State, line: Line) {
  const { gone, wither } = cutPreview(s, line)
  if (!gone.length) return
  const cost = cutCost(s)
  const wasAbroad = s.abroad
  for (const g of gone) removeAndWither(s, g.uid)
  if (wasAbroad && line === 'city') { s.abroad = false; log(s, '回流。旧牌的面值按老规矩重新算。', 'era') }
  s.cash -= cost.cash; s.face -= cost.face; s.relDebt += cost.rel; s.opt += cost.opt
  s.stats.cuts++
  const lines = [
    `清空：${gone.map((g) => CARD[g.id].name).join('、')}`,
    `钱 −${cost.cash} · 体面 −${cost.face} · 关系债 +${cost.rel} · 可选性 +${cost.opt}`,
    '空白两年',
  ]
  if (wither.length) lines.splice(1, 0, `连根枯萎：${wither.map((k) => CARD[k.id].name).join('、')}`)
  s.flash = { title: `切牌：放弃整条「${LINE_NAME[line]}」`, lines, tone: 'cut' }
  log(s, `切牌：放弃整条「${LINE_NAME[line]}」脉络。${lines.join('；')}。`, 'good')
  clamp(s)
  if (closeTurn(s)) return
  openTurn(s, true)
  if (closeTurn(s)) return
  s.cutLine = line
  s.entries = entriesFor(s, line)
  if (s.entries.length) s.phase = 'cutpick'
  else { s.cutLine = null; openTurn(s, false) }
}

export function reducer(prev: State, a: Action): State {
  if (a.type === 'restart') return structuredClone(initial)
  const s: State = structuredClone(prev)
  s.flash = null
  switch (a.type) {
    case 'start': {
      const o = ORIGINS.find((x) => x.id === a.origin)!
      Object.assign(s, structuredClone(initial), { originId: o.id, hard: a.hard, cash: o.cash, face: o.face, opt: o.opt })
      for (const id of o.hand) add(s, id, null, 'dealt')
      if (a.hard) { add(s, 'b_olddebt', null, 'dealt'); s.cash -= 1 }
      log(s, `发牌：${o.name}${a.hard ? '（逆风）' : ''}。${o.taste}`, 'info')
      openTurn(s, false)
      break
    }
    case 'accept': if (s.phase === 'offer') accept(s); break
    case 'refuse':
      if (s.phase === 'offer' && s.offer) {
        const d = CARD[s.offer.id]
        s.face -= d.refFace; s.cool[d.id] = s.turn + 3; s.stats.refuses++
        if (s.kid && d.refBond) s.kid.bond += d.refBond
        if (s.gov && d.refTies) { s.gov.ties += d.refTies; log(s, `不合群：官场关系 ${sgn(d.refTies)}。`, 'gossip') }
        log(s, `没接「${d.name}」。${d.refFace ? `体面 −${d.refFace}。` : ''}${s.kid && d.refBond ? `亲密 ${sgn(d.refBond)}。` : ''}`, 'info')
        nextOffer(s); clamp(s)
      }
      break
    case 'discard': if (s.phase === 'action') discard(s, a.uid); break
    case 'cut': if (s.phase === 'action') cut(s, a.line); break
    case 'emigrate': if (s.phase === 'action') emigrate(s); break
    case 'entry':
      if (s.phase === 'cutpick') {
        if (a.id) {
          const d = CARD[a.id], late = actOf(s.turn) >= 3 && d.cash > 0
          add(s, a.id, null, 'entry', late); s.cash -= d.cost
          if (a.id === 't_fullparent') s.stats.fullparent = true
          log(s, `从头开始：「${d.name}」${late ? '（入行晚，产出 −1）' : ''}${d.cost ? `，钱 −${d.cost}` : ''}。`, 'info')
        } else log(s, '先空着。', 'info')
        s.cutLine = null; s.entries = []; s.landing = false
        openTurn(s, false)
      }
      break
    case 'endTurn': if (s.phase === 'action' && !closeTurn(s)) openTurn(s, false); break
  }
  return s
}

// ---------- 结算 ----------
export interface Ending { radar: { label: string; v: number }[]; title: string; blurb: string; tags: string[]; diagnosis: string; legacy: string | null }
const c10 = (n: number) => Math.max(0, Math.min(10, Math.round(n * 10) / 10))

export function computeEnding(s: State): Ending {
  const live = s.holdings.filter((h) => !h.withered)
  const tagN = (t: string) => live.filter((h) => CARD[h.id].tags.includes(t)).length
  const st = s.stats, age = ageOf(s.turn), kid = s.kid
  const bust = s.endCause === 'body' || s.endCause === 'cash'
  const survive = bust && age < 60 ? 0 : c10((age - 54) / 3 - 1.5 * Math.max(0, 2 - s.cash))
  const witheredSocial = s.holdings.filter((h) => h.withered && ['net', 'love'].includes(CARD[h.id].line)).length
  const relation = c10(5 - 1.2 * s.relDebt + (tagN('partner') ? 1.5 : 0) + (live.some((h) => CARD[h.id].line === 'net' && !CARD[h.id].bad) ? 1.5 : 0)
    + (kid ? (kid.bond - 3) * 0.5 : 0) - 0.5 * witheredSocial)
  const active = st.discards + 3 * st.cuts + 0.5 * st.refuses
  const passive = st.accepts + st.lifeChose
  const initiative = active + passive === 0 ? 0 : c10((14 * active) / (active + passive))
  const depr = s.aiOn ? c10(5 + 2 * tagN('aiup') + tagN('onsite') - 1.5 * tagN('standard') - 1.5 * tagN('fake')) : 5
  const radar = [
    { label: '善终', v: survive }, { label: '可选性', v: s.opt }, { label: '关系质量', v: relation },
    { label: '主动指数', v: initiative }, { label: '折旧管理', v: depr },
  ]
  if (kid) radar.push({ label: '下一代', v: c10((kid.edu + kid.bond + kid.self) / 2.4) })
  const goodKid = !!kid && ['有出息也有主意的孩子', '有手艺的孩子'].includes(kid.result)
  const all: [boolean, string, string][] = [
    [st.caught, '《落马》', '该拿的不该拿的都拿了。最后连本带利还了回去，还搭上了四年。'],
    [s.endCause === 'body', '《身体先弃了你》', '你一张牌都舍不得弃，于是身体替你弃了全部。'],
    [s.endCause === 'cash' && age >= 60, '《老无所依》', '活得比钱久。'],
    [s.endCause === 'cash', '《爆仓》', '现金流断了。牌还在手里，但已经不归你打。'],
    [s.hard && initiative >= 5 && s.opt >= 5, '《剩下的牌打出了胜负》', '起手很差。你没等到好牌，你只是把烂牌一张张处理掉了。'],
    [goodKid && kid!.bond >= 5, '《把牌传下去》', '你发给孩子的牌，比你拿到的多一条路。TA 还愿意回来看你。'],
    [!!kid && kid.edu >= 8 && kid.bond <= 2, '《鸡娃耗尽》', '分数是满的。电话是短的。'],
    [st.fullparent, '《把自己切给了孩子》', '你切掉了自己的行当。这张牌没有工资，也没有简历。'],
    [s.abroad && survive >= 4, '《换了一张牌桌》', '你清空了手牌，付了全价，在别人的规则里重新长出了一手牌。'],
    [st.emigrated && !s.abroad, '《回流》', '出去过，又回来了。两边的牌桌你都坐过，两边都不完全是你的。'],
    [st.topRank >= 3 && !!s.gov && s.gov.dirty === 0, '《两袖清风》', '位置坐到了，手是干净的。这条路最慢，也最难。'],
    [st.topRank >= 3 && !!s.gov && s.gov.dirty > 0, '《平安落地》', '有些事没人查，或者还没查到。你自己知道。'],
    [st.exposed, '《东窗事发》', '那张牌让你喘过气。被发现的那天，别的牌一起塌了。'],
    [st.cuts >= 2 && survive >= 5, '《切过牌的人》', '你不止一次放弃过整条路，付了全价，然后活下来了。'],
    [depr >= 8, '《重配成功》', 'AI 发牌机重写规则之后，你手里的牌是涨的。'],
    [st.discards >= 5 && s.opt >= 5, '《漂亮的止损》', '体面掉了一些。路还在。'],
    [!kid && !tagN('partner') && relation >= 5, '《一个人的牌局》', '没按模板来。朋友、爱好、自己的节奏，都在。'],
    [s.cash >= 30 && (relation <= 4 || age < 70), '《买到了好牌》', '钱堆出了资产。别的东西没跟上。'],
    [s.face >= 8 && s.opt <= 3, '《懂事耗尽》', '体面接近满分。你自己空了。'],
    [st.lifeChose >= 3, '《被生活替你选》', '可选性归零之后，递过来什么就是什么。'],
    [st.cuts === 0 && st.discards <= 3, '《顺流而下》', '每一张牌都是顺着上一张长出来的。你没选过，也几乎没拒绝过。'],
    [age >= 80, '《打到了最后一张》', '活得够久，把手里的牌一张张看着它们到期。'],
    [true, '《还在桌上》', '没赢，没爆。牌局散了。'],
  ]
  const hit = all.filter((x) => x[0])
  const worst = Math.max(st.structural, st.stuffed * 2 + st.accepts, st.notFolded)
  const diagnosis = worst === st.notFolded && st.notFolded > 0
    ? `自己不敢弃：吸血牌在你手里一共多待了 ${st.notFolded * 2} 牌·年。`
    : worst === st.structural
      ? `结构性剩下：年龄、保质期和闲话一共拿走了你 ${st.structural} 次，这部分不是你打错的。`
      : `他人塞牌：你顺势接了 ${st.accepts} 张，另有 ${st.stuffed} 张烂牌是源头直接发来的。`
  let legacy: string | null = null
  if (kid) {
    const house = tagN('house') > 0
    const dealt = s.abroad ? '另一张牌桌上的起手：没有老家的闲话，也没有老家的关系' : house && s.cash >= 15 ? '一线中产式的起手：有房、有钱、有期待' : tagN('onsite') || tagN('local') ? '县城奋斗式的起手：有手艺或关系，没多少余钱' : '小镇做题家式的起手：除了分数，别的要自己挣'
    legacy = `${kid.result || '还没长大的孩子'}（学业 ${kid.edu} · 亲密 ${Math.round(kid.bond)} · 自主 ${kid.self}）。你发给 TA 的是${dealt}。`
  }
  return { radar, title: hit[0][1], blurb: hit[0][2], tags: hit.slice(1, 4).map((x) => x[1]).filter((t) => t !== '《还在桌上》'), diagnosis, legacy }
}
