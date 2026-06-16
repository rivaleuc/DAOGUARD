import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster, toast } from 'sonner'
import { read, write, connectWallet, CONTRACT } from './genlayer'

const CREAM = '#FAFAF9'
const ORANGE = '#E85D04'

type NavKey = 'Check' | 'Charter' | 'History'

type ChainProposal = {
  key: string
  title: string
  author: string
  compliant: boolean
  confidence: string
  recommendation: string
  violations: string
  bodyPreview: string
}

type CheckResult = {
  score: number
  verdict: 'compliant' | 'violation'
  rules: { label: string; pass: boolean; note: string }[]
}

const STATUS_STYLE: Record<'compliant' | 'violation', { dot: string; text: string; label: string }> = {
  compliant: { dot: '#16A34A', text: '#15803D', label: 'Compliant' },
  violation: { dot: '#DC2626', text: '#B91C1C', label: 'Violation' },
}

function Icon({ name }: { name: NavKey | 'wallet' | 'shield' | 'spark' }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (name) {
    case 'Check': return <svg {...common}><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
    case 'Charter': return <svg {...common}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
    case 'History': return <svg {...common}><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /><path d="M12 7v5l4 2" /></svg>
    case 'wallet': return <svg {...common}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4z" /></svg>
    case 'shield': return <svg {...common}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
    case 'spark': return <svg {...common}><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" /></svg>
  }
}

const NAV: { key: NavKey }[] = [{ key: 'Check' }, { key: 'Charter' }, { key: 'History' }]

function StatCard({ label, value, delta, idx }: { label: string; value: string; delta: string; idx: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.06 }}
      className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.02)]"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">{label}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-stone-900">{value}</p>
      <p className="mt-1 text-xs font-medium text-stone-500">{delta}</p>
    </motion.div>
  )
}

function confScore(compliant: boolean, conf: string): number {
  if (compliant) return conf === 'high' ? 95 : conf === 'medium' ? 82 : 70
  return conf === 'high' ? 22 : conf === 'medium' ? 38 : 50
}

