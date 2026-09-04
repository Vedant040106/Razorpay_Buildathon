import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Play, LayoutDashboard } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal.jsx';

export function DemoCTA({ user }) {
  return (
    <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_50%)] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
        <ScrollReveal animation="fade-up" delay={0} duration={600}>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-xs font-mono font-medium mb-6">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>RAZORPAY AI BUILDATHON SUBMISSION</span>
          </div>
        </ScrollReveal>

        <ScrollReveal animation="fade-up" delay={80} duration={650}>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight max-w-2xl mx-auto leading-tight">
            See revenue recovery under controlled automation.
          </h2>
        </ScrollReveal>

        <ScrollReveal animation="fade-up" delay={140} duration={650}>
          <p className="mt-4 text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Explore the merchant console and follow a failed payment from real-time detection to AI diagnosis, policy authorization, and immutable audit.
          </p>
        </ScrollReveal>

        <ScrollReveal animation="fade-up" delay={200} duration={650}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to={user ? '/dashboard' : '/login'}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-md shadow-indigo-600/30 transition"
            >
              {user ? <LayoutDashboard className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{user ? 'Go to Merchant Console' : 'Open Merchant Console'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </ScrollReveal>

        <ScrollReveal animation="fade-up" delay={260} duration={650}>
          <div className="mt-8 pt-6 border-t border-slate-800 text-xs text-slate-400 font-mono">
            Demo Evaluator Account: <span className="text-indigo-400">admin@recoverai.local</span> • Password: <span className="text-indigo-400">password123</span>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
