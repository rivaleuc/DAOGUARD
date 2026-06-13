import { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster, toast } from 'sonner'
import { read, write, CONTRACT } from './genlayer'

const CREAM = '#FAFAF9'
const ORANGE = '#E85D04'

type NavKey = 'Check' | 'Charter' | 'History' | 'Settings'

type CheckResult = {
  score: number
  verdict: 'compliant' | 'flagged' | 'violation'
  rules: { label: string; pass: boolean; note: string }[]
}

type ProposalRow = {
  id: string
  title: string
  author: string
  score: number
  status: 'compliant' | 'flagged' | 'violation'
  when: string
}

const RECENT: ProposalRow[] = [
  { id: 'PIP-184', title: 'Treasury diversification into stETH', author: 'metagov.eth', score: 96, status: 'compliant', when: '2h ago' },
  { id: 'PIP-183', title: 'Increase quorum threshold to 12%', author: '0x9f…21a', score: 71, status: 'flagged', when: '5h ago' },
  { id: 'PIP-182', title: 'Grant multisig unilateral spend rights', author: 'core.eth', score: 38, status: 'violation', when: '1d ago' },
  { id: 'PIP-181', title: 'Quadratic funding round #7 budget', author: 'grants.eth', score: 91, status: 'compliant', when: '1d ago' },
  { id: 'PIP-180', title: 'Reduce timelock from 48h to 6h', author: '0x3c…8de', score: 54, status: 'flagged', when: '2d ago' },
]

const STATUS_STYLE: Record<ProposalRow['status'], { dot: string; text: string; label: string }> = {
  compliant: { dot: '#16A34A', text: '#15803D', label: 'Compliant' },
  flagged: { dot: '#D97706', text: '#B45309', label: 'Flagged' },
  violation: { dot: '#DC2626', text: '#B91C1C', label: 'Violation' },
}

function Icon({ name }: { name: NavKey | 'wallet' | 'shield' | 'search' | 'spark' }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (name) {
    case 'Check': return <svg {...common}><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
    case 'Charter': return <svg {...common}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
    case 'History': return <svg {...common}><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /><path d="M12 7v5l4 2" /></svg>
    case 'Settings': return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 14H4a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 6 8.6l-.39-.39a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 11 4.6V4a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 2.78 1.18l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 11H20a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
    case 'wallet': return <svg {...common}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4z" /></svg>
    case 'shield': return <svg {...common}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
    case 'search': return <svg {...common}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" /></svg>
    case 'spark': return <svg {...common}><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" /></svg>
  }
}

const NAV: { key: NavKey }[] = [{ key: 'Check' }, { key: 'Charter' }, { key: 'History' }, { key: 'Settings' }]

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

function App() {
  const [active, setActive] = useState<NavKey>('Check')
  const [wallet, setWallet] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<CheckResult | null>(null)
  const [chainStats, setChainStats] = useState<{ checked: number; approved: number; blocked: number } | null>(null)

  useEffect(() => {
    read('stats').then((s: any) => setChainStats({
      checked: Number(s.proposals_checked), approved: Number(s.approved), blocked: Number(s.blocked),
    })).catch(() => {})
  }, [result])

  const passRate = useMemo(() => {
    const p = RECENT.filter((r) => r.status === 'compliant').length
    return Math.round((p / RECENT.length) * 100)
  }, [])

  function connect() {
    if (wallet) {
      setWallet(null)
      toast('Wallet disconnected')
      return
    }
    const addr = '0x' + Math.random().toString(16).slice(2, 6) + '…' + Math.random().toString(16).slice(2, 6)
    setWallet(addr)
    toast.success('Wallet connected', { description: addr })
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
      // Read the latest proposal verdict back from the contract
      const stats: any = await read('stats')
      const key = String(Number(stats.proposals_checked) - 1)
      const p: any = await read('get_proposal', [key])
      const compliant = !!p.compliant
      const conf = String(p.confidence || 'medium')
      const score = compliant ? (conf === 'high' ? 95 : 82) : (conf === 'high' ? 22 : 45)
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
    } catch (e: any) {
      setRunning(false)
      toast.error('Screening failed', { id: 'check', description: e?.message?.slice(0, 80) ?? 'chain error' })
    }
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
                onClick={() => { setActive(key); if (key !== 'Check') toast(`${key} panel`, { description: 'Coming online soon' }) }}
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
            <h1 className="text-lg font-bold tracking-tight">Proposal Compliance</h1>
            <p className="text-xs text-stone-500">Audit governance proposals against the on-chain charter</p>
          </div>
          <div className="ml-auto hidden items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-stone-400 lg:flex">
            <Icon name="search" />
            <input
              placeholder="Search PIPs…"
              className="w-44 bg-transparent text-sm text-stone-700 outline-none placeholder:text-stone-400"
            />
          </div>
          <button
            onClick={connect}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${wallet ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'text-white'}`}
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
            <StatCard idx={3} label="Active charter rules" value="5" delta="v1 ratified" />
          </section>

          {/* CHECK TOOL + RESULT */}
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
                <p className="text-xs text-stone-400">{text.trim().length} chars · checked against 24 rules</p>
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

          {/* RECENT TABLE */}
          <section className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white">
            <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3.5">
              <h2 className="text-sm font-bold">Recent proposals</h2>
              <button onClick={() => toast('Opening full history')} className="text-xs font-semibold" style={{ color: ORANGE }}>View all →</button>
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-stone-400">
                  <th className="px-5 py-2.5 font-semibold">PIP</th>
                  <th className="px-5 py-2.5 font-semibold">Title</th>
                  <th className="hidden px-5 py-2.5 font-semibold sm:table-cell">Author</th>
                  <th className="px-5 py-2.5 font-semibold">Score</th>
                  <th className="px-5 py-2.5 font-semibold">Status</th>
                  <th className="hidden px-5 py-2.5 font-semibold md:table-cell">When</th>
                </tr>
              </thead>
              <tbody>
                {RECENT.map((r, i) => (
                  <motion.tr
                    key={r.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    onClick={() => toast(`${r.id}`, { description: r.title })}
                    className="cursor-pointer border-t border-stone-100 transition hover:bg-stone-50"
                  >
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-stone-500">{r.id}</td>
                    <td className="px-5 py-3 font-medium text-stone-800">{r.title}</td>
                    <td className="hidden px-5 py-3 font-mono text-xs text-stone-500 sm:table-cell">{r.author}</td>
                    <td className="px-5 py-3 font-bold" style={{ color: ORANGE }}>{r.score}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: STATUS_STYLE[r.status].text }}>
                        <span className="h-2 w-2 rounded-full" style={{ background: STATUS_STYLE[r.status].dot }} />
                        {STATUS_STYLE[r.status].label}
                      </span>
                    </td>
                    <td className="hidden px-5 py-3 text-xs text-stone-400 md:table-cell">{r.when}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </section>
        </main>
      </div>
    </div>
  )
}

export default App
