import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

/* ─── data ─────────────────────────────────────────────── */
const STATS = [
  { value: "10,000+", label: "Services Completed",  icon: "✓" },
  { value: "2,500+",  label: "Verified Providers",  icon: "★" },
  { value: "4.9 / 5", label: "Average Rating",      icon: "♥" },
  { value: "50+",     label: "Service Categories",  icon: "⚡" },
];

const FEATURES = [
  { icon: "🛡", title: "Verified Professionals",  desc: "Every provider passes identity checks and skill verification before they can list services on our platform." },
  { icon: "⚡", title: "Instant Booking",         desc: "Book a service in under 2 minutes. See real-time availability and get instant confirmation." },
  { icon: "💬", title: "Built-in Messaging",      desc: "Chat directly with your service provider through our secure in-app messaging before and after the visit." },
  { icon: "📍", title: "Map-Based Search",        desc: "Find the closest professionals using our interactive map. Filter by distance, rating, and availability." },
  { icon: "🔒", title: "Secure Payments",         desc: "Funds are held safely until the job is complete. Pay only after you're satisfied with the work." },
  { icon: "⚖️", title: "Dispute Protection",      desc: "Our dedicated admin team mediates any disagreements to ensure a fair outcome for every party." },
];

const STEPS = [
  { num: "01", icon: "🔍", title: "Browse & Compare",  desc: "Search services by category or location. View provider profiles, ratings, reviews, and transparent pricing." },
  { num: "02", icon: "📅", title: "Book & Confirm",    desc: "Choose your preferred date and time slot. Chat with the provider before they arrive at your door." },
  { num: "03", icon: "✅", title: "Get It Done & Pay", desc: "Your professional completes the job. Pay securely through the app and leave an honest review." },
];

const CATEGORIES = [
  { icon: "🔧", name: "Mechanic" },
  { icon: "🚿", name: "Plumber" },
  { icon: "⚡", name: "Electrician" },
  { icon: "🪚", name: "Carpenter" },
  { icon: "❄️", name: "AC Technician" },
  { icon: "🎨", name: "Painter" },
  { icon: "🏠", name: "Cleaning" },
  { icon: "🔑", name: "Locksmith" },
];

const TESTIMONIALS = [
  { name: "Priya Sharma",  avatar: "P", rating: 5, role: "Home Owner", text: "Found an electrician within 10 minutes. Arrived on time, fixed everything cleanly. FixItNow has completely changed how I handle home maintenance." },
  { name: "Rohit Kumar",   avatar: "R", rating: 5, role: "Customer",   text: "The map search is brilliant — I could see every nearby plumber, their ratings, and pricing before committing. Completely transparent." },
  { name: "Anita Patel",   avatar: "A", rating: 5, role: "Customer",   text: "The built-in chat is a game-changer. I described the problem before the provider arrived, saving us both time. Highly recommend." },
];

