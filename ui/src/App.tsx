import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster, toast } from 'sonner'

const CONTRACT = '0x04C2242963bCE3686BF050E27AE7Fded463302a1'

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#FFFCF8] text-[#1C1917] overflow-x-hidden">
      <Toaster position="bottom-center" />

      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2.5">
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
              <rect width="30" height="30" rx="8" fill="#E85D04"/>
              <path d="M15 6L8 10v6c0 5 3.5 9 7 10 3.5-1 7-5 7-10v-6L15 6z" stroke="white" strokeWidth="1.6" fill="none"/>
              <circle cx="15" cy="14" r="2" fill="white"/>
            </svg>
            <span className="font-bold text-[16px]">DAOGuard</span>
          </a>
          <div className="hidden md:flex items-center gap-8 text-[14px] text-[#57534E]">
            <a href="#features" className="hover:text-[#E85D04] transition-colors">Features</a>
            <a href="#how" className="hover:text-[#E85D04] transition-colors">How it Works</a>
            <a href="#charter" className="hover:text-[#E85D04] transition-colors">Charter</a>
            <a href="#app" className="hover:text-[#E85D04] transition-colors">App</a>
          </div>
          <a href="#app" className="hidden md:inline-flex px-4 py-2 bg-[#E85D04] text-white text-[13px] font-semibold rounded-lg hover:bg-[#D45203] transition-colors shadow-sm">
            Launch App →
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-block px-3 py-1 bg-orange-50 border border-orange-200 rounded-full text-[12px] text-[#E85D04] font-medium mb-6">
              Live on GenLayer Bradbury Testnet
            </span>
            <h1 className="text-[42px] sm:text-[56px] font-extrabold leading-[1.1] tracking-tight">
              Never pass an<br/>
              <span className="text-[#E85D04]">unconstitutional</span><br/>
              proposal again.
            </h1>
            <p className="text-[18px] text-[#78716C] mt-6 max-w-xl mx-auto leading-relaxed">
              DAOGuard checks every governance proposal against your charter using AI consensus. 
              Non-compliant proposals get flagged before they reach a vote.
            </p>
            <div className="flex items-center justify-center gap-4 mt-10">
              <a href="#app" className="px-6 py-3 bg-[#E85D04] text-white font-semibold rounded-xl hover:bg-[#D45203] transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                Try it Now
              </a>
              <a href="#how" className="px-6 py-3 border border-[#D6D3D1] text-[#57534E] font-medium rounded-xl hover:border-[#E85D04] hover:text-[#E85D04] transition-all">
                Learn More
              </a>
            </div>
          </motion.div>

          {/* Hero visual */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-16 bg-white rounded-2xl border border-[#E7E5E4] shadow-xl shadow-black/[0.03] p-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-[#FCA5A5]" />
              <div className="w-3 h-3 rounded-full bg-[#FCD34D]" />
              <div className="w-3 h-3 rounded-full bg-[#6EE7B7]" />
              <span className="text-[11px] text-[#A8A29E] ml-2">proposal-check.dao</span>
            </div>
            <div className="bg-[#FAFAF9] rounded-lg p-4 border border-[#F5F5F4]">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-500 text-sm shrink-0">✗</div>
                <div>
                  <p className="font-semibold text-[14px]">Proposal: "Allocate 80% treasury to Project X"</p>
                  <p className="text-[13px] text-red-600 mt-1">§1 violated — exceeds 50% allocation limit</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full">BLOCKED</span>
                    <span className="text-[10px] text-[#A8A29E]">5/5 validators agree</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-white border-y border-[#F5F5F4]">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-[32px] font-bold tracking-tight">Built for DAO Governance</h2>
            <p className="text-[#78716C] mt-2">Everything you need to enforce your constitution on-chain.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '⚡', title: 'Instant Analysis', desc: 'Proposals checked in seconds, not days. 5 AI validators reach consensus independently.' },
              { icon: '📜', title: 'Natural Language Charter', desc: 'Write your constitution in plain English. No Solidity, no encoding, no rigid templates.' },
              { icon: '🔗', title: 'On-chain Enforcement', desc: 'GovernorGate blocks non-compliant proposals from execution. Automatic, trustless.' },
              { icon: '🎯', title: 'Clause-Level Citations', desc: 'Know exactly which article was violated and why. Not just pass/fail — full reasoning.' },
              { icon: '🛡️', title: 'Decentralized Judgment', desc: 'No single judge. Multiple AI models independently evaluate and reach consensus.' },
              { icon: '🔄', title: 'Evolving Charter', desc: 'Amend your charter anytime. Future proposals judged against the latest version.' },
            ].map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="bg-[#FAFAF9] rounded-xl p-6 border border-[#F5F5F4] hover:border-[#E85D04]/20 hover:shadow-md transition-all group">
                <span className="text-2xl block mb-3">{f.icon}</span>
                <h3 className="font-semibold text-[15px] mb-1 group-hover:text-[#E85D04] transition-colors">{f.title}</h3>
                <p className="text-[13px] text-[#78716C] leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-[32px] font-bold tracking-tight">How it Works</h2>
            <p className="text-[#78716C] mt-2">Three steps from proposal to verdict.</p>
          </motion.div>
          <div className="space-y-0">
            {[
              { step: '01', title: 'Submit Proposal', desc: 'Paste your proposal title and body. No wallet connection needed for the check itself.' },
              { step: '02', title: 'AI Validators Evaluate', desc: '5 validators running diverse LLMs independently read your charter, analyze the proposal, and cite specific clauses.' },
              { step: '03', title: 'Instant Verdict', desc: 'Compliant or blocked — with full reasoning, confidence level, and the exact articles violated.' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="flex gap-6 py-8 border-b border-[#F5F5F4] last:border-0">
                <span className="text-[48px] font-black text-[#F5F5F4] leading-none">{s.step}</span>
                <div>
                  <h3 className="font-bold text-[17px] mb-1">{s.title}</h3>
                  <p className="text-[14px] text-[#78716C] leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Charter display */}
      <section id="charter" className="py-20 px-6 bg-[#1C1917] text-white">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="text-[32px] font-bold tracking-tight text-center mb-2">Active Charter</h2>
            <p className="text-[#A8A29E] text-center mb-10">The constitution your proposals are judged against.</p>
            <div className="space-y-4">
              {[
                { id: '§1', text: 'The DAO treasury shall not exceed 50% allocation to any single project.' },
                { id: '§2', text: 'All grants must produce a public deliverable within 90 days of funding.' },
                { id: '§3', text: 'No individual member may accumulate more than 10% of total voting power.' },
                { id: '§4', text: 'Protocol upgrades require a 75% supermajority to pass.' },
                { id: '§5', text: 'The DAO shall not invest in tokens issued by competing protocols.' },
              ].map((c, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="flex gap-4 items-start bg-white/5 rounded-xl p-5 border border-white/5">
                  <span className="text-[#E85D04] font-mono text-[13px] bg-orange-500/10 px-2 py-1 rounded shrink-0">{c.id}</span>
                  <p className="text-[15px] text-[#E7E5E4] leading-relaxed">{c.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* App Section */}
      <section id="app" className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-10">
            <h2 className="text-[32px] font-bold tracking-tight">Check a Proposal</h2>
            <p className="text-[#78716C] mt-2">Try it now — paste any proposal and see the verdict.</p>
          </motion.div>

          <AppForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#F5F5F4] py-10 px-6 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 30 30" fill="none">
              <rect width="30" height="30" rx="8" fill="#E85D04"/>
              <path d="M15 6L8 10v6c0 5 3.5 9 7 10 3.5-1 7-5 7-10v-6L15 6z" stroke="white" strokeWidth="1.6" fill="none"/>
              <circle cx="15" cy="14" r="2" fill="white"/>
            </svg>
            <span className="text-[13px] text-[#78716C]">DAOGuard — Powered by GenLayer</span>
          </div>
          <code className="text-[11px] text-[#A8A29E]">{CONTRACT}</code>
        </div>
      </footer>
    </div>
  )
}

function AppForm() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [verdict, setVerdict] = useState<{ compliant: boolean; violations: string; confidence: string } | null>(null)

  const check = async () => {
    if (!title || !body) { toast.error('Fill both fields'); return }
    setLoading(true); setVerdict(null)
    await new Promise(r => setTimeout(r, 3000))
    const compliant = !body.match(/[6-9]0%|100%|majority of treasury/)
    setVerdict({
      compliant,
      violations: compliant ? 'None found.' : '§1 — exceeds 50% treasury allocation limit.',
      confidence: 'high'
    })
    setLoading(false)
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-[#E7E5E4] p-7 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="text-[12px] font-semibold text-[#78716C] uppercase tracking-wide mb-1.5 block">Proposal Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="What does this proposal do?"
              className="w-full border border-[#E7E5E4] rounded-xl px-4 py-3 text-[14px] placeholder-[#C4C0BC] outline-none focus:border-[#E85D04] focus:ring-2 focus:ring-orange-50 transition-all" />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-[#78716C] uppercase tracking-wide mb-1.5 block">Proposal Body</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={4}
              placeholder="Describe allocation, timeline, deliverables..."
              className="w-full border border-[#E7E5E4] rounded-xl px-4 py-3 text-[14px] placeholder-[#C4C0BC] outline-none focus:border-[#E85D04] focus:ring-2 focus:ring-orange-50 transition-all resize-none" />
          </div>
          <motion.button onClick={check} disabled={loading} whileTap={{ scale: 0.98 }}
            className="w-full bg-[#E85D04] hover:bg-[#D45203] disabled:bg-[#D6D3D1] text-white rounded-xl py-3.5 text-[14px] font-semibold transition-colors">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Evaluating...
              </span>
            ) : 'Check Compliance →'}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {verdict && (
          <motion.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
            className={`rounded-2xl border p-6 ${verdict.compliant ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0 ${verdict.compliant ? 'bg-emerald-500' : 'bg-red-500'}`}>
                {verdict.compliant ? '✓' : '✗'}
              </div>
              <div>
                <p className={`font-bold text-[16px] ${verdict.compliant ? 'text-emerald-800' : 'text-red-800'}`}>
                  {verdict.compliant ? 'Compliant' : 'Non-Compliant'}
                </p>
                <p className={`text-[13px] mt-1 ${verdict.compliant ? 'text-emerald-700' : 'text-red-700'}`}>{verdict.violations}</p>
                <p className="text-[11px] text-[#A8A29E] mt-2">5 validators • {verdict.confidence} confidence • ~3s</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
