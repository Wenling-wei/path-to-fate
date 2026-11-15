import { CARD, ageOf, computeEnding, type Ending, type State } from './engine'

/** 跨局保存的记录（只存在这台设备的浏览器里） */
export interface Meta { ach: Record<string, number>; origins: string[]; endings: string[] }
const KEY = 'shengxia.meta.v1'
export const emptyMeta = (): Meta => ({ ach: {}, origins: [], endings: [] })
export function loadMeta(): Meta {
  try {
    const m = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (m && typeof m === 'object') return { ach: m.ach ?? {}, origins: m.origins ?? [], endings: m.endings ?? [] }
  } catch { /* 存不了就当没有 */ }
  return emptyMeta()
}
export function saveMeta(m: Meta) { try { localStorage.setItem(KEY, JSON.stringify(m)) } catch { /* 忽略 */ } }

export interface Ach {
  id: string; group: string; name: string; desc: string; hidden?: boolean
  /** e 只在终局时有值 */
  test: (s: State, e: Ending | null, m: Meta) => boolean
}

const took = (s: State, id: string) => s.stats.took.includes(id)
const holds = (s: State, id: string) => s.holdings.some((h) => h.id === id)
const ev = (s: State, k: string) => s.stats.ev[k] ?? 0
const age = (s: State) => ageOf(s.turn)
const titled = (e: Ending | null, t: string) => !!e && (e.title === t || e.tags.includes(t))