/* ─── animation helpers ──────────────────────────────────── */
const FadeUp = ({ children, delay = 0, style = {}, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 28 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    style={style}
    className={className}
  >
    {children}
  </motion.div>
);

/* ─── Navbar ─────────────────────────────────────────────── */
const Navbar = ({ navigate }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const navLinks = [
    { label: "Features",      href: "#features"      },
    { label: "How It Works",  href: "#how-it-works"  },
    { label: "Categories",    href: "#categories"    },
    { label: "For Providers", href: "#for-providers" },
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45 }}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        height: 68,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(20px, 4vw, 56px)",
        background: scrolled ? "rgba(2,8,23,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(148,163,184,0.1)" : "none",
        transition: "background 0.3s, border-color 0.3s, backdrop-filter 0.3s",
      }}
    >
      {/* Logo */}
      <a href="#hero" style={{ textDecoration: "none" }}>
        <span style={{
          fontSize: 22, fontWeight: 800,
          fontFamily: "var(--font-display)",
          background: "linear-gradient(135deg, #818cf8 0%, #06b6d4 100%)",
          WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
          letterSpacing: "-0.3px",
        }}>
          FixItNow
        </span>
      </a>

      {/* Desktop links */}
      <div style={{ display: "flex", gap: 32, alignItems: "center" }}
           className="nav-desktop-links">
        {navLinks.map(({ label, href }) => (
          <a key={href} href={href} className="landing-nav-link">{label}</a>
        ))}
      </div>

      {/* CTA buttons */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button
          onClick={() => navigate("/login")}
          style={{
            background: "transparent",
            border: "1px solid rgba(148,163,184,0.28)",
            color: "#f1f5f9", padding: "8px 18px",
            borderRadius: 8, cursor: "pointer",
            fontSize: 13, fontWeight: 500,
            transition: "border-color 0.2s, background 0.2s",
            fontFamily: "var(--font-sans)",
          }}
          onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; e.currentTarget.style.background = "rgba(99,102,241,0.07)"; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(148,163,184,0.28)"; e.currentTarget.style.background = "transparent"; }}
        >
          Sign In
        </button>
        <button
          onClick={() => navigate("/register")}
          style={{
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            border: "none", color: "#fff",
            padding: "8px 18px", borderRadius: 8,
            cursor: "pointer", fontSize: 13, fontWeight: 600,
            boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
            transition: "opacity 0.2s, transform 0.2s",
            fontFamily: "var(--font-sans)",
          }}
          onMouseOver={e => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseOut={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
        >
          Get Started Free
        </button>
      </div>
    </motion.nav>
  );
};

/* ─── Hero ───────────────────────────────────────────────── */
const Hero = ({ navigate }) => (
  <section id="hero" style={{
    minHeight: "100vh", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: "120px clamp(20px, 5vw, 80px) 80px",
    textAlign: "center", position: "relative", overflow: "hidden",
  }}>
    {/* Background glow blobs */}
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.14), transparent 70%)", top: "5%", left: "10%", filter: "blur(40px)" }} />
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(6,182,212,0.12), transparent 70%)", top: "20%", right: "8%", filter: "blur(40px)" }} />
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.08), transparent 70%)", bottom: "5%", left: "40%", filter: "blur(60px)" }} />
      {/* Grid pattern */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `linear-gradient(rgba(148,163,184,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.04) 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
      }} />
    </div>

    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        background: "rgba(99,102,241,0.1)",
        border: "1px solid rgba(99,102,241,0.28)",
        color: "#a5b4fc", padding: "6px 16px",
        borderRadius: 999, fontSize: 12, fontWeight: 600,
        letterSpacing: "0.6px", textTransform: "uppercase",
        marginBottom: 28,
      }}
    >
      <span>⭐</span> Trusted by 10,000+ customers across India
    </motion.div>

    <motion.h1
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      style={{
        fontSize: "clamp(38px, 6vw, 72px)",
        fontWeight: 900,
        fontFamily: "var(--font-display)",
        lineHeight: 1.1,
        letterSpacing: "-1.5px",
        margin: "0 0 20px",
        maxWidth: 840,
      }}
    >
      The Smarter Way to{" "}
      <span style={{
        background: "linear-gradient(135deg, #818cf8 0%, #06b6d4 60%, #67e8f9 100%)",
        WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
      }}>
        Fix Your Home
      </span>
    </motion.h1>

    <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.2 }}
      style={{
        fontSize: "clamp(16px, 2vw, 19px)",
        color: "var(--c-text2)",
        maxWidth: 560,
        margin: "0 0 40px",
        lineHeight: 1.7,
      }}
    >
      Book verified, background-checked professionals for plumbing, electrical, carpentry and more — in minutes, not hours.
    </motion.p>

    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}
    >
      <button
        onClick={() => navigate("/register")}
        style={{
          padding: "14px 32px", borderRadius: 10, border: "none",
          background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
          color: "#fff", fontSize: 15, fontWeight: 700,
          cursor: "pointer", boxShadow: "0 8px 24px rgba(99,102,241,0.45)",
          transition: "transform 0.2s, box-shadow 0.2s",
          fontFamily: "var(--font-sans)",
        }}
        onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(99,102,241,0.55)"; }}
        onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(99,102,241,0.45)"; }}
      >
        Get Started Free →
      </button>
      <button
        onClick={() => navigate("/login")}
        style={{
          padding: "14px 32px", borderRadius: 10,
          border: "1px solid rgba(148,163,184,0.25)",
          background: "rgba(255,255,255,0.04)",
          color: "var(--c-text)", fontSize: 15, fontWeight: 600,
          cursor: "pointer",
          transition: "border-color 0.2s, background 0.2s",
          fontFamily: "var(--font-sans)",
          backdropFilter: "blur(8px)",
        }}
        onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; e.currentTarget.style.background = "rgba(99,102,241,0.07)"; }}
        onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(148,163,184,0.25)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
      >
        Sign In to Your Account
      </button>
    </motion.div>

    {/* Floating service preview cards */}
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.5 }}
      style={{
        marginTop: 72, display: "flex", gap: 16,
        flexWrap: "wrap", justifyContent: "center", maxWidth: 760,
        position: "relative", zIndex: 2,
      }}
    >
      {[
        { icon: "⚡", name: "Electrician",  price: "from ₹299",  rating: "4.9", bg: "rgba(99,102,241,0.1)",  border: "rgba(99,102,241,0.25)" },
        { icon: "🚿", name: "Plumber",      price: "from ₹249",  rating: "4.8", bg: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.25)" },
        { icon: "❄️", name: "AC Service",   price: "from ₹399",  rating: "4.9", bg: "rgba(6,182,212,0.06)", border: "rgba(6,182,212,0.2)"  },
        { icon: "🔧", name: "Mechanic",     price: "from ₹349",  rating: "4.7", bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.2)"  },
      ].map((s, i) => (
        <motion.div
          key={s.name}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
          style={{
            background: s.bg,
            border: `1px solid ${s.border}`,
            borderRadius: 14, padding: "14px 18px",
            display: "flex", alignItems: "center", gap: 12,
            backdropFilter: "blur(12px)",
            minWidth: 160,
          }}
        >
          <span style={{ fontSize: 26 }}>{s.icon}</span>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--c-text)" }}>{s.name}</div>
            <div style={{ fontSize: 12, color: "var(--c-text3)" }}>{s.price} · ⭐ {s.rating}</div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  </section>
);

/* ─── Stats ──────────────────────────────────────────────── */
const StatsSection = () => (
  <section style={{
    borderTop: "1px solid var(--c-border)",
    borderBottom: "1px solid var(--c-border)",
    background: "rgba(15,23,42,0.5)",
    padding: "52px clamp(20px, 5vw, 80px)",
  }}>
    <div style={{
      maxWidth: 1200, margin: "0 auto",
      display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: 32,
    }}>
      {STATS.map((s, i) => (
        <FadeUp key={s.label} delay={i * 0.08} style={{ textAlign: "center" }}>
          <div style={{
            fontSize: "clamp(32px, 4vw, 44px)", fontWeight: 900,
            fontFamily: "var(--font-display)",
            background: "linear-gradient(135deg, #818cf8, #06b6d4)",
            WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
            letterSpacing: "-1px",
          }}>
            {s.value}
          </div>
          <div style={{ color: "var(--c-text2)", fontSize: 14, marginTop: 6 }}>{s.label}</div>
        </FadeUp>
      ))}
    </div>
  </section>
);

/* ─── Features ───────────────────────────────────────────── */
const FeaturesSection = () => (
  <section id="features" style={{ padding: "96px clamp(20px, 5vw, 80px)" }}>
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <FadeUp style={{ textAlign: "center" }}>
        <div className="section-badge">Why Choose FixItNow</div>
        <h2 className="section-heading" style={{ textAlign: "center" }}>
          Everything you need,<br />nothing you don't
        </h2>
        <p className="section-sub" style={{ textAlign: "center" }}>
          We've built every feature to make home services fast, fair, and completely stress-free.
        </p>
      </FadeUp>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: 20,
      }}>
        {FEATURES.map((f, i) => (
          <FadeUp key={f.title} delay={i * 0.07}>
            <div className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3 style={{ margin: "0 0 10px", fontSize: 17, fontWeight: 700, color: "var(--c-text)" }}>{f.title}</h3>
              <p style={{ margin: 0, fontSize: 14, color: "var(--c-text2)", lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          </FadeUp>
        ))}
      </div>
    </div>
  </section>
);

/* ─── How It Works ───────────────────────────────────────── */
const HowItWorks = () => (
  <section id="how-it-works" style={{
    padding: "96px clamp(20px, 5vw, 80px)",
    background: "rgba(15,23,42,0.4)",
    borderTop: "1px solid var(--c-border)",
    borderBottom: "1px solid var(--c-border)",
  }}>
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <FadeUp style={{ textAlign: "center" }}>
        <div className="section-badge">Simple Process</div>
        <h2 className="section-heading" style={{ textAlign: "center" }}>
          From request to resolved<br />in three easy steps
        </h2>
        <p className="section-sub" style={{ textAlign: "center" }}>
          No phone tag, no hidden fees. Just professional service delivered at your convenience.
        </p>
      </FadeUp>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
        {STEPS.map((s, i) => (
          <FadeUp key={s.num} delay={i * 0.12}>
            <div className="step-card">
              <span className="step-number">{s.num}</span>
              <div style={{ fontSize: 32, marginBottom: 14 }}>{s.icon}</div>
              <h3 style={{ margin: "0 0 10px", fontSize: 19, fontWeight: 700 }}>{s.title}</h3>
              <p style={{ margin: 0, color: "var(--c-text2)", fontSize: 14, lineHeight: 1.65 }}>{s.desc}</p>
            </div>
          </FadeUp>
        ))}
      </div>
    </div>
  </section>
);

/* ─── Categories ─────────────────────────────────────────── */
const CategoriesSection = ({ navigate }) => (
  <section id="categories" style={{ padding: "96px clamp(20px, 5vw, 80px)" }}>
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <FadeUp style={{ textAlign: "center" }}>
        <div className="section-badge">Service Categories</div>
        <h2 className="section-heading" style={{ textAlign: "center" }}>Whatever you need, we've got it</h2>
        <p className="section-sub" style={{ textAlign: "center" }}>
          Browse our growing catalog of home and business service categories.
        </p>
      </FadeUp>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
        gap: 16, marginBottom: 44,
      }}>
        {CATEGORIES.map((c, i) => (
          <FadeUp key={c.name} delay={i * 0.06}>
            <div className="category-chip" onClick={() => navigate("/register")}>
              <span className="category-icon">{c.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text2)" }}>{c.name}</span>
            </div>
          </FadeUp>
        ))}
      </div>

      <FadeUp style={{ textAlign: "center" }}>
        <button
          onClick={() => navigate("/register")}
          style={{
            padding: "13px 30px", borderRadius: 10,
            border: "1px solid rgba(99,102,241,0.35)",
            background: "rgba(99,102,241,0.08)",
            color: "#a5b4fc", fontSize: 14, fontWeight: 600, cursor: "pointer",
            transition: "all 0.2s", fontFamily: "var(--font-sans)",
          }}
          onMouseOver={e => { e.currentTarget.style.background = "rgba(99,102,241,0.15)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.6)"; }}
          onMouseOut={e => { e.currentTarget.style.background = "rgba(99,102,241,0.08)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.35)"; }}
        >
          View All Categories →
        </button>
      </FadeUp>
    </div>
  </section>
);

/* ─── Provider CTA ───────────────────────────────────────── */
const ProviderCTA = ({ navigate }) => (
  <section id="for-providers" style={{
    padding: "80px clamp(20px, 5vw, 80px)",
    borderTop: "1px solid var(--c-border)",
    borderBottom: "1px solid var(--c-border)",
  }}>
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <FadeUp>
        <div style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(6,182,212,0.08) 50%, rgba(15,23,42,0.9) 100%)",
          border: "1px solid rgba(99,102,241,0.25)",
          borderRadius: 24, padding: "52px 48px",
          display: "flex", flexWrap: "wrap",
          alignItems: "center", justifyContent: "space-between",
          gap: 32,
        }}>
          <div style={{ flex: "1 1 400px" }}>
            <div className="section-badge" style={{ marginBottom: 16 }}>For Professionals</div>
            <h2 style={{
              margin: "0 0 16px", fontFamily: "var(--font-display)",
              fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, letterSpacing: "-0.5px",
            }}>
              Grow your business<br />with FixItNow
            </h2>
            <p style={{ margin: "0 0 28px", color: "var(--c-text2)", fontSize: 15, lineHeight: 1.7, maxWidth: 480 }}>
              Join 2,500+ verified professionals. Set your own schedule, manage bookings, and receive secure payments — all from one dashboard.
            </p>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 32 }}>
              {["Zero upfront cost", "Flexible hours", "Weekly payouts", "Dedicated support"].map(item => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--c-text2)" }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: "50%",
                    background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, color: "#a5b4fc", fontWeight: 700, flexShrink: 0,
                  }}>✓</span>
                  {item}
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate("/register")}
              style={{
                padding: "13px 30px", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                color: "#fff", fontSize: 14, fontWeight: 700,
                cursor: "pointer", boxShadow: "0 8px 24px rgba(99,102,241,0.4)",
                transition: "opacity 0.2s, transform 0.2s",
                fontFamily: "var(--font-sans)",
              }}
              onMouseOver={e => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseOut={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              Join as a Provider →
            </button>
          </div>

          <div style={{ flex: "0 1 280px", display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "New Bookings Today",   value: "+12",  color: "#818cf8" },
              { label: "This Month's Earnings", value: "₹18,400", color: "#06b6d4" },
              { label: "Customer Rating",       value: "4.9 ⭐",  color: "#22c55e" },
            ].map(stat => (
              <div key={stat.label} style={{
                background: "rgba(15,23,42,0.8)",
                border: "1px solid rgba(148,163,184,0.12)",
                borderRadius: 12, padding: "16px 20px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: 13, color: "var(--c-text2)" }}>{stat.label}</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: stat.color, fontFamily: "var(--font-display)" }}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </FadeUp>
    </div>
  </section>
);

/* ─── Testimonials ───────────────────────────────────────── */
const TestimonialsSection = () => (
  <section style={{ padding: "96px clamp(20px, 5vw, 80px)" }}>
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <FadeUp style={{ textAlign: "center" }}>
        <div className="section-badge">Customer Reviews</div>
        <h2 className="section-heading" style={{ textAlign: "center" }}>Loved by homeowners everywhere</h2>
        <p className="section-sub" style={{ textAlign: "center" }}>
          Don't take our word for it — here's what our customers say.
        </p>
      </FadeUp>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
        {TESTIMONIALS.map((t, i) => (
          <FadeUp key={t.name} delay={i * 0.1}>
            <div className="testimonial-card">
              <div style={{ display: "flex", gap: 4, marginBottom: 18 }}>
                {Array.from({ length: t.rating }).map((_, j) => (
                  <span key={j} style={{ color: "#f59e0b", fontSize: 15 }}>★</span>
                ))}
              </div>
              <p style={{ margin: "0 0 20px", color: "var(--c-text2)", fontSize: 14, lineHeight: 1.7, fontStyle: "italic" }}>
                "{t.text}"
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "linear-gradient(135deg, #6366f1, #06b6d4)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: 16, color: "#fff", flexShrink: 0,
                  fontFamily: "var(--font-display)",
                }}>
                  {t.avatar}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: "var(--c-text3)" }}>{t.role}</div>
                </div>
              </div>
            </div>
          </FadeUp>
        ))}
      </div>
    </div>
  </section>
);

/* ─── Footer ─────────────────────────────────────────────── */
const Footer = ({ navigate }) => (
  <footer style={{
    borderTop: "1px solid var(--c-border)",
    background: "rgba(2,8,23,0.8)",
    padding: "52px clamp(20px, 5vw, 80px) 32px",
  }}>
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 48, justifyContent: "space-between", marginBottom: 48 }}>
        {/* Brand */}
        <div style={{ flex: "1 1 240px", maxWidth: 280 }}>
          <div style={{
            fontSize: 22, fontWeight: 800, fontFamily: "var(--font-display)",
            background: "linear-gradient(135deg, #818cf8, #06b6d4)",
            WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
            marginBottom: 14,
          }}>
            FixItNow
          </div>
          <p style={{ color: "var(--c-text3)", fontSize: 13, lineHeight: 1.7, margin: 0 }}>
            Connecting homeowners with trusted local professionals for all home service needs.
          </p>
        </div>

        {/* Links */}
        {[
          { heading: "Platform", links: ["How It Works", "Browse Services", "For Providers", "Pricing"] },
          { heading: "Company",  links: ["About Us", "Blog", "Careers", "Press"] },
          { heading: "Support",  links: ["Help Center", "Privacy Policy", "Terms of Service", "Contact Us"] },
        ].map(col => (
          <div key={col.heading} style={{ flex: "1 1 140px" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--c-text)", marginBottom: 16, letterSpacing: "0.3px" }}>
              {col.heading}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {col.links.map(link => (
                <span
                  key={link}
                  onClick={() => navigate(link === "Browse Services" ? "/login" : "/register")}
                  style={{ color: "var(--c-text3)", fontSize: 13, cursor: "pointer", transition: "color 0.2s" }}
                  onMouseOver={e => { e.currentTarget.style.color = "var(--c-text)"; }}
                  onMouseOut={e => { e.currentTarget.style.color = "var(--c-text3)"; }}
                >
                  {link}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        paddingTop: 24, borderTop: "1px solid var(--c-border)",
        display: "flex", flexWrap: "wrap", gap: 16,
        alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ color: "var(--c-text3)", fontSize: 13 }}>
          © 2025 FixItNow. All rights reserved.
        </span>
        <div style={{ display: "flex", gap: 20 }}>
          {["Privacy", "Terms", "Cookies"].map(item => (
            <span key={item} style={{ color: "var(--c-text3)", fontSize: 13, cursor: "pointer", transition: "color 0.2s" }}
              onMouseOver={e => { e.currentTarget.style.color = "var(--c-text)"; }}
              onMouseOut={e => { e.currentTarget.style.color = "var(--c-text3)"; }}>
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

/* ─── LandingPage ────────────────────────────────────────── */
const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ background: "var(--c-bg)", minHeight: "100vh", overflowX: "hidden" }}>
      <Navbar navigate={navigate} />
      <Hero navigate={navigate} />
      <StatsSection />
      <FeaturesSection />
      <HowItWorks />
      <CategoriesSection navigate={navigate} />
      <ProviderCTA navigate={navigate} />
      <TestimonialsSection />
      <Footer navigate={navigate} />
    </div>
  );
};

export default LandingPage;
