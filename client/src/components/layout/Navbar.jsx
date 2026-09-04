import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, CreditCard, RotateCcw, ShieldCheck, 
  BarChart3, History, Play, LogOut, ExternalLink, Menu, X 
} from 'lucide-react';

export function Navbar({ pendingApprovalsCount = 0, onOpenSimulator, onLogout, user }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/payments', label: 'Payments', icon: CreditCard },
    { to: '/recovery', label: 'Recovery Queue', icon: RotateCcw },
    { 
      to: '/approvals', 
      label: 'Approvals', 
      icon: ShieldCheck,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null 
    },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/audit', label: 'Audit Trail', icon: History },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Console Tag */}
          <div className="flex items-center space-x-6">
            <Link to="/dashboard" className="flex items-center space-x-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs group-hover:bg-indigo-700 transition">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-slate-900">RecoverAI</span>
                <span className="hidden sm:inline-block ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                  CONSOLE
                </span>
              </div>
            </Link>

            {/* Desktop Navigation links */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`
                    }
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-1 px-1.5 py-0.2 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-[10px] font-mono font-bold">
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
            {/* View Landing Page link */}
            <Link
              to="/"
              title="View Public Landing Page"
              className="hidden lg:flex items-center space-x-1 px-2.5 py-1 text-xs text-slate-500 hover:text-indigo-600 rounded-md hover:bg-slate-100 transition"
            >
              <span>Public Site</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            {/* Demo Simulator trigger */}
            <button
              type="button"
              onClick={onOpenSimulator}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition active:scale-95"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>Pitch Demo</span>
            </button>

            {/* Merchant Indicator */}
            <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-slate-200 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-700 font-medium">Apex Retail</span>
            </div>

            {/* Logout button */}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
              aria-label="Toggle Navigation Menu"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileNavOpen && (
          <div className="md:hidden py-3 px-2 border-t border-slate-200 bg-white space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileNavOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-[10px] font-mono font-bold">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between px-3 text-xs text-slate-500">
              <Link
                to="/"
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center space-x-1 text-indigo-600 font-medium"
              >
                <span>Visit Landing Page</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
              <span>Apex Retail (Test)</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