export const ACHS: Ach[] = [
  // 牌局
  { id: 'first', group: '牌局', name: '第一局', desc: '打完一局。', test: (_s, e) => !!e },
  { id: 'origins', group: '牌局', name: '三手起手牌', desc: '三种出身各打完一局。', test: (_s, e, m) => !!e && m.origins.length >= 3 },
  { id: 'end6', group: '牌局', name: '六种活法', desc: '累计拿到 6 种不同的结局。', test: (_s, e, m) => !!e && m.endings.length >= 6 },
  { id: 'end12', group: '牌局', name: '十二种活法', desc: '累计拿到 12 种不同的结局。', test: (_s, e, m) => !!e && m.endings.length >= 12 },
  { id: 'old90', group: '牌局', name: '打到最后一张', desc: '活到 90 岁。', test: (s) => age(s) >= 90 },
  { id: 'young', group: '牌局', name: '身体先弃了你', desc: '60 岁前因为身体出局。', test: (s, e) => !!e && s.endCause === 'body' },
  { id: 'hard', group: '牌局', name: '逆风局', desc: '逆风发牌，活过 70 岁。', test: (s) => s.hard && age(s) >= 70 },
  // 打法
  { id: 'flow', group: '打法', name: '顺流而下', desc: '一局没弃过牌也没切过牌，活过 60 岁。', test: (s, e) => !!e && s.stats.discards === 0 && s.stats.cuts === 0 && age(s) >= 60 },
  { id: 'no15', group: '打法', name: '不了，谢谢', desc: '一局里拒绝 15 张递来的牌。', test: (s) => s.stats.refuses >= 15 },
  { id: 'cut3', group: '打法', name: '切牌的人', desc: '一局里切牌 3 次。', test: (s) => s.stats.cuts >= 3 },
  { id: 'dis10', group: '打法', name: '断舍离', desc: '一局里主动弃牌 10 次。', test: (s) => s.stats.discards >= 10 },
  { id: 'auto3', group: '打法', name: '被生活替你选', desc: '可选性归零后，被自动接下 3 张牌。', test: (s) => s.stats.lifeChose >= 3 },
  { id: 'emi', group: '打法', name: '换一张牌桌', desc: '移民。', test: (s) => s.stats.emigrated },
  { id: 'back', group: '打法', name: '回流', desc: '移民之后又回来。', test: (s) => s.stats.emigrated && !s.abroad && s.phase !== 'cutpick' },
  // 行当
  { id: 'boss', group: '行当', name: '老板', desc: '把公司做到有规模。', test: (s) => took(s, 't_boss') },
  { id: 'exec', group: '行当', name: '高管', desc: '在大厂一路升到高管。', test: (s) => took(s, 't_exec') },
  { id: 'master', group: '行当', name: '老师傅', desc: '把一门手艺做成老师傅。', test: (s) => took(s, 't_master') },
  { id: 'doctor', group: '行当', name: '博士', desc: '读完博士。', test: (s) => holds(s, 'e_doctor') },
  { id: 'fullparent', group: '行当', name: '把自己切给了孩子', desc: '切掉行当，全职培养孩子。', test: (s) => s.stats.fullparent },
  { id: 'aiup', group: '行当', name: '重配成功', desc: 'AI 发牌机启动后，结局雷达的折旧管理达到 8。', test: (_s, e) => !!e && (e.radar.find((r) => r.label === '折旧管理')?.v ?? 0) >= 8 },
  // 官场
  { id: 'rank2', group: '官场', name: '科长', desc: '当上科长。', test: (s) => s.stats.topRank >= 3 },
  { id: 'rank4', group: '官场', name: '厅局级', desc: '升到厅局级。', test: (s) => s.stats.topRank >= 7 },
  { id: 'rank8', group: '官场', name: '副部级', desc: '升到副部级。', test: (s) => s.stats.topRank >= 8 },
  { id: 'buyrank', group: '官场', name: '跑官', desc: '资历不够，拿钱补上，换来一次升迁。', test: (s) => (s.stats.ev.buyRank ?? 0) > 0 },
  { id: 'clean', group: '官场', name: '两袖清风', desc: '当到处长以上，问题始终为 0，直到终局。', test: (_s, e) => titled(e, '《两袖清风》') },
  { id: 'landed', group: '官场', name: '平安落地', desc: '当到处长以上，有问题，但没被查到。', hidden: true, test: (_s, e) => titled(e, '《平安落地》') },
  { id: 'caught', group: '官场', name: '落马', desc: '被查。', test: (s) => s.stats.caught },
  { id: 'noenv', group: '官场', name: '不合群', desc: '一局里拒收信封和项目 4 次。', test: (s) => ev(s, 'ref:g_grab') + ev(s, 'ref:g_project') >= 4 },
  { id: 'storm', group: '官场', name: '顶风', desc: '反腐风暴或专项整治期间，带着问题过完一整幕。', hidden: true, test: (s) => ev(s, 'storm') > 0 },
  // 钱
  { id: 'cash100', group: '钱', name: '钱不是问题', desc: '存款到过 100。', test: (s) => s.stats.maxCash >= 100 },
  { id: 'trust', group: '钱', name: '钱不再是你的', desc: '设立家族信托。', test: (s) => took(s, 'a_trust') },
  { id: 'donate', group: '钱', name: '楼上有你的名字', desc: '捐一栋楼。', test: (s) => took(s, 'a_donate') },
  { id: 'deal', group: '钱', name: '只给自己人', desc: '参加一次熟人投资局。', test: (s) => took(s, 'a_deal') },
  { id: 'bust', group: '钱', name: '爆仓', desc: '现金流断掉。', test: (s, e) => !!e && s.endCause === 'cash' },
  { id: 'shore', group: '钱', name: '上岸', desc: '借了网贷，又连本带利还清。', test: (s) => ev(s, 'dis:b_shark') > 0 },
  // 灰色
  { id: 'gray1', group: '灰色', name: '就这一次', desc: '第一次接下一张灰色牌。', test: (s) => s.stats.gray >= 1 },
  { id: 'gray5', group: '灰色', name: '大家都这么做', desc: '一局里接下 5 张灰色牌。', test: (s) => s.stats.gray >= 5 },
  { id: 'wet', group: '灰色', name: '湿了鞋', desc: '灰色牌出事。', test: (s) => s.stats.busted >= 1 },
  { id: 'wet3', group: '灰色', name: '常在河边走', desc: '一局里出事 3 次。', hidden: true, test: (s) => s.stats.busted >= 3 },
  { id: 'dry', group: '灰色', name: '没湿鞋', desc: '一局里接过 4 张灰色牌，一次都没出事。', test: (s, e) => !!e && s.stats.gray >= 4 && s.stats.busted === 0 && !s.stats.caught },
  { id: 'white', group: '灰色', name: '清白', desc: '活过 70 岁，一张灰色牌都没接过，被递到面前至少 5 次。', test: (s) => age(s) >= 70 && s.stats.gray === 0 && !s.stats.caught && ev(s, 'refGray') >= 5 && (!s.gov || s.gov.dirty === 0) },
  { id: 'fakediv', group: '灰色', name: '假戏真做', desc: '假离婚离成了真的。', hidden: true, test: (s) => ev(s, 'fakedivFail') > 0 },
  { id: 'exposed', group: '灰色', name: '东窗事发', desc: '情人被发现。', hidden: true, test: (s) => s.stats.exposed },
  { id: 'secret', group: '灰色', name: '没人知道', desc: '带着一张情人牌走到终局。', hidden: true, test: (s, e) => !!e && holds(s, 'l_lover') },
  { id: 'inside', group: '灰色', name: '里面的两年', desc: '没当过官，也进去了。', hidden: true, test: (s) => ev(s, 'jailed') > 0 },
  // 家
  { id: 'kidtop', group: '家', name: '金榜题名', desc: '孩子考上名校。', test: (s) => holds(s, 'k_college_top') },
  { id: 'pass', group: '家', name: '把牌传下去', desc: '孩子有出息或有手艺，亲密不低于 5。', test: (_s, e) => titled(e, '《把牌传下去》') },
  { id: 'burn', group: '家', name: '鸡娃耗尽', desc: '孩子学业 8 以上，亲密 2 以下。', hidden: true, test: (_s, e) => titled(e, '《鸡娃耗尽》') },
  { id: 'grand', group: '家', name: '隔代', desc: '带上孙辈。', test: (s) => took(s, 'k_grandkid') },
  { id: 'silver', group: '家', name: '四十年', desc: '同一张婚姻牌拿满 40 年。', test: (s) => s.holdings.some((h) => CARD[h.id].tags.includes('marriage') && h.age >= 20) },
  { id: 'solo', group: '家', name: '一个人的牌局', desc: '没有伴侣也没有孩子，关系质量不低于 5。', test: (_s, e) => titled(e, '《一个人的牌局》') },
]
export const ACH: Record<string, Ach> = Object.fromEntries(ACHS.map((a) => [a.id, a]))
export const ACH_GROUPS = [...new Set(ACHS.map((a) => a.group))]

/** 根据当前局面算出新解锁的成就，并返回更新后的记录。没有变化时返回 null。 */
export function evaluate(s: State, meta: Meta): { meta: Meta; fresh: string[] } | null {
  if (s.phase === 'pick') return null
  const e = s.phase === 'end' ? computeEnding(s) : null
  let m = meta
  if (e) {
    const origins = m.origins.includes(s.originId) ? m.origins : [...m.origins, s.originId]
    const endings = m.endings.includes(e.title) ? m.endings : [...m.endings, e.title]
    if (origins !== m.origins || endings !== m.endings) m = { ...m, origins, endings }
  }
  const fresh = ACHS.filter((a) => !m.ach[a.id] && a.test(s, e, m)).map((a) => a.id)
  if (!fresh.length && m === meta) return null
  if (fresh.length) m = { ...m, ach: { ...m.ach, ...Object.fromEntries(fresh.map((id) => [id, Date.now()])) } }
  return { meta: m, fresh }
}
