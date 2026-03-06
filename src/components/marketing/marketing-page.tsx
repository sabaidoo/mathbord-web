"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { SUBJECT_DATA } from "./subject-data";
import { LEGAL_CONTENT } from "./legal-content";
import "./marketing.css";

export default function MarketingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [province, setProvince] = useState("");
  const [consultStep, setConsultStep] = useState(1);
  const [consultSubmitted, setConsultSubmitted] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<"faq" | "privacy" | "terms">("faq");
  const [toast, setToast] = useState("");
  const [appSubmitted, setAppSubmitted] = useState(false);

  // Consultation form refs
  const consultFirstName = useRef<HTMLInputElement>(null);
  const consultLastName = useRef<HTMLInputElement>(null);
  const consultEmail = useRef<HTMLInputElement>(null);
  const consultPhone = useRef<HTMLInputElement>(null);
  const consultGrade = useRef<HTMLInputElement>(null);
  const consultGoals = useRef<HTMLTextAreaElement>(null);
  const consultMarketing = useRef<HTMLInputElement>(null);

  // Application form refs
  const appFname = useRef<HTMLInputElement>(null);
  const appLname = useRef<HTMLInputElement>(null);
  const appEmail = useRef<HTMLInputElement>(null);
  const appPhone = useRef<HTMLInputElement>(null);
  const appCity = useRef<HTMLInputElement>(null);
  const appDegree = useRef<HTMLInputElement>(null);
  const appExperience = useRef<HTMLSelectElement>(null);
  const appApproach = useRef<HTMLTextAreaElement>(null);
  const appSource = useRef<HTMLSelectElement>(null);
  const appSubjectsRef = useRef<HTMLDivElement>(null);

  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("mkt-visible");
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".mkt-reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Sticky nav shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Escape to close legal modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLegalOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Lock body scroll when legal modal open
  useEffect(() => {
    document.body.style.overflow = legalOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [legalOpen]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  const removeSubject = (subject: string) => {
    setSelectedSubjects((prev) => prev.filter((s) => s !== subject));
  };

  const openLegalModal = (tab: "faq" | "privacy" | "terms") => {
    setLegalTab(tab);
    setLegalOpen(true);
  };

  const switchLegalTab = (tab: "faq" | "privacy" | "terms") => {
    setLegalTab(tab);
  };

  // Bind FAQ accordion after legal content renders
  useEffect(() => {
    if (!legalOpen) return;
    const timer = setTimeout(() => {
      document.querySelectorAll(".mkt-faq-q").forEach((q) => {
        (q as HTMLElement).onclick = () =>
          q.parentElement?.classList.toggle("mkt-faq-open");
      });
    }, 50);
    return () => clearTimeout(timer);
  }, [legalOpen, legalTab]);

  // Consultation form submit
  async function handleConsultSubmit() {
    const firstName = consultFirstName.current?.value.trim();
    const lastName = consultLastName.current?.value.trim();
    const email = consultEmail.current?.value.trim();
    if (!firstName || !lastName || !email) {
      showToast("Please fill in all required fields.");
      return;
    }
    setConsultSubmitted(true);
    try {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone: consultPhone.current?.value.trim() || null,
          province: province || null,
          subjects: selectedSubjects,
          gradeLevel: consultGrade.current?.value.trim() || null,
          goals: consultGoals.current?.value.trim() || null,
          marketingConsent: consultMarketing.current?.checked ?? false,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      showToast("Request sent! We'll be in touch within 24 hours.");
      setTimeout(() => {
        setConsultSubmitted(false);
        setConsultStep(1);
        setSelectedSubjects([]);
        setProvince("");
        if (consultFirstName.current) consultFirstName.current.value = "";
        if (consultLastName.current) consultLastName.current.value = "";
        if (consultEmail.current) consultEmail.current.value = "";
        if (consultPhone.current) consultPhone.current.value = "";
        if (consultGrade.current) consultGrade.current.value = "";
        if (consultGoals.current) consultGoals.current.value = "";
        if (consultMarketing.current) consultMarketing.current.checked = false;
      }, 4000);
    } catch {
      showToast("Something went wrong. Please try again.");
      setConsultSubmitted(false);
    }
  }

  // Tutor application submit
  async function handleApplicationSubmit() {
    const fname = appFname.current?.value.trim();
    const lname = appLname.current?.value.trim();
    const email = appEmail.current?.value.trim();
    const city = appCity.current?.value.trim();
    const degree = appDegree.current?.value.trim();
    const experience = appExperience.current?.value;
    const subjects: string[] = [];
    appSubjectsRef.current
      ?.querySelectorAll("input:checked")
      .forEach((cb) => subjects.push((cb as HTMLInputElement).value));

    if (!fname || !lname || !email || !city || !degree || !experience || subjects.length === 0) {
      showToast("Please fill in all required fields and select at least one subject.");
      return;
    }

    setAppSubmitted(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${fname} ${lname}`,
          email,
          phone: appPhone.current?.value.trim() || null,
          city,
          degree,
          subjects,
          experience,
          approach: appApproach.current?.value.trim() || null,
          source: appSource.current?.value || "Website",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      showToast("Application submitted! We'll review it within 48 hours.");
      setTimeout(() => {
        setAppSubmitted(false);
        // Reset form fields
        [appFname, appLname, appEmail, appPhone, appCity, appDegree, appApproach].forEach((r) => {
          if (r.current) (r.current as HTMLInputElement | HTMLTextAreaElement).value = "";
        });
        if (appExperience.current) appExperience.current.selectedIndex = 0;
        if (appSource.current) appSource.current.selectedIndex = 0;
        appSubjectsRef.current
          ?.querySelectorAll("input")
          .forEach((cb) => ((cb as HTMLInputElement).checked = false));
      }, 4000);
    } catch {
      showToast("Something went wrong. Please try again.");
      setAppSubmitted(false);
    }
  }

  const provinceData = province ? SUBJECT_DATA[province] : null;
  const legalContent = LEGAL_CONTENT[legalTab];

  return (
    <div className="mkt">
      {/* NAV */}
      <nav className={`mkt-nav${scrolled ? " mkt-nav-scrolled" : ""}`} id="nav">
        <div className="mkt-nav-inner">
          <a href="#hero" className="mkt-nav-logo">
            <span className="mkt-nav-logo-name">Mathbord</span>
          </a>
          <ul className="mkt-nav-links">
            <li><a href="#hero">Home</a></li>
            <li><a href="#process">How It Works</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#success">Results</a></li>
            <li><a href="#resources">Resources</a></li>
            <li><a href="#apply">Teach with Us</a></li>
            <li><Link href="/login" style={{ color: "var(--mkt-teal)", fontWeight: 600 }}>Log in</Link></li>
            <li><Link href="/login" className="mkt-nav-cta">Get started</Link></li>
          </ul>
          <button
            className={`mkt-hamburger${mobileOpen ? " mkt-hamburger-open" : ""}`}
            aria-label="Menu"
            onClick={() => setMobileOpen((o) => !o)}
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>
      <div className={`mkt-mobile-menu${mobileOpen ? " mkt-mobile-open" : ""}`}>
        <a href="#hero" onClick={closeMobile}>Home</a>
        <a href="#process" onClick={closeMobile}>How It Works</a>
        <a href="#services" onClick={closeMobile}>Services</a>
        <a href="#success" onClick={closeMobile}>Results</a>
        <a href="#resources" onClick={closeMobile}>Resources</a>
        <a href="#apply" onClick={closeMobile}>Teach with Us</a>
        <Link href="/login" onClick={closeMobile}>Log in</Link>
        <Link href="/login" onClick={closeMobile}>Get started</Link>
      </div>

      {/* HERO */}
      <section className="mkt-hero" id="hero">
        <div className="mkt-hero-inner">
          <div className="mkt-hero-content mkt-reveal">
            <h1>Right tutor. Right plan.<br /><span>Visible progress.</span></h1>
            <p className="mkt-hero-sub">Mathbord connects students to rigorously vetted math specialists through a structured five&#8209;step process that diagnoses gaps, builds a personalized plan, and tracks visible progress.</p>
            <div className="mkt-hero-buttons">
              <a href="#contact" className="mkt-btn-primary">Book Free 3&#8209;Minute Consultation &rarr;</a>
              <a href="#process" className="mkt-btn-secondary">Explore How It Works</a>
            </div>
            <div className="mkt-hero-pills">
              <a href="#segments" className="mkt-pill">For Students</a>
              <a href="#segments" className="mkt-pill">For Families</a>
              <a href="#segments" className="mkt-pill">For Exam Prep</a>
            </div>
          </div>
          <div className="mkt-hero-visual mkt-reveal" style={{ transitionDelay: "0.15s" }}>
            <div className="mkt-mock-header">
              <div className="mkt-mock-header-left">
                <div className="mkt-mock-avatar">AL</div>
                <div>
                  <div className="mkt-mock-name">Amara L.</div>
                  <div className="mkt-mock-grade">Grade 10 &middot; Ontario Curriculum</div>
                </div>
              </div>
              <div className="mkt-mock-badge">On Track</div>
            </div>
            <div className="mkt-mock-body">
              <div className="mkt-mock-section-title">Strengths &amp; Gaps</div>
              <div className="mkt-mock-tags">
                <span className="mkt-mock-tag mkt-mock-tag-green">Linear Relations &#10003;</span>
                <span className="mkt-mock-tag mkt-mock-tag-green">Statistics &#10003;</span>
                <span className="mkt-mock-tag mkt-mock-tag-amber">Quadratics &#9684;</span>
                <span className="mkt-mock-tag mkt-mock-tag-red">Trigonometry &#10007;</span>
              </div>
              <div className="mkt-mock-section-title">Progress Chart</div>
              <div className="mkt-mock-chart">
                <div className="mkt-mock-chart-bars">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="mkt-mock-bar" />
                  ))}
                </div>
                <div className="mkt-mock-chart-label">
                  <span>Week 1</span>
                  <span>Week 8</span>
                </div>
              </div>
              <div className="mkt-mock-section-title">Upcoming Sessions</div>
              <div className="mkt-mock-sessions">
                <div className="mkt-mock-session">
                  <div className="mkt-mock-session-info">
                    <div className="mkt-mock-session-dot mkt-dot-teal" />
                    <span className="mkt-mock-session-text">Quadratic Equations Review</span>
                  </div>
                  <span className="mkt-mock-session-time">Tue 4:00 PM</span>
                </div>
                <div className="mkt-mock-session">
                  <div className="mkt-mock-session-info">
                    <div className="mkt-mock-session-dot mkt-dot-amber" />
                    <span className="mkt-mock-session-text">Trig Fundamentals Introduction</span>
                  </div>
                  <span className="mkt-mock-session-time">Thu 4:00 PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAND */}
      <section className="mkt-trust-band" id="trust">
        <div className="mkt-trust-inner">
          <div className="mkt-trust-label mkt-reveal">The Mathbord Difference</div>
          <h2 className="mkt-trust-heading mkt-reveal">Designing impact. Delivering results.<br />Trusted by families across Canada.</h2>
          <p className="mkt-trust-para mkt-reveal">Canadian PISA math scores have fallen 35 points since 2003 &mdash; nearly two years of lost learning. One in five students now falls below the OECD baseline. Structured, specialist tutoring isn&rsquo;t optional anymore. It&rsquo;s critical.</p>
          <div className="mkt-trust-metrics mkt-reveal">
            <div className="mkt-trust-metric">
              <div className="mkt-trust-metric-value">5&#8209;Step</div>
              <div className="mkt-trust-metric-label">Proprietary process from consultation to visible progress &mdash; no more random sessions, no more guesswork.</div>
            </div>
            <div className="mkt-trust-metric">
              <div className="mkt-trust-metric-value">100%</div>
              <div className="mkt-trust-metric-label">Of Mathbord tutors rigorously vetted for subject expertise, teaching ability, and reliability.</div>
            </div>
            <div className="mkt-trust-metric">
              <div className="mkt-trust-metric-value">Visible</div>
              <div className="mkt-trust-metric-label">Progress charts and milestones that make improvement easy to see and measure.</div>
            </div>
          </div>
          <div className="mkt-trust-bottom mkt-reveal">
            &ldquo;As an embedded extension of your support system, we bring specialist&#8209;level math expertise and a repeatable methodology. No guesswork. No fluff. Just a clear, strategic path to closing gaps and building lasting fluency.&rdquo;
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="mkt-services" id="services">
        <div className="mkt-services-inner">
          <div className="mkt-section-label mkt-reveal">Mathbord services</div>
          <h2 className="mkt-section-heading mkt-reveal">What we do &mdash; and how we do it differently.</h2>
          <div className="mkt-service-tiles">
            {[
              { num: "01", title: "One&#8209;on&#8209;One Tutoring", desc: "Personalized 1:1 support from rigorously vetted math specialists across all provincial curricula, AP, IB, and university&#8209;level mathematics." },
              { num: "02", title: "Small Groups &amp; Bootcamps", desc: "Targeted small group classes and intensive bootcamps for catch&#8209;up, acceleration, and exam crunch periods, available Canada&#8209;wide." },
              { num: "03", title: "Exam &amp; Admissions Prep", desc: "Structured prep for SAT Math, PSAT Math, GRE Quant, and GMAT Quant with diagnostic clarity and visible progress tracking." },
            ].map((s, i) => (
              <div key={i} className="mkt-service-tile mkt-reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="mkt-service-number">{s.num}</div>
                <div className="mkt-service-title" dangerouslySetInnerHTML={{ __html: s.title }} />
                <p className="mkt-service-desc" dangerouslySetInnerHTML={{ __html: s.desc }} />
                <span className="mkt-service-arrow">Learn more &rarr;</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="mkt-marquee-section">
        <div className="mkt-marquee-track">
          {[
            "No fluff, just better math results.",
            "Right tutor. Right plan. Visible progress.",
            "Math tutoring for every Canadian province and curriculum.",
            "Elite math specialists, vetted and accountable.",
            "A structured five\u2011step process, not random sessions.",
            "ON \u00b7 BC \u00b7 AB \u00b7 QC \u00b7 MB \u00b7 SK \u00b7 NS \u00b7 NB \u2014 all provinces covered.",
          ].map((text, i) => (
            <span key={`a${i}`} className="mkt-marquee-item">{text}</span>
          ))}
          {[
            "No fluff, just better math results.",
            "Right tutor. Right plan. Visible progress.",
            "Math tutoring for every Canadian province and curriculum.",
            "Elite math specialists, vetted and accountable.",
            "A structured five\u2011step process, not random sessions.",
            "ON \u00b7 BC \u00b7 AB \u00b7 QC \u00b7 MB \u00b7 SK \u00b7 NS \u00b7 NB \u2014 all provinces covered.",
          ].map((text, i) => (
            <span key={`b${i}`} className="mkt-marquee-item">{text}</span>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="mkt-process" id="process">
        <div className="mkt-process-inner">
          <div className="mkt-section-label mkt-reveal">How Mathbord works</div>
          <h2 className="mkt-section-heading mkt-reveal">A holistic approach to math support,<br />powered by diagnostics and data.</h2>
          <div className="mkt-process-steps">
            {[
              { n: 1, t: "Book Consultation", d: "Free 3\u2011minute call to understand goals, academic level, curriculum, and timelines." },
              { n: 2, t: "Review Profile", d: "We assess strengths, gaps, and the optimal learning sequence to drive improvement." },
              { n: 3, t: "Tutor Matching", d: "We match you with a rigorously vetted specialist tutor aligned to your exact needs." },
              { n: 4, t: "Personalized Plan", d: "We set clear objectives, tailored lesson plans, and weekly milestones." },
              { n: 5, t: "Track Progress", d: "You get ongoing progress charts, plan adjustments, and documented wins to keep momentum." },
            ].map((step) => (
              <div key={step.n} className="mkt-process-step mkt-reveal" style={{ transitionDelay: `${(step.n - 1) * 0.08}s` }}>
                <div className="mkt-step-num">{step.n}</div>
                <div className="mkt-step-title">{step.t}</div>
                <p className="mkt-step-desc">{step.d}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center" }} className="mkt-reveal">
            <a href="#contact" className="mkt-btn-primary">Start the 5&#8209;Step Process &rarr;</a>
          </div>
        </div>
      </section>

      {/* SUCCESS STORIES */}
      <section className="mkt-success" id="success">
        <div className="mkt-success-inner">
          <div className="mkt-section-label mkt-reveal">Results</div>
          <h2 className="mkt-section-heading mkt-reveal">Featured Student Success Stories</h2>
          <div className="mkt-success-grid">
            {[
              { type: "Grade 10 Academic Math \u2014 Ontario", result: "From struggling with foundational concepts to consistently scoring above 80% in one semester.", detail: "A tailored recovery plan addressed two years of compounding gaps with structured weekly milestones and visible progress tracking." },
              { type: "First\u2011Year Calculus \u2014 UBC", result: "Rebuilt core skills and improved test confidence over one term with a specialist tutor.", detail: "Diagnostic review identified prerequisite gaps. A matched specialist rebuilt foundations while keeping pace with university content." },
              { type: "SAT Math Prep", result: "Closed foundational algebra gaps while preparing for SAT Math, with visible weekly progress.", detail: "Structured prep plan combined diagnostic review with targeted practice, tracking score gains at every checkpoint." },
            ].map((card, i) => (
              <div key={i} className="mkt-success-card mkt-reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="mkt-success-type">{card.type}</div>
                <div className="mkt-success-result">{card.result}</div>
                <p className="mkt-success-detail">{card.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEGMENTS */}
      <section className="mkt-segments" id="segments">
        <div className="mkt-segments-inner">
          <div className="mkt-section-label mkt-reveal">Who we serve</div>
          <h2 className="mkt-section-heading mkt-reveal">Built for families, students, and serious exam prep.</h2>
          <div className="mkt-segments-grid">
            {[
              { icon: "\ud83d\udcd0", title: "Students", desc: "For students who want a clear, structured plan instead of random tutoring sessions." },
              { icon: "\ud83d\udc68\u200d\ud83d\udc69\u200d\ud83d\udc67", title: "Families", desc: "For families seeking reliable, specialist\u2011level math support they can trust." },
              { icon: "\ud83c\udfaf", title: "Exam\u2011Focused Learners", desc: "For learners preparing for high\u2011stakes exams and significant grade improvement." },
            ].map((seg, i) => (
              <div key={i} className="mkt-segment-card mkt-reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="mkt-segment-icon">{seg.icon}</div>
                <div className="mkt-segment-title">{seg.title}</div>
                <p className="mkt-segment-desc">{seg.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HIGHLIGHTS */}
      <section className="mkt-highlights">
        <div className="mkt-highlights-inner">
          <div className="mkt-section-label mkt-reveal" style={{ color: "var(--mkt-teal-light)" }}>Case highlights</div>
          <h2 className="mkt-section-heading mkt-reveal" style={{ color: "var(--mkt-white)", marginBottom: "3rem" }}>Highlights from Our Latest Tutoring Journeys</h2>
          <div className="mkt-highlights-grid">
            {[
              { header: "Grade 11 Functions \u2014 Ontario", text: "Turned two years of lost learning into a clear, week\u2011by\u2011week recovery plan with visible milestones." },
              { header: "Calculus I \u2014 Engineering", text: "Rebuilt core skills and improved test confidence over one term through structured diagnostics." },
              { header: "SAT Math Prep", text: "Structured prep plan with diagnostic review and tracked score gains across eight weeks." },
              { header: "Grade 8 Transition \u2014 BC", text: "Proactive gap closure before high school, building confidence and fluency in key areas." },
              { header: "IB Math AA HL", text: "Specialist\u2011matched tutor helped navigate advanced content with weekly progress tracking." },
              { header: "GRE Quant Prep", text: "Diagnostic\u2011first approach identified weaknesses and delivered targeted, efficient prep." },
              { header: "Grade 10 Foundations \u2014 Alberta", text: "Family saw documented improvement for the first time after years of inconsistent tutoring." },
              { header: "AP Calculus BC", text: "Accelerated prep with a vetted specialist, combining content mastery with exam strategy." },
            ].map((h, i) => (
              <div key={i} className="mkt-highlight-tile mkt-reveal" style={{ transitionDelay: `${i * 0.06}s` }}>
                <div className="mkt-highlight-header">{h.header}</div>
                <p className="mkt-highlight-text">{h.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RESOURCES */}
      <section className="mkt-resources" id="resources">
        <div className="mkt-resources-inner">
          <div className="mkt-section-label mkt-reveal">Latest insights</div>
          <h2 className="mkt-section-heading mkt-reveal">Resources for families and students.</h2>
          <div className="mkt-resources-grid">
            {[
              {
                num: "01",
                meta: ["Feb 2026", "Math Instruction", "Families"],
                title: "Why Random Tutoring Sessions Fail \u2014 And What a 5\u2011Step Process Fixes",
                excerpt: "Most tutoring fails because it treats symptoms, not root causes. Learn how a structured, diagnostic\u2011first approach delivers lasting results.",
              },
              {
                num: "02",
                meta: ["Jan 2026", "Progress Tracking", "Exam Prep"],
                title: "How Visible Progress Charts Keep Students and Families Aligned",
                excerpt: "Transparency drives motivation. Discover why making progress visible is the most underrated tool in math education.",
              },
            ].map((r, i) => (
              <div key={i} className="mkt-resource-card mkt-reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="mkt-resource-img"><span className="mkt-resource-img-text">{r.num}</span></div>
                <div className="mkt-resource-body">
                  <div className="mkt-resource-meta">
                    <span>{r.meta[0]}</span>
                    {r.meta.slice(1).map((t, j) => (
                      <span key={j} className="mkt-resource-tag">{t}</span>
                    ))}
                  </div>
                  <div className="mkt-resource-title">{r.title}</div>
                  <p className="mkt-resource-excerpt">{r.excerpt}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: "3rem" }} className="mkt-reveal">
            <a href="#" className="mkt-btn-secondary">More resources &rarr;</a>
          </div>
        </div>
      </section>

      {/* TUTOR APPLICATION */}
      <section className="mkt-tutor-apply" id="apply">
        <div className="mkt-tutor-apply-inner">
          <div className="mkt-tutor-apply-content mkt-reveal">
            <div className="mkt-section-label" style={{ color: "var(--mkt-teal)" }}>Become a Mathbord tutor</div>
            <h2>Teach math with <span>purpose, structure, and support.</span></h2>
            <p>We&rsquo;re building a network of Canada&rsquo;s best math specialists. If you have deep subject expertise and a passion for helping students achieve visible results, we want to hear from you.</p>
            <div className="mkt-tutor-perks">
              {[
                { icon: "\ud83d\udcb0", title: "Competitive Pay", desc: "Earn $40\u2013$65/hr with transparent rates and reliable bi\u2011weekly payouts." },
                { icon: "\ud83d\udcc5", title: "Flexible Schedule", desc: "Set your own availability. Teach from anywhere in Canada \u2014 fully remote." },
                { icon: "\ud83d\udcca", title: "Admin Handled", desc: "We handle matching, billing, scheduling, and parent communication. You just teach." },
                { icon: "\ud83d\ude80", title: "Grow Your Career", desc: "Build a reputation, earn performance bonuses, and access professional development." },
              ].map((p, i) => (
                <div key={i} className="mkt-tutor-perk">
                  <div className="mkt-tutor-perk-icon">{p.icon}</div>
                  <div className="mkt-tutor-perk-title">{p.title}</div>
                  <div className="mkt-tutor-perk-desc">{p.desc}</div>
                </div>
              ))}
            </div>
            <div className="mkt-tutor-reqs">
              <div className="mkt-tutor-reqs-title">What we look for</div>
              <div className="mkt-tutor-reqs-list">
                {[
                  "Degree in Mathematics, Engineering, Actuarial Science, or a related quantitative field",
                  "Demonstrated teaching or tutoring experience (1+ year preferred)",
                  "Strong command of at least one Canadian provincial curriculum, IB, AP, or standardized test",
                  "Reliable internet, a quiet workspace, and professional communication skills",
                  "Eligible to work in Canada",
                ].map((req, i) => (
                  <div key={i} className="mkt-tutor-req">
                    <span className="mkt-tutor-req-check">&#10003;</span>{req}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mkt-tutor-form mkt-reveal" style={{ transitionDelay: "0.1s" }}>
            <div className="mkt-tutor-form-title">Apply to Tutor</div>
            <div className="mkt-tutor-form-sub">Tell us about your background. We review every application within 48 hours.</div>
            <div className="mkt-t-form-row">
              <div className="mkt-t-form-group"><label className="mkt-t-form-label">First Name *</label><input className="mkt-t-form-input" ref={appFname} type="text" placeholder="First name" /></div>
              <div className="mkt-t-form-group"><label className="mkt-t-form-label">Last Name *</label><input className="mkt-t-form-input" ref={appLname} type="text" placeholder="Last name" /></div>
            </div>
            <div className="mkt-t-form-group"><label className="mkt-t-form-label">Email *</label><input className="mkt-t-form-input" ref={appEmail} type="email" placeholder="you@email.com" /></div>
            <div className="mkt-t-form-group"><label className="mkt-t-form-label">Phone</label><input className="mkt-t-form-input" ref={appPhone} type="tel" placeholder="(optional)" /></div>
            <div className="mkt-t-form-group"><label className="mkt-t-form-label">City &amp; Province *</label><input className="mkt-t-form-input" ref={appCity} type="text" placeholder="e.g. Vancouver, BC" /></div>
            <div className="mkt-t-form-group"><label className="mkt-t-form-label">Highest Degree &amp; Field of Study *</label><input className="mkt-t-form-input" ref={appDegree} type="text" placeholder="e.g. B.Sc. Mathematics, University of Toronto" /></div>
            <div className="mkt-t-form-checks">
              <div className="mkt-t-form-checks-title">Subjects you can teach (select all that apply) *</div>
              <div className="mkt-t-form-check-grid" ref={appSubjectsRef}>
                {[
                  "Elementary Math (K\u20136)", "Middle School (7\u20138)", "High School Functions", "High School Calculus",
                  "IB Math (AA / AI)", "AP Calculus (AB / BC)", "SAT / PSAT Math", "GRE / GMAT Quant",
                  "University Calculus", "Linear Algebra", "Statistics / Probability", "Other",
                ].map((subj) => (
                  <label key={subj} className="mkt-t-form-check">
                    <input type="checkbox" value={subj} /> {subj === "Other" ? "Other (specify below)" : subj}
                  </label>
                ))}
              </div>
            </div>
            <div className="mkt-t-form-group">
              <label className="mkt-t-form-label">Years of Tutoring Experience *</label>
              <select className="mkt-t-form-input" ref={appExperience}>
                <option value="">Select&hellip;</option>
                <option>Less than 1 year</option>
                <option>1&ndash;2 years</option>
                <option>3&ndash;5 years</option>
                <option>5+ years</option>
              </select>
            </div>
            <div className="mkt-t-form-group"><label className="mkt-t-form-label">Tell us about your teaching approach</label><textarea className="mkt-t-form-input" ref={appApproach} placeholder="What makes you effective as a math tutor? Any specialties, methodologies, or results you're proud of?" /></div>
            <div className="mkt-t-form-group">
              <label className="mkt-t-form-label">How did you hear about Mathbord?</label>
              <select className="mkt-t-form-input" ref={appSource}>
                <option value="">Select&hellip;</option>
                <option>LinkedIn</option>
                <option>Google Search</option>
                <option>Referral from a friend</option>
                <option>Social Media</option>
                <option>University job board</option>
                <option>Other</option>
              </select>
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--mkt-gray-400)", marginBottom: "1rem" }}>
              By applying, you agree to our{" "}
              <a href="#" onClick={(e) => { e.preventDefault(); openLegalModal("privacy"); }} style={{ color: "var(--mkt-teal)", textDecoration: "none" }}>Privacy Policy</a>.
              We&rsquo;ll review your application and follow up within 48 hours.
            </div>
            <button
              className="mkt-t-form-submit"
              onClick={handleApplicationSubmit}
              disabled={appSubmitted}
              style={appSubmitted ? { background: "#166534" } : undefined}
            >
              {appSubmitted ? "\u2713 Application submitted!" : "Submit application \u2192"}
            </button>
          </div>
        </div>
      </section>

      {/* CTA / CONSULTATION FORM */}
      <section className="mkt-cta-section" id="contact">
        <div className="mkt-cta-inner">
          <div className="mkt-cta-content mkt-reveal">
            <h2>Book Your Free 3&#8209;Minute Consultation.</h2>
            <p>Let&rsquo;s talk about goals, curriculum, and timelines &mdash; and match you with the right specialist tutor.</p>
            <div className="mkt-cta-reassurance">
              <p>Every tutor on Mathbord is vetted for subject expertise, teaching skill, and reliability. Your information is safe with us.</p>
              <div className="mkt-cta-location">{"\ud83d\udccd"} Vancouver, BC &middot; Canada&#8209;wide online</div>
              <div className="mkt-cta-socials">
                <a href="#" className="mkt-cta-social" title="Facebook">f</a>
                <a href="#" className="mkt-cta-social" title="Instagram">ig</a>
                <a href="#" className="mkt-cta-social" title="LinkedIn">in</a>
                <a href="#" className="mkt-cta-social" title="YouTube">yt</a>
              </div>
            </div>
          </div>

          <div className="mkt-cta-form mkt-reveal" style={{ transitionDelay: "0.1s" }}>
            {/* STEP 1: Province & Subjects */}
            <div className={`mkt-subj-step${consultStep === 1 ? " mkt-subj-step-active" : ""}`}>
              <div className="mkt-subj-step-indicator">
                <div className="mkt-subj-step-dot mkt-subj-step-dot-active" />
                <div className={`mkt-subj-step-dot${consultStep >= 2 ? " mkt-subj-step-dot-active" : ""}`} />
              </div>
              <div className="mkt-checkbox-group-label" style={{ marginBottom: "0.25rem" }}>What does your student need help with?</div>
              <p style={{ fontSize: "0.78rem", color: "var(--mkt-gray-400)", marginBottom: "1.25rem" }}>Choose your province or university level, then select all relevant subjects.</p>

              <div className="mkt-form-group" style={{ marginBottom: "1rem" }}>
                <label className="mkt-form-label">Province or Level *</label>
                <select
                  className="mkt-subj-province-select"
                  value={province}
                  onChange={(e) => { setProvince(e.target.value); setSelectedSubjects([]); }}
                >
                  <option value="">Select province or university&hellip;</option>
                  <optgroup label="Provincial Curricula">
                    <option value="ON">Ontario</option>
                    <option value="BC">British Columbia</option>
                    <option value="AB">Alberta</option>
                    <option value="QC">Quebec</option>
                    <option value="MB">Manitoba</option>
                    <option value="SK">Saskatchewan</option>
                    <option value="NS">Nova Scotia</option>
                    <option value="NB">New Brunswick</option>
                    <option value="NL">Newfoundland &amp; Labrador</option>
                    <option value="PE">Prince Edward Island</option>
                  </optgroup>
                  <optgroup label="University & College">
                    <option value="UNI">University / College Courses</option>
                  </optgroup>
                  <optgroup label="International / Standardized">
                    <option value="IB">IB Programme</option>
                    <option value="AP">AP Programme</option>
                    <option value="EXAM">Standardized Test Prep (SAT, GRE, GMAT)</option>
                  </optgroup>
                </select>
              </div>

              {provinceData && (
                <div>
                  {provinceData.categories.map((cat) => (
                    <div key={cat.title} className="mkt-subj-category">
                      <div className="mkt-subj-cat-title">{cat.title}</div>
                      <div className="mkt-subj-grid">
                        {cat.subjects.map((s) => {
                          const checked = selectedSubjects.includes(s);
                          return (
                            <label
                              key={s}
                              className={`mkt-subj-chip${checked ? " mkt-subj-chip-checked" : ""}`}
                              onClick={(e) => { e.preventDefault(); toggleSubject(s); }}
                            >
                              <div className="mkt-subj-chip-icon">{checked ? "\u2713" : ""}</div>
                              <span>{s}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mkt-subj-selected-summary">
                {selectedSubjects.map((s) => (
                  <span key={s} className="mkt-subj-sel-tag">
                    {s}{" "}
                    <span className="mkt-subj-sel-remove" onClick={() => removeSubject(s)}>&#10005;</span>
                  </span>
                ))}
              </div>

              <button
                className="mkt-subj-next-btn"
                disabled={selectedSubjects.length === 0}
                onClick={() => setConsultStep(2)}
              >
                Continue to booking details &rarr;
              </button>
            </div>

            {/* STEP 2: Contact Details */}
            <div className={`mkt-subj-step${consultStep === 2 ? " mkt-subj-step-active" : ""}`}>
              <div className="mkt-subj-step-indicator">
                <div className="mkt-subj-step-dot mkt-subj-step-dot-active" />
                <div className="mkt-subj-step-dot mkt-subj-step-dot-active" />
              </div>
              <div className="mkt-checkbox-group-label" style={{ marginBottom: "0.25rem" }}>Your details</div>
              <p style={{ fontSize: "0.78rem", color: "var(--mkt-gray-400)", marginBottom: "0.75rem" }}>
                Selected subjects: <span style={{ color: "var(--mkt-teal)", fontWeight: 600 }}>{selectedSubjects.join(", ")}</span>
              </p>

              <div className="mkt-form-row">
                <div className="mkt-form-group"><label className="mkt-form-label">First Name *</label><input type="text" className="mkt-form-input" ref={consultFirstName} placeholder="First name" /></div>
                <div className="mkt-form-group"><label className="mkt-form-label">Last Name *</label><input type="text" className="mkt-form-input" ref={consultLastName} placeholder="Last name" /></div>
              </div>
              <div className="mkt-form-group"><label className="mkt-form-label">Email *</label><input type="email" className="mkt-form-input" ref={consultEmail} placeholder="you@email.com" /></div>
              <div className="mkt-form-group"><label className="mkt-form-label">Phone Number</label><input type="tel" className="mkt-form-input" ref={consultPhone} placeholder="(optional)" /></div>
              <div className="mkt-form-group"><label className="mkt-form-label">Student&rsquo;s Grade Level</label><input type="text" className="mkt-form-input" ref={consultGrade} placeholder="e.g. Grade 10, First Year University" /></div>
              <div className="mkt-form-group"><label className="mkt-form-label">Goals &amp; Timeline</label><textarea className="mkt-form-input" ref={consultGoals} placeholder="Tell us about current challenges, target grades, and important dates." /></div>
              <div className="mkt-form-checkboxes"><label className="mkt-form-checkbox"><input type="checkbox" ref={consultMarketing} /> I agree to receive resources and updates from Mathbord.</label></div>
              <div className="mkt-form-privacy">By submitting, you agree to our <a href="#" onClick={(e) => { e.preventDefault(); openLegalModal("privacy"); }}>Privacy Policy</a>.</div>
              <button
                className="mkt-form-submit"
                type="button"
                onClick={handleConsultSubmit}
                disabled={consultSubmitted}
                style={consultSubmitted ? { background: "#166534" } : undefined}
              >
                {consultSubmitted ? "\u2713 Request sent!" : "Book consultation \u2192"}
              </button>
              <button className="mkt-subj-next-btn mkt-subj-back-btn" onClick={() => setConsultStep(1)}>&larr; Back to subject selection</button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mkt-footer" id="footer">
        <div className="mkt-footer-inner">
          <div className="mkt-footer-grid">
            <div className="mkt-footer-brand">
              <div className="mkt-nav-logo" style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                <span className="mkt-nav-logo-name">Mathbord</span>
              </div>
              <p className="mkt-footer-brand-desc">Right tutor. Right plan. Visible progress. Canada&rsquo;s premier platform for elite math tutors.</p>
            </div>
            <div>
              <div className="mkt-footer-col-title">Company</div>
              <ul className="mkt-footer-links">
                <li><a href="#process">How It Works</a></li>
                <li><a href="#success">Results</a></li>
                <li><a href="#resources">Resources</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>
            <div>
              <div className="mkt-footer-col-title">Services</div>
              <ul className="mkt-footer-links">
                <li><a href="#">One&#8209;on&#8209;One Tutoring</a></li>
                <li><a href="#">Small Groups &amp; Bootcamps</a></li>
                <li><a href="#">Exam &amp; Admissions Prep</a></li>
              </ul>
            </div>
            <div>
              <div className="mkt-footer-col-title">Support</div>
              <ul className="mkt-footer-links">
                <li><a href="#" onClick={(e) => { e.preventDefault(); openLegalModal("faq"); }}>FAQ</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); openLegalModal("privacy"); }}>Privacy Policy</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); openLegalModal("terms"); }}>Terms of Service</a></li>
                <li><Link href="/login">Client Login</Link></li>
                <li><a href="#apply">Apply to Tutor</a></li>
              </ul>
            </div>
          </div>
          <div className="mkt-footer-bottom">
            <span>&copy; Mathbord 2026. All rights reserved.</span>
            <a href="#" onClick={(e) => { e.preventDefault(); openLegalModal("privacy"); }}>Privacy Policy</a>
          </div>
        </div>
      </footer>

      {/* LEGAL MODAL */}
      {legalOpen && (
        <div className="mkt-legal-overlay mkt-legal-overlay-open" onClick={(e) => { if (e.target === e.currentTarget) setLegalOpen(false); }}>
          <div className="mkt-legal-modal">
            <div className="mkt-legal-modal-header">
              <h2>{legalContent.title}</h2>
              <button className="mkt-legal-modal-close" onClick={() => setLegalOpen(false)}>&#10005;</button>
            </div>
            <div className="mkt-legal-modal-tabs">
              {(["faq", "privacy", "terms"] as const).map((tab) => (
                <div
                  key={tab}
                  className={`mkt-legal-modal-tab${legalTab === tab ? " mkt-legal-modal-tab-active" : ""}`}
                  onClick={() => switchLegalTab(tab)}
                >
                  {tab === "faq" ? "FAQ" : tab === "privacy" ? "Privacy Policy" : "Terms of Service"}
                </div>
              ))}
            </div>
            <div className="mkt-legal-modal-body" dangerouslySetInnerHTML={{ __html: legalContent.html }} />
          </div>
        </div>
      )}

      {/* TOAST */}
      <div className={`mkt-site-toast${toast ? " mkt-site-toast-show" : ""}`}>{toast}</div>
    </div>
  );
}
