import { useEffect, useReducer, useState } from 'react'
import {
  BUST_BODY, CARD, GIFT_MAX, LATE_FEE, RANK_NAME, govShop, rankMul, SEASONED, caughtChance, govScore, rankOf, slotCap, EMI_COST, EMI_NEED, canEmigrate, emigrateGone, CUTTABLE, ERA, LINES, LINE_NAME, ORIGINS, STAGE_NAME,
  actOf, activeEras, ageOf, capE, computeEnding, cutCost, cutPreview, deviation, discardPreview,
  growsFrom, hasTag, hstat, income, initial, isGray, load, netValue, reducer, riskP, slotCount,
  type Action, type CardDef, type Inst, type Line, type State,
} from './game/engine'
import { ACH, ACHS, ACH_GROUPS, evaluate, loadMeta, saveMeta, type Meta } from './game/achievements'

const sgn = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0')

export default function App() {
  const [s, dispatch] = useReducer(reducer, initial)
  const [meta, setMeta] = useState<Meta>(loadMeta)
  const [run, setRun] = useState<string[]>([])
  const [toast, setToast] = useState<string[]>([])
  const [book, setBook] = useState(false)
  useEffect(() => {
    if (s.phase === 'pick') { if (run.length) setRun([]); return }
    const r = evaluate(s, meta)
    if (!r) return
    setMeta(r.meta); saveMeta(r.meta)
    if (r.fresh.length) {
      setRun((p) => [...p, ...r.fresh.filter((id) => !p.includes(id))])
      setToast((p) => [...p, ...r.fresh.filter((id) => !p.includes(id))])
    }
  }, [s, meta, run.length])
  useEffect(() => {
    if (!toast.length) return
    const t = setTimeout(() => setToast((p) => p.slice(1)), 2200)
    return () => clearTimeout(t)
  }, [toast])
  const openBook = () => setBook(true)
  const done = ACHS.filter((a) => meta.ach[a.id]).length
  return (
    <>
      {s.phase === 'pick' ? <Pick dispatch={dispatch} done={done} openBook={openBook} />
        : s.phase === 'end' ? <End s={s} dispatch={dispatch} run={run} openBook={openBook} />
          : <Table s={s} dispatch={dispatch} done={done} openBook={openBook} />}
      {book && <Book meta={meta} onClose={() => setBook(false)} onReset={() => { const m = { ach: {}, origins: [], endings: [] }; setMeta(m); saveMeta(m) }} />}
      {toast.length > 0 && (
        <div className="toast" key={toast[0]} role="status">
          <i>成就</i><b>{ACH[toast[0]].name}</b><span>{ACH[toast[0]].desc}</span>
        </div>
      )}
    </>
  )
}

