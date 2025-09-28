"use client";

import React, { useState, useEffect } from 'react';

// =====================================================================
// TYPE DEFINITIONS
// =====================================================================
interface PathCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  stats: string;
  accentColor: 'blue' | 'purple' | 'cyan' | 'rose';
  href: string;
}

// =====================================================================
// Icon Components
// =====================================================================
const StudentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

const TeacherIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
);

const OrganizationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

const AdminIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);

// =====================================================================
// PathCard Component
// =====================================================================
const PathCard: React.FC<PathCardProps> = ({ icon, title, description, stats, accentColor, href }) => {
  const iconColor = `text-${accentColor}-400`;
  const statsAndArrowColor = accentColor === 'rose' ? 'text-rose-400' : 'text-cyan-400';

  return (
    <a href={href} className="group block h-full">
      <div className="flex flex-col h-full bg-[#1A1F32] border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:bg-[#1F253C] hover:border-white/20 transform hover:-translate-y-1">
        <div className="flex items-center space-x-4 mb-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-white/5 ${iconColor}`}>
            {icon}
          </div>
          <span className="font-bold text-lg text-white">{title}</span>
        </div>
        <p className="text-gray-400 text-base flex-grow">{description}</p>
        <div className="mt-6 pt-4 flex items-center justify-between">
          <div className={`text-sm font-semibold ${statsAndArrowColor}`}>
            {stats}
          </div>
          <div className={`${statsAndArrowColor} group-hover:translate-x-1 transition-transform duration-300`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    </a>
  );
};

// =====================================================================
// Data for Path Cards
// =====================================================================
const pathData: PathCardProps[] = [
    {
        icon: <StudentIcon />,
        title: 'Student',
        description: 'Learn, connect, and grow with peers worldwide',
        stats: '25K+ Active',
        accentColor: 'blue',
        href: '/login/student'
    },
    {
        icon: <TeacherIcon />,
        title: 'Teacher',
        description: 'Teach, inspire, and mentor future leaders',
        stats: '12K+ Educators',
        accentColor: 'purple',
        href: '/login/faculty'
    },
    {
        icon: <OrganizationIcon />,
        title: 'Organization',
        description: 'Recruit talent, partner, and expand globally',
        stats: '2.5K+ Companies',
        accentColor: 'cyan',
        href: '/login/organization'
    },
    {
        icon: <AdminIcon />,
        title: 'Administration',
        description: 'Manage, monitor, and maintain the platform',
        stats: 'System Control',
        accentColor: 'rose',
        href: '/login/admin'
    }
];

// =====================================================================
// Header Component
// =====================================================================
const Header = () => {
  return (
    <header className="relative z-10 bg-black/60 backdrop-blur-xl border-b border-white/10 shadow-2xl">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Enhanced Logo */}
          <a href="/#" className="flex items-center">
            <div className="flex items-center space-x-3">
              <img src="/nobglogo.png" alt="Campus Buddy Logo" className="w-12 h-12" />
              <div>
                <span className="text-white font-bold text-2xl">Campus Buddy</span>
                <div className="text-xs text-gray-400 -mt-1">Education Redefined</div>
              </div>
            </div>
          </a>

          {/* Enhanced Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="/#features" className="text-gray-300 hover:text-white transition-all duration-300 font-medium hover:scale-105 relative group">
              Features
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-400 group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="/#/about" className="text-gray-300 hover:text-white transition-all duration-300 font-medium hover:scale-105 relative group">
              About
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-400 group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="/#/contact" className="text-gray-300 hover:text-white transition-all duration-300 font-medium hover:scale-105 relative group">
              Contact
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-400 group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="/#choose-your-path" className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-2 rounded-full text-white font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 cursor-pointer">
              Get Started
            </a>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-white p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};


// =====================================================================
// Footer Component
// =====================================================================
const Footer = () => {
  return (
    <footer className="relative z-10 bg-black/80 border-t border-white/10 mt-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-12">
          <div className="col-span-2 space-y-6">
            <a href="/#" className="flex items-center space-x-3">
              <img src="/nobglogo.png" alt="Campus Buddy Logo" className="w-12 h-12" />
              <div>
                <span className="text-white font-bold text-2xl">Campus Buddy</span>
                <div className="text-xs text-gray-400 -mt-1">Education Redefined</div>
              </div>
            </a>
            <p className="text-gray-300 max-w-md text-lg leading-relaxed">Empowering education through seamless connections between students, educators, and organizations worldwide. Join the future of learning today.</p>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-white font-bold text-lg">Platform</h4>
            <ul className="space-y-3">
              <li><a href="/#features" className="text-gray-400 hover:text-blue-400 transition-colors hover:translate-x-1 transform duration-200 block">Features</a></li>
              <li><a href="/#/about" className="text-gray-400 hover:text-blue-400 transition-colors hover:translate-x-1 transform duration-200 block">About Us</a></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-white font-bold text-lg">Support</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors hover:translate-x-1 transform duration-200 block">Help Center</a></li>
              <li><a href="/#/contact" className="text-gray-400 hover:text-blue-400 transition-colors hover:translate-x-1 transform duration-200 block">Contact Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors hover:translate-x-1 transform duration-200 block">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors hover:translate-x-1 transform duration-200 block">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700/50 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-gray-400">© 2024 Campus Buddy. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <div className="flex items-center text-green-400">
              <div className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              <span className="font-medium">All systems operational</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};


// =====================================================================
// Layout Component
// =====================================================================
const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white relative overflow-x-hidden">
      {/* Enhanced Background Graphics */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        {/* Animated gradient orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-gradient-to-tr from-cyan-500/15 via-blue-500/10 to-transparent rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        
        {/* Dynamic geometric shapes */}
        <div className="absolute top-20 left-10 w-32 h-32 border-2 border-blue-500/30 rounded-full animate-spin" style={{animationDuration: '15s'}}></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg rotate-45 animate-bounce" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 border-2 border-cyan-400/30 rounded-lg rotate-12 animate-pulse"></div>
        <div className="absolute bottom-60 right-40 w-20 h-20 bg-gradient-to-r from-purple-500/15 to-pink-500/15 rounded-full animate-ping" style={{animationDelay: '3s'}}></div>
        
        {/* Enhanced grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse" style={{animationDuration: '4s'}}></div>
        
        {/* Floating particles */}
        <div className="absolute top-32 right-1/4">
          <div className="relative animate-bounce" style={{animationDelay: '0.5s'}}>
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500/40 to-cyan-400/40 rounded-full animate-pulse"></div>
            <div className="absolute -top-2 -right-2 w-10 h-10 border-2 border-blue-400/30 rounded-full animate-spin" style={{animationDuration: '8s'}}></div>
          </div>
        </div>
        
        {/* Additional floating elements */}
        <div className="absolute top-1/3 left-1/4 w-4 h-4 bg-purple-400/30 rounded-full animate-bounce" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/3 right-1/3 w-3 h-3 bg-cyan-400/40 rounded-full animate-ping" style={{animationDelay: '4s'}}></div>
      </div>
      <Header />
      <main className="relative z-0">
        {children}
      </main>
      <Footer />
    </div>
  );
};


// =====================================================================
// HomePage Component
// =====================================================================
const HomePage = () => {
  useEffect(() => {
    // Handles scrolling to an anchor on the home page when navigating from another page
    const hash = window.location.hash;
    if (hash && !hash.startsWith('#/')) {
      const id = hash.substring(1);
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, []);

  return (
    <>
      {/* Enhanced Hero Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Enhanced Left Content */}
          <div className="space-y-10">
            <div className="space-y-8">
              <div className="inline-flex items-center bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-full px-6 py-3 backdrop-blur-sm group hover:from-blue-500/30 hover:to-cyan-500/30 transition-all duration-300">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full mr-3 animate-pulse"></div>
                <span className="text-blue-300 text-sm font-semibold tracking-wide">Connecting Education Worldwide</span>
                <div className="ml-2 text-blue-400 group-hover:translate-x-1 transition-transform duration-300">→</div>
              </div>
              
              <div className="space-y-6">
                <h1 className="text-6xl lg:text-7xl font-black text-white leading-tight">
                  Campus
                  <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    Buddy
                  </span>
                </h1>
                
                <p className="text-2xl text-gray-300 leading-relaxed max-w-2xl">
                  The ultimate platform connecting students, educators, and organizations. 
                  <span className="text-blue-300 font-semibold"> Experience seamless collaboration</span> and unlock endless possibilities.
                </p>
              </div>

              {/* Enhanced Stats */}
              <div className="flex items-center space-x-8 pt-4">
                <div className="text-center group">
                  <div className="text-3xl font-bold text-white group-hover:text-blue-400 transition-colors">50K+</div>
                  <div className="text-sm text-gray-400">Active Users</div>
                </div>
                <div className="w-px h-12 bg-gray-700"></div>
                <div className="text-center group">
                  <div className="text-3xl font-bold text-white group-hover:text-cyan-400 transition-colors">500+</div>
                  <div className="text-sm text-gray-400">Campus</div>
                </div>
                <div className="w-px h-12 bg-gray-700"></div>
                <div className="text-center group">
                  <div className="text-3xl font-bold text-white group-hover:text-purple-400 transition-colors">2.5K+</div>
                  <div className="text-sm text-gray-400">Companies</div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Right Visual */}
          <div className="relative hidden lg:flex items-center justify-center">
            {/* Enhanced Central Hub */}
            <div className="relative flex items-center justify-center">
              <div className="w-80 h-80 bg-gradient-to-br from-blue-500/20 via-purple-500/15 to-cyan-500/20 rounded-full flex items-center justify-center relative backdrop-blur-sm border border-white/10 shadow-2xl">
                {/* Enhanced connection lines */}
                <div className="absolute inset-0 z-0">
                  <div className="absolute top-1/2 left-1/2 w-1 h-40 bg-gradient-to-t from-blue-500/60 via-blue-400/40 to-transparent transform -translate-x-1/2 -translate-y-full rounded-full"></div>
                  <div className="absolute top-1/2 left-1/2 w-40 h-1 bg-gradient-to-r from-purple-500/60 via-purple-400/40 to-transparent transform -translate-y-1/2 rounded-full"></div>
                  <div className="absolute top-1/2 left-1/2 w-1 h-40 bg-gradient-to-b from-cyan-500/60 via-cyan-400/40 to-transparent transform -translate-x-1/2 rounded-full"></div>
                </div>

                {/* Enhanced center logo */}
                <div className="relative z-20 w-28 h-28 flex items-center justify-center">
                  <img src="/nobglogo.png" alt="Campus Buddy Logo" className="w-full h-full object-contain" />
                </div>
                
                {/* Enhanced orbiting elements */}
                <div className="absolute inset-0 animate-spin z-10" style={{ animationDuration: '25s' }}>
                  {/* Enhanced Student node */}
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-blue-500/60 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-blue-500/25 transition-all duration-300 backdrop-blur-sm">
                      <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Enhanced Teacher node */}
                  <div className="absolute top-1/2 -right-8 transform -translate-y-1/2">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-purple-500/60 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-purple-500/25 transition-all duration-300 backdrop-blur-sm">
                      <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Enhanced Organization node */}
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-cyan-500/60 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 backdrop-blur-sm">
                      <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced floating info cards */}
              <div className="absolute -top-12 -left-12 animate-bounce" style={{animationDelay: '0.5s'}}>
                <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-white font-semibold">50K+ Users</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Growing daily</div>
                </div>
              </div>
              
              <div className="absolute -bottom-12 -right-12 animate-bounce" style={{animationDelay: '2s'}}>
                <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-pulse"></div>
                    <span className="text-white font-semibold">500+ Campus</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Worldwide reach</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Selection Section */}
      <section id="choose-your-path" className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-5xl font-bold text-white mb-16">Choose Your Path</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {pathData.map((path) => (
              <PathCard key={path.title} {...path} />
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <div className="text-center mb-20">
          <h2 className="text-5xl font-bold text-white mb-6">Powerful Features</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">Everything you need to connect, learn, and grow in one integrated platform designed for the future of education</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-600/30 rounded-3xl p-10 hover:border-blue-500/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10 backdrop-blur-sm group">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500/30 to-blue-600/30 rounded-2xl flex items-center justify-center mb-6 group-hover:from-blue-500/50 group-hover:to-blue-600/50 transition-all duration-300 group-hover:scale-110">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors">Analytics Dashboard</h3>
            <p className="text-gray-300 text-lg leading-relaxed">Track progress, performance, and engagement with comprehensive real-time analytics and insights</p>
          </div>

          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-600/30 rounded-3xl p-10 hover:border-purple-500/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/10 backdrop-blur-sm group">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500/30 to-purple-600/30 rounded-2xl flex items-center justify-center mb-6 group-hover:from-purple-500/50 group-hover:to-purple-600/50 transition-all duration-300 group-hover:scale-110">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-purple-300 transition-colors">Community Hub</h3>
            <p className="text-gray-300 text-lg leading-relaxed">Connect with peers, join groups, and participate in dynamic discussions that shape your learning experience</p>
          </div>

          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-600/30 rounded-3xl p-10 hover:border-cyan-500/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/10 backdrop-blur-sm group">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/30 to-cyan-600/30 rounded-2xl flex items-center justify-center mb-6 group-hover:from-cyan-500/50 group-hover:to-cyan-600/50 transition-all duration-300 group-hover:scale-110">
              <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-cyan-300 transition-colors">Smart Matching</h3>
            <p className="text-gray-300 text-lg leading-relaxed">AI-powered connections between students, educators, and opportunities tailored to your goals and interests</p>
          </div>

          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-600/30 rounded-3xl p-10 hover:border-emerald-500/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/10 backdrop-blur-sm group">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/30 to-emerald-600/30 rounded-2xl flex items-center justify-center mb-6 group-hover:from-emerald-500/50 group-hover:to-emerald-600/50 transition-all duration-300 group-hover:scale-110">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-emerald-300 transition-colors">Mobile First</h3>
            <p className="text-gray-300 text-lg leading-relaxed">Access your education anywhere with our responsive platform designed for seamless mobile experiences</p>
          </div>

          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-600/30 rounded-3xl p-10 hover:border-rose-500/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-rose-500/10 backdrop-blur-sm group">
            <div className="w-16 h-16 bg-gradient-to-br from-rose-500/30 to-rose-600/30 rounded-2xl flex items-center justify-center mb-6 group-hover:from-rose-500/50 group-hover:to-rose-600/50 transition-all duration-300 group-hover:scale-110">
              <svg className="w-8 h-8 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-rose-300 transition-colors">Secure Platform</h3>
            <p className="text-gray-300 text-lg leading-relaxed">Enterprise-grade security protecting your data with end-to-end encryption and privacy controls</p>
          </div>

          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-600/30 rounded-3xl p-10 hover:border-amber-500/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/10 backdrop-blur-sm group">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500/30 to-amber-600/30 rounded-2xl flex items-center justify-center mb-6 group-hover:from-amber-500/50 group-hover:to-amber-600/50 transition-all duration-300 group-hover:scale-110">
              <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-amber-300 transition-colors">Growth Tracking</h3>
            <p className="text-gray-300 text-lg leading-relaxed">Visualize your learning journey with detailed progress tracking and personalized growth insights</p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-6">What Our Community Says</h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">Real stories from students, educators, and organizations transforming education</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border border-blue-500/20 rounded-3xl p-8 backdrop-blur-sm">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-4">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <h4 className="text-white font-semibold">Sarah Chen</h4>
                <p className="text-blue-300 text-sm">Computer Science Student</p>
              </div>
            </div>
            <p className="text-gray-300 italic">"Campus Buddy transformed how I collaborate with classmates and connect with industry professionals. The networking opportunities are incredible!"</p>
          </div>

          <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 border border-purple-500/20 rounded-3xl p-8 backdrop-blur-sm">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <div>
                <h4 className="text-white font-semibold">Prof. Maria Rodriguez</h4>
                <p className="text-purple-300 text-sm">Mathematics Educator</p>
              </div>
            </div>
            <p className="text-gray-300 italic">"The analytics dashboard helps me understand student engagement like never before. I can tailor my teaching to each student's needs."</p>
          </div>

          <div className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/20 border border-cyan-500/20 rounded-3xl p-8 backdrop-blur-sm">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center mr-4">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <div>
                <h4 className="text-white font-semibold">TechCorp Solutions</h4>
                <p className="text-cyan-300 text-sm">Recruiting Partner</p>
              </div>
            </div>
            <p className="text-gray-300 italic">"We've found amazing talent through Campus Buddy. The platform makes it easy to connect with qualified candidates from top universities."</p>
          </div>
        </div>
      </section>
    </>
  );
};


