import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FiTarget, FiEye, FiHeart, FiUsers, FiHome, FiAward, FiArrowRight, FiStar, FiZap, FiLayers, FiGlobe } from 'react-icons/fi';

// Custom hook for scroll animation
const useScrollAnimation = (threshold = 0.1) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold]);

  return [ref, isVisible];
};

// Mouse parallax hook
const useMouseParallax = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  return mousePosition;
};

// Counter animation component
const AnimatedCounter = ({ end, duration = 2000, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const [ref, isVisible] = useScrollAnimation(0.3);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (isVisible && !hasAnimated.current) {
      hasAnimated.current = true;
      let startTime;
      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        // Easing function for smoother animation
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setCount(Math.floor(easeOut * end));
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [isVisible, end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
};

// Typewriter effect component
const TypewriterText = ({ text, delay = 100 }) => {
  const [displayText, setDisplayText] = useState('');
  const [ref, isVisible] = useScrollAnimation(0.5);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (isVisible && !hasAnimated.current) {
      hasAnimated.current = true;
      let index = 0;
      const timer = setInterval(() => {
        if (index <= text.length) {
          setDisplayText(text.slice(0, index));
          index++;
        } else {
          clearInterval(timer);
        }
      }, delay);
      return () => clearInterval(timer);
    }
  }, [isVisible, text, delay]);

  return <span ref={ref}>{displayText}<span className="animate-pulse">|</span></span>;
};

// Floating particles component
const ParticleField = ({ count = 50 }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${Math.random() * 4 + 2}px`,
            height: `${Math.random() * 4 + 2}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: i % 3 === 0 ? '#ED7600' : i % 3 === 1 ? 'rgba(255,255,255,0.5)' : 'rgba(237,118,0,0.5)',
            animation: `particle-float ${8 + Math.random() * 12}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
            opacity: 0.4 + Math.random() * 0.6
          }}
        />
      ))}
    </div>
  );
};

// 3D Tilt card component
const TiltCard = ({ children, className = '' }) => {
  const cardRef = useRef(null);
  const [transform, setTransform] = useState('');
  const [glare, setGlare] = useState({ x: 50, y: 50 });

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    const tiltX = (y - 0.5) * 20;
    const tiltY = (x - 0.5) * -20;
    
    setTransform(`perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`);
    setGlare({ x: x * 100, y: y * 100 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTransform('perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)');
    setGlare({ x: 50, y: 50 });
  }, []);

  return (
    <div
      ref={cardRef}
      className={`relative transition-transform duration-300 ease-out ${className}`}
      style={{ transform, transformStyle: 'preserve-3d' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <div 
        className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-30 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.8) 0%, transparent 60%)`
        }}
      />
    </div>
  );
};

