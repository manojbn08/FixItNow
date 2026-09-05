import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import API from "../api/api";
import { useAuth } from "../auth/AuthContext";
import { useAppData } from "../state/AppDataContext";
import {
  findLocalAccountByEmail,
  normalizeEmail,
  rememberRegisteredEmail,
  resolveRole,
  resolveRoleFromClaims,
  upsertLocalAccount,
  validateLocalCredentials
} from "../auth/localAuth";

const roles = [
  { label: "Customer", value: "CUSTOMER" },
  { label: "Provider", value: "PROVIDER" },
  { label: "Admin", value: "ADMIN" }
];

const roleLabels = {
  CUSTOMER: "customer",
  PROVIDER: "provider",
  ADMIN: "admin"
};

const getRoleLabel = (value) => roleLabels[resolveRole(value)] || "assigned";

const getRoleFromAuthResponse = (payload = {}) => {
  let tokenRole = "";

  if (payload?.token) {
    try {
      tokenRole = resolveRoleFromClaims(jwtDecode(payload.token));
    } catch {
      tokenRole = "";
    }
  }

  const responseRole = resolveRole(payload?.role || payload?.user?.role);
  return tokenRole || responseRole || "";
};

const Login = () => {
  const [role, setRole] = useState("CUSTOMER");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, user } = useAuth();
  const { getProviderAccessStatus } = useAppData();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user?.role === "CUSTOMER") navigate("/customer/dashboard");
    if (user?.role === "PROVIDER") navigate("/provider/dashboard");
    if (user?.role === "ADMIN") navigate("/admin/dashboard");
  }, [user, navigate]);

  useEffect(() => {
    if (!location.state) return;

    const selectedRole = location.state?.selectedRole;
    const prefilledEmail = location.state?.prefilledEmail;
    const incomingMessage = location.state?.infoMessage;

    if (selectedRole && roles.some((item) => item.value === selectedRole)) {
      setRole(selectedRole);
    }

    if (prefilledEmail) {
      setEmail(prefilledEmail);
    }

    if (incomingMessage) {
      setInfoMessage(incomingMessage);
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [location, navigate]);

  const redirectByRole = (selectedRole) => {
    if (selectedRole === "CUSTOMER") navigate("/customer/dashboard");
    if (selectedRole === "PROVIDER") navigate("/provider/dashboard");
    if (selectedRole === "ADMIN") navigate("/admin/dashboard");
  };

  const onRoleChange = (nextRole) => {
    if (nextRole === role) return;
    setRole(nextRole);
    setEmail("");
    setPassword("");
    setError("");
    setInfoMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");
    setIsSubmitting(true);

    const normalizedEmail = normalizeEmail(email);
    const providerAccessStatus = getProviderAccessStatus(normalizedEmail);
    const portalMismatchMessage = (assignedRole) =>
      `This email is registered for the ${getRoleLabel(
        assignedRole
      )} portal. Please use that portal only.`;
    const ensureRoleMatch = (assignedRole) => {
      const resolvedAssignedRole = resolveRole(assignedRole);
      if (!resolvedAssignedRole || resolvedAssignedRole === role) return true;
      setError(portalMismatchMessage(resolvedAssignedRole));
      return false;
    };

    const knownAccountRole = resolveRole(findLocalAccountByEmail(normalizedEmail)?.role);
    if (!ensureRoleMatch(knownAccountRole)) {
      setIsSubmitting(false);
      return;
    }

    if (role === "PROVIDER" && providerAccessStatus.provider && !providerAccessStatus.isApproved) {
      setError("Provider login is blocked until admin verifies your submitted details.");
      setIsSubmitting(false);
      return;
    }

    const loginLocalAccount = () => {
      const localAccount = validateLocalCredentials({
        email: normalizedEmail,
        password,
        role
      });

      if (!localAccount) {
        return false;
      }

      rememberRegisteredEmail(normalizedEmail);
      const localRole = resolveRole(localAccount.role) || role;
      login({
        role: localRole,
        email: localAccount.email,
        name: localAccount.name
      });
      redirectByRole(localRole);
      return true;
    };

    const loginAsOpenAdmin = () => {
      if (role !== "ADMIN") return false;
      if (!ensureRoleMatch(resolveRole(findLocalAccountByEmail(normalizedEmail)?.role))) return true;

      const fallbackName = normalizedEmail.split("@")[0] || "Admin";
      login({
        role: "ADMIN",
        email: normalizedEmail,
        name: fallbackName
      });
      redirectByRole("ADMIN");
      return true;
    };

    const persistAccountRole = ({ accountEmail, accountName, assignedRole }) => {
      rememberRegisteredEmail(accountEmail);
      const savedAccount = upsertLocalAccount({
        email: accountEmail,
        name: accountName,
        password,
        role: assignedRole
      });

      if (savedAccount) return true;

      const existingRole = resolveRole(findLocalAccountByEmail(accountEmail)?.role) || assignedRole;
      setError(portalMismatchMessage(existingRole));
      return false;
    };

    try {
      const res = await API.post("/auth/login", {
        email: normalizedEmail,
        password,
        role
      });
      const payload = res?.data?.data ?? res?.data;
      const authenticatedRole = resolveRole(getRoleFromAuthResponse(payload) || role) || role;

      if (!ensureRoleMatch(authenticatedRole)) {
        return;
      }

      if (!payload?.token) {
        if (loginAsOpenAdmin()) return;
        if (loginLocalAccount()) return;

        const hasFallbackIdentity = Boolean(
          payload?.email || payload?.user?.email || payload?.name || payload?.user?.name
        );
        const fallbackEmail =
          normalizeEmail(payload?.email || payload?.user?.email || normalizedEmail);
        const fallbackName =
          payload?.name || payload?.user?.name || fallbackEmail.split("@")[0];

        if (hasFallbackIdentity) {
          if (
            !persistAccountRole({
              accountEmail: fallbackEmail,
              accountName: fallbackName,
              assignedRole: authenticatedRole
            })
          ) {
            return;
          }

          login({
            role: authenticatedRole,
            email: fallbackEmail,
            name: fallbackName
          });
          redirectByRole(authenticatedRole);
          return;
        }

        setError("Login failed. Please try again.");
        return;
      }

      if (
        !persistAccountRole({
          accountEmail: normalizedEmail,
          accountName: payload?.name || normalizedEmail.split("@")[0],
          assignedRole: authenticatedRole
        })
      ) {
        return;
      }

      login({ ...payload, role: authenticatedRole });
      redirectByRole(authenticatedRole);
    } catch (err) {
      if (err?.response) {
        if (loginAsOpenAdmin()) return;
        if (loginLocalAccount()) return;
        const backendMessage =
          err.response?.data?.message || err.response?.data?.error || "";
        setError(backendMessage || "Invalid credentials. Please try again.");
        return;
      }

      if (loginAsOpenAdmin()) return;
      if (loginLocalAccount()) return;
      setError("Kingly Create an account and login.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const ROLE_ICONS = { CUSTOMER: "🏠", PROVIDER: "🔧", ADMIN: "⚙️" };

  return (
    <div style={S.page}>
      {/* ── Left brand panel ── */}
      <div style={S.brand} className="login-brand-panel">
        <div style={S.brandInner}>
          <div style={S.logo}>FixItNow</div>
          <p style={S.tagline}>Your home. Our professionals.<br />Every service, on demand.</p>
          <div style={S.trustList}>
            {[
              { icon: "🛡", text: "Verified & background-checked providers" },
              { icon: "⚡", text: "Book any service in under 2 minutes" },
              { icon: "🔒", text: "Secure payments, protected every time" },
              { icon: "💬", text: "Real-time chat with your provider" },
            ].map(item => (
              <div key={item.text} style={S.trustItem}>
                <span style={S.trustIcon}>{item.icon}</span>
                <span style={S.trustText}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Decorative blobs */}
        <div style={{ ...S.blob, top: -80, right: -80, background: "radial-gradient(circle, rgba(99,102,241,0.3), transparent 70%)", width: 360, height: 360 }} />
        <div style={{ ...S.blob, bottom: -60, left: -60, background: "radial-gradient(circle, rgba(6,182,212,0.2), transparent 70%)", width: 300, height: 300 }} />
      </div>

      {/* ── Right form panel ── */}
      <div style={S.formPanel}>
        <div style={S.formCard}>
          <div style={{ marginBottom: 28 }}>
            <h2 style={S.title}>Welcome back</h2>
            <p style={S.subtitle}>Sign in to your FixItNow workspace</p>
          </div>

          {infoMessage && (
            <div style={S.infoBox}>{infoMessage}</div>
          )}

          {/* Role tabs */}
          <div style={S.roleTabs}>
            {roles.map(item => (
              <button
                key={item.value}
                type="button"
                style={role === item.value ? { ...S.roleTab, ...S.roleTabActive } : S.roleTab}
                onClick={() => onRoleChange(item.value)}
              >
                <span style={{ fontSize: 16 }}>{ROLE_ICONS[item.value]}</span>
                {item.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="form-field">
              <label htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <div style={S.errorBox}>{error}</div>}

            <button
              type="submit"
              className="btn-primary"
              style={{ marginTop: 4, padding: "13px", fontSize: 15, borderRadius: 10 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in…" : "Sign In →"}
            </button>
          </form>

          <p style={S.switchText}>
            Don't have an account?{" "}
            <Link to="/register" style={S.switchLink}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

const S = {
  page: {
    minHeight: "100vh",
    display: "flex",
    background: "var(--c-bg)",
  },
  /* left brand panel */
  brand: {
    flex: "0 0 420px",
    position: "relative",
    overflow: "hidden",
    background: "linear-gradient(155deg, #0f172a 0%, #1a1060 50%, #0c1a38 100%)",
    borderRight: "1px solid rgba(148,163,184,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 48px",
  },
  brandInner: { position: "relative", zIndex: 2 },
  logo: {
    fontSize: 32,
    fontWeight: 900,
    fontFamily: "var(--font-display)",
    background: "linear-gradient(135deg, #818cf8, #06b6d4)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    marginBottom: 20,
    letterSpacing: "-0.5px",
  },
  tagline: {
    fontSize: 22,
    fontWeight: 700,
    color: "#f1f5f9",
    lineHeight: 1.4,
    marginBottom: 40,
    fontFamily: "var(--font-display)",
  },
  trustList: { display: "flex", flexDirection: "column", gap: 18 },
  trustItem: { display: "flex", alignItems: "flex-start", gap: 14 },
  trustIcon: {
    fontSize: 20,
    width: 36, height: 36,
    background: "rgba(99,102,241,0.15)",
    border: "1px solid rgba(99,102,241,0.25)",
    borderRadius: 8,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  trustText: { fontSize: 14, color: "#cbd5e1", lineHeight: 1.5, paddingTop: 6 },
  blob: { position: "absolute", borderRadius: "50%", filter: "blur(40px)", pointerEvents: "none" },

  /* right form panel */
  formPanel: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 24px",
    background: "var(--c-bg)",
  },
  formCard: {
    width: "min(420px, 100%)",
  },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 800,
    color: "var(--c-text)",
    fontFamily: "var(--font-display)",
    letterSpacing: "-0.3px",
  },
  subtitle: { margin: "6px 0 0", fontSize: 14, color: "var(--c-text3)" },

  roleTabs: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
    marginBottom: 24,
    background: "rgba(15,23,42,0.8)",
    padding: 5,
    borderRadius: 10,
    border: "1px solid rgba(148,163,184,0.12)",
  },
  roleTab: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    padding: "9px 6px",
    background: "transparent",
    color: "var(--c-text2)",
    border: "none",
    borderRadius: 7,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    fontFamily: "var(--font-sans)",
    transition: "all 0.2s",
  },
  roleTabActive: {
    background: "rgba(99,102,241,0.18)",
    color: "#a5b4fc",
    fontWeight: 700,
    boxShadow: "0 0 0 1px rgba(99,102,241,0.35)",
  },

  errorBox: {
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.25)",
    borderRadius: 8,
    padding: "10px 14px",
    color: "#fca5a5",
    fontSize: 13,
    lineHeight: 1.5,
  },
  infoBox: {
    background: "rgba(99,102,241,0.1)",
    border: "1px solid rgba(99,102,241,0.25)",
    borderRadius: 8,
    padding: "10px 14px",
    color: "#a5b4fc",
    fontSize: 13,
    marginBottom: 20,
  },
  switchText: { marginTop: 20, textAlign: "center", fontSize: 14, color: "var(--c-text3)" },
  switchLink: { color: "#818cf8", textDecoration: "none", fontWeight: 600 },
};

