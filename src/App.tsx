import React, { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import CyberGyroScene from './components/CyberGyroScene';

const BG_IMAGE_1 = '/assets/aistudio/Gemini_Generated_Image_ptr2q2ptr2q2ptr2_99804165.jpg';
const BG_IMAGE_2 = '/assets/aistudio/Gemini_Generated_Image_ptr2q2ptr2q2ptr2_1__477fdb5b.jpg';

const LOGO_PATH =
  'M 256 64 L 256 128 L 192.5 128 L 160 95 L 128 64 L 96 95 L 63.5 128 L 64 128 L 128 192 L 128 256 L 64.5 256 L 32 223 L 0 192 L 0 64 L 64 0 L 192 0 Z M 256 192 L 256 256 L 192.5 256 L 160 223 L 128 192 L 128 128 L 192 128 Z';

interface NavItem {
  id: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'works', label: 'Works' },
  { id: 'skills', label: 'Skills' },
  { id: 'education', label: 'Education' },
  { id: 'contact', label: 'Contact' },
];

interface ArcSpec {
  id: string;
  r: number;
  startDeg: number;
  endDeg: number;
  dotDeg: number;
  value: string;
  suffix: string;
  label: string;
}

const ARC_CENTER = { x: -110, y: 300 };

const ARC_SPECS: ArcSpec[] = [
  {
    id: 'arc-1',
    r: 330,
    startDeg: -92,
    endDeg: 16,
    dotDeg: -46,
    value: '04',
    suffix: '+',
    label: 'CORE DISCIPLINES',
  },
  {
    id: 'arc-2',
    r: 395,
    startDeg: -56,
    endDeg: 60,
    dotDeg: 2,
    value: '02',
    suffix: '×',
    label: 'WEB & SEO',
  },
  {
    id: 'arc-3',
    r: 460,
    startDeg: -14,
    endDeg: 72,
    dotDeg: 44,
    value: '100',
    suffix: '%',
    label: 'CUSTOM CODE',
  },
];

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

const WORKS_ITEMS = [
  {
    index: '01',
    title: 'Web Development',
    summary:
      'Production-grade web applications engineered from scratch with semantic HTML, TypeScript, React, and fast rendering pipelines built for conversion and Core Web Vitals.',
    deliverables: 'Custom architecture · Responsive interfaces · Performance optimization',
  },
  {
    index: '02',
    title: 'Technical & Organic SEO',
    summary:
      'Search engineering designed into the codebase—clean crawl architecture, structured schema markup, keyword taxonomy, and high-authority content velocity.',
    deliverables: 'Technical audits · Schema & metadata · Search ranking growth',
  },
  {
    index: '03',
    title: 'Brand & Web Design',
    summary:
      'Visual systems that pair crisp typographic hierarchy with purposeful interactive motion so visitors grasp your value proposition in seconds.',
    deliverables: 'UI/UX systems · Interactive hero craft · Conversion flows',
  },
  {
    index: '04',
    title: 'AI Ads & Growth Marketing',
    summary:
      'Data-backed ad creative testing and automated campaign optimization powered by machine-learning audience targeting and clear attribution.',
    deliverables: 'AI ad creatives · Funnel analytics · Paid acquisition',
  },
];

const SKILLS_ITEMS = [
  {
    index: '01',
    name: 'Coding',
    detail:
      'Full-stack engineering in TypeScript, React, modern CSS, and server-side APIs with clean, maintainable structure.',
  },
  {
    index: '02',
    name: 'Web Designer',
    detail:
      'High-contrast layouts, responsive grid systems, micro-interactions, and accessible interfaces across desktop and mobile.',
  },
  {
    index: '03',
    name: 'Marketing',
    detail:
      'Positioning, conversion copywriting, organic search strategy, and full-funnel customer acquisition.',
  },
  {
    index: '04',
    name: 'AI Ads',
    detail:
      'AI-assisted creative iteration, predictive audience segmentation, and ROI-focused campaign scaling.',
  },
];

