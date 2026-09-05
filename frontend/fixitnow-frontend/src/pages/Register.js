import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/api";
import { useAuth } from "../auth/AuthContext";
import { useAppData } from "../state/AppDataContext";
import {
  getLocalAccountRoleByEmail,
  hasRegisteredEmail,
  normalizeEmail,
  registerLocalAccount,
  rememberRegisteredEmail,
  upsertLocalAccount
} from "../auth/localAuth";

const roles = [
  { label: "Customer", value: "CUSTOMER" },
  { label: "Provider", value: "PROVIDER" }
];

const idProofTypes = ["PAN", "AADHAAR", "DRIVING_LICENSE", "VOTER_ID"];

const Register = () => {
  const [role, setRole] = useState("CUSTOMER");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const [serviceType, setServiceType] = useState("Mechanic");
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [idProofType, setIdProofType] = useState("PAN");
  const [idProofFile, setIdProofFile] = useState(null);

  const [error, setError] = useState("");
  const [geoMessage, setGeoMessage] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const { portalData, saveCustomerProfile, saveProviderProfile, submitProviderVerification } =
    useAppData();
  const navigate = useNavigate();
  const slotOptions = portalData.providerSlotOptions || [];

  const roleHint = useMemo(() => {
    if (role === "CUSTOMER") return "Book trusted local professionals in minutes.";
    return "Offer services, manage slots, and grow your business.";
  }, [role]);

  const buildDuplicateEmailMessage = (existingRole = "") => {
    if (existingRole) {
      return `This email is already registered for the ${String(
        existingRole
      ).toLowerCase()} portal. One email can access only one portal. Please login.`;
    }
    return "This email is already registered. One email can access only one portal. Please login.";
  };

  const clearFormForRoleSwitch = () => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setAddress("");
    setPhone("");
    setServiceType("Mechanic");
    setSelectedSlots([]);
    setIdProofType("PAN");
    setIdProofFile(null);
    setGeoMessage("");
    setIsLocating(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError("");
  };

  const onRoleChange = (nextRole) => {
    if (nextRole === role) return;
    setRole(nextRole);
    clearFormForRoleSwitch();
  };

  const isValidIdFile = (file) => {
    if (!file) return false;
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg"];
    return allowedTypes.includes(file.type) && file.size <= 5 * 1024 * 1024;
  };

  const toggleTimeSlot = (slot) => {
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((existingSlot) => existingSlot !== slot) : [...prev, slot]
    );
  };

  const redirectByRole = (selectedRole) => {
    if (selectedRole === "CUSTOMER") navigate("/customer/dashboard");
    if (selectedRole === "PROVIDER") navigate("/provider/dashboard");
  };

  const joinUniqueAddressParts = (parts) => {
    const uniqueParts = [];
    parts.forEach((part) => {
      const cleaned = part?.trim();
      if (cleaned && !uniqueParts.includes(cleaned)) {
        uniqueParts.push(cleaned);
      }
    });
    return uniqueParts.join(", ");
  };

  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoMessage("Location service is not available in your browser.");
      return;
    }

    const getAccuratePosition = () =>
      new Promise((resolve, reject) => {
        let bestPosition = null;
        let watchId = null;
        let timeoutId = null;

        const finish = (result, error) => {
          if (watchId !== null) navigator.geolocation.clearWatch(watchId);
          if (timeoutId !== null) window.clearTimeout(timeoutId);
          if (error) {
            reject(error);
            return;
          }
          resolve(result);
        };

        watchId = navigator.geolocation.watchPosition(
          (position) => {
            if (
              !bestPosition ||
              position.coords.accuracy < bestPosition.coords.accuracy
            ) {
              bestPosition = position;
            }

            // Stop early once we get a good GPS fix.
            if (position.coords.accuracy <= 40) {
              finish(bestPosition);
            }
          },
          (error) => {
            finish(null, error);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
          }
        );

        timeoutId = window.setTimeout(() => {
          if (bestPosition) {
            finish(bestPosition);
            return;
          }
          finish(null, new Error("Location timed out"));
        }, 12000);
      });

    setGeoMessage("Detecting your location...");
    setIsLocating(true);

    const getPreciseAddressFromCoords = async (latitude, longitude) => {
      const openStreetMapUrl =
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}` +
        `&lon=${longitude}&addressdetails=1&zoom=18`;

      const openStreetMapResponse = await fetch(openStreetMapUrl, {
        headers: { Accept: "application/json" }
      });

      if (openStreetMapResponse.ok) {
        const data = await openStreetMapResponse.json();
        const addressData = data.address || {};

        const street = [addressData.house_number, addressData.road]
          .filter(Boolean)
          .join(" ")
          .trim();
        const locality =
          addressData.suburb ||
          addressData.neighbourhood ||
          addressData.city_district ||
          addressData.quarter;
        const city =
          addressData.city || addressData.town || addressData.village || addressData.county;
        const state = addressData.state || addressData.state_district;
        const postCode = addressData.postcode;
        const country = addressData.country;

        const preciseAddress =
          joinUniqueAddressParts([street, locality, city, state, postCode, country]) ||
          data.display_name ||
          "";

        if (preciseAddress) {
          return {
            placeName: preciseAddress
          };
        }
      }

      const backupUrl =
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}` +
        `&longitude=${longitude}&localityLanguage=en`;

      const backupResponse = await fetch(backupUrl);
      if (!backupResponse.ok) {
        throw new Error("Reverse geocoding failed");
      }

      const backupData = await backupResponse.json();
      const placeName = joinUniqueAddressParts([
        backupData.locality,
        backupData.city,
        backupData.principalSubdivision,
        backupData.countryName
      ]);

      return {
        placeName
      };
    };

    getAccuratePosition()
      .then(async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        try {
          const { placeName } = await getPreciseAddressFromCoords(latitude, longitude);
          if (placeName) {
            setAddress(placeName);
            const roundedAccuracy = Math.round(accuracy || 0);
            if (roundedAccuracy > 120) {
              setGeoMessage(
                `Location detected with low GPS accuracy (~${roundedAccuracy}m). Please verify the address before creating account.`
              );
            } else {
              setGeoMessage(`Precise location set to ${placeName}.`);
            }
            return;
          }
        } catch {
          // Fallback handled below
        }

        const fallback = `Lat ${latitude.toFixed(6)}, Lng ${longitude.toFixed(6)}`;
        setAddress(fallback);
        setGeoMessage("Could not fetch place name. Coordinates were captured.");
      })
      .catch(() => {
        setGeoMessage("Location access denied or unavailable. Please fill manually.");
      })
      .finally(() => {
        setIsLocating(false);
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    const normalizedEmail = normalizeEmail(email);
    const trimmedAddress = address.trim();

    if (password !== confirmPassword) {
      setError("Password does not match confirm password.");
      return;
    }

    if (!trimmedName || !normalizedEmail || !trimmedAddress) {
      setError("Please fill all required fields.");
      return;
    }

    if (phone.length !== 10) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }

    if (hasRegisteredEmail(normalizedEmail)) {
      setError(buildDuplicateEmailMessage(getLocalAccountRoleByEmail(normalizedEmail)));
      return;
    }

    if (role === "PROVIDER") {
      if (!idProofType) {
        setError("Please select an ID proof type.");
        return;
      }

      if (!isValidIdFile(idProofFile)) {
        setError("Upload a valid ID proof (PDF/JPG/PNG, max 5MB).");
        return;
      }

      if (selectedSlots.length === 0) {
        setError("Please choose at least one time slot before creating provider account.");
        return;
      }
    }

    setIsSubmitting(true);

    const payload = {
      name: trimmedName,
      email: normalizedEmail,
      password,
      role,
      address: trimmedAddress,
      phone,
      serviceType: role === "PROVIDER" ? serviceType : null,
      selectedSlots: role === "PROVIDER" ? selectedSlots : [],
      idProofType: role === "PROVIDER" ? idProofType : null,
      idProofDocumentName: role === "PROVIDER" ? idProofFile?.name || null : null
    };

    const persistRoleProfile = () => {
      if (role === "CUSTOMER") {
        saveCustomerProfile({
          name: trimmedName,
          email: normalizedEmail,
          phone,
          location: trimmedAddress
        });
      }

      if (role === "PROVIDER") {
        saveProviderProfile({
          displayName: trimmedName,
          category: serviceType,
          availability: "Mon - Sat, 9 AM - 8 PM",
          location: trimmedAddress,
          selectedSlots
        }, normalizedEmail);
      }
    };

    const loginAndRedirect = () => {
      login({ role, email: normalizedEmail, name: trimmedName });
      persistRoleProfile();
      redirectByRole(role);
    };

    const completeProviderRegistration = () => {
      submitProviderVerification({
        ...payload,
        name: trimmedName,
        email: normalizedEmail,
        area: trimmedAddress,
        address: trimmedAddress,
        selectedSlots
      });
      persistRoleProfile();
      navigate("/pending-approval", {
        state: {
          name: trimmedName,
          email: normalizedEmail
        }
      });
    };

    try {
      const res = await API.post("/auth/register", payload);
      const responseData = res?.data?.data ?? res?.data;

      if (role === "PROVIDER") {
        const savedProviderAccount = upsertLocalAccount(payload);
        if (!savedProviderAccount) {
          setError(buildDuplicateEmailMessage(getLocalAccountRoleByEmail(normalizedEmail)));
          return;
        }
        completeProviderRegistration();
        return;
      }

      if (responseData?.token) {
        const savedCustomerAccount = upsertLocalAccount(payload);
        if (!savedCustomerAccount) {
          setError(buildDuplicateEmailMessage(getLocalAccountRoleByEmail(normalizedEmail)));
          return;
        }
        login({ ...responseData, role });
        persistRoleProfile();
        redirectByRole(role);
        return;
      }

      const fallbackRegistration = registerLocalAccount(payload);
      if (
        !fallbackRegistration.ok &&
        fallbackRegistration.reason === "duplicate_email_account"
      ) {
        setError(buildDuplicateEmailMessage(fallbackRegistration.existingRole));
        return;
      }

      rememberRegisteredEmail(normalizedEmail);
      loginAndRedirect();
    } catch (err) {
      if (err?.response) {
        const backendMessage =
          err.response?.data?.message || err.response?.data?.error || "";

        if (
          err.response.status === 409 ||
          /already|exists|duplicate|registered|taken/i.test(String(backendMessage))
        ) {
          rememberRegisteredEmail(normalizedEmail);
          setError(buildDuplicateEmailMessage(getLocalAccountRoleByEmail(normalizedEmail)));
          return;
        }
      }

      const fallbackRegistration = registerLocalAccount(payload);
      if (
        !fallbackRegistration.ok &&
        fallbackRegistration.reason === "duplicate_email_account"
      ) {
        setError(buildDuplicateEmailMessage(fallbackRegistration.existingRole));
        return;
      }

      rememberRegisteredEmail(normalizedEmail);

      if (role === "PROVIDER") {
        completeProviderRegistration();
        return;
      }

      loginAndRedirect();
    } finally {
      setIsSubmitting(false);
    }
  };

  const ROLE_META = {
    CUSTOMER: { icon: "🏠", hint: "Book trusted local professionals in minutes." },
    PROVIDER: { icon: "🔧", hint: "List your services, set availability, and grow your business." },
  };

  return (
    <div style={R.page}>
      {/* background blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%)", top: -100, right: -100, filter: "blur(60px)" }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(6,182,212,0.08), transparent 70%)", bottom: -80, left: -80, filter: "blur(60px)" }} />
      </div>

      <div style={R.scrollArea}>
        <div style={R.card}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <a href="/" style={{ textDecoration: "none" }}>
              <div style={{
                fontSize: 22, fontWeight: 800, fontFamily: "var(--font-display)",
                background: "linear-gradient(135deg, #818cf8, #06b6d4)",
                WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
                marginBottom: 16,
              }}>
                FixItNow
              </div>
            </a>
            <h2 style={R.title}>Create your account</h2>
            <p style={R.subtitle}>{ROLE_META[role]?.hint}</p>
          </div>

          {/* Role toggle */}
          <div style={R.roleTabs}>
            {roles.map(item => (
              <button
                key={item.value}
                type="button"
                style={role === item.value ? { ...R.roleTab, ...R.roleTabActive } : R.roleTab}
                onClick={() => onRoleChange(item.value)}
              >
                <span style={{ fontSize: 16 }}>{ROLE_META[item.value]?.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Basic info */}
            <div style={R.sectionLabel}>Basic Information</div>
            <div style={R.twoCol}>
              <div className="form-field">
                <label>Full Name</label>
                <input type="text" placeholder="John Doe" required value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Email Address</label>
                <input type="email" placeholder="you@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>

            <div style={R.twoCol}>
              <div className="form-field">
                <label>Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ paddingRight: 40, width: "100%" }}
                  />
                  <button type="button" style={R.eyeBtn} onClick={() => setShowPassword(p => !p)} aria-label="toggle password">
                    {showPassword ? "🙈" : "👁"}
                  </button>
                </div>
              </div>
              <div className="form-field">
                <label>Confirm Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    style={{ paddingRight: 40, width: "100%" }}
                  />
                  <button type="button" style={R.eyeBtn} onClick={() => setShowConfirmPassword(p => !p)} aria-label="toggle confirm password">
                    {showConfirmPassword ? "🙈" : "👁"}
                  </button>
                </div>
              </div>
            </div>

            <div style={R.twoCol}>
              <div className="form-field">
                <label>Phone Number</label>
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={e => { const v = e.target.value.replace(/\D/g, ""); if (v.length <= 10) setPhone(v); }}
                  required
                />
              </div>
              <div className="form-field">
                <label>Current Location</label>
                <input type="text" placeholder="City, State" required value={address} onChange={e => setAddress(e.target.value)} />
              </div>
            </div>

            {/* Detect location */}
            <div style={R.locationBox}>
              <button
                type="button"
                style={R.detectBtn}
                onClick={detectCurrentLocation}
                disabled={isLocating}
              >
                <span>📍</span>
                {isLocating ? "Detecting location…" : "Auto-detect my location"}
              </button>
              {geoMessage && <p style={R.geoMsg}>{geoMessage}</p>}
            </div>

            {/* Provider extras */}
            {role === "PROVIDER" && (
              <div style={R.providerBlock}>
                <div style={{ ...R.sectionLabel, marginBottom: 16, marginTop: 0 }}>
                  <span>🔧</span> Provider Details
                </div>

                <div style={R.twoCol}>
                  <div className="form-field">
                    <label>Service Type</label>
                    <select value={serviceType} onChange={e => setServiceType(e.target.value)}>
                      <option>Mechanic</option>
                      <option>Plumber</option>
                      <option>Electrician</option>
                      <option>Carpenter</option>
                      <option>AC Technician</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>ID Proof Type</label>
                    <select value={idProofType} onChange={e => setIdProofType(e.target.value)}>
                      {idProofTypes.map(proof => (
                        <option key={proof} value={proof}>{proof.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-field">
                  <label>Upload ID Proof (PDF / JPG / PNG — max 5 MB)</label>
                  <input
                    className="register-file-input"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    style={{ color: "var(--c-text2)", fontSize: 13, cursor: "pointer" }}
                    onChange={e => setIdProofFile(e.target.files?.[0] || null)}
                  />
                  {idProofFile && (
                    <span style={{ fontSize: 12, color: "#818cf8" }}>✓ {idProofFile.name}</span>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: 12, color: "var(--c-text2)", marginBottom: 10, fontWeight: 500 }}>
                    Available Time Slots <span style={{ color: "var(--c-text3)" }}>(select all that apply)</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {slotOptions.map(slot => (
                      <button
                        type="button"
                        key={slot}
                        style={selectedSlots.includes(slot) ? R.slotActive : R.slot}
                        onClick={() => toggleTimeSlot(slot)}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div style={R.errorBox}>{error}</div>
            )}

            <button
              className="btn-primary"
              type="submit"
              disabled={isSubmitting}
              style={{ padding: "13px", fontSize: 15, borderRadius: 10, marginTop: 4 }}
            >
              {isSubmitting ? "Creating account…" : (role === "PROVIDER" ? "Submit for Verification →" : "Create Account →")}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--c-text3)" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#818cf8", textDecoration: "none", fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

const R = {
  page: {
    minHeight: "100vh",
    background: "var(--c-bg)",
    position: "relative",
  },
  scrollArea: {
    position: "relative", zIndex: 1,
    display: "flex", justifyContent: "center", alignItems: "flex-start",
    padding: "40px 20px 60px",
    minHeight: "100vh",
  },
  card: {
    width: "min(760px, 100%)",
    background: "rgba(15,23,42,0.85)",
    border: "1px solid rgba(148,163,184,0.12)",
    borderRadius: 20,
    padding: "36px 36px",
    backdropFilter: "blur(20px)",
    boxShadow: "0 32px 64px rgba(0,0,0,0.4)",
  },
  title: {
    margin: 0,
    fontSize: 26,
    fontWeight: 800,
    color: "var(--c-text)",
    fontFamily: "var(--font-display)",
    letterSpacing: "-0.3px",
  },
  subtitle: {
    margin: "6px 0 0",
    fontSize: 14,
    color: "var(--c-text3)",
  },
  roleTabs: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 8,
    marginBottom: 24,
    background: "rgba(2,8,23,0.6)",
    padding: 5,
    borderRadius: 10,
    border: "1px solid rgba(148,163,184,0.1)",
  },
  roleTab: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: "10px 6px",
    background: "transparent",
    color: "var(--c-text2)",
    border: "none", borderRadius: 7,
    cursor: "pointer", fontSize: 14, fontWeight: 500,
    fontFamily: "var(--font-sans)",
    transition: "all 0.2s",
  },
  roleTabActive: {
    background: "rgba(99,102,241,0.18)",
    color: "#a5b4fc",
    fontWeight: 700,
    boxShadow: "0 0 0 1px rgba(99,102,241,0.35)",
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "var(--c-text3)",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    display: "flex", alignItems: "center", gap: 8,
    marginBottom: 4,
    marginTop: 4,
    paddingBottom: 10,
    borderBottom: "1px solid rgba(148,163,184,0.1)",
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  },
  eyeBtn: {
    position: "absolute",
    right: 10, top: "50%", transform: "translateY(-50%)",
    border: "none", background: "transparent",
    cursor: "pointer", fontSize: 15, padding: 2, lineHeight: 1,
  },
  locationBox: {
    background: "rgba(2,8,23,0.5)",
    border: "1px solid rgba(148,163,184,0.1)",
    borderRadius: 10, padding: "12px 14px",
  },
  detectBtn: {
    display: "flex", alignItems: "center", gap: 8,
    background: "rgba(99,102,241,0.12)",
    border: "1px solid rgba(99,102,241,0.3)",
    color: "#a5b4fc",
    borderRadius: 8, padding: "9px 14px",
    cursor: "pointer", fontSize: 13, fontWeight: 600,
    fontFamily: "var(--font-sans)",
    transition: "all 0.2s",
  },
  geoMsg: {
    margin: "10px 0 0",
    fontSize: 12,
    color: "var(--c-text2)",
    lineHeight: 1.5,
  },
  providerBlock: {
    background: "rgba(2,8,23,0.5)",
    border: "1px solid rgba(99,102,241,0.15)",
    borderRadius: 12, padding: 20,
    display: "flex", flexDirection: "column", gap: 16,
  },
  slot: {
    border: "1px solid rgba(148,163,184,0.2)",
    borderRadius: 999,
    background: "rgba(15,23,42,0.8)",
    color: "var(--c-text2)",
    padding: "6px 12px",
    fontSize: 12, fontWeight: 500,
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
    transition: "all 0.2s",
  },
  slotActive: {
    border: "1px solid rgba(99,102,241,0.7)",
    borderRadius: 999,
    background: "rgba(99,102,241,0.18)",
    color: "#a5b4fc",
    padding: "6px 12px",
    fontSize: 12, fontWeight: 700,
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
    boxShadow: "0 0 0 1px rgba(99,102,241,0.2)",
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
};