function App() {
  const [active, setActive] = useState<NavKey>('Check')
  const [wallet, setWallet] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<CheckResult | null>(null)
  const [chainStats, setChainStats] = useState<{ checked: number; approved: number; blocked: number } | null>(null)
  const [charter, setCharter] = useState<string>('')
  const [proposals, setProposals] = useState<ChainProposal[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [selected, setSelected] = useState<ChainProposal | null>(null)

  const loadProposals = useCallback(async () => {
    setLoadingList(true)
    try {
      const s: any = await read('stats')
      const count = Number(s.proposals_checked ?? 0)
      setChainStats({ checked: count, approved: Number(s.approved ?? 0), blocked: Number(s.blocked ?? 0) })
      const out: ChainProposal[] = []
      for (let i = count - 1; i >= 0 && out.length < 50; i--) {
        try {
          const p: any = await read('get_proposal', [String(i)])
          if (p && p.exists !== false) {
            out.push({
              key: String(i),
              title: String(p.title ?? `Proposal ${i}`),
              author: String(p.author ?? '—'),
              compliant: !!p.compliant,
              confidence: String(p.confidence ?? 'medium'),
              recommendation: String(p.recommendation ?? '—'),
              violations: String(p.violations ?? 'none'),
              bodyPreview: String(p.body_preview ?? ''),
            })
          }
        } catch { /* skip unreadable */ }
      }
      setProposals(out)
    } catch { /* contract not reachable */ } finally {
      setLoadingList(false)
    }
  }, [])

  useEffect(() => { loadProposals() }, [loadProposals])

  useEffect(() => {
    read('get_charter').then((c: any) => setCharter(String(c ?? ''))).catch(() => {})
  }, [])

  async function connect() {
    if (wallet) {
      setWallet(null)
      toast('Wallet disconnected')
      return
    }
    try {
      toast.loading('Connecting wallet…', { id: 'wc' })
      const addr = await connectWallet()
      setWallet(addr.slice(0, 6) + '…' + addr.slice(-4))
      toast.success('Wallet connected', { id: 'wc', description: addr })
    } catch (e: any) {
      toast.error('Connection failed', { id: 'wc', description: e?.message?.slice(0, 80) })
    }
  }

  async function runCheck() {
    if (!text.trim()) {
      toast.error('Paste proposal text to check')
      return
    }
    setRunning(true)
    setResult(null)
    toast.loading('Submitting to GenLayer validators…', { id: 'check' })
    try {
      const title = text.trim().split('\n')[0].slice(0, 80)
      const author = wallet ?? 'anon.eth'
      // REAL on-chain write — AI validators evaluate against the charter
      await write('check_proposal', [title, text.trim(), author])
      toast.loading('Reading verdict from chain…', { id: 'check' })
      const stats: any = await read('stats')
      const key = String(Number(stats.proposals_checked) - 1)
      const p: any = await read('get_proposal', [key])
      const compliant = !!p.compliant
      const conf = String(p.confidence || 'medium')
      const score = confScore(compliant, conf)
      const verdict: CheckResult['verdict'] = compliant ? 'compliant' : 'violation'
      const violations = String(p.violations || 'none')
      setResult({
        score,
        verdict,
        rules: [
          { label: 'Charter compliance', pass: compliant, note: compliant ? 'meets all articles' : violations },
          { label: 'Recommendation', pass: String(p.recommendation) === 'approve', note: String(p.recommendation || '—') },
          { label: 'Validator confidence', pass: conf !== 'low', note: `${conf} confidence` },
        ],
      })
      setRunning(false)
      toast[verdict === 'compliant' ? 'success' : 'error'](
        compliant ? 'Compliant — verified on-chain' : 'Non-compliant — blocked',
        { id: 'check', description: violations },
      )
      loadProposals()
    } catch (e: any) {
      setRunning(false)
      toast.error('Screening failed', { id: 'check', description: e?.message?.slice(0, 80) ?? 'chain error' })
    }
  }

  function openProposal(p: ChainProposal) {
    setSelected(p)
    setActive('History')
  }

  return (
    <div className="flex min-h-screen" style={{ background: CREAM, color: '#1C1917' }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      <Toaster position="bottom-right" richColors closeButton />

      {/* SIDEBAR */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-stone-200 bg-white/70 px-4 py-6 backdrop-blur md:flex">
        <div className="flex items-center gap-2.5 px-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl text-white" style={{ background: ORANGE }}>
            <Icon name="shield" />
          </div>
          <div>
            <p className="text-sm font-extrabold leading-none tracking-tight">DAOGUARD</p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-stone-400">Compliance</p>
          </div>
        </div>

        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map(({ key }) => {
            const on = active === key
            return (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${on ? 'text-white' : 'text-stone-600 hover:bg-stone-100'}`}
                style={on ? { background: ORANGE } : undefined}
              >
                <Icon name={key} />
                {key}
              </button>
            )
          })}
        </nav>

        <div className="mt-auto rounded-2xl border border-stone-200 bg-stone-50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">Charter contract</p>
          <p className="mt-1 break-all font-mono text-[11px] leading-relaxed text-stone-600">{CONTRACT}</p>
          <button
            onClick={() => { navigator.clipboard?.writeText(CONTRACT); toast.success('Contract copied') }}
            className="mt-2 w-full rounded-lg border border-stone-200 bg-white py-1.5 text-[11px] font-semibold text-stone-700 transition hover:border-stone-300"
          >
            Copy address
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* TOP BAR */}
        <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-stone-200 bg-[#FAFAF9]/85 px-6 py-4 backdrop-blur">
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              {active === 'Check' ? 'Proposal Compliance' : active === 'Charter' ? 'On-chain Charter' : 'Proposal History'}
            </h1>
            <p className="text-xs text-stone-500">Audit governance proposals against the on-chain charter</p>
          </div>
          <button
            onClick={connect}
            className={`ml-auto flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${wallet ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'text-white'}`}
            style={wallet ? undefined : { background: ORANGE }}
          >
            <span className={`h-2 w-2 rounded-full ${wallet ? 'bg-emerald-500' : 'bg-white/80'}`} />
            <Icon name="wallet" />
            {wallet ?? 'Connect wallet'}
          </button>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-7">
          {/* STATS ROW */}
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard idx={0} label="Proposals checked" value={chainStats ? String(chainStats.checked) : '…'} delta="live on-chain" />
            <StatCard idx={1} label="Approved" value={chainStats ? String(chainStats.approved) : '…'} delta="charter-compliant" />
            <StatCard idx={2} label="Blocked" value={chainStats ? String(chainStats.blocked) : '…'} delta="violations caught" />
            <StatCard idx={3} label="Charter length" value={charter ? `${charter.length}` : '…'} delta="chars ratified" />
          </section>

          {/* CHECK VIEW */}
          {active === 'Check' && (
            <>
              <section className="mt-6 grid gap-5 lg:grid-cols-5">
                <div className="lg:col-span-3 rounded-2xl border border-stone-200 bg-white p-5">
                  <div className="flex items-center gap-2">
                    <span style={{ color: ORANGE }}><Icon name="spark" /></span>
                    <h2 className="text-sm font-bold">Run compliance check</h2>
                  </div>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste a proposal description, calldata summary, or PIP body…"
                    className="mt-3 h-40 w-full resize-none rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-800 outline-none transition focus:border-stone-300 focus:bg-white"
                  />
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-stone-400">{text.trim().length} chars · audited against the on-chain charter</p>
                    <button
                      onClick={runCheck}
                      disabled={running}
                      className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60"
                      style={{ background: ORANGE }}
                    >
                      {running ? 'Auditing…' : 'Run check'}
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-2 rounded-2xl border border-stone-200 bg-white p-5">
                  <h2 className="text-sm font-bold">Result</h2>
                  <AnimatePresence mode="wait">
                    {result ? (
                      <motion.div key="res" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div className="mt-3 flex items-end gap-3">
                          <span className="text-5xl font-extrabold tracking-tighter" style={{ color: ORANGE }}>{result.score}</span>
                          <span className="mb-1 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide"
                            style={{ background: STATUS_STYLE[result.verdict].dot + '22', color: STATUS_STYLE[result.verdict].text }}>
                            {STATUS_STYLE[result.verdict].label}
                          </span>
                        </div>
                        <ul className="mt-4 space-y-2">
                          {result.rules.map((r) => (
                            <li key={r.label} className="flex items-center gap-2 text-sm">
                              <span className={`grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold text-white ${r.pass ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                {r.pass ? '✓' : '✕'}
                              </span>
                              <span className="font-medium text-stone-700">{r.label}</span>
                              <span className="ml-auto text-xs text-stone-400">{r.note}</span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    ) : (
                      <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="mt-6 text-center text-sm text-stone-400">
                        Run a check to see the charter audit breakdown.
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </section>

              {/* RECENT TABLE — real on-chain proposals */}
              <section className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white">
                <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3.5">
                  <h2 className="text-sm font-bold">Recent proposals</h2>
                  <button onClick={() => setActive('History')} className="text-xs font-semibold" style={{ color: ORANGE }}>View all →</button>
                </div>
                {proposals.length === 0 ? (
                  <p className="px-5 py-10 text-center text-sm text-stone-400">
                    {loadingList ? 'Loading proposals from chain…' : 'No proposals checked yet. Run the first compliance check above.'}
                  </p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wider text-stone-400">
                        <th className="px-5 py-2.5 font-semibold">#</th>
                        <th className="px-5 py-2.5 font-semibold">Title</th>
                        <th className="hidden px-5 py-2.5 font-semibold sm:table-cell">Author</th>
                        <th className="px-5 py-2.5 font-semibold">Score</th>
                        <th className="px-5 py-2.5 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proposals.slice(0, 5).map((p, i) => {
                        const st = p.compliant ? 'compliant' : 'violation'
                        return (
                          <motion.tr
                            key={p.key}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => openProposal(p)}
                            className="cursor-pointer border-t border-stone-100 transition hover:bg-stone-50"
                          >
                            <td className="px-5 py-3 font-mono text-xs font-semibold text-stone-500">#{p.key}</td>
                            <td className="px-5 py-3 font-medium text-stone-800">{p.title}</td>
                            <td className="hidden px-5 py-3 font-mono text-xs text-stone-500 sm:table-cell">{p.author.length > 18 ? p.author.slice(0, 8) + '…' + p.author.slice(-4) : p.author}</td>
                            <td className="px-5 py-3 font-bold" style={{ color: ORANGE }}>{confScore(p.compliant, p.confidence)}</td>
                            <td className="px-5 py-3">
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: STATUS_STYLE[st].text }}>
                                <span className="h-2 w-2 rounded-full" style={{ background: STATUS_STYLE[st].dot }} />
                                {STATUS_STYLE[st].label}
                              </span>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </section>
            </>
          )}

          {/* CHARTER VIEW */}
          {active === 'Charter' && (
            <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold">Ratified charter (read from contract)</h2>
                <button onClick={() => { read('get_charter').then((c: any) => { setCharter(String(c ?? '')); toast.success('Charter refreshed') }).catch(() => toast.error('Read failed')) }}
                  className="text-xs font-semibold" style={{ color: ORANGE }}>Refresh</button>
              </div>
              <pre className="mt-4 whitespace-pre-wrap break-words rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm leading-relaxed text-stone-700">
                {charter || 'Loading charter from chain…'}
              </pre>
            </section>
          )}

          {/* HISTORY VIEW */}
          {active === 'History' && (
            <section className="mt-6 grid gap-5 lg:grid-cols-5">
              <div className="lg:col-span-3 overflow-hidden rounded-2xl border border-stone-200 bg-white">
                <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3.5">
                  <h2 className="text-sm font-bold">All proposals ({proposals.length})</h2>
                  <button onClick={loadProposals} className="text-xs font-semibold" style={{ color: ORANGE }}>Refresh</button>
                </div>
                {proposals.length === 0 ? (
                  <p className="px-5 py-10 text-center text-sm text-stone-400">
                    {loadingList ? 'Loading proposals from chain…' : 'No proposals on-chain yet.'}
                  </p>
                ) : (
                  <ul className="divide-y divide-stone-100">
                    {proposals.map((p) => {
                      const st = p.compliant ? 'compliant' : 'violation'
                      const on = selected?.key === p.key
                      return (
                        <li key={p.key}>
                          <button onClick={() => setSelected(p)} className={`flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-stone-50 ${on ? 'bg-stone-50' : ''}`}>
                            <span className="font-mono text-xs font-semibold text-stone-500">#{p.key}</span>
                            <span className="min-w-0 flex-1 truncate font-medium text-stone-800">{p.title}</span>
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: STATUS_STYLE[st].text }}>
                              <span className="h-2 w-2 rounded-full" style={{ background: STATUS_STYLE[st].dot }} />
                              {STATUS_STYLE[st].label}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
              <div className="lg:col-span-2 rounded-2xl border border-stone-200 bg-white p-5">
                <h2 className="text-sm font-bold">Detail</h2>
                {selected ? (
                  <div className="mt-3 space-y-3 text-sm">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Title</p>
                      <p className="font-medium text-stone-800">{selected.title}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Author</p>
                      <p className="break-all font-mono text-xs text-stone-600">{selected.author}</p>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Recommendation</p>
                        <p className="font-semibold" style={{ color: selected.recommendation === 'approve' ? '#15803D' : '#B91C1C' }}>{selected.recommendation}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Confidence</p>
                        <p className="font-semibold text-stone-700">{selected.confidence}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Violations</p>
                      <p className="text-stone-700">{selected.violations}</p>
                    </div>
                    {selected.bodyPreview && (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Body preview</p>
                        <p className="text-stone-600">{selected.bodyPreview}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-6 text-center text-sm text-stone-400">Select a proposal to view its on-chain verdict.</p>
                )}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