function Book({ meta, onClose, onReset }: { meta: Meta; onClose: () => void; onReset: () => void }) {
  const [ask, setAsk] = useState(false)
  const done = ACHS.filter((a) => meta.ach[a.id]).length
  return (
    <div className="book-wrap" onClick={onClose}>
      <div className="book" onClick={(ev) => ev.stopPropagation()}>
        <div className="book-head">
          <h2>成就 <small>{done}/{ACHS.length}</small></h2>
          <button className="btn" onClick={onClose}>关闭</button>
        </div>
        <p className="book-note">已打完的出身 {meta.origins.length}/3 · 拿到过的结局 {meta.endings.length} 种{meta.endings.length ? `：${meta.endings.join(' ')}` : ''}</p>
        {ACH_GROUPS.map((g) => (
          <div key={g} className="book-group">
            <h3>{g}</h3>
            <div className="book-list">
              {ACHS.filter((a) => a.group === g).map((a) => {
                const got = !!meta.ach[a.id]
                const secret = a.hidden && !got
                return (
                  <div key={a.id} className={got ? 'ach got' : 'ach'}>
                    <b>{secret ? '？？？' : a.name}</b>
                    <span>{secret ? '隐藏成就，做到了才知道。' : a.desc}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        <p className="book-note">记录只保存在这台设备的这个浏览器里，换设备或清除浏览器数据后会丢失。</p>
        {ask
          ? <p className="book-note">确定清空全部成就记录？<button className="btn danger" onClick={() => { onReset(); setAsk(false) }}>清空</button> <button className="btn" onClick={() => setAsk(false)}>不了</button></p>
          : <button className="btn" onClick={() => setAsk(true)}>清空记录</button>}
      </div>
    </div>
  )
}

function Pick({ dispatch, done, openBook }: { dispatch: (a: Action) => void; done: number; openBook: () => void }) {
  const [hard, setHard] = useState(false)
  return (
    <div className="pick">
      <h1>剩下的牌</h1>
      <p className="lead">
        从 18 岁打到人生的尽头。牌不是抽来的，是从手里的牌长出来的。你能主动做的只有两件事：<b>弃牌</b>，和不计代价的<b>切牌</b>。
      </p>
      <div className="origins">
        {ORIGINS.map((o) => (
          <button key={o.id} className="origin" onClick={() => dispatch({ type: 'start', origin: o.id, hard })}>
            <h2>{o.name}</h2>
            <p className="taste">{o.taste}</p>
            <p className="nums">钱 {o.cash} · 体面 {o.face} · 可选性 {o.opt}</p>
            <p className="hand">起手：{o.hand.map((id) => CARD[id].name).join('、')}</p>
            <p><span className="k">活路</span>{o.win}</p>
            <p><span className="k">翻车</span>{o.bust}</p>
          </button>
        ))}
      </div>
      <label className="hard">
        <input type="checkbox" checked={hard} onChange={(e) => setHard(e.target.checked)} />
        逆风发牌：多带一张「家里的旧债」，钱 −1
      </label>
      <button className="btn ach-btn" onClick={openBook}>成就 {done}/{ACHS.length}</button>
    </div>
  )
}

function StatLine({ d, k }: { d: CardDef | ReturnType<typeof hstat>; k?: CardDef }) {
  const parts: string[] = []
  if (d.cash) parts.push(`钱 ${sgn(d.cash)}/年`)
  if (d.upC) parts.push(`花钱 ${d.upC}/年`)
  if (d.upE) parts.push(`负荷 ${sgn(d.upE)}`)
  if (d.fd) parts.push(`体面 ${sgn(d.fd)}/幕`)
  if (d.od) parts.push(`可选性 ${sgn(d.od)}/幕`)
  if (k?.vol) parts.push(`钱 −${k.vol}～+${k.vol + 1}/年`)
  if (k?.kEdu) parts.push(`孩子学业 ${sgn(k.kEdu)}`)
  if (k?.kBond) parts.push(`孩子亲密 ${sgn(k.kBond)}`)
  if (k?.kSelf) parts.push(`孩子自主 ${sgn(k.kSelf)}`)
  if (k?.gMerit) parts.push(`政绩 ${sgn(k.gMerit)}`)
  if (k?.gTies) parts.push(`官场关系 ${sgn(k.gTies)}`)
  if (k && !k.instant) parts.push(`占 ${k.slot} 槽`)
  return <div className="stats">{parts.join(' · ')}</div>
}

function HoldingCard({ s, h, dispatch }: { s: State; h: Inst; dispatch: (a: Action) => void }) {
  const d = CARD[h.id]
  const st = hstat(s, h)
  const parent = s.holdings.find((x) => x.uid === h.parent)
  const g = growsFrom(h.id, s.turn, s.abroad)
  const bleeding = !d.locked && netValue(s, h) < -1
  const left = d.life ? d.life - h.age : 0
  const cls = ['card', d.bad ? 'bad' : '', h.withered ? 'withered' : '', d.locked ? 'locked' : ''].join(' ')
  return (
    <div className={cls}>
      <div className="card-head">
        <span className="name">{d.name}</span>
        {h.withered && <span className="badge dim">已枯</span>}
        {h.late && <span className="badge dim">入行晚</span>}
        {bleeding && <span className="badge red">吸血</span>}
        {st.seasoned && <span className="badge green">驾轻就熟 负荷−1</span>}
        {!st.seasoned && !d.bad && !h.withered && st.upE > 0 && <span className="badge dim">再拿 {(SEASONED - h.age) * 2} 年变熟</span>}
        {left > 0 && <span className="badge amber">还剩 {left} 年</span>}
        {d.locked && <span className="badge dim">弃不掉</span>}
        {isGray(d) && <span className="badge gray">灰色</span>}
      </div>
      <StatLine d={st} k={d} />
      {d.risk?.ev === 'bust' && !h.withered && <div className="grows closed">每回合 {Math.round(riskP(s, d) * 100)}% 出事</div>}
      {st.eraNote.length > 0 && <div className="era-note">受【{st.eraNote.join('、')}】影响</div>}
      {parent && <div className="from">长自「{CARD[parent.id].name}」</div>}
      {!h.withered && g.open.length > 0 && <div className="grows">会长出：{g.open.map((c) => c.name).join('、')}</div>}
      {!h.withered && g.closed > 0 && <div className="grows closed">{g.closed} 张牌的窗口已关</div>}
      {d.emits && !h.withered && <div className="grows closed">每 {d.emits.every} 年发一张「{CARD[d.emits.id].name}」</div>}
      <div className="flavor">{d.flavor}</div>
      {!d.locked && s.phase === 'action' && (
        <button className="btn discard" onClick={() => dispatch({ type: 'discard', uid: h.uid })}>
          {d.bad ? '处理掉' : '弃牌'}<small>{discardPreview(s, h)}</small>
        </button>
      )}
    </div>
  )
}

function acceptText(s: State, d: CardDef): string {
  const k = d.iRank ? rankMul(s) : 1
  const bits = [d.cost ? `钱 −${d.cost}` : '', d.iCash ? `钱 +${d.iCash * k}` : '', d.iKid ? `孩子学业 +${d.iKid}` : '', d.iRel ? `关系债 +${d.iRel}` : '', d.iAdd ? `多一张「${CARD[d.iAdd].name}」` : '', d.iTies ? `官场关系 ${sgn(d.iTies)}` : '', d.iMerit ? `政绩 ${sgn(d.iMerit)}` : '', s.gov && d.iDirty ? `问题 ${sgn(d.iDirty)}` : '']
  return bits.filter(Boolean).join(' · ') || '无代价'
}

function Offer({ s, dispatch }: { s: State; dispatch: (a: Action) => void }) {
  if (!s.offer) return null
  const d = CARD[s.offer.id]
  const parent = s.holdings.find((h) => h.uid === s.offer!.parentUid)
  const g = growsFrom(d.id, s.turn, s.abroad)
  return (
    <div className="offer">
      <div className="offer-label">顺势牌 · 这条路递过来的{s.queue.length ? `（后面还有 ${s.queue.length} 张）` : ''}</div>
      <div className="offer-body">
        <div className="card offered">
          <div className="card-head"><span className="name">{d.name}</span><span className="badge dim">{LINE_NAME[d.line]}</span>{isGray(d) && <span className="badge gray">灰色</span>}</div>
          <StatLine d={d} k={d} />
          {parent && <div className="from">{d.upgrade ? `「${CARD[parent.id].name}」会变成它` : `长自「${CARD[parent.id].name}」`}</div>}
          {g.open.length > 0 && <div className="grows">接了以后会长出：{g.open.map((c) => c.name).join('、')}</div>}
          {d.locked && <div className="grows closed">接了就弃不掉</div>}
          {d.instant && <div className="grows closed">一次性的事，不占卡槽</div>}
          {d.risk?.ev === 'bust' && <div className="grows closed">每回合 {Math.round(riskP(s, d) * 100)}% 出事{d.risk.fine ? `：罚 ${d.risk.fine}` : ''}{d.risk.face ? ` · 体面 −${d.risk.face}` : ''}{d.risk.killParent ? ' · 连它长自的那张牌一起没' : ''}{d.risk.jail ? ' · 进去两年' : ''}</div>}
          {d.needGov > 0 && <div className="grows closed">资历够了（需要 {d.needGov}，你有 {govScore(s)}）</div>}
          <div className="flavor">{d.flavor}</div>
        </div>
        <div className="offer-btns">
          <button className="btn primary" onClick={() => dispatch({ type: 'accept' })}>
            接<small>{acceptText(s, d)}{s.kid && d.accBond ? ` · 亲密 ${sgn(d.accBond)}` : ''}{!d.instant && !d.upgrade && slotCount(s) + d.slot > slotCap(s) ? ' · 超仓，负荷上升' : ''}</small>
          </button>
          <button className="btn" onClick={() => dispatch({ type: 'refuse' })}>
            不接<small>{[d.refFace ? `体面 −${d.refFace}` : '', s.gov && d.refTies ? `官场关系 ${sgn(d.refTies)}` : ''].filter(Boolean).join(' · ') || '无代价'}{s.kid && d.refBond ? ` · 亲密 ${sgn(d.refBond)}` : ''}</small>
          </button>
        </div>
      </div>
    </div>
  )
}

function CutPick({ s, dispatch }: { s: State; dispatch: (a: Action) => void }) {
  const late = actOf(s.turn) >= 3
  return (
    <div className="offer">
      <div className="offer-label">{s.landing ? `落地之后 · 在另一张牌桌上从哪里开始` : `切牌之后 · 「${LINE_NAME[s.cutLine!]}」从哪里重新开始`}{late ? '（年纪不小了，入行晚：产出 −1）' : ''}</div>
      <div className="offer-body wrap">
        {s.entries.map((id) => {
          const d = CARD[id]
          return (
            <button key={id} className="card offered pickable" onClick={() => dispatch({ type: 'entry', id })}>
              <div className="card-head"><span className="name">{d.name}</span></div>
              <StatLine d={d} k={d} />
              {d.cost > 0 && <div className="from">钱 −{d.cost}</div>}
              <div className="flavor">{d.flavor}</div>
            </button>
          )
        })}
        <button className="btn" onClick={() => dispatch({ type: 'entry', id: null })}>先空着</button>
      </div>
    </div>
  )
}

function Table({ s, dispatch, done, openBook }: { s: State; dispatch: (a: Action) => void; done: number; openBook: () => void }) {
  const [cutAsk, setCutAsk] = useState<Line | null>(null)
  const [emiAsk, setEmiAsk] = useState(false)
  const [shopOpen, setShopOpen] = useState(false)
  const shop = s.phase === 'action' ? govShop(s) : []
  const act = actOf(s.turn)
  const l = load(s), inc = income(s), dev = deviation(s), cap = capE(s)
  const minor = hasTag(s, 'minor')
  const eras = activeEras(s)
  const cost = cutCost(s)
  const doCut = (line: Line) => { setCutAsk(null); dispatch({ type: 'cut', line }) }
  return (
    <div className="table">
      <header>
        <div className="title">
          <h1>剩下的牌</h1>
          <span>{ageOf(s.turn)} 岁 · 第 {act} 幕「{STAGE_NAME[act]}」{s.retired ? ' · 已退休' : ''}</span>
          <button className="btn ach-btn" onClick={openBook}>成就 {done}/{ACHS.length}</button>
        </div>
        <div className="res">
          <div className={l > cap ? 'r warn' : 'r'}><b>{l}/{cap}</b>负荷</div>
          <div className={s.cash < 0 ? 'r warn' : 'r'}><b>{s.cash}</b>钱<i>{sgn(inc)}/年</i></div>
          <div className={s.face <= 3 ? 'r warn' : 'r'}><b>{s.face}</b>体面</div>
          <div className={s.opt <= 2 ? 'r warn' : 'r'}><b>{s.opt}</b>可选性</div>
          <div className={s.bodyDebt >= 5 ? 'r warn' : 'r'}><b>{s.bodyDebt}</b>身体债<i>{BUST_BODY} 爆仓</i></div>
          <div className="r"><b>{s.relDebt}</b>关系债</div>
          <div className={slotCount(s) > slotCap(s) ? 'r warn' : 'r'}><b>{slotCount(s)}/{slotCap(s)}</b>仓位</div>
          <div className="r"><b>{dev}</b>偏离模板</div>
          {s.gov && (rankOf(s) > 0 || s.gov.dirty > 0) && (
            <div className={s.gov.dirty > 0 ? 'r gov warn' : 'r gov'}>
              <b>{govScore(s)}·{s.gov.dirty}</b>{rankOf(s) ? RANK_NAME[rankOf(s)] : hasTag(s, 'stable') ? '体制内' : '已离开官场'}
              <i>资历·问题{s.gov.dirty > 0 ? ` 落马 ${Math.round(caughtChance(s) * 100)}%/回合` : ''}</i>
            </div>
          )}
          {s.kid && <div className="r kid"><b>{s.kid.edu}·{Math.round(s.kid.bond)}·{s.kid.self}</b>孩子<i>学业·亲密·自主</i></div>}
        </div>
      </header>

      <div className="main">
        <section className="board">
          <div className="eras">
            {eras.map((e) => (
              <div key={e.id} className={e.id === 'era_ai' ? 'era ai' : e.id === 'era_abroad' ? 'era abroad' : 'era'}>
                <b>{e.id === 'era_abroad' ? '所在牌桌' : '时代牌'} · {e.name}</b><span>{e.text}</span><em>{e.rule}</em>
              </div>
            ))}
          </div>

          {s.flash && (
            <div className={`flash ${s.flash.tone}`} key={s.log.length}>
              <b>{s.flash.title}</b>
              {s.flash.lines.map((x, i) => <span key={i}>{x}</span>)}
            </div>
          )}

          {s.phase === 'offer' && <Offer s={s} dispatch={dispatch} />}
          {s.phase === 'cutpick' && <CutPick s={s} dispatch={dispatch} />}

          <div className="lines">
            {LINES.map((line) => {
              const cards = s.holdings.filter((h) => CARD[h.id].line === line)
              const canCut = CUTTABLE.includes(line) && s.phase === 'action' && cards.some((h) => !CARD[h.id].locked)
              const pv = cutAsk === line ? cutPreview(s, line) : null
              return (
                <div key={line} className="line">
                  <div className="line-head">
                    <h3>{LINE_NAME[line]}</h3>
                    {canCut && cutAsk !== line && <button className="btn cut" onClick={() => setCutAsk(line)}>切牌</button>}
                    {!CUTTABLE.includes(line) && <span className="nocut">切不掉</span>}
                  </div>
                  {pv && (
                    <div className="cut-confirm">
                      <p>放弃整条「{LINE_NAME[line]}」：{pv.gone.map((g) => CARD[g.id].name).join('、')}</p>
                      {pv.wither.length > 0 && <p>连根枯萎：{pv.wither.map((g) => CARD[g.id].name).join('、')}</p>}
                      <p>代价固定，不打折：钱 −{cost.cash} · 体面 −{cost.face} · 关系债 +{cost.rel} · 空白两年。换来可选性 +{cost.opt}，然后从最底层重来。</p>
                      <button className="btn danger" onClick={() => doCut(line)}>切</button>
                      <button className="btn" onClick={() => setCutAsk(null)}>再想想</button>
                    </div>
                  )}
                  {cards.length === 0 && <div className="empty">空</div>}
                  {cards.map((h) => <HoldingCard key={h.uid} s={s} h={h} dispatch={dispatch} />)}
                </div>
              )
            })}
          </div>

          {s.phase === 'action' && emiAsk && (
            <div className="cut-confirm emi">
              <p><b>移民：换一张牌桌</b></p>
              <p>清空手牌：{emigrateGone(s).map((g) => CARD[g.id].name).join('、') || '无'}</p>
              <p>跟着你走的：{s.holdings.filter((h) => !emigrateGone(s).includes(h)).map((h) => CARD[h.id].name).join('、')}</p>
              <p>代价：钱 −{EMI_COST} · 关系债 +2 · 空白两年。换来可选性 +4。之后牌面按「另一张牌桌」算：标准答案型体面 −1，现场型产出 +1，养孩子更贵，海外的活工资高也更累，闲话够不着你。国内才有的牌（编制、相亲、学区房、补习班……）不会再递过来。</p>
              <div><button className="btn danger" onClick={() => { setEmiAsk(false); dispatch({ type: 'emigrate' }) }}>走</button> <button className="btn" onClick={() => setEmiAsk(false)}>再想想</button></div>
            </div>
          )}
          {shopOpen && shop.length > 0 && (
            <div className="cut-confirm shop">
              <p><b>走动：花钱直接换官场的牌</b>（这两年还能换 {Math.max(0, GIFT_MAX - s.bought)} 次 · 你有钱 {s.cash}）</p>
              <p>升迁的资历不够，可以拿钱补：每差 1 点多付 3。走动会留下痕迹，问题越多，落马的概率越高。</p>
              <div className="shop-list">
                {shop.map((it) => {
                  const d = it.def
                  const fx = [d.rank ? `升到${RANK_NAME[d.rank]}` : '', d.iTies ? `官场关系 ${sgn(d.iTies)}` : '', d.iMerit ? `政绩 ${sgn(d.iMerit)}` : '', d.gMerit ? `政绩 ${sgn(d.gMerit)}/回合` : '', d.gTies ? `官场关系 ${sgn(d.gTies)}/回合` : '', d.upE ? `负荷 ${sgn(d.upE)}` : '', d.upC ? `花钱 ${d.upC}/年` : '', d.life ? `持续 ${d.life * 2} 年` : '', d.instant && d.iDirty < 0 ? `问题 ${sgn(d.iDirty)}` : '', d.tags.includes('glove') ? '落马概率减半' : ''].filter(Boolean)
                  const dirty = d.instant ? Math.max(0, d.iDirty) : d.pDirty
                  const no = s.bought >= GIFT_MAX ? '这两年走动够多了' : s.cash < it.price ? '钱不够' : ''
                  return (
                    <button key={d.id} className="card offered pickable" disabled={!!no} onClick={() => dispatch({ type: 'buy', id: d.id })}>
                      <div className="card-head"><span className="name">{d.name}</span><span className="badge amber">钱 −{it.price}</span>{dirty > 0 && <span className="badge red">问题 +{dirty}</span>}</div>
                      <div className="stats">{fx.join(' · ')}</div>
                      {it.short > 0 && <div className="grows closed">资历差 {it.short}（需要 {d.needGov}，你有 {govScore(s)}），多付 {it.short * 3}</div>}
                      {it.late && <div className="grows closed">已过年龄线，破格提拔，多付 {LATE_FEE}</div>}
                      {d.risk && <div className="grows closed">每回合 {Math.round(riskP(s, d) * 100)}% 出事</div>}
                      <div className="flavor">{d.flavor}</div>
                      {no && <div className="from">{no}</div>}
                    </button>
                  )
                })}
              </div>
              <div><button className="btn" onClick={() => setShopOpen(false)}>收起</button></div>
            </div>
          )}
          {s.phase === 'action' && (
            <div className="actions">
              <span>你能做的只有：弃牌、切牌，或者什么都不做。{shop.length > 0 ? '在官场里，还可以花钱走动。' : ''}{minor ? '想转去全职培养孩子：切掉「行当」，重新开始时选它。' : ''}</span>
              {shop.length > 0 && <button className="btn cut" onClick={() => setShopOpen(!shopOpen)}>走动{shopOpen ? '（收起）' : ''}</button>}
              {!s.abroad && s.turn <= 21 && (
                <button className="btn cut" disabled={!canEmigrate(s)} onClick={() => setEmiAsk(true)}>
                  移民{canEmigrate(s) ? '' : `（需要钱 ≥ ${EMI_NEED}）`}
                </button>
              )}
              <button className="btn primary" onClick={() => { setCutAsk(null); setEmiAsk(false); dispatch({ type: 'endTurn' }) }}>
                过完这两年 →
              </button>
            </div>
          )}
        </section>

        <aside className="log">
          <h3>牌局记录</h3>
          {[...s.log].reverse().map((x, i) => (
            <p key={s.log.length - i} className={`l-${x.kind}`}><i>{ageOf(x.turn)}岁</i>{x.text}</p>
          ))}
        </aside>
      </div>
    </div>
  )
}

function Radar({ data }: { data: { label: string; v: number }[] }) {
  const R = 100, C = 150, n = data.length
  const pt = (i: number, r: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n
    return [C + r * Math.cos(a), C + r * Math.sin(a)]
  }
  const poly = (r: (i: number) => number) => data.map((_, i) => pt(i, r(i)).join(',')).join(' ')
  return (
    <svg viewBox="0 0 300 300" className="radar">
      {[0.25, 0.5, 0.75, 1].map((k) => <polygon key={k} points={poly(() => R * k)} className="grid" />)}
      {data.map((_, i) => { const [x, y] = pt(i, R); return <line key={i} x1={C} y1={C} x2={x} y2={y} className="grid" /> })}
      <polygon points={poly((i) => (R * data[i].v) / 10)} className="shape" />
      {data.map((d, i) => { const [x, y] = pt(i, R + 26); return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle">{d.label} {d.v}</text> })}
    </svg>
  )
}

function End({ s, dispatch, run, openBook }: { s: State; dispatch: (a: Action) => void; run: string[]; openBook: () => void }) {
  const e = computeEnding(s)
  const st = s.stats
  const o = ORIGINS.find((x) => x.id === s.originId)!
  return (
    <div className="end">
      <p className="sub">{o.name}{s.hard ? '（逆风）' : ''} · 享年 {ageOf(s.turn)} 岁 · 最后的时代：{s.eraId ? ERA[s.eraId].name : ''}</p>
      <h1>{e.title}</h1>
      <p className="blurb">{e.blurb}</p>
      {e.tags.length > 0 && <p className="tags">也可以叫：{e.tags.join(' ')}</p>}
      <div className="end-body">
        <Radar data={e.radar} />
        <div className="recap">
          <h3>回放</h3>
          <p className="diag">{e.diagnosis}</p>
          <ul>
            <li>顺势接下 {st.accepts} 张，拒绝 {st.refuses} 张{st.lifeChose ? `，其中 ${st.lifeChose} 张是生活替你接的` : ''}</li>
            <li>主动弃牌 {st.discards} 次，切牌 {st.cuts} 次</li>
            <li>因弃牌和切牌连根枯掉 {st.withered} 张</li>
            <li>源头发来烂牌 {st.stuffed} 张</li>
            {st.gray > 0 && <li>接下灰色牌 {st.gray} 张，出事 {st.busted} 次</li>}
            <li>钱 {s.cash} · 体面 {s.face} · 可选性 {s.opt} · 身体债 {s.bodyDebt} · 关系债 {s.relDebt}</li>
          </ul>
          {e.legacy && <><h3>下一代</h3><p>{e.legacy}</p></>}
          <h3>最后手里的牌</h3>
          <p className="final">{s.holdings.map((h) => CARD[h.id].name + (h.withered ? '（枯）' : '')).join('、') || '空'}</p>
          <h3>这一局解锁的成就</h3>
          {run.length === 0 ? <p className="final">没有新的。</p> : (
            <div className="book-list">
              {run.map((id) => <div key={id} className="ach got"><b>{ACH[id].name}</b><span>{ACH[id].desc}</span></div>)}
            </div>
          )}
          <button className="btn primary" onClick={() => dispatch({ type: 'restart' })}>重新发牌</button>
          <button className="btn" onClick={openBook}>全部成就</button>
        </div>
      </div>
    </div>
  )
}
