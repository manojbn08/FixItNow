import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../auth/AuthContext";
import "./PortalLayout.css";

/* ── Icon map: match nav labels to emojis ────────────────── */
const NAV_ICONS = {
  // Generic
  Dashboard:           "📊",
  Overview:            "📊",
  Analytics:           "📈",
  Settings:            "⚙️",
  Profile:             "👤",
  Messages:            "💬",
  Chat:                "💬",
  // Bookings
  Bookings:            "📅",
  "My Bookings":       "📅",
  "Service Requests":  "📋",
  Requests:            "📋",
  // Services
  Services:            "🔧",
  "My Services":       "🔧",
  Marketplace:         "🛒",
  "Browse Services":   "🛒",
  // Financial
  Payments:            "💳",
  Earnings:            "💰",
  Wallet:              "💰",
  // Admin
  Providers:           "👥",
  Users:               "👤",
  "Provider Approval": "✅",
  Disputes:            "⚖️",
  Reviews:             "⭐",
  // Map
  "Map Search":        "🗺️",
  Map:                 "🗺️",
  // Misc
  Notifications:       "🔔",
  Support:             "🛡",
  Reports:             "📊",
};

const getNavIcon = (label = "") => {
  const exact = NAV_ICONS[label];
  if (exact) return exact;
  const lower = label.toLowerCase();
  if (lower.includes("dashboard") || lower.includes("overview")) return "📊";
  if (lower.includes("book"))        return "📅";
  if (lower.includes("service"))     return "🔧";
  if (lower.includes("chat") || lower.includes("message")) return "💬";
  if (lower.includes("dispute"))     return "⚖️";
  if (lower.includes("payment") || lower.includes("wallet") || lower.includes("earn")) return "💳";
  if (lower.includes("review") || lower.includes("rating")) return "⭐";
  if (lower.includes("map"))         return "🗺️";
  if (lower.includes("provider"))    return "👥";
  if (lower.includes("user"))        return "👤";
  if (lower.includes("setting"))     return "⚙️";
  if (lower.includes("profile"))     return "👤";
  if (lower.includes("analytic"))    return "📈";
  if (lower.includes("report"))      return "📊";
  if (lower.includes("request"))     return "📋";
  return "•";
};

/* ── PortalLayout ─────────────────────────────────────────── */
const PortalLayout = ({ portalTitle, menuItems, children }) => {
  const location = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();

  const activeItem =
    menuItems.find((item) => location.pathname.startsWith(item.path)) || menuItems[0];

  const userDisplay  = user?.name || user?.email?.split("@")[0] || `${portalTitle} User`;
  const userInitial  = userDisplay.charAt(0).toUpperCase();

  const ROLE_COLORS = {
    CUSTOMER: "linear-gradient(135deg, #6366f1, #06b6d4)",
    PROVIDER: "linear-gradient(135deg, #06b6d4, #0284c7)",
    ADMIN:    "linear-gradient(135deg, #8b5cf6, #6366f1)",
  };
  const avatarGradient = ROLE_COLORS[user?.role] || ROLE_COLORS.CUSTOMER;

  return (
    <div className="portal-app">
      {/* ── Sidebar ── */}
      <aside className="portal-sidebar">
        <div className="portal-sidebar-header">
          <Link to={menuItems[0]?.path} className="portal-brand">
            FixItNow
          </Link>
          <p className="portal-role">{portalTitle} Portal</p>
        </div>

        <nav className="portal-nav">
          {menuItems.map((item) => {
            const isActive    = location.pathname.startsWith(item.path);
            const rawBadge    = Number(item.badgeCount || 0);
            const badgeCount  = Number.isFinite(rawBadge) ? Math.max(0, Math.floor(rawBadge)) : 0;
            const icon        = getNavIcon(item.label);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`portal-nav-link${isActive ? " active" : ""}`}
              >
                <span className="portal-nav-icon">{icon}</span>
                <span className="portal-nav-label">{item.label}</span>
                {badgeCount > 0 && (
                  <span className="portal-nav-badge">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="portal-sidebar-foot">
          <div style={{ marginBottom: 4, fontWeight: 600, fontSize: 12, color: "#f1f5f9" }}>
            FixItNow
          </div>
          Reliable local services for homes and businesses.
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="portal-main">
        {/* Topbar */}
        <header className="portal-topbar">
          <div className="portal-topbar-title">
            <p className="portal-meta">FixItNow · {portalTitle} Workspace</p>
            <h1>{activeItem?.label || `${portalTitle} Dashboard`}</h1>
          </div>

          <div className="portal-actions">
            <div className="portal-user">
              <div
                className="portal-avatar"
                style={{ background: avatarGradient }}
              >
                {userInitial}
              </div>
              <div>
                <p className="portal-user-name">{userDisplay}</p>
                <p className="portal-user-role">{portalTitle}</p>
              </div>
            </div>

            <button
              className="portal-button"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Content */}
        <motion.main
          className="portal-content"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          key={location.pathname}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
};

export default PortalLayout;
