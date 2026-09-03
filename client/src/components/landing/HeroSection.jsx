import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, ShieldCheck, Zap, CheckCircle2, Clock, 
  AlertCircle, ChevronRight, Lock, Activity, Sparkles, RefreshCw
} from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative pt-12 pb-20 overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-white">
      {/* Subtle architectural grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Heading, Value Proposition & CTAs */}
          <div className="lg:col-span-6 space-y-6 text-left">
            {/* Eyebrow badge */}
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <span>AI Revenue Recovery Infrastructure</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              Recover revenue.
              <span className="block text-indigo-600 mt-1">With intelligence under control.</span>
            </h1>

            {/* Supporting technical copy */}
            <p className="text-base text-slate-600 leading-relaxed max-w-xl">
              RecoverAI automatically intercepts failed payment attempts, diagnoses technical root causes, evaluates recovery feasibility with AI, and applies deterministic financial policy controls before any action is executed.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/login"
                className="inline-flex items-center space-x-2 px-5 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition"
              >
                <span>Explore the Console</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center space-x-2 px-5 py-3 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold border border-slate-300 shadow-xs transition"
              >
                <span>See How It Works</span>
              </a>
            </div>

            {/* Trust points */}
            <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 text-left">
              <div>
                <div className="text-xs font-bold text-slate-900 font-mono">100% PAISAE</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Integer money precision</div>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 font-mono">POL-001—010</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Deterministic rules</div>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 font-mono">HMAC SHA-256</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Cryptographic verify</div>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual - Live Recovery Opportunity Pipeline */}
          <div className="lg:col-span-6">
            <div className="relative mx-auto max-w-md bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-200/60 p-5 space-y-4">
              
              {/* Window Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <span className="font-mono font-medium text-slate-500 text-[11px] ml-1">rec_event_pipeline.json</span>
                </div>
                <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  RECOVERED
                </span>
              </div>

              {/* Step 1: Failed Payment Context */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-500">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Payment Intercept</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500">Attempt 1 of 3</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono text-xs font-bold text-slate-900">#pay_8F291ad49</div>
                    <div className="text-xs text-slate-500">HDFC Bank ••4012 • 3DS Dropped</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-extrabold text-slate-900 font-mono">₹4,500.00</div>
                    <div className="text-[10px] text-rose-600 font-semibold font-mono">GATEWAY_TIMEOUT</div>
                  </div>
                </div>
              </div>

              {/* Step 2: AI Recommendation & Feasibility */}
              <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 text-indigo-700 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-[10px] uppercase tracking-wider">AI Feasibility Analysis</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-indigo-600">92% Feasibility</span>
                </div>
                <div className="text-xs text-slate-700 leading-relaxed font-sans">
                  "Transient timeout. Instrument active. Re-dispatch via alternative banking channel recommended."
                </div>
                <div className="pt-1 flex items-center space-x-2 text-[10px] font-mono text-indigo-800">
                  <span className="px-1.5 py-0.5 rounded bg-indigo-100/70 border border-indigo-200">STRATEGY: RETRY_PAYMENT</span>
                  <span className="px-1.5 py-0.5 rounded bg-indigo-100/70 border border-indigo-200">PRIORITY: HIGH</span>
                </div>
              </div>

              {/* Step 3: Policy Engine Verification Gate */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-500">
                  <div className="flex items-center space-x-1 text-slate-700 font-semibold font-sans">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[10px] uppercase tracking-wider">Policy Engine Gate</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold">ALL CHECKS PASSED</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center space-x-1.5 text-slate-700">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                    <span>Invariance: OK</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-slate-700">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                    <span>Attempts: &lt; 3 Max</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-slate-700">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                    <span>Cooldown: 15m Met</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-slate-700">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                    <span>Value: &le; ₹5,000 Cap</span>
                  </div>
                </div>
              </div>

              {/* Step 4: Action Gate Execution & Audit Log */}
              <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-mono text-[11px] text-slate-600">Action Dispatched: <strong className="text-slate-900">RETRY_PAYMENT</strong></span>
                </div>
                <span className="font-mono text-[10px] text-slate-500">Idempotency Lock: SHA-256 OK</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