// =====================================================================
// AboutPage Component
// =====================================================================
const TeamMember = ({ name, role, imageUrl }: { name: string; role: string; imageUrl: string }) => (
  <div className="text-center group">
    <div className="relative w-32 h-32 mx-auto mb-4">
      <img className="rounded-full w-full h-full object-cover border-4 border-gray-700 group-hover:border-blue-500 transition-all duration-300" src={imageUrl} alt={name} />
      <div className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-cyan-400 animate-spin" style={{ animationDuration: '5s' }}></div>
    </div>
    <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">{name}</h3>
    <p className="text-gray-400">{role}</p>
  </div>
);

const AboutPage = () => {
  return (
    <div className="py-24 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-20">
          <h1 className="text-6xl lg:text-7xl font-black text-white leading-tight">
            About 
            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Campus Buddy
            </span>
          </h1>
          <p className="mt-6 text-xl text-gray-300 max-w-3xl mx-auto">
            We are redefining education by building bridges between students, educators, and organizations worldwide.
          </p>
        </div>

        {/* Mission and Vision Section */}
        <div className="grid md:grid-cols-2 gap-16 items-center mb-32">
          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-600/30 rounded-3xl p-10 backdrop-blur-sm">
            <h2 className="text-4xl font-bold text-white mb-6">Our Mission</h2>
            <p className="text-lg text-gray-300 leading-relaxed">
              To empower every student with the connections and resources they need to succeed. We strive to create a global, interconnected educational ecosystem where knowledge is accessible, collaboration is seamless, and opportunities are limitless.
            </p>
          </div>
          <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-600/30 rounded-3xl p-10 backdrop-blur-sm">
            <h2 className="text-4xl font-bold text-white mb-6">Our Vision</h2>
            <p className="text-lg text-gray-300 leading-relaxed">
              To be the definitive platform for the future of learning. We envision a world where education transcends physical boundaries, fostering a vibrant community of learners, mentors, and innovators who collectively shape a better tomorrow.
            </p>
          </div>
        </div>

        {/* Team Section */}
        <div className="text-center">
          <h2 className="text-5xl font-bold text-white mb-16">Meet Our Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">
            <TeamMember name="Alex Johnson" role="Founder & CEO" imageUrl="https://i.pravatar.cc/150?img=11" />
            <TeamMember name="Maria Garcia" role="Head of Product" imageUrl="https://i.pravatar.cc/150?img=25" />
            <TeamMember name="James Lee" role="Lead Engineer" imageUrl="https://i.pravatar.cc/150?img=14" />
            <TeamMember name="Priya Patel" role="UX/UI Designer" imageUrl="https://i.pravatar.cc/150?img=32" />
          </div>
        </div>
      </div>
    </div>
  );
};


