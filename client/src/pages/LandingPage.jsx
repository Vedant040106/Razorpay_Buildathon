import React from 'react';
import { LandingNavbar } from '../components/landing/Navbar.jsx';
import { HeroSection } from '../components/landing/HeroSection.jsx';
import { CorePrinciple } from '../components/landing/CorePrinciple.jsx';
import { HowItWorks } from '../components/landing/HowItWorks.jsx';
import { FeatureSection } from '../components/landing/FeatureSection.jsx';
import { SafetySection } from '../components/landing/SafetySection.jsx';
import { FailureRecoverySection } from '../components/landing/FailureRecoverySection.jsx';
import { MetricsSection } from '../components/landing/MetricsSection.jsx';
import { ArchitectureSection } from '../components/landing/ArchitectureSection.jsx';
import { DemoCTA } from '../components/landing/DemoCTA.jsx';
import { LandingFooter } from '../components/landing/Footer.jsx';

export function LandingPage({ user }) {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. Header Navigation */}
      <LandingNavbar user={user} />

      {/* 2. Hero Section with Interactive Visualization */}
      <HeroSection />

      {/* 3. Core Architectural Principle (AI Recommends, Deterministic Authorizes) */}
      <CorePrinciple />

      {/* 4. How It Works: 5-Stage Pipeline */}
      <HowItWorks />

      {/* 5. 6 Deep Platform Capabilities */}
      <FeatureSection />

      {/* 6. Impermeable Safety Boundary */}
      <SafetySection />

      {/* 7. Failure Handling & Resilience */}
      <FailureRecoverySection />

      {/* 8. Verifiable Architectural Metrics */}
      <MetricsSection />

      {/* 9. System Topology Architecture */}
      <ArchitectureSection />

      {/* 10. Demo Invitation CTA */}
      <DemoCTA user={user} />

      {/* 11. Footer */}
      <LandingFooter />
    </div>
  );
}
