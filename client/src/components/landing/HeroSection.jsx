import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Sparkles, ArrowDown } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal.jsx';

export function HeroSection({ user }) {
  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Value Proposition Copy */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <ScrollReveal animation="fade-up" delay={0} duration={600}>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                <span>AI REVENUE RECOVERY INFRASTRUCTURE</span>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={80} duration={650}>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Recover revenue. <br className="hidden sm:inline" />
                <span className="text-indigo-600">With intelligence under control.</span>
              </h1>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={140} duration={700}>
              <p className="text-base text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-sans">
                RecoverAI intercepts failed Razorpay transactions, diagnoses underlying failure causes, evaluates recovery feasibility, and executes permitted gateway actions under deterministic policy constraints.
              </p>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={200} duration={700}>
              {/* Primary Call to Action */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <Link
                  to={user ? "/dashboard" : "/login"}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 transition"
                >
                  <span>{user ? "Open Merchant Console" : "Launch Merchant Console"}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold border border-slate-300 shadow-xs transition"
                >
                  <span>See How It Works</span>
                </a>
              </div>
            </ScrollReveal>

            {/* Trust points */}
            <ScrollReveal animation="fade-up" delay={260} duration={700}>
              <div className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-left">
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
            </ScrollReveal>
          </div>

          {/* Right Column: Hero Visual - Live Recovery Opportunity Pipeline */}
          <div className="lg:col-span-6">
            <ScrollReveal animation="fade-left" delay={150} duration={800}>
              <div className="relative mx-auto max-w-md bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-200/60 p-5 space-y-3">
                
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
                <ScrollReveal animation="fade-up" delay={250} duration={500}>
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
                </ScrollReveal>

                {/* Connector Arrow */}
                <div className="flex justify-center -my-1 text-indigo-400">
                  <ArrowDown className="w-3.5 h-3.5" />
                </div>

                {/* Step 2: AI Recommendation & Feasibility */}
                <ScrollReveal animation="fade-up" delay={380} duration={500}>
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
                </ScrollReveal>

                {/* Connector Arrow */}
                <div className="flex justify-center -my-1 text-emerald-500">
                  <ArrowDown className="w-3.5 h-3.5" />
                </div>

                {/* Step 3: Policy Engine Verification Gate */}
                <ScrollReveal animation="fade-up" delay={500} duration={500}>
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
                </ScrollReveal>

                {/* Step 4: Action Gate Execution & Audit Log */}
                <ScrollReveal animation="fade-up" delay={620} duration={500}>
                  <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="font-mono text-[11px] text-slate-600">Action Dispatched: <strong className="text-slate-900">RETRY_PAYMENT</strong></span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">Idempotency: SHA-256 OK</span>
                  </div>
                </ScrollReveal>

              </div>
            </ScrollReveal>
          </div>

        </div>
      </div>
    </section>
  );
}