// =====================================================================
// ContactPage Component
// =====================================================================
const ContactInfo = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
    <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500/30 to-blue-600/30 rounded-2xl flex items-center justify-center">
            {icon}
        </div>
        <div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <div className="text-gray-300">{children}</div>
        </div>
    </div>
);

const ContactPage = () => {
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        alert('Thank you for your message! We will get back to you soon.');
        // Here you would typically handle the form submission, e.g., send data to an API
    };

  return (
    <div className="py-24 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-20">
          <h1 className="text-6xl lg:text-7xl font-black text-white leading-tight">
            Get In Touch
          </h1>
          <p className="mt-6 text-xl text-gray-300 max-w-3xl mx-auto">
            Have a question or want to work together? We’d love to hear from you.
          </p>
        </div>

        {/* Contact Grid */}
        <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left Side: Info */}
            <div className="space-y-12">
                <ContactInfo
                    title="Our Office"
                    icon={<svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                >
                    <p>123 Innovation Drive</p>
                    <p>Tech City, TC 54321</p>
                </ContactInfo>
                <ContactInfo
                    title="Email Us"
                    icon={<svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                >
                    <a href="mailto:hello@campusbuddy.com" className="hover:text-blue-400 transition-colors">hello@campusbuddy.com</a>
                </ContactInfo>
                <ContactInfo
                    title="Call Us"
                    icon={<svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
                >
                     <p>(123) 456-7890</p>
                </ContactInfo>
            </div>

            {/* Right Side: Form */}
            <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-gray-600/50 rounded-3xl p-10 backdrop-blur-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                        <input type="text" name="name" id="name" required className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                        <input type="email" name="email" id="email" required className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                    </div>
                    <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
                        <input type="text" name="subject" id="subject" required className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                    </div>
                    <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">Message</label>
                        <textarea name="message" id="message" rows={4} required className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"></textarea>
                    </div>
                    <div>
                        <button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 rounded-full text-white font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105">
                            Send Message
                        </button>
                    </div>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
};


// =====================================================================
// App Component - The Router
// =====================================================================
const App: React.FC = () => {
  const [route, setRoute] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => {
      const newHash = window.location.hash;
      setRoute(newHash);
      // Only scroll to top on "page" changes (e.g., #/about), not on-page anchor links (e.g., #features)
      if (newHash.startsWith('#/')) {
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    
    // Initial scroll check for when the page loads directly on a sub-page
    if (window.location.hash.startsWith('#/')) {
        window.scrollTo(0, 0);
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const renderPage = () => {
    switch (route) {
      case '#/about':
        return <AboutPage />;
      case '#/contact':
        return <ContactPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <Layout>
      {renderPage()}
    </Layout>
  );
};

export default App;