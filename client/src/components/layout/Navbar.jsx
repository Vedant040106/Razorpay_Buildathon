import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, CreditCard, RotateCcw, ShieldAlert, 
  BarChart3, History, Play, LogOut, ShieldCheck, ExternalLink 
} from 'lucide-react';

export function Navbar({ pendingApprovalsCount = 0, onOpenSimulator, onLogout, user }) {
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Console Tag */}
          <div className="flex items-center space-x-6">
            <Link to="/dashboard" className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-slate-900">RecoverAI</span>
                <span className="hidden sm:inline-block ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                  CONSOLE
                </span>
              </div>
            </Link>

            {/* Navigation links */}
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
              <span>Public Page</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            {/* Demo Simulator trigger */}
            <button
              onClick={onOpenSimulator}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition active:scale-95"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>Pitch Demo</span>
            </button>

            {/* Merchant Badge */}
            <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-xs text-slate-700 font-medium">Apex Retail (Test)</span>
            </div>

            {/* Logout button */}
            {onLogout && (
              <button
                onClick={onLogout}
                title="Log Out"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                aria-label="Log Out"
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