export default function App() {
  const [activeNav, setActiveNav] = useState<string>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Form state for project reservation / Connect
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [projectScope, setProjectScope] = useState('Web Development & SEO');
  const [projectMessage, setProjectMessage] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedInquiry, setSubmittedInquiry] = useState<{
    name: string;
    scope: string;
  } | null>(null);

  const heroRef = useRef<HTMLElement | null>(null);
  const gridPatternRef = useRef<SVGPatternElement | null>(null);
  const revealLayerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const scrollToSection = (sectionId: string, focusForm = false) => {
    setActiveNav(sectionId);
    setMobileMenuOpen(false);
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (focusForm) {
      window.setTimeout(() => {
        nameInputRef.current?.focus({ preventScroll: true });
      }, 450);
    }
  };

  useEffect(() => {
    const heroEl = heroRef.current;
    const canvas = canvasRef.current;
    if (!heroEl || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();

    // Clear mask initially so reveal layer starts invisible
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (revealLayerRef.current) {
      const emptyUrl = canvas.toDataURL();
      revealLayerRef.current.style.maskImage = `url(${emptyUrl})`;
      revealLayerRef.current.style.webkitMaskImage = `url(${emptyUrl})`;
    }

    const targetCursor = { x: -999, y: -999 };
    const smoothCursor = { x: -999, y: -999 };
    const targetGrid = { x: 0, y: 0 };
    const smoothGrid = { x: 0, y: 0 };

    let lastDrawnX = -999;
    let lastDrawnY = -999;
    let hasMoved = false;
    let rafId = 0;

    const handleMouseMove = (e: MouseEvent) => {
      hasMoved = true;
      targetCursor.x = e.clientX;
      targetCursor.y = e.clientY;

      const normX = window.innerWidth > 0 ? e.clientX / window.innerWidth : 0.5;
      const normY = window.innerHeight > 0 ? e.clientY / window.innerHeight : 0.5;
      targetGrid.x = (normX - 0.5) * 16;
      targetGrid.y = (normY - 0.5) * 16;
    };

    const handleMouseLeave = () => {
      targetCursor.x = -999;
      targetCursor.y = -999;
      targetGrid.x = 0;
      targetGrid.y = 0;
    };

    const drawSpotlight = (x: number, y: number) => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (x > -280 && y > -280 && x < w + 280 && y < h + 280) {
        const radius = 260;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.4, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.6, 'rgba(255, 255, 255, 0.75)');
        grad.addColorStop(0.75, 'rgba(255, 255, 255, 0.4)');
        grad.addColorStop(0.88, 'rgba(255, 255, 255, 0.12)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (revealLayerRef.current) {
        const dataUrl = canvas.toDataURL();
        revealLayerRef.current.style.maskImage = `url(${dataUrl})`;
        revealLayerRef.current.style.webkitMaskImage = `url(${dataUrl})`;
      }
    };

    const tick = () => {
      if (prefersReducedMotion) {
        smoothCursor.x = targetCursor.x;
        smoothCursor.y = targetCursor.y;
        smoothGrid.x = targetGrid.x;
        smoothGrid.y = targetGrid.y;
      } else {
        smoothCursor.x += (targetCursor.x - smoothCursor.x) * 0.1;
        smoothCursor.y += (targetCursor.y - smoothCursor.y) * 0.1;
        smoothGrid.x += (targetGrid.x - smoothGrid.x) * 0.06;
        smoothGrid.y += (targetGrid.y - smoothGrid.y) * 0.06;
      }

      if (gridPatternRef.current) {
        gridPatternRef.current.setAttribute('x', smoothGrid.x.toFixed(2));
        gridPatternRef.current.setAttribute('y', smoothGrid.y.toFixed(2));
      }

      const movedDist =
        Math.abs(smoothCursor.x - lastDrawnX) + Math.abs(smoothCursor.y - lastDrawnY);

      if (hasMoved && movedDist > 0.2) {
        drawSpotlight(smoothCursor.x, smoothCursor.y);
        lastDrawnX = smoothCursor.x;
        lastDrawnY = smoothCursor.y;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', resizeCanvas, { passive: true });
    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Track active nav section on scroll
  useEffect(() => {
    const sections = NAV_ITEMS.map((item) => document.getElementById(item.id)).filter(
      (el): el is HTMLElement => el !== null
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveNav(entry.target.id);
          }
        }
      },
      { rootMargin: '-40% 0px -45% 0px', threshold: 0.05 }
    );

    sections.forEach((sec) => observer.observe(sec));
    return () => observer.disconnect();
  }, []);

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = clientName.trim();
    const trimmedEmail = clientEmail.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedName) {
      setFormError('Please enter your name.');
      return;
    }
    if (!emailPattern.test(trimmedEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!projectMessage.trim()) {
      setFormError('Please briefly describe your project goals.');
      return;
    }

    setFormError(null);
    setSubmittedInquiry({
      name: trimmedName,
      scope: projectScope,
    });
    setClientName('');
    setClientEmail('');
    setProjectMessage('');
  };

  return (
    <div
      className="min-h-screen bg-white text-neutral-900 tracking-[-0.02em]"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      {/* Fixed Navbar (z-50) */}
      <nav
        aria-label="Primary navigation"
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between md:justify-center p-4 sm:p-5"
      >
        {/* Desktop centered pill */}
        <div className="hidden md:flex nav-drop bg-black/60 backdrop-blur-md rounded-full pl-3 pr-2 py-2 items-center gap-1">
          <button
            type="button"
            onClick={() => scrollToSection('overview')}
            aria-label="Weblumes home"
            className="flex items-center justify-center p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 256 256"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d={LOGO_PATH} fill="#FFFFFF" />
            </svg>
          </button>

          {NAV_ITEMS.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className={`text-sm font-medium px-3 py-1.5 rounded-full transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'text-white bg-white/15'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => scrollToSection('contact', true)}
            className="bg-white text-gray-900 text-sm font-semibold px-5 py-1.5 rounded-full hover:bg-gray-100 ml-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            Connect
          </button>
        </div>

        {/* Mobile left logo pill */}
        <button
          type="button"
          onClick={() => scrollToSection('overview')}
          aria-label="Weblumes home"
          className="md:hidden nav-drop bg-black/60 backdrop-blur-md rounded-full p-2.5 flex items-center justify-center cursor-pointer"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 256 256"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path d={LOGO_PATH} fill="#FFFFFF" />
          </svg>
        </button>

        {/* Mobile right hamburger toggle pill */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          className="md:hidden nav-drop bg-black/60 backdrop-blur-md rounded-full p-2.5 text-white flex items-center justify-center cursor-pointer"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile Dropdown Menu (z-40) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white pt-16 pb-6 px-5 shadow-lg">
          <div className="flex flex-col">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className="w-full text-left text-sm font-medium text-gray-800 py-3 border-b border-gray-100 hover:text-black cursor-pointer"
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => scrollToSection('contact', true)}
              className="mt-4 w-full bg-gray-900 text-white text-sm font-semibold py-3 rounded-full hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Connect
            </button>
          </div>
        </div>
      )}

      {/* Hero Section (100dvh, relative overflow-hidden) */}
      <section
        id="overview"
        ref={heroRef}
        className="relative h-[100dvh] w-full overflow-hidden bg-[#1b0500]"
      >
        {/* Layer 1 (z-0): Parallax 48px Grid SVG */}
        <svg
          className="absolute inset-0 w-full h-full z-0 pointer-events-none"
          style={{ opacity: 0.1 }}
          aria-hidden="true"
        >
          <defs>
            <pattern
              ref={gridPatternRef}
              id="hero-grid-pattern"
              width="48"
              height="48"
              patternUnits="userSpaceOnUse"
              x="0"
              y="0"
            >
              <path
                d="M 48 0 L 0 0 0 48"
                fill="none"
                stroke="#64748b"
                strokeWidth="0.6"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid-pattern)" />
        </svg>

        {/* Layer 2 (z-10): Base image with Ken Burns intro */}
        <div
          className="ken-burns absolute inset-0 z-10 bg-center bg-cover pointer-events-none"
          style={{ backgroundImage: `url('${BG_IMAGE_1}')` }}
          aria-hidden="true"
        />

        {/* Layer 3 (z-30): Cursor spotlight reveal layer (BG_IMAGE_2) */}
        <div
          ref={revealLayerRef}
          className="ken-burns absolute inset-0 z-30 bg-center bg-cover pointer-events-none"
          style={{
            backgroundImage: `url('${BG_IMAGE_2}')`,
            maskSize: '100% 100%',
            WebkitMaskSize: '100% 100%',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
          }}
          aria-hidden="true"
        />

        {/* Hidden full-window canvas for radial spotlight mask generation */}
        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

        {/* Subtle directional contrast scrim so bottom-left white copy remains crisp */}
        <div
          className="absolute inset-0 z-40 pointer-events-none bg-gradient-to-tr from-black/70 via-black/20 to-transparent"
          aria-hidden="true"
        />

        {/* Layer 4 (z-50): Stats on fading circular arcs (hidden below sm) */}
        <div
          className="hidden sm:block absolute inset-y-0 right-0 z-50 pointer-events-none pr-4 md:pr-8"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 380 700"
            preserveAspectRatio="xMaxYMid meet"
            className="h-full w-auto overflow-visible"
          >
            <defs>
              {ARC_SPECS.map((arc) => {
                const start = polarToCartesian(ARC_CENTER.x, ARC_CENTER.y, arc.r, arc.startDeg);
                const end = polarToCartesian(ARC_CENTER.x, ARC_CENTER.y, arc.r, arc.endDeg);
                return (
                  <linearGradient
                    key={`grad-${arc.id}`}
                    id={`grad-${arc.id}`}
                    gradientUnits="userSpaceOnUse"
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                  >
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
                    <stop offset="22%" stopColor="#FFFFFF" stopOpacity="0.5" />
                    <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.5" />
                    <stop offset="85%" stopColor="#FFFFFF" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                  </linearGradient>
                );
              })}
            </defs>

            {ARC_SPECS.map((arc, i) => {
              const start = polarToCartesian(ARC_CENTER.x, ARC_CENTER.y, arc.r, arc.startDeg);
              const end = polarToCartesian(ARC_CENTER.x, ARC_CENTER.y, arc.r, arc.endDeg);
              const dot = polarToCartesian(ARC_CENTER.x, ARC_CENTER.y, arc.r, arc.dotDeg);
              const deltaRad = ((arc.endDeg - arc.startDeg) * Math.PI) / 180;
              const arcLen = arc.r * deltaRad;

              const lineDelay = 0.4 + i * 0.22;
              const markDelay = lineDelay + 0.9;

              const pathData = `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${arc.r} ${arc.r} 0 0 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;

              return (
                <g key={arc.id}>
                  <path
                    d={pathData}
                    fill="none"
                    stroke={`url(#grad-${arc.id})`}
                    strokeWidth="1.1"
                    className="arc-line"
                    style={
                      {
                        '--len': arcLen.toFixed(2),
                        animationDelay: `${lineDelay}s`,
                      } as React.CSSProperties
                    }
                  />

                  <circle
                    cx={dot.x}
                    cy={dot.y}
                    r="7"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="1"
                    strokeOpacity="0.35"
                    className="arc-ring"
                    style={{ animationDelay: `${(markDelay + 0.3).toFixed(2)}s` }}
                  />

                  <circle
                    cx={dot.x}
                    cy={dot.y}
                    r="3.4"
                    fill="#FFFFFF"
                    className="arc-dot"
                    style={{ animationDelay: `${markDelay.toFixed(2)}s` }}
                  />

                  <text
                    x={dot.x + 16}
                    y={dot.y + 4}
                    fill="#FFFFFF"
                    fontSize="32"
                    fontWeight="600"
                    className="arc-text"
                    style={{ animationDelay: `${(markDelay + 0.15).toFixed(2)}s` }}
                  >
                    {arc.value}
                    <tspan fontSize="19" dy="-10" letterSpacing="-1">
                      {arc.suffix}
                    </tspan>
                  </text>

                  <text
                    x={dot.x + 18}
                    y={dot.y + 22}
                    fill="#FFFFFF"
                    fillOpacity="0.8"
                    fontSize="8.5"
                    fontWeight="600"
                    letterSpacing="2"
                    className="arc-text"
                    style={{ animationDelay: `${(markDelay + 0.3).toFixed(2)}s` }}
                  >
                    {arc.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Layer 5 (z-50): Hero text block */}
        <div className="absolute bottom-12 sm:bottom-16 md:bottom-24 left-5 sm:left-8 md:left-12 max-w-[300px] sm:max-w-md z-50">
          <p
            className="hero-rise text-[11px] sm:text-xs font-semibold tracking-[0.12em] text-white/90 mb-3"
            style={{ animationDelay: '0.15s' }}
          >
            Weblumes · <span className="italic font-medium">Harvard Computer Science</span>
          </p>

          <h1
            className="hero-rise text-4xl sm:text-5xl md:text-6xl font-semibold leading-[1.05] tracking-[-0.08em] text-white mb-4"
            style={{ animationDelay: '0.3s' }}
          >
            A window
            <br />
            of web &amp; SEO
            <br />
            enhancements
          </h1>

          <p
            className="hero-rise text-sm sm:text-base text-white/90 leading-relaxed mb-6"
            style={{ animationDelay: '0.5s' }}
          >
            A digital studio where clean code, web design, technical SEO, and AI-driven ads align. Engineered by Weblumes for measurable growth.
          </p>

          <div className="hero-rise" style={{ animationDelay: '0.7s' }}>
            <button
              type="button"
              onClick={() => scrollToSection('contact', true)}
              className="group relative overflow-hidden bg-white text-gray-900 font-semibold text-sm px-7 sm:px-8 py-3 sm:py-3.5 rounded-full shadow-lg shadow-black/20 transition-transform duration-200 hover:scale-[1.04] active:scale-95 cursor-pointer"
            >
              <span className="relative z-10">Reserve Now</span>
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
              />
            </button>
          </div>
        </div>
      </section>

      {/* Interactive 3D Viewport Section (Three.js) */}
      <section aria-label="Interactive 3D Core Showcase" className="bg-[#0a0a0a] border-t border-white/10">
        <CyberGyroScene />
      </section>

      {/* Section 2: Works & Capabilities */}
      <section id="works" className="border-t border-neutral-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-20 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            <div className="lg:col-span-4">
              <p className="text-xs font-semibold tracking-[0.12em] uppercase text-orange-600 mb-3">
                01. Works
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.04em] text-neutral-900 leading-tight mb-4">
                Web development and search engineering built as one system.
              </h2>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Weblumes builds fast, resilient web platforms paired with technical SEO and AI-assisted acquisition so design and search performance reinforce each other.
              </p>
            </div>

            <div className="lg:col-span-8 divide-y divide-neutral-200 border-y border-neutral-200">
              {WORKS_ITEMS.map((item) => (
                <div
                  key={item.index}
                  className="py-7 first:pt-6 last:pb-6 grid grid-cols-1 sm:grid-cols-12 gap-4 items-baseline"
                >
                  <div className="sm:col-span-2 text-xs font-semibold tabular-nums text-neutral-400">
                    {item.index}
                  </div>
                  <div className="sm:col-span-10">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-neutral-600 leading-relaxed mb-3">
                      {item.summary}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {item.deliverables}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Skills Matrix */}
      <section id="skills" className="border-t border-neutral-200 bg-neutral-50">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-20 sm:py-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <p className="text-xs font-semibold tracking-[0.12em] uppercase text-orange-600 mb-3">
                02. Skills
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.04em] text-neutral-900">
                Four disciplines, zero handoff friction.
              </h2>
            </div>
            <p className="text-xs text-neutral-500 max-w-xs leading-relaxed">
              Coding · Web Designer · Marketing · AI Ads
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SKILLS_ITEMS.map((skill) => (
              <div
                key={skill.index}
                className="bg-white border border-neutral-200 rounded-xl p-7 transition-colors hover:border-neutral-400"
              >
                <div className="flex items-baseline justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900">
                    {skill.name}
                  </h3>
                  <span className="text-xs font-semibold tabular-nums text-neutral-400">
                    {skill.index}
                  </span>
                </div>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {skill.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Education */}
      <section id="education" className="border-t border-neutral-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-20 sm:py-24">
          <div className="bg-neutral-950 text-white rounded-2xl p-8 sm:p-12 md:p-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <p className="text-xs font-semibold tracking-[0.12em] uppercase text-orange-400 mb-3">
                03. Education &amp; Foundation
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[-0.04em] leading-tight mb-4">
                Harvard University Computer Science
              </h2>
              <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
                Every Weblumes build is grounded in formal computer science—algorithmic efficiency, clean software architecture, structured data, and disciplined problem solving applied directly to web development, SEO, and AI ad systems.
              </p>
            </div>

            <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-neutral-800 pt-6 lg:pt-0 lg:pl-10 space-y-5">
              <div>
                <p className="text-xs text-neutral-400 mb-1">Company</p>
                <p className="text-base font-semibold text-white">Weblumes</p>
              </div>
              <div>
                <p className="text-xs text-neutral-400 mb-1">Primary Focus</p>
                <p className="text-base font-semibold text-white">Web Development &amp; SEO</p>
              </div>
              <div>
                <p className="text-xs text-neutral-400 mb-1">Academic Track</p>
                <p className="text-base font-semibold text-white">Harvard University — Computer Science</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Contact & Project Reservation */}
      <section id="contact" className="border-t border-neutral-200 bg-neutral-50">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-20 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-5">
              <p className="text-xs font-semibold tracking-[0.12em] uppercase text-orange-600 mb-3">
                04. Contact
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.04em] text-neutral-900 mb-4">
                Start a project with Weblumes.
              </h2>
              <p className="text-sm text-neutral-600 leading-relaxed mb-8">
                Reach out directly by phone or email, or reserve a consultation slot for web development, SEO, design, or AI ad campaigns.
              </p>

              <div className="space-y-5 border-t border-neutral-200 pt-6">
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Phone</p>
                  <a
                    href="tel:+14423258687"
                    className="text-base font-semibold text-neutral-900 hover:text-orange-600 transition-colors tabular-nums"
                  >
                    +1 (442) 325 8687
                  </a>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Email</p>
                  <a
                    href="mailto:weblumess@gmail.com"
                    className="text-base font-semibold text-neutral-900 hover:text-orange-600 transition-colors break-all"
                  >
                    weblumess@gmail.com
                  </a>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Studio</p>
                  <p className="text-sm font-medium text-neutral-800">
                    Weblumes · Web Development &amp; SEO
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-white border border-neutral-200 rounded-2xl p-7 sm:p-9">
              {submittedInquiry ? (
                <div className="py-8">
                  <p className="text-xs font-semibold tracking-[0.12em] uppercase text-orange-600 mb-2">
                    Request Received
                  </p>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                    Thank you, {submittedInquiry.name}.
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed mb-6">
                    Your inquiry for <span className="font-semibold text-neutral-900">{submittedInquiry.scope}</span> is prepared. For immediate priority, call{' '}
                    <a href="tel:+14423258687" className="underline font-medium text-neutral-900">
                      +1 (442) 325 8687
                    </a>{' '}
                    or email{' '}
                    <a href="mailto:weblumess@gmail.com" className="underline font-medium text-neutral-900">
                      weblumess@gmail.com
                    </a>
                    .
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmittedInquiry(null)}
                    className="bg-neutral-900 text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    Send Another Note
                  </button>
                </div>
              ) : (
                <form onSubmit={handleInquirySubmit} noValidate className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="client-name" className="block text-xs font-medium text-neutral-700 mb-2">
                        Your Name
                      </label>
                      <input
                        ref={nameInputRef}
                        id="client-name"
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Alex Morgan"
                        className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="client-email" className="block text-xs font-medium text-neutral-700 mb-2">
                        Email Address
                      </label>
                      <input
                        id="client-email"
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="project-scope" className="block text-xs font-medium text-neutral-700 mb-2">
                      Primary Service
                    </label>
                    <select
                      id="project-scope"
                      value={projectScope}
                      onChange={(e) => setProjectScope(e.target.value)}
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
                    >
                      <option value="Web Development & SEO">Web Development &amp; SEO</option>
                      <option value="Custom Coding & Web Design">Custom Coding &amp; Web Design</option>
                      <option value="Marketing & AI Ads">Marketing &amp; AI Ads</option>
                      <option value="Full Growth Retainer">Full Growth Retainer</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="project-message" className="block text-xs font-medium text-neutral-700 mb-2">
                      Project Brief
                    </label>
                    <textarea
                      id="project-message"
                      rows={4}
                      value={projectMessage}
                      onChange={(e) => setProjectMessage(e.target.value)}
                      placeholder="Tell Weblumes about your website, search goals, or campaign timeline."
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none resize-none"
                    />
                  </div>

                  {formError && (
                    <p role="alert" className="text-xs font-medium text-red-600">
                      {formError}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                    <span className="text-xs text-neutral-500">
                      Direct line: +1 (442) 325 8687
                    </span>
                    <button
                      type="submit"
                      className="bg-neutral-900 text-white text-sm font-semibold px-7 py-3 rounded-full hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      Submit Request
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="border-t border-neutral-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-neutral-500">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-neutral-900">Weblumes</span>
            <span aria-hidden="true">·</span>
            <span>Web Development &amp; SEO</span>
            <span aria-hidden="true">·</span>
            <span>Harvard University CS</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <a href="tel:+14423258687" className="hover:text-neutral-900 transition-colors tabular-nums">
              +1 (442) 325 8687
            </a>
            <a href="mailto:weblumess@gmail.com" className="hover:text-neutral-900 transition-colors">
              weblumess@gmail.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
