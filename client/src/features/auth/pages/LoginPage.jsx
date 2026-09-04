import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, Lock, Mail, ArrowRight, ArrowLeft, 
  CheckCircle2, AlertCircle, RefreshCw, Eye, EyeOff 
} from 'lucide-react';
import { api } from '../../../services/api.js';
import { validateLoginForm, validateEmail, validatePassword } from '../../../validation/index.js';

export function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('admin@recoverai.local');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (touched.email) {
      const res = validateEmail(val);
      setFieldErrors(prev => ({ ...prev, email: res.error }));
    }
  };

  const handleEmailBlur = () => {
    setTouched(prev => ({ ...prev, email: true }));
    const res = validateEmail(email);
    setFieldErrors(prev => ({ ...prev, email: res.error }));
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    if (touched.password) {
      const res = validatePassword(val);
      setFieldErrors(prev => ({ ...prev, password: res.error }));
    }
  };

  const handlePasswordBlur = () => {
    setTouched(prev => ({ ...prev, password: true }));
    const res = validatePassword(password);
    setFieldErrors(prev => ({ ...prev, password: res.error }));
  };

  const handleFillDemo = () => {
    setEmail('admin@recoverai.local');
    setPassword('password123');
    setFieldErrors({});
    setTouched({ email: true, password: true });
    setServerError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    // Run complete frontend validation
    const validation = validateLoginForm({ email, password });
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      setTouched({ email: true, password: true });
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/login', { 
        email: email.trim(), 
        password 
      });
      if (response.token) {
        localStorage.setItem('recoverai_token', response.token);
      }
      onLoginSuccess(response.user);
    } catch (err) {
      // Map server validation details if provided
      if (err.details && Array.isArray(err.details)) {
        const mapped = {};
        err.details.forEach(d => {
          if (d.field) mapped[d.field] = d.message;
        });
        setFieldErrors(mapped);
      }
      setServerError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const isEmailValid = touched.email && !fieldErrors.email && email.trim().length > 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-indigo-500 selection:text-white animate-fadeIn">
      {/* Top navigation return */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-4 px-4 sm:px-0">
        <Link
          to="/"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-indigo-600 font-medium transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Landing Page</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4 sm:px-0">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 shadow-md shadow-indigo-600/30 text-white mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          RecoverAI Merchant Console
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Autonomous failure analysis, deterministic policy gating & Razorpay recovery
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white border border-slate-200 py-8 px-6 shadow-sm rounded-2xl sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {serverError && (
              <div 
                role="alert"
                className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2 animate-fadeIn"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="email-input" className="block text-xs font-semibold text-slate-700">
                  Merchant Operator Email
                </label>
                {isEmailValid && (
                  <span className="flex items-center space-x-1 text-[11px] text-emerald-600 font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Valid format</span>
                  </span>
                )}
              </div>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email-input"
                  name="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  required
                  maxLength={255}
                  placeholder="admin@recoverai.local"
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? "email-error" : undefined}
                  className={`block w-full pl-9 pr-3 py-2 bg-white border rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition ${
                    fieldErrors.email
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 focus:border-rose-500'
                      : isEmailValid
                      ? 'border-emerald-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                      : 'border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p id="email-error" className="mt-1.5 text-[11px] text-rose-600 flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{fieldErrors.email}</span>
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password-input" className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password-input"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={handlePasswordBlur}
                  required
                  maxLength={128}
                  placeholder="••••••••••••"
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? "password-error" : undefined}
                  className={`block w-full pl-9 pr-9 py-2 bg-white border rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition ${
                    fieldErrors.password
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 focus:border-rose-500'
                      : 'border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p id="password-error" className="mt-1.5 text-[11px] text-rose-600 flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{fieldErrors.password}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex justify-center items-center space-x-2 py-2.5 px-4 rounded-lg shadow-xs text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 disabled:opacity-50 transition active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Preset Demo Credentials Box with Action */}
          <div className="mt-6 pt-4 border-t border-slate-100 bg-slate-50 -mx-6 -mb-8 p-6 rounded-b-2xl text-[11px] text-slate-600 space-y-2 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px] font-mono flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Demo Evaluator Account:</span>
              </div>
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-[10px] font-mono font-semibold text-indigo-600 hover:text-indigo-800 underline focus:outline-none"
              >
                Autofill Credentials
              </button>
            </div>
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-slate-500">Email:</span>
              <span className="font-bold text-indigo-700">admin@recoverai.local</span>
            </div>
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-slate-500">Password:</span>
              <span className="font-bold text-indigo-700">password123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
