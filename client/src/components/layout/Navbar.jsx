import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CreditCard, RotateCcw, ShieldAlert, BarChart3, History, Play, LogOut } from 'lucide-react';

export function Navbar({ pendingApprovalsCount = 0, onOpenSimulator, onLogout, user }) {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/payments', label: 'Payments', icon: CreditCard },
    { to: '/recovery', label: 'Recovery Queue', icon: RotateCcw },
    { 
      to: '/approvals', 
      label: 'Approvals', 
      icon: ShieldAlert,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null 
    },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/audit', label: 'Audit Trail', icon: History },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-6">
            <NavLink to="/" className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center font-bold text-white shadow-md shadow-brand-600/30">
                R
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-white">RecoverAI</span>
                <span className="hidden sm:inline-block ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand-950 text-brand-400 border border-brand-800">
                  REVENUE AGENT
                </span>
              </div>
            </NavLink>

            {/* Navigation links */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        isActive
                          ? 'bg-slate-800 text-white shadow-sm border border-slate-700/80'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`
                    }
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-1 px-1.5 py-0.2 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full text-[10px] font-mono font-bold">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Right Action Ribbon */}
          <div className="flex items-center space-x-3">
            {/* Demo Simulator trigger */}
            <button
              onClick={onOpenSimulator}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-brand-600/20 border border-brand-400/30 transition active:scale-95"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>Pitch Demo</span>
            </button>

            {/* Merchant Badge */}
            <div className="hidden lg:flex items-center space-x-2 pl-2 border-l border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-xs text-slate-300 font-medium">Apex Retail (Test)</span>
            </div>

            {/* Logout button */}
            {onLogout && (
              <button
                onClick={onLogout}
                title="Log Out"
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