const AboutUsPage = () => {
  const [heroRef, heroVisible] = useScrollAnimation(0.1);
  const [storyRef, storyVisible] = useScrollAnimation(0.2);
  const [missionRef, missionVisible] = useScrollAnimation(0.2);
  const [valuesRef, valuesVisible] = useScrollAnimation(0.2);
  const [ctaRef, ctaVisible] = useScrollAnimation(0.2);
  const [timelineRef, timelineVisible] = useScrollAnimation(0.2);
  const mousePosition = useMouseParallax();
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
        <div 
          className="h-full bg-gradient-to-r from-[#ED7600] via-[#FF9A3C] to-[#ED7600] transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(20px) rotate(-5deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(60px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-left {
          from { opacity: 0; transform: translateX(-60px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-right {
          from { opacity: 0; transform: translateX(60px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.5) rotate(-10deg); }
          to { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes particle-float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate(100px, -200px) rotate(360deg); opacity: 0; }
        }
        @keyframes morph {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(237, 118, 0, 0.3); }
          50% { box-shadow: 0 0 40px rgba(237, 118, 0, 0.6), 0 0 60px rgba(237, 118, 0, 0.3); }
        }
        @keyframes text-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes rotate-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes dash {
          to { stroke-dashoffset: 0; }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-reverse { animation: float-reverse 7s ease-in-out infinite; }
        .animate-float-slow { animation: float 10s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }
        .animate-slide-up { animation: slide-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-left { animation: slide-left 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-right { animation: slide-right 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-scale-in { animation: scale-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-bounce-subtle { animation: bounce-subtle 2s ease-in-out infinite; }
        .animate-morph { animation: morph 8s ease-in-out infinite; }
        .animate-gradient { 
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite; 
        }
        .animate-glow { animation: glow-pulse 2s ease-in-out infinite; }
        .animate-rotate-slow { animation: rotate-slow 20s linear infinite; }
        .text-shimmer {
          background: linear-gradient(90deg, #ED7600, #FFD93D, #ED7600);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: text-shimmer 3s linear infinite;
        }
        .glassmorphism {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
        .delay-500 { animation-delay: 500ms; }
        .delay-600 { animation-delay: 600ms; }
        .opacity-0 { opacity: 0; }
      `}</style>

      {/* Hero Section */}
      <section ref={heroRef} className="relative bg-[#2F3D57] py-24 md:py-36 overflow-hidden min-h-[90vh] flex items-center">
        {/* Animated morphing background blobs */}
        <div className="absolute inset-0">
          <div 
            className="absolute w-[600px] h-[600px] bg-gradient-to-br from-[#ED7600] to-[#FF6B6B] animate-morph animate-pulse-glow filter blur-3xl opacity-30"
            style={{ 
              top: '-20%', 
              left: '-10%',
              transform: `translate(${mousePosition.x * 30}px, ${mousePosition.y * 30}px)`
            }}
          />
          <div 
            className="absolute w-[500px] h-[500px] bg-gradient-to-br from-[#4ECDC4] to-[#ED7600] animate-morph animate-pulse-glow filter blur-3xl opacity-20"
            style={{ 
              bottom: '-20%', 
              right: '-10%',
              animationDelay: '2s',
              transform: `translate(${mousePosition.x * -20}px, ${mousePosition.y * -20}px)`
            }}
          />
          <div 
            className="absolute w-[400px] h-[400px] bg-gradient-to-br from-[#A855F7] to-[#ED7600] animate-morph animate-pulse-glow filter blur-3xl opacity-20"
            style={{ 
              top: '30%', 
              left: '50%',
              animationDelay: '4s',
              transform: `translate(${mousePosition.x * 40}px, ${mousePosition.y * 40}px)`
            }}
          />
        </div>

        {/* Particle field */}
        <ParticleField count={40} />
        
        {/* Geometric decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 border-2 border-[#ED7600]/30 rounded-2xl animate-float" style={{ transform: `translate(${mousePosition.x * 20}px, ${mousePosition.y * 20}px)` }}></div>
          <div className="absolute top-40 right-20 w-24 h-24 border-2 border-white/20 rounded-full animate-float-reverse animate-rotate-slow"></div>
          <div className="absolute bottom-32 left-1/4 w-16 h-16 bg-[#ED7600]/20 rounded-xl animate-float-slow rotate-45"></div>
          <div className="absolute bottom-20 right-1/3 w-20 h-20 border-2 border-[#4ECDC4]/30 rounded-full animate-float"></div>
          <div className="absolute top-1/3 right-1/4 w-12 h-12 bg-white/5 rounded-lg animate-bounce-subtle"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className={`text-center max-w-5xl mx-auto ${heroVisible ? 'animate-slide-up' : 'opacity-0'}`}>
            <div className="inline-flex items-center gap-3 glassmorphism px-6 py-3 rounded-full mb-8 animate-glow">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ED7600] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#ED7600]"></span>
              </span>
              <span className="text-white/90 text-sm font-medium tracking-wide">Discover Our Journey</span>
              <FiStar className="text-[#ED7600] animate-pulse" />
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight">
              About{' '}
              <span className="relative inline-block">
                <span className="text-shimmer">NextGenArchitect</span>
                <svg className="absolute -bottom-3 left-0 w-full h-4" viewBox="0 0 300 12" fill="none">
                  <path d="M2 10C80 2 220 2 298 10" stroke="url(#gradient)" strokeWidth="4" strokeLinecap="round" style={{strokeDasharray: 300, strokeDashoffset: 300, animation: 'dash 2s ease-out 0.5s forwards'}}/>
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ED7600" />
                      <stop offset="50%" stopColor="#FFD93D" />
                      <stop offset="100%" stopColor="#ED7600" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h1>
            
            <p className={`text-xl md:text-2xl text-gray-300 leading-relaxed max-w-3xl mx-auto mb-12 ${heroVisible ? 'animate-slide-up' : 'opacity-0'}`} style={{animationDelay: '200ms'}}>
              Transforming the way people design their dream homes through innovative{' '}
              <span className="text-[#ED7600] font-semibold">AI-powered</span> floor plan generation.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section ref={storyRef} className="py-20 md:py-32 relative">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-0 w-96 h-96 bg-[#ED7600]/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#2F3D57]/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className={storyVisible ? 'animate-slide-up' : 'opacity-0'}>
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-[#ED7600]/20 to-[#ED7600]/5 px-5 py-2.5 rounded-full mb-8 group cursor-default hover:from-[#ED7600]/30 hover:to-[#ED7600]/10 transition-all duration-300">
                <FiHeart className="text-[#ED7600] group-hover:scale-125 transition-transform" />
                <span className="text-[#ED7600] font-semibold tracking-wide">Our Story</span>
                <FiZap className="text-[#ED7600] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold text-[#2F3D57] mb-8 leading-tight">
                How It All{' '}
                <span className="relative inline-block">
                  <span className="text-[#ED7600]">Started</span>
                  <svg className="absolute -bottom-2 left-0 w-full h-3" viewBox="0 0 100 12" fill="none">
                    <path d="M2 10Q50 2 98 10" stroke="#ED7600" strokeWidth="3" strokeLinecap="round" strokeDasharray="100" strokeDashoffset="100" style={{animation: storyVisible ? 'dash 1s ease-out 0.5s forwards' : 'none'}}/>
                  </svg>
                </span>
              </h2>
              
              <div className="space-y-6 text-gray-600 leading-relaxed text-lg">
                {[
                  "NextGenArchitect was created to solve a common problem: traditional home design can process be complicated, expensive, and out of reach for many. We realized that AI could simplify this journey for everyone.",
                  "Our goal is to make professional design ideas accessible. By building a platform specifically tailored to housing societies and their rules, we are aiming to bridge the gap between abstract ideas and practical floor plans.",
                  "Today, we continue to develop intuitive tools that let you easily design, refine, and visualize your future home without needing prior architectural knowledge."
                ].map((text, idx) => (
                  <p 
                    key={idx} 
                    className="relative pl-6 border-l-2 border-transparent hover:border-[#ED7600] hover:pl-8 transition-all duration-500 hover:text-gray-800"
                    style={{ animationDelay: `${idx * 200}ms` }}
                  >
                    {text}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section ref={missionRef} className="py-20 md:py-32 bg-white relative overflow-hidden">
        {/* Animated background decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#ED7600]/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#2F3D57]/10 to-transparent rounded-full translate-y-1/2 -translate-x-1/2"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-gray-100 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-gray-100 rounded-full"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className={`text-center mb-20 ${missionVisible ? 'animate-slide-up' : 'opacity-0'}`}>
              <div className="inline-flex items-center gap-2 bg-[#2F3D57]/5 px-4 py-2 rounded-full mb-6">
                <FiTarget className="text-[#ED7600]" />
                <span className="text-[#2F3D57] font-medium">Purpose Driven</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-[#2F3D57] mb-6">
                Our <span className="text-shimmer">Mission & Vision</span>
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                Guided by purpose and driven by innovation, we're committed to transforming the architectural landscape.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-10">
              {/* Mission Statement */}
              <TiltCard className={`group ${missionVisible ? 'animate-slide-left' : 'opacity-0'}`} style={{animationDelay: '200ms'}}>
                <div className="relative h-full bg-gradient-to-br from-white via-gray-50 to-white rounded-3xl p-10 border border-gray-100 shadow-xl overflow-hidden">
                  {/* Animated top border */}
                  <div className="absolute top-0 left-0 w-full h-1.5 overflow-hidden rounded-t-3xl">
                    <div className="h-full bg-gradient-to-r from-[#ED7600] via-[#FFD93D] to-[#ED7600] animate-gradient"></div>
                  </div>
                  
                  {/* Glow effect */}
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#ED7600]/10 rounded-full blur-3xl group-hover:bg-[#ED7600]/20 transition-all duration-700"></div>
                  
                  <div className="relative">
                    <div className="flex items-center gap-5 mb-8">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#ED7600] to-[#D56900] rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                          <FiTarget className="w-8 h-8 text-white" />
                        </div>
                        <div className="absolute -inset-2 bg-[#ED7600]/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-[#2F3D57]">Our Mission</h3>
                        <p className="text-[#ED7600] text-sm font-medium">What drives us forward</p>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 leading-relaxed mb-6 text-lg">
                      To empower every individual with the tools and technology needed to design their perfect living space. We strive to make architectural planning simple, accessible, and affordable.
                    </p>
                    
                    <ul className="space-y-4">
                      {[
                        { text: 'Simplify the home design process through AI-powered solutions', icon: FiZap },
                        { text: 'Bridge the gap between housing societies and plot owners', icon: FiLayers },
                        { text: 'Provide compliance-ready floor plans that meet regulations', icon: FiAward }
                      ].map((item, idx) => (
                        <li 
                          key={idx} 
                          className="flex items-start gap-4 group/item p-3 -ml-3 rounded-xl hover:bg-[#ED7600]/5 transition-all duration-300 cursor-default"
                        >
                          <div className="w-8 h-8 bg-[#ED7600]/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover/item:bg-[#ED7600] group-hover/item:scale-110 transition-all duration-300">
                            <item.icon className="w-4 h-4 text-[#ED7600] group-hover/item:text-white transition-colors" />
                          </div>
                          <span className="text-gray-600 group-hover/item:text-gray-800 transition-colors">{item.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TiltCard>

              {/* Vision Statement */}
              <TiltCard className={`group ${missionVisible ? 'animate-slide-right' : 'opacity-0'}`} style={{animationDelay: '400ms'}}>
                <div className="relative h-full bg-gradient-to-br from-[#2F3D57] via-[#3d4f6f] to-[#1a2435] rounded-3xl p-10 shadow-xl overflow-hidden">
                  {/* Animated top border */}
                  <div className="absolute top-0 left-0 w-full h-1.5 overflow-hidden rounded-t-3xl">
                    <div className="h-full bg-gradient-to-r from-[#4ECDC4] via-[#ED7600] to-[#4ECDC4] animate-gradient"></div>
                  </div>
                  
                  {/* Pattern overlay */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0" style={{
                      backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                      backgroundSize: '24px 24px'
                    }}></div>
                  </div>
                  
                  {/* Glow effects */}
                  <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#4ECDC4]/20 rounded-full blur-3xl group-hover:bg-[#4ECDC4]/30 transition-all duration-700"></div>
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#ED7600]/20 rounded-full blur-3xl group-hover:bg-[#ED7600]/30 transition-all duration-700"></div>
                  
                  <div className="relative">
                    <div className="flex items-center gap-5 mb-8">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#4ECDC4] to-[#2F9E94] rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
                          <FiEye className="w-8 h-8 text-white" />
                        </div>
                        <div className="absolute -inset-2 bg-[#4ECDC4]/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">Our Vision</h3>
                        <p className="text-[#4ECDC4] text-sm font-medium">Where we're heading</p>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 leading-relaxed mb-6 text-lg">
                      To become the leading platform for intelligent home design, where every dream home begins its journey from concept to reality with just a few clicks.
                    </p>
                    
                    <ul className="space-y-4">
                      {[
                        { text: 'Create a future where everyone can be their own architect', icon: FiStar, color: '#4ECDC4' },
                        { text: 'Build a connected ecosystem of societies, designers, and homeowners', icon: FiGlobe, color: '#ED7600' },
                        { text: 'Lead the revolution in AI-driven architectural solutions', icon: FiZap, color: '#FFD93D' }
                      ].map((item, idx) => (
                        <li 
                          key={idx} 
                          className="flex items-start gap-4 group/item p-3 -ml-3 rounded-xl hover:bg-white/5 transition-all duration-300 cursor-default"
                        >
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 group-hover/item:scale-110 transition-all duration-300"
                            style={{ backgroundColor: `${item.color}20` }}
                          >
                            <item.icon className="w-4 h-4" style={{ color: item.color }} />
                          </div>
                          <span className="text-gray-300 group-hover/item:text-white transition-colors">{item.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TiltCard>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section ref={valuesRef} className="py-24 md:py-32 bg-gradient-to-br from-[#2F3D57] via-[#1a2435] to-[#2F3D57] relative overflow-hidden">
        {/* Animated particle background */}
        <ParticleField count={30} />
        
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#ED7600]/20 rounded-full blur-[100px] animate-pulse-glow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-[#4ECDC4]/15 rounded-full blur-[100px] animate-pulse-glow" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#A855F7]/10 rounded-full blur-[120px] animate-pulse-glow" style={{animationDelay: '1s'}}></div>
        </div>
        
        {/* Geometric patterns */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className={`text-center mb-20 ${valuesVisible ? 'animate-slide-up' : 'opacity-0'}`}>
              <div className="inline-flex items-center gap-2 glassmorphism px-5 py-2.5 rounded-full mb-6">
                <FiHeart className="text-[#ED7600]" />
                <span className="text-white/90 font-medium">What We Stand For</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Our Core <span className="text-shimmer">Values</span>
              </h2>
              <p className="text-gray-300 max-w-2xl mx-auto text-lg">
                The principles that guide everything we do at NextGenArchitect.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  Icon: FiTarget,
                  title: 'Innovation',
                  description: 'Constantly pushing boundaries with cutting-edge AI technology',
                  gradient: 'from-[#ED7600] to-[#FF6B6B]',
                  iconColor: '#ED7600'
                },
                {
                  Icon: FiUsers,
                  title: 'Accessibility',
                  description: 'Making professional design tools available to everyone',
                  gradient: 'from-[#4ECDC4] to-[#2F9E94]',
                  iconColor: '#4ECDC4'
                },
                {
                  Icon: FiAward,
                  title: 'Quality',
                  description: 'Delivering excellence in every floor plan we generate',
                  gradient: 'from-[#FFD93D] to-[#F59E0B]',
                  iconColor: '#FFD93D'
                },
                {
                  Icon: FiHeart,
                  title: 'Sustainability',
                  description: 'Promoting eco-friendly and sustainable design practices',
                  gradient: 'from-[#10B981] to-[#059669]',
                  iconColor: '#10B981'
                }
              ].map((value, index) => (
                <div 
                  key={index}
                  className={`group relative ${valuesVisible ? 'animate-scale-in' : 'opacity-0'}`}
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="relative glassmorphism rounded-3xl p-8 text-center hover:bg-white/20 transition-all duration-700 transform hover:-translate-y-4 hover:scale-105 cursor-default h-full overflow-hidden">
                    {/* Animated gradient border */}
                    <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${value.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10`}></div>
                    <div className="absolute inset-[2px] rounded-3xl bg-[#2F3D57] group-hover:bg-[#1a2435] transition-colors duration-500 -z-10"></div>
                    
                    {/* Glowing orb on hover */}
                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-br ${value.gradient} rounded-full blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-700`}></div>
                    
                    <div className="relative">
                      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center transform group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500" style={{ backgroundColor: `${value.iconColor}20` }}>
                        <value.Icon className="w-8 h-8" style={{ color: value.iconColor }} />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-[#ED7600] transition-colors duration-500">
                        {value.title}
                      </h3>
                      <p className="text-gray-400 group-hover:text-gray-200 transition-colors duration-500 leading-relaxed">
                        {value.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features Section */}
      <section ref={timelineRef} className="py-20 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-[#ED7600]/30 to-transparent"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className={`text-center mb-16 ${timelineVisible ? 'animate-slide-up' : 'opacity-0'}`}>
              <div className="inline-flex items-center gap-2 bg-[#ED7600]/10 px-4 py-2 rounded-full mb-6">
                <FiLayers className="text-[#ED7600]" />
                <span className="text-[#ED7600] font-medium">Why Choose Us</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#2F3D57] mb-4">
                Platform <span className="text-[#ED7600]">Features</span>
              </h2>
              <p className="text-gray-600 text-lg">Everything you need to design your home intelligently</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {[
                { title: 'AI-Generated Floor Plans', desc: 'Instantly create optimized floor plans driven by powerful AI technology based on your specific requirements.', icon: FiZap },
                { title: 'Plot-Based Design Suggestions', desc: 'Get smart design recommendations perfectly tailored to the exact dimensions and rules of your housing plot.', icon: FiTarget },
                { title: 'Easy Home Planning', desc: 'A simple, intuitive interface that allows anyone to plan their home without needing prior architectural experience.', icon: FiHome },
                { title: 'Support for Housing Societies', desc: 'Built-in tools that connect homeowners directly with trusted housing societies for seamless planning and approvals.', icon: FiUsers }
              ].map((item, idx) => (
                <div 
                  key={idx}
                  className={`bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group cursor-default border border-gray-100 ${timelineVisible ? 'animate-slide-up' : 'opacity-0'}`}
                  style={{ animationDelay: `${idx * 150}ms` }}
                >
                  <div className="w-14 h-14 bg-[#ED7600]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#ED7600] group-hover:scale-110 transition-all duration-300">
                    <item.icon className="w-7 h-7 text-[#ED7600] group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold text-[#2F3D57] mb-3 group-hover:text-[#ED7600] transition-colors">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section ref={ctaRef} className="py-24 md:py-32 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-40 h-40 border-2 border-[#ED7600]/10 rounded-full animate-float-slow"></div>
          <div className="absolute bottom-20 right-20 w-32 h-32 border-2 border-[#2F3D57]/10 rounded-2xl animate-float-reverse rotate-45"></div>
          <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-[#ED7600]/5 rounded-full animate-bounce-subtle"></div>
          <div className="absolute bottom-1/3 left-1/4 w-16 h-16 bg-[#4ECDC4]/5 rounded-lg animate-float rotate-12"></div>
          
          {/* Large gradient shapes */}
          <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-t from-[#ED7600]/10 to-transparent rounded-t-full"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className={`max-w-4xl mx-auto text-center ${ctaVisible ? 'animate-slide-up' : 'opacity-0'}`}>
            {/* Decorative badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ED7600]/10 to-[#ED7600]/5 px-5 py-2.5 rounded-full mb-8 animate-bounce-subtle">
              <FiStar className="text-[#ED7600]" />
              <span className="text-[#2F3D57] font-medium">Start Your Journey</span>
              <FiArrowRight className="text-[#ED7600]" />
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#2F3D57] mb-8 leading-tight">
              Ready to Design Your{' '}
              <span className="relative inline-block">
                <span className="text-shimmer">Dream Home?</span>
              </span>
            </h2>
            
            <p className="text-gray-600 mb-12 text-xl max-w-2xl mx-auto leading-relaxed">
              Join thousands of happy homeowners who have already started their journey with NextGenArchitect.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <a 
                href="/society" 
                className="group relative px-10 py-5 rounded-2xl overflow-hidden transition-all duration-500 transform hover:scale-105 hover:shadow-2xl"
              >
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#ED7600] via-[#FF8C00] to-[#ED7600] animate-gradient"></div>
                
                {/* Shine effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </div>
                
                <span className="relative z-10 flex items-center justify-center gap-3 text-white font-bold text-lg">
                  Explore Societies
                  <FiArrowRight className="transform group-hover:translate-x-2 transition-transform duration-300" />
                </span>
              </a>
              
              <a 
                href="/login" 
                className="group relative px-10 py-5 rounded-2xl overflow-hidden transition-all duration-500 transform hover:scale-105 hover:shadow-2xl border-2 border-[#2F3D57]"
              >
                <div className="absolute inset-0 bg-[#2F3D57] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                
                <span className="relative z-10 flex items-center justify-center gap-3 text-[#2F3D57] group-hover:text-white font-bold text-lg transition-colors duration-300">
                  Get Started
                  <FiZap className="transform group-hover:rotate-12 group-hover:scale-125 transition-all duration-300" />
                </span>
              </a>
            </div>
            
            {/* Trust badges */}
            <div className={`mt-16 flex flex-wrap justify-center items-center gap-8 ${ctaVisible ? 'animate-slide-up' : 'opacity-0'}`} style={{animationDelay: '400ms'}}>
              {[
                { icon: FiUsers, text: `AI-Powered` },
                { icon: FiAward, text: 'Top Rated Design Tool' },
                { icon: FiTarget, text: `Trusted by Homeowners` }
              ].map((badge, idx) => (
                <div key={idx} className="flex items-center gap-2 text-gray-500 hover:text-[#ED7600] transition-colors cursor-default">
                  <badge.icon className="w-5 h-5" />
                  <span className="font-medium">{badge.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUsPage;
