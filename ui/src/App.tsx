import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster, toast } from 'sonner'
import {
  ShieldCheck,
  Scale,
  Landmark,
  ScrollText,
  Sparkles,
  ArrowRight,
  Check,
  X,
  Loader2,
  Wallet,
  Gavel,
  FileCheck2,
  Network,
  Lock,
  Activity,
  ExternalLink,
} from 'lucide-react'
import { read, write, connectWallet, isWalletConnected, CONTRACT } from './genlayer'
import { Button, Card, Badge } from './components/ui'

const EXPLORER = `https://explorer-bradbury.genlayer.com/contract/${CONTRACT}`
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`

type Verdict = {
  exists?: boolean
  author?: string
  title?: string
  body_preview?: string
  compliant?: boolean
  violations?: string
  recommendation?: string
  confidence?: string
}

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
}
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }

export default function App() {
  const [wallet, setWallet] = useState<string | null>(null)
  const [stats, setStats] = useState({ proposals_checked: 0, approved: 0, blocked: 0 })
  const [charter, setCharter] = useState('')
  const [recent, setRecent] = useState<(Verdict & { key: string })[]>([])

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<Verdict | null>(null)

  // spotlight that follows the cursor in the hero
  const heroRef = useRef<HTMLDivElement>(null)
  function onHeroMove(e: React.MouseEvent) {
    const el = heroRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
  }

  async function loadAll() {
    try {
      const s = (await read('stats')) as any
      setStats({
        proposals_checked: Number(s?.proposals_checked ?? 0),
        approved: Number(s?.approved ?? 0),
        blocked: Number(s?.blocked ?? 0),
      })
      const total = Number(s?.proposals_checked ?? 0)
      const out: (Verdict & { key: string })[] = []
      for (let i = total - 1; i >= 0 && i >= total - 6; i--) {
        try {
          const p = (await read('get_proposal', [String(i)])) as any
          if (p?.exists !== false) out.push({ ...p, key: String(i) })
        } catch {
          /* skip */
        }
      }
      setRecent(out)
    } catch (e: any) {
      console.warn(e)
    }
    try {
      const c = (await read('get_charter')) as any
      if (typeof c === 'string') setCharter(c)
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    loadAll()
    setWallet(isWalletConnected() ? 'connected' : null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleConnect() {
    try {
      const a = await connectWallet()
      setWallet(a)
      toast.success(`Wallet connected · ${short(a)}`)
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to connect wallet')
    }
  }

  async function runCheck() {
    if (!title.trim() || !body.trim()) {
      toast.error('Add a proposal title and body.')
      return
    }
    setChecking(true)
    setResult(null)
    const tid = toast.loading('Validators are judging the proposal against the charter… (30–60s)')
    try {
      await write('check_proposal', [title.trim(), body.trim(), authorName.trim()])
      const s = (await read('stats')) as any
      const idx = Number(s?.proposals_checked ?? 1) - 1
      const p = (await read('get_proposal', [String(idx)])) as any
      setResult(p)
      toast.success(p?.compliant ? 'Compliant — proposal may proceed.' : 'Blocked — charter conflict found.', {
        id: tid,
      })
      setTitle('')
      setBody('')
      setAuthorName('')
      await loadAll()
    } catch (e: any) {
      toast.error(`Check failed: ${e?.shortMessage ?? e?.message ?? e}`, { id: tid })
    } finally {
      setChecking(false)
    }
  }

  const approvalRate =
    stats.proposals_checked > 0 ? Math.round((stats.approved / stats.proposals_checked) * 100) : 0

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Toaster theme="dark" position="top-center" richColors />

      {/* ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:46px_46px] [mask-image:radial-gradient(ellipse_at_50%_0%,black,transparent_72%)]" />
        <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]" />
        <div className="absolute top-1/3 -right-40 h-[420px] w-[420px] rounded-full bg-accent/10 blur-[150px]" />
      </div>

      {/* NAV */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/70 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <a href="#top" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </span>
            <span className="text-[15px] font-bold tracking-tight">
              DAO<span className="text-primary">Guard</span>
            </span>
          </a>
          <div className="hidden items-center gap-7 text-sm text-muted md:flex">
            <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#console" className="transition-colors hover:text-foreground">Console</a>
            <a href={EXPLORER} target="_blank" rel="noreferrer" className="transition-colors hover:text-foreground">
              Contract
            </a>
          </div>
          <Button size="sm" variant={wallet ? 'outline' : 'primary'} onClick={handleConnect}>
            <Wallet className="h-4 w-4" />
            {wallet && wallet !== 'connected' ? short(wallet) : wallet ? 'Connected' : 'Connect'}
          </Button>
        </nav>
      </header>

      {/* HERO */}
      <section
        id="top"
        ref={heroRef}
        onMouseMove={onHeroMove}
        className="relative mx-auto max-w-6xl px-5 pt-20 pb-16 md:pt-28"
      >
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(420px_circle_at_var(--mx,50%)_var(--my,20%),color-mix(in_oklab,var(--color-primary)_10%,transparent),transparent_60%)]" />
        <motion.div variants={stagger} initial="hidden" animate="show" className="relative mx-auto max-w-3xl text-center">
          <motion.div variants={fadeUp} className="mb-5 flex justify-center">
            <Badge tone="brand">
              <Sparkles className="h-3.5 w-3.5" /> AI-validated governance · GenLayer
            </Badge>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="text-balance text-4xl font-black leading-[1.05] tracking-tight md:text-6xl"
          >
            Every proposal, checked against your{' '}
            <span className="bg-gradient-to-r from-primary via-emerald-300 to-accent bg-clip-text text-transparent">
              constitution
            </span>
            .
          </motion.h1>
          <motion.p variants={fadeUp} className="mx-auto mt-5 max-w-xl text-pretty text-base text-muted md:text-lg">
            DAOGuard reads your charter and judges whether a proposal violates it — through a
            decentralized validator consensus, not a single model. The verdict lands on-chain
            before anything executes.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="#console">
              <Button size="lg">
                Check a proposal <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
            <a href="#how">
              <Button size="lg" variant="outline">
                How it works
              </Button>
            </a>
          </motion.div>

          {/* live stat chips */}
          <motion.div variants={fadeUp} className="mt-12 grid grid-cols-3 gap-3 sm:gap-4">
            <Stat label="Proposals checked" value={stats.proposals_checked} icon={<FileCheck2 className="h-4 w-4" />} />
            <Stat label="Approved" value={stats.approved} tone="approve" icon={<Check className="h-4 w-4" />} />
            <Stat label="Blocked" value={stats.blocked} tone="block" icon={<X className="h-4 w-4" />} />
          </motion.div>
        </motion.div>
      </section>

      {/* HOW IT WORKS */}
      <Section id="how" eyebrow="Workflow" title="From proposal to on-chain verdict">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { i: ScrollText, t: '1 · Submit', d: 'Anyone submits a proposal — title and body — against the DAO charter stored in the contract.' },
            { i: Scale, t: '2 · Deliberate', d: 'Validators independently read the charter and the proposal, then reach consensus on whether it conflicts.' },
            { i: Gavel, t: '3 · Settle', d: 'A deterministic verdict (compliant + recommendation + confidence) is written on-chain for governance to act on.' },
          ].map((s, idx) => (
            <motion.div key={s.t} variants={fadeUp}>
              <Card className="h-full p-6">
                <div className="mb-4 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/12 ring-1 ring-primary/25">
                    <s.i className="h-5 w-5 text-primary" />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">step {idx + 1}</span>
                </div>
                <h3 className="text-lg font-bold">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.d}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* FEATURES BENTO */}
      <Section id="features" eyebrow="Why DAOGuard" title="Judgment that holds up on-chain">
        <div className="grid gap-4 md:grid-cols-3 md:grid-rows-2">
          <Feature
            className="md:col-span-2 md:row-span-2"
            icon={<Network className="h-5 w-5 text-primary" />}
            title="Validator consensus, not one model"
            body="Each validator independently judges the proposal against the charter. The leader's verdict is only accepted when validators agree it is internally consistent — so a single hallucination can't pass."
            big
          >
            <div className="mt-6 grid grid-cols-3 gap-2">
              {['high', 'medium', 'low'].map((c) => (
                <div key={c} className="rounded-xl border border-border bg-white/[0.02] p-3 text-center">
                  <div className="text-[10px] uppercase tracking-widest text-muted">confidence</div>
                  <div className="mt-1 text-sm font-semibold capitalize text-foreground">{c}</div>
                </div>
              ))}
            </div>
          </Feature>
          <Feature
            icon={<ScrollText className="h-5 w-5 text-primary" />}
            title="Charter-anchored"
            body="The verdict is grounded in the on-chain charter — amendable only by the governor."
          />
          <Feature
            icon={<Lock className="h-5 w-5 text-primary" />}
            title="Deterministic recommendation"
            body="approve / reject is a pure function of the compliance flag — never free-form text."
          />
        </div>
      </Section>

      {/* CONSOLE */}
      <Section id="console" eyebrow="Live on Bradbury" title="Compliance console">
        <div className="grid gap-4 lg:grid-cols-5">
          {/* charter */}
          <Card className="lg:col-span-2 p-6">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Landmark className="h-4 w-4 text-primary" /> DAO charter
            </div>
            <div className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-xl border border-border bg-background/60 p-4 text-[13px] leading-relaxed text-muted">
              {charter || 'Loading charter from chain…'}
            </div>
            <a
              href={EXPLORER}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-primary"
            >
              <ExternalLink className="h-3.5 w-3.5" /> {short(CONTRACT)} on explorer
            </a>
          </Card>

          {/* form + result */}
          <Card className="lg:col-span-3 p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Gavel className="h-4 w-4 text-primary" /> Submit a proposal for review
            </div>
            <div className="space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Proposal title — e.g. “Allocate 5% of treasury to a marketing DAO”"
                className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted/60 focus:border-primary/50"
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                placeholder="Full proposal text — what should the DAO do, and why?"
                className="w-full resize-none rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted/60 focus:border-primary/50"
              />
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Author (optional)"
                  className="flex-1 rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted/60 focus:border-primary/50"
                />
                <Button onClick={runCheck} disabled={checking} className="sm:w-48">
                  {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  {checking ? 'Judging…' : 'Run compliance check'}
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-5 overflow-hidden"
                >
                  <div
                    className={`rounded-2xl border p-5 ${
                      result.compliant ? 'border-approve/30 bg-approve/[0.06]' : 'border-block/30 bg-block/[0.06]'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={result.compliant ? 'approve' : 'block'}>
                        {result.compliant ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        {result.recommendation?.toUpperCase() ?? (result.compliant ? 'APPROVE' : 'REJECT')}
                      </Badge>
                      <Badge tone={result.confidence === 'high' ? 'approve' : result.confidence === 'low' ? 'block' : 'caution'}>
                        confidence: {result.confidence}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm font-medium text-foreground">{result.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      <span className="text-foreground/80">Charter analysis: </span>
                      {result.violations}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>

        {/* recent verdicts */}
        {recent.length > 0 && (
          <div className="mt-8">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted">
              <Activity className="h-4 w-4" /> Recent verdicts · {approvalRate}% approved
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {recent.map((p) => (
                <motion.div key={p.key} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
                  <Card className="flex items-start justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted">{p.violations}</p>
                    </div>
                    <Badge tone={p.compliant ? 'approve' : 'block'} className="shrink-0">
                      {p.compliant ? 'approved' : 'blocked'}
                    </Badge>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* FOOTER */}
      <footer className="mt-10 border-t border-border/70">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-10 text-sm text-muted md:flex-row">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 ring-1 ring-primary/30">
              <ShieldCheck className="h-4 w-4 text-primary" />
            </span>
            <span className="font-semibold text-foreground">DAOGuard</span>
            <span>· constitutional compliance for DAOs</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#console" className="hover:text-foreground">Console</a>
            <a href={EXPLORER} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-primary">
              Contract <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* --------------------------------- helpers --------------------------------- */
function Stat({
  label,
  value,
  tone,
  icon,
}: {
  label: string
  value: number
  tone?: 'approve' | 'block'
  icon: React.ReactNode
}) {
  const color = tone === 'approve' ? 'text-approve' : tone === 'block' ? 'text-block' : 'text-foreground'
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-sm">
      <div className="flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-wider text-muted">
        {icon} {label}
      </div>
      <div className={`mt-1.5 text-2xl font-black tabular-nums md:text-3xl ${color}`}>{value}</div>
    </div>
  )
}

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string
  eyebrow: string
  title: string
  children: React.ReactNode
}) {
  return (
    <motion.section
      id={id}
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
      className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16"
    >
      <motion.div variants={fadeUp} className="mb-8 text-center">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">{eyebrow}</div>
        <h2 className="mt-2 text-2xl font-black tracking-tight md:text-4xl">{title}</h2>
      </motion.div>
      {children}
    </motion.section>
  )
}

function Feature({
  icon,
  title,
  body,
  className,
  big,
  children,
}: {
  icon: React.ReactNode
  title: string
  body: string
  className?: string
  big?: boolean
  children?: React.ReactNode
}) {
  return (
    <motion.div variants={fadeUp} className={className}>
      <Card className="group h-full p-6 transition-colors hover:border-primary/30">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/12 ring-1 ring-primary/25">
          {icon}
        </span>
        <h3 className={`mt-4 font-bold ${big ? 'text-xl' : 'text-base'}`}>{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
        {children}
      </Card>
    </motion.div>
  )
}
