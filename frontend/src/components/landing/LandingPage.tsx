import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

/* ------------------------------------------------------------------ */
/*  Small reusable primitives                                          */
/* ------------------------------------------------------------------ */

function useCountUp(target, duration = 1600, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let frame;
    const startTime = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [start, target, duration]);
  return value;
}

function useInView(options = { threshold: 0.3 }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.disconnect();
      }
    }, options);
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return [ref, inView];
}

function Reveal({ children, delay = 0, className = "" }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className} ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function Stat({ value, suffix = "", label }) {
  const [ref, inView] = useInView();
  const count = useCountUp(value, 1800, inView);
  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-bold text-[#0F172A] tabular-nums">
        {count.toLocaleString()}
        <span className="text-[#10B981]">{suffix}</span>
      </div>
      <p className="mt-2 text-sm text-slate-500 font-medium">{label}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Icon set (inline SVG, single stroke style, emerald accented)       */
/* ------------------------------------------------------------------ */

const Icon = ({ path, className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={path} />
  </svg>
);

const icons = {
  register: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M19 8v6 M22 11h-6",
  verify: "m9 12 2 2 4-4 M12 3 4 6.5v5.2c0 4.8 3.4 8.8 8 9.8 4.6-1 8-5 8-9.8V6.5L12 3Z",
  eligibility: "M9 11l3 3L22 4 M21 12v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11",
  drive: "M3 21h18 M6 21V9l6-4 6 4v12 M9 9h.01 M9 13h.01 M9 17h.01 M15 9h.01 M15 13h.01",
  apply: "M14 2v5a1 1 0 0 0 1 1h5 M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z M9 15h6 M9 11h2",
  shortlist: "M4 6h16 M4 12h10 M4 18h6 M17 15l3 3 3-3",
  interview: "M8 12h.01 M12 12h.01 M16 12h.01 M21 12c0 4.4-4 8-9 8a9.7 9.7 0 0 1-4-.8L3 20l1.3-4A7.9 7.9 0 0 1 3 12c0-4.4 4-8 9-8s9 3.6 9 8Z",
  offer: "M20 7h-3.2a2.5 2.5 0 0 0 .2-1 2.5 2.5 0 0 0-4.7-1.2A2.5 2.5 0 0 0 7.6 6a2.5 2.5 0 0 0 .2 1H4a1 1 0 0 0-1 1v3h18V8a1 1 0 0 0-1-1Z M3 11v9a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-9",
  reports: "M3 3v18h18 M7 15l4-4 3 3 5-6",
  chart: "M3 3v18h18 M7 16v-4 M12 16v-8 M17 16v-2",
};

const workflow = [
  { key: "register", label: "Student Registration", copy: "Students sign up and complete a verified academic profile." },
  { key: "verify", label: "Resume Verification", copy: "Coordinators check documents against academic records." },
  { key: "eligibility", label: "Eligibility Check", copy: "CGPA, backlog and branch rules filter who can apply." },
  { key: "drive", label: "Company Drive", copy: "Recruiters open a drive with role, criteria and dates." },
  { key: "apply", label: "Applications", copy: "Eligible students apply in a single click from their dashboard." },
  { key: "shortlist", label: "Shortlisting", copy: "Recruiters filter applicants by resume, scores and skills." },
  { key: "interview", label: "Interviews", copy: "Rounds are scheduled and tracked with live status updates." },
  { key: "offer", label: "Offer Letter", copy: "Offers are generated, released and accepted digitally." },
  { key: "reports", label: "Placement Reports", copy: "TPOs get real-time, department-wise placement analytics." },
];

/* ------------------------------------------------------------------ */
/*  Role-based feature data                                            */
/* ------------------------------------------------------------------ */

const roles = [
  {
    id: "student",
    name: "Student",
    tagline: "Your placement journey, in one dashboard.",
    items: ["Dashboard", "Resume Builder", "Profile Management", "Job Applications", "Application Tracking", "Interview Schedule", "Placement Statistics", "Notifications", "Offer Letters", "Skill Verification"],
  },
  {
    id: "coordinator",
    name: "Placement Coordinator",
    tagline: "Run the drive without the spreadsheet chaos.",
    items: ["Manage Students", "Verify Profiles", "Company Management", "Create Placement Drives", "Eligibility Configuration", "Shortlisting", "Interview Scheduling", "Notice Management", "Reports", "Analytics"],
  },
  {
    id: "tpo",
    name: "Placement Officer (TPO)",
    tagline: "Full visibility, every department, every drive.",
    items: ["Complete Placement Control", "Company Relations", "Campus Drive Management", "Student Analytics", "Placement Reports", "Department Statistics", "Offer Management", "Hiring Pipeline"],
  },
  {
    id: "recruiter",
    name: "Recruiter",
    tagline: "Hire from campus without the back-and-forth emails.",
    items: ["Company Registration", "Post Jobs", "Eligibility Criteria", "View Applicants", "Shortlist Candidates", "Interview Scheduling", "Offer Release", "Hiring Dashboard"],
  },
  {
    id: "admin",
    name: "Admin",
    tagline: "Govern the platform end to end.",
    items: ["User Management", "Department Management", "Branch Management", "System Settings", "Role Management", "Permissions", "Audit Logs", "Database Control", "Backup Management"],
  },
];

const modules = [
  "Authentication", "JWT Security", "Role Based Access", "Resume Upload", "Cloud Storage",
  "Email Notifications", "Company Drives", "Interview Management", "Analytics Dashboard",
  "Reports", "Placement Statistics", "Search & Filters", "Notifications", "Offer Management",
  "Student Verification", "Profile Approval",
];

const stack = {
  Frontend: ["React", "Tailwind CSS", "TypeScript", "React Router"],
  Backend: ["Node.js", "Express.js", "MongoDB", "JWT Authentication", "REST APIs"],
  Cloud: ["AWS", "MongoDB Atlas", "S3 Storage"],
  Tooling: ["Git", "GitHub", "VS Code"],
};

const testimonials = [
  {
    quote: "Application tracking used to live in three different Excel sheets. Now every student can see exactly where they stand.",
    name: "Ritika Verma",
    role: "Final Year Student, CSE",
  },
  {
    quote: "Setting eligibility rules per drive and getting an auto-filtered list saved our team a full day of manual shortlisting.",
    name: "Sandeep Malhotra",
    role: "Placement Coordinator",
  },
  {
    quote: "We ran a drive across four campuses from a single dashboard and had offers out within a week.",
    name: "Ananya Rao",
    role: "Campus Recruiter, TechCorp",
  },
];

const faqs = [
  { q: "How do students apply to a company drive?", a: "Once a drive is published, eligible students see it on their dashboard and apply with one click using their verified profile and resume — no re-uploading documents per company." },
  { q: "How do companies recruit through SUPRESET?", a: "Recruiters register, define role details and eligibility criteria, then get a live, filtered pool of applicants with resumes, scores and verification status ready to shortlist." },
  { q: "How does eligibility filtering work?", a: "Coordinators configure rules — CGPA cutoff, backlog limit, branch and batch — per drive. Ineligible students are automatically excluded before applications open." },
  { q: "How is interview scheduling handled?", a: "Interview rounds, slots and panels are scheduled inside the platform, with automatic notifications to students and live status updates for recruiters and TPOs." },
  { q: "How are placement reports generated?", a: "Reports are generated in real time from live application and offer data — filterable by department, batch or company, and exportable for accreditation and audits." },
];

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  const [activeRole, setActiveRole] = useState(roles[0].id);
  const [openFaq, setOpenFaq] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const currentRole = roles.find((r) => r.id === activeRole);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#0F172A] antialiased [font-feature-settings:'ss01']">
      <style>{`
        @keyframes float-slow { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-14px); } }
        @keyframes float-slower { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-9px); } }
        .float-1 { animation: float-slow 6s ease-in-out infinite; }
        .float-2 { animation: float-slower 7.5s ease-in-out infinite; animation-delay: .6s; }
        .float-3 { animation: float-slow 5.5s ease-in-out infinite; animation-delay: 1.1s; }
        @media (prefers-reduced-motion: reduce) {
          .float-1, .float-2, .float-3 { animation: none; }
        }
      `}</style>

      {/* -------------------------------------------------- Navbar -- */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/80 backdrop-blur-md shadow-sm" : "bg-white/0"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#10B981] to-[#34D399] shadow-md shadow-emerald-200">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-lg font-bold tracking-tight">SUPRESET</span>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 lg:flex">
            <a href="#platform" className="hover:text-[#0F172A] transition-colors">Platform</a>
            <a href="#roles" className="hover:text-[#0F172A] transition-colors">Roles</a>
            <a href="#modules" className="hover:text-[#0F172A] transition-colors">Modules</a>
            <a href="#analytics" className="hover:text-[#0F172A] transition-colors">Analytics</a>
            <a href="#faq" className="hover:text-[#0F172A] transition-colors">FAQ</a>
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Login
            </Link>
            <Link
              to="/login?tab=signup"
              className="rounded-lg bg-[#0F172A] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-[#10B981]"
            >
              Get Started
            </Link>
          </div>

          <button
            className="lg:hidden text-slate-700"
            onClick={() => setMenuOpen((m) => !m)}
            aria-label="Toggle menu"
          >
            <Icon path={menuOpen ? "M18 6 6 18 M6 6l12 12" : "M4 6h16 M4 12h16 M4 18h16"} className="w-6 h-6" />
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-100 bg-white px-6 py-4 lg:hidden">
            <nav className="flex flex-col gap-3 text-sm font-medium text-slate-600">
              <a href="#platform" onClick={() => setMenuOpen(false)}>Platform</a>
              <a href="#roles" onClick={() => setMenuOpen(false)}>Roles</a>
              <a href="#modules" onClick={() => setMenuOpen(false)}>Modules</a>
              <a href="#analytics" onClick={() => setMenuOpen(false)}>Analytics</a>
              <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
              <div className="mt-2 flex gap-3">
                <Link to="/login" className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-center">Login</Link>
                <Link to="/login?tab=signup" className="flex-1 rounded-lg bg-[#0F172A] px-4 py-2 text-center text-white">Get Started</Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ----------------------------------------------------- Hero -- */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,#D1FAE5_0%,rgba(209,250,229,0)_70%)]" />
        <div className="pointer-events-none absolute -left-32 top-24 h-72 w-72 rounded-full bg-[#D1FAE5] opacity-60 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-64 h-80 w-80 rounded-full bg-emerald-50 opacity-70 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-16 lg:px-8 lg:pb-28 lg:pt-24">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-[#D1FAE5]/60 px-4 py-1.5 text-xs font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                  Role-based campus placement platform
                </span>
              </Reveal>

              <Reveal delay={80}>
                <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-[#0F172A] sm:text-5xl lg:text-[3.4rem]">
                  Modern Placement
                  <br />
                  Management <span className="text-[#10B981]">Platform</span>
                </h1>
              </Reveal>

              <Reveal delay={160}>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
                  A complete solution to manage campus placements, student recruitment,
                  company hiring, applications, interviews, offers, and analytics — from
                  one centralized platform.
                </p>
              </Reveal>

              <Reveal delay={240}>
                <div className="mt-9 flex flex-wrap gap-4">
                  <Link
                    to="/login?tab=signup"
                    className="rounded-xl bg-gradient-to-r from-[#10B981] to-[#34D399] px-7 py-3.5 font-semibold text-white shadow-lg shadow-emerald-200 transition hover:shadow-emerald-300 hover:-translate-y-0.5"
                  >
                    Get Started
                  </Link>
                  <Link
                    to="/login"
                    className="rounded-xl border border-slate-200 bg-white px-7 py-3.5 font-semibold text-slate-700 transition hover:border-slate-300 hover:-translate-y-0.5"
                  >
                    Login
                  </Link>
                </div>
              </Reveal>

              <Reveal delay={320}>
                <div className="mt-10 flex gap-10">
                  <div>
                    <p className="text-2xl font-bold">5,000+</p>
                    <p className="text-sm text-slate-500">Students</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">300+</p>
                    <p className="text-sm text-slate-500">Companies</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">95%</p>
                    <p className="text-sm text-slate-500">Placement rate</p>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Dashboard preview */}
            <Reveal delay={200}>
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="absolute -top-6 -right-4 rounded-2xl border border-emerald-100 bg-white p-4 shadow-xl shadow-emerald-900/5 float-1 hidden sm:block">
                  <p className="text-xs text-slate-400">Highest Package</p>
                  <p className="text-lg font-bold text-[#10B981]">₹42 LPA</p>
                </div>
                <div className="absolute -bottom-8 -left-6 rounded-2xl border border-emerald-100 bg-white p-4 shadow-xl shadow-emerald-900/5 float-2 hidden sm:block">
                  <p className="text-xs text-slate-400">Offers Released</p>
                  <p className="text-lg font-bold text-[#0F172A]">1,214</p>
                </div>

                <div className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-2xl shadow-slate-900/10 backdrop-blur">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                    </div>
                    <p className="text-xs font-medium text-slate-400">TPO Dashboard</p>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {[
                      { label: "Registered", value: "5,214" },
                      { label: "Placed", value: "3,102" },
                      { label: "Drives", value: "84" },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl bg-[#F8FAFC] p-3">
                        <p className="text-[11px] text-slate-400">{s.label}</p>
                        <p className="text-base font-bold">{s.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-xl bg-[#F8FAFC] p-4">
                    <p className="mb-3 text-xs font-medium text-slate-400">Department-wise placement</p>
                    <div className="flex items-end gap-2 h-24">
                      {[52, 88, 40, 70, 95, 60].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-[#10B981] to-[#34D399]" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {[
                      { name: "Aditi Sharma", role: "SDE-1 · Amazon", status: "Offer Released" },
                      { name: "Rohan Gupta", role: "Analyst · Deloitte", status: "Interview" },
                    ].map((p) => (
                      <div key={p.name} className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#10B981] to-[#34D399]" />
                          <div>
                            <p className="text-sm font-semibold leading-none">{p.name}</p>
                            <p className="mt-1 text-xs text-slate-400">{p.role}</p>
                          </div>
                        </div>
                        <span className="rounded-full bg-[#D1FAE5] px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                          {p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="absolute bottom-6 right-0 translate-x-1/4 rounded-2xl border border-emerald-100 bg-white px-4 py-3 shadow-xl shadow-emerald-900/5 float-3 hidden md:block">
                  <p className="text-xs text-slate-400">Placement Rate</p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-2 w-16 rounded-full bg-[#D1FAE5]">
                      <div className="h-2 w-[95%] rounded-full bg-[#10B981]" />
                    </div>
                    <span className="text-xs font-bold text-[#10B981]">95%</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------- Trusted by -- */}
      <section className="border-y border-slate-100 bg-[#F8FAFC] py-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
            Recruiting partners on the platform
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-slate-400">
            {["Google", "Microsoft", "Amazon", "Infosys", "TCS", "Wipro", "Deloitte", "Accenture"].map((c) => (
              <span key={c} className="text-lg font-semibold tracking-tight opacity-70 grayscale transition hover:opacity-100 hover:text-[#0F172A]">
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------- Platform overview -- */}
      <section id="platform" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#10B981]">Platform overview</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              One workflow, from registration to offer
            </h2>
            <p className="mt-4 text-slate-600">
              Every placement cycle moves through the same nine stages. SUPRESET keeps
              each one connected, so nothing falls through the cracks between teams.
            </p>
          </div>
        </Reveal>

        <div className="relative mt-16">
          <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent lg:block" />
          <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-3 lg:grid-cols-9 lg:gap-x-2">
            {workflow.map((step, i) => (
              <Reveal key={step.key} delay={i * 60}>
                <div className="group relative flex flex-col items-center px-2 text-center">
                  <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-100 bg-white shadow-md shadow-emerald-900/5 transition group-hover:-translate-y-1 group-hover:shadow-emerald-200">
                    <Icon path={icons[step.key]} className="h-7 w-7 text-[#10B981]" />
                  </div>
                  <p className="mt-3 text-xs font-bold text-slate-400">{`0${i + 1}`}</p>
                  <p className="mt-1 text-sm font-semibold leading-tight">{step.label}</p>
                  <p className="mt-1.5 hidden text-xs leading-snug text-slate-500 lg:block">{step.copy}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------- Role features -- */}
      <section id="roles" className="bg-[#F8FAFC] py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#10B981]">Built for every seat</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Five dashboards, one shared source of truth
              </h2>
              <p className="mt-4 text-slate-600">
                Role-based access means everyone opens the platform to exactly what
                their job needs — nothing more, nothing hidden.
              </p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="mt-10 flex flex-wrap justify-center gap-2">
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setActiveRole(r.id)}
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                    activeRole === r.id
                      ? "bg-[#0F172A] text-white shadow-md"
                      : "bg-white text-slate-600 border border-slate-200 hover:border-emerald-200 hover:text-[#10B981]"
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </Reveal>

          <Reveal delay={160} className="mt-8">
            <div className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-xl shadow-emerald-900/5 lg:p-10">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-end">
                <div>
                  <h3 className="text-2xl font-bold">{currentRole.name}</h3>
                  <p className="mt-1 text-slate-500">{currentRole.tagline}</p>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#D1FAE5] px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  {currentRole.items.length} modules included
                </span>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {currentRole.items.map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl bg-[#F8FAFC] px-4 py-3 transition hover:bg-[#D1FAE5]/50">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#10B981]/15">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                    </span>
                    <span className="text-sm font-medium text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* --------------------------------------------------- Modules -- */}
      <section id="modules" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#10B981]">Core modules</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything the platform ships with
            </h2>
          </div>
        </Reveal>

        <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {modules.map((m, i) => (
            <Reveal key={m} delay={(i % 8) * 40}>
              <div className="group flex h-full items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-900/5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#10B981]/10 to-[#34D399]/10 text-[#10B981] transition group-hover:from-[#10B981] group-hover:to-[#34D399] group-hover:text-white">
                  <Icon path={icons.chart} className="h-4.5 w-4.5" />
                </div>
                <span className="text-sm font-semibold leading-snug text-slate-700">{m}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------- Analytics -- */}
      <section id="analytics" className="bg-gradient-to-b from-[#0F172A] to-[#132133] py-24 text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#34D399]">Analytics</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Numbers your placement cell actually needs
              </h2>
              <p className="mt-4 text-slate-300">
                Live, filterable dashboards for TPOs — no more waiting on end-of-semester spreadsheets.
              </p>
            </div>
          </Reveal>

          <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { value: 5214, suffix: "", label: "Registered" },
              { value: 3102, suffix: "", label: "Placed" },
              { value: 95, suffix: "%", label: "Placement rate" },
              { value: 42, suffix: " LPA", label: "Highest package" },
              { value: 300, suffix: "+", label: "Companies visited" },
              { value: 1214, suffix: "", label: "Offers released" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <StatDark value={s.value} suffix={s.suffix} label={s.label} />
              </div>
            ))}
          </div>

          <Reveal delay={120}>
            <div className="mt-16 grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <p className="mb-6 text-sm font-semibold text-slate-300">Department-wise placements</p>
                <div className="flex items-end gap-4 h-48">
                  {[
                    { d: "CSE", v: 92 }, { d: "ECE", v: 78 }, { d: "ME", v: 54 },
                    { d: "CE", v: 46 }, { d: "IT", v: 88 }, { d: "EEE", v: 61 },
                  ].map((b) => (
                    <div key={b.d} className="flex flex-1 flex-col items-center gap-2">
                      <div className="flex w-full flex-1 items-end">
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-[#10B981] to-[#34D399] transition-all duration-700"
                          style={{ height: `${b.v}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400">{b.d}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <p className="mb-4 text-sm font-semibold text-slate-300">Average package trend</p>
                <svg viewBox="0 0 240 120" className="h-40 w-full">
                  <polyline
                    fill="none"
                    stroke="#34D399"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="0,100 40,88 80,70 120,74 160,44 200,32 240,18"
                  />
                  <polygon
                    fill="url(#areaFill)"
                    points="0,100 40,88 80,70 120,74 160,44 200,32 240,18 240,120 0,120"
                  />
                  <defs>
                    <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34D399" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
                <p className="mt-2 text-xs text-slate-400">₹6.4 LPA → ₹9.8 LPA over 4 batches</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ----------------------------------------------- Why choose -- */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#10B981]">Why SUPRESET</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Built to remove friction, not add features
            </h2>
          </div>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: icons.eligibility, title: "Role-Based Access", copy: "Every user only sees the features relevant to their role — no clutter, no confusion." },
            { icon: icons.drive, title: "Automation", copy: "Eligibility filtering, shortlisting and notifications run themselves — no manual busywork." },
            { icon: icons.verify, title: "Secure by Design", copy: "JWT authentication and encrypted credentials protect every student and company record." },
            { icon: icons.reports, title: "Cloud Ready", copy: "Resume storage and infrastructure scale from one department to an entire university." },
            { icon: icons.interview, title: "Real-Time Notifications", copy: "Students and recruiters get instant updates the moment status changes." },
            { icon: icons.chart, title: "Analytics", copy: "Placement insights, department-wise, updated live — not once a semester." },
          ].map((f, i) => (
            <Reveal key={f.title} delay={i * 60}>
              <div className="group h-full rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-900/5 hover:border-emerald-100">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D1FAE5] text-[#10B981] transition group-hover:bg-[#10B981] group-hover:text-white">
                  <Icon path={f.icon} className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{f.copy}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------- Architecture -- */}
      <section className="bg-[#F8FAFC] py-24">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#10B981]">Architecture</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                A clean, scalable stack under the hood
              </h2>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="mt-14 flex flex-col items-center">
              {["Frontend", "Backend API", "Authentication", "Database", "Cloud Storage", "Notification Service", "Analytics Engine"].map((layer, i, arr) => (
                <React.Fragment key={layer}>
                  <div className="w-full max-w-md rounded-2xl border border-emerald-100 bg-white px-6 py-4 text-center font-semibold shadow-sm shadow-emerald-900/5">
                    {layer}
                  </div>
                  {i < arr.length - 1 && (
                    <div className="my-1 h-6 w-px bg-gradient-to-b from-[#10B981]/40 to-[#10B981]/10" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------ Tech stack -- */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#10B981]">Technology stack</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Modern tools, production-tested
            </h2>
          </div>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(stack).map(([group, techs], i) => (
            <Reveal key={group} delay={i * 80}>
              <div className="h-full rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-[#10B981]">{group}</p>
                <ul className="mt-4 space-y-2.5">
                  {techs.map((t) => (
                    <li key={t} className="flex items-center gap-2 text-sm font-medium text-slate-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------- Numbers -- */}
      <section className="border-y border-slate-100 bg-[#F8FAFC] py-20">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 sm:grid-cols-3 lg:grid-cols-6 lg:px-8">
          <Stat value={5000} suffix="+" label="Students" />
          <Stat value={300} suffix="+" label="Companies" />
          <Stat value={95} suffix="%" label="Placement rate" />
          <Stat value={1200} suffix="+" label="Offers" />
          <Stat value={45} suffix="+" label="Departments" />
          <Stat value={100} suffix="%" label="Digital process" />
        </div>
      </section>

      {/* ---------------------------------------------- Testimonials -- */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#10B981]">Testimonials</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              What the platform changes day to day
            </h2>
          </div>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 100}>
              <div className="flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-7 shadow-sm">
                <Icon path="M7 8a4 4 0 0 0-4 4v6h6v-6H6a2 2 0 0 1 2-2V8Zm10 0a4 4 0 0 0-4 4v6h6v-6h-3a2 2 0 0 1 2-2V8Z" className="h-7 w-7 text-[#D1FAE5]" />
                <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-600">{t.quote}</p>
                <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#10B981] to-[#34D399]" />
                  <div>
                    <p className="text-sm font-bold leading-none">{t.name}</p>
                    <p className="mt-1 text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------ FAQ -- */}
      <section id="faq" className="bg-[#F8FAFC] py-24">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#10B981]">FAQ</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Common questions</h2>
            </div>
          </Reveal>

          <div className="mt-12 space-y-3">
            {faqs.map((f, i) => (
              <Reveal key={f.q} delay={i * 60}>
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="font-semibold">{f.q}</span>
                    <Icon
                      path={openFaq === i ? "M5 12h14" : "M12 5v14 M5 12h14"}
                      className="h-5 w-5 shrink-0 text-[#10B981] transition-transform"
                    />
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      openFaq === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-5 text-sm leading-relaxed text-slate-500">{f.a}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- CTA -- */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F172A] to-[#10B981] px-8 py-16 text-center shadow-2xl sm:px-16">
            <div className="pointer-events-none absolute -top-10 -right-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
            <h2 className="relative text-3xl font-bold text-white sm:text-4xl">
              Ready to transform campus placements?
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-emerald-50/90">
              Give students, recruiters and your placement cell one platform that
              actually keeps up with the drive.
            </p>
            <div className="relative mt-9 flex flex-wrap justify-center gap-4">
              <Link
                to="/login?tab=signup"
                className="rounded-xl bg-white px-8 py-3.5 font-semibold text-[#0F172A] shadow-lg transition hover:-translate-y-0.5"
              >
                Start Now
              </Link>
              <a
                href="#faq"
                className="rounded-xl border border-white/40 px-8 py-3.5 font-semibold text-white transition hover:bg-white/10 hover:-translate-y-0.5"
              >
                Request Demo
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ------------------------------------------------- Footer -- */}
      <footer className="border-t border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#10B981] to-[#34D399]">
                  <span className="text-white font-bold text-xs">S</span>
                </div>
                <span className="font-bold">SUPRESET</span>
              </div>
              <p className="mt-4 text-sm text-slate-500">
                Role-based campus placement management, built for universities.
              </p>
            </div>

            <FooterCol title="Product" links={["Home", "Features", "Modules", "Pricing"]} />
            <FooterCol title="Company" links={["Contact", "Support"]} />
            <FooterCol title="Legal" links={["Privacy Policy", "Terms"]} />
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 sm:flex-row">
            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} SUPRESET. All rights reserved.
            </p>
            <div className="flex gap-4 text-slate-400">
              {["M4 4h16v16H4z", "M4 4h16v16H4z", "M4 4h16v16H4z"].map((_, i) => (
                <a key={i} href="#" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 transition hover:border-emerald-200 hover:text-[#10B981]">
                  <span className="text-xs font-bold">{["in", "tw", "gh"][i]}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <p className="text-sm font-bold text-[#0F172A]">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l}>
            <a href="#" className="text-sm text-slate-500 transition hover:text-[#10B981]">{l}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatDark({ value, suffix, label }) {
  const [ref, inView] = useInView();
  const count = useCountUp(value, 1800, inView);
  return (
    <div ref={ref}>
      <div className="text-2xl font-bold tabular-nums sm:text-3xl">
        {count.toLocaleString()}
        <span className="text-[#34D399]">{suffix}</span>
      </div>
      <p className="mt-1 text-xs font-medium text-slate-400">{label}</p>
    </div>
  );
}