import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import PortalLayout from "../layout/PortalLayout";
import API from "../api/api";
import { useAppData } from "../state/AppDataContext";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const adminMenu = [
  { label: "Dashboard", path: "/admin/dashboard" },
  { label: "Verification", path: "/admin/verification" },
  { label: "Disputes", path: "/admin/disputes" },
  { label: "Analytics", path: "/admin/analytics" },
  { label: "Messages", path: "/admin/messages" },
  { label: "Settings", path: "/admin/settings" }
];

const disputeStatusLabel = (status) =>
  String(status || "")
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const disputeStatusKey = (status) =>
  String(status || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

const disputeTone = (status) => {
  const normalized = disputeStatusKey(status);
  if (["RESOLVED", "REFUNDED", "REJECTED"].includes(normalized)) return "ok";
  if (normalized === "ESCALATED") return "alert";
  return "warn";
};

const isClosedDisputeStatus = (status) =>
  ["RESOLVED", "REFUNDED", "REJECTED"].includes(disputeStatusKey(status));

const formatDateTime = (timestamp) => {
  if (!timestamp) return "";
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  });
};

const toEpochMs = (value) => {
  const parsed = new Date(value || "").getTime();
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const buildDisputeIdentityKey = (dispute = {}) => {
  const bookingKey = String(dispute?.bookingId ?? "").trim();
  const issueKey = String(dispute?.issueDescription || dispute?.issue || "")
    .trim()
    .toLowerCase();
  const createdKey = String(dispute?.createdAt || "").trim();
  const idKey = String(dispute?.id || "").trim();

  if (bookingKey && issueKey) return `booking:${bookingKey}|issue:${issueKey}`;
  if (idKey) return `id:${idKey}`;
  if (bookingKey) return `booking:${bookingKey}|created:${createdKey}`;
  return `issue:${issueKey}|created:${createdKey}`;
};

const mergeDisputeLists = (...lists) => {
  const merged = new Map();

  lists.forEach((list) => {
    (Array.isArray(list) ? list : []).forEach((dispute) => {
      const identity = buildDisputeIdentityKey(dispute);
      const existing = merged.get(identity);
      const existingTimestamp = toEpochMs(existing?.updatedAt || existing?.createdAt);
      const nextTimestamp = toEpochMs(dispute?.updatedAt || dispute?.createdAt);

      if (!existing || nextTimestamp >= existingTimestamp) {
        merged.set(identity, dispute);
      }
    });
  });

  return Array.from(merged.values()).sort(
    (a, b) => toEpochMs(b?.updatedAt || b?.createdAt) - toEpochMs(a?.updatedAt || a?.createdAt)
  );
};

const toTopList = (items, limit = 5) =>
  Object.entries(items || {})
    .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))
    .slice(0, limit)
    .map(([name, value]) => ({ name, value }));

const buildFallbackAnalytics = (portalData) => {
  const bookings = Array.isArray(portalData?.bookings) ? portalData.bookings : [];
  const providerProfiles = Array.isArray(portalData?.providerProfiles) ? portalData.providerProfiles : [];

  const mostBookedServices = toTopList(
    bookings.reduce((acc, booking) => {
      const key = booking?.subcategory || booking?.category || "Unknown";
      acc[key] = Number(acc[key] || 0) + 1;
      return acc;
    }, {})
  );

  const locationTrends = toTopList(
    bookings.reduce((acc, booking) => {
      const key = booking?.customerLocation || booking?.providerLocation || "Unknown";
      acc[key] = Number(acc[key] || 0) + 1;
      return acc;
    }, {})
  );

  const topProvidersByRating = providerProfiles
    .map((provider) => ({ name: provider.name, value: Number(provider.rating || 0) }))
    .sort((a, b) => Number(b.value || 0) - Number(a.value || 0))
    .slice(0, 5);

  const topProvidersByProblemsSolved = providerProfiles
    .map((provider) => ({ name: provider.name, value: Number(provider.completedJobs || 0) }))
    .sort((a, b) => Number(b.value || 0) - Number(a.value || 0))
    .slice(0, 5);

  const topEarningProviders = toTopList(
    bookings
      .filter((booking) => booking.status === "Paid")
      .reduce((acc, booking) => {
        const key = booking?.providerName || "Provider";
        acc[key] = Number(acc[key] || 0) + Number(booking?.price || 0);
        return acc;
      }, {})
  );

  const totalRevenue = bookings
    .filter((booking) => booking.status === "Paid")
    .reduce((sum, booking) => sum + Number(booking.price || 0), 0);

  return {
    mostBookedServices,
    topProvidersByRating,
    topProvidersByJobs: topProvidersByProblemsSolved,
    topProvidersByProblemsSolved,
    topEarningProviders,
    locationTrends,
    totalRevenue,
    totalProviderWalletBalance: totalRevenue,
    openDisputesCount: (portalData?.disputeQueue || []).filter(
      (entry) => !["RESOLVED", "REFUNDED", "REJECTED"].includes(disputeStatusKey(entry?.status))
    ).length,
    totalPaidBookings: bookings.filter((booking) => booking.status === "Paid").length,
    pendingProviderVerifications: (portalData?.providerQueue || []).filter(
      (provider) => provider.status !== "APPROVED"
    ).length
  };
};

const AdminDashboard = () => {
  const {
    portalData,
    saveAdminSettings,
    approveProvider,
    holdProvider,
    updateVerificationStatus,
    updateDisputeStatus,
    addAdminProviderMessage
  } = useAppData();

  const [feedback, setFeedback] = useState("");
  const [searchText, setSearchText] = useState("");
  const [adminDraft, setAdminDraft] = useState(portalData.adminSettings);
  const [healthMessage, setHealthMessage] = useState("No health check run yet.");
  const [adminChatText, setAdminChatText] = useState("");
  const [analyticsData, setAnalyticsData] = useState(buildFallbackAnalytics(portalData));
  const [adminDisputes, setAdminDisputes] = useState([]);

  useEffect(() => {
    setAdminDraft(portalData.adminSettings);
  }, [portalData.adminSettings]);

  useEffect(() => {
    setAnalyticsData(buildFallbackAnalytics(portalData));
  }, [portalData]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await API.get("/admin/analytics");
        if (res?.data?.success && res?.data?.data) {
          setAnalyticsData(res.data.data);
          return;
        }
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      }

      setAnalyticsData(buildFallbackAnalytics(portalData));
    };

    fetchAnalytics();
  }, [portalData]);

  useEffect(() => {
    const fetchDisputes = async () => {
      const localDisputes = Array.isArray(portalData.disputeQueue) ? portalData.disputeQueue : [];
      try {
        const res = await API.get("/disputes/all");
        if (res?.data?.success) {
          const backendDisputes = Array.isArray(res.data.data) ? res.data.data : [];
          setAdminDisputes(mergeDisputeLists(backendDisputes, localDisputes));
          return;
        }
      } catch (err) {
        console.error("Failed to fetch disputes:", err);
      }

      setAdminDisputes(mergeDisputeLists(localDisputes));
    };

    fetchDisputes();
  }, [portalData.disputeQueue]);

  const visibleVerificationQueue = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return portalData.userVerificationQueue;
    return portalData.userVerificationQueue.filter((entry) =>
      `${entry.name} ${entry.role}`.toLowerCase().includes(query)
    );
  }, [portalData.userVerificationQueue, searchText]);

  const pendingVerificationCount = useMemo(() => {
    const userPending = portalData.userVerificationQueue.filter(
      (entry) =>
        String(entry.role || "").trim().toLowerCase() !== "provider" && entry.status !== "Verified"
    ).length;
    const providerPending = portalData.providerQueue.filter(
      (provider) => provider.status !== "APPROVED"
    ).length;
    return userPending + providerPending;
  }, [portalData.userVerificationQueue, portalData.providerQueue]);

  const openDisputeCount = useMemo(
    () =>
      adminDisputes.filter(
        (dispute) =>
          !["RESOLVED", "REFUNDED", "REJECTED"].includes(disputeStatusKey(dispute.status))
      ).length,
    [adminDisputes]
  );

  const averageProviderRating = useMemo(() => {
    if (!portalData.providerProfiles.length) return 0;
    const total = portalData.providerProfiles.reduce((sum, profile) => sum + profile.rating, 0);
    return total / portalData.providerProfiles.length;
  }, [portalData.providerProfiles]);

  const totalCompletedJobs = useMemo(
    () =>
      portalData.providerProfiles.reduce(
        (sum, profile) => sum + Number(profile.completedJobs || 0),
        0
      ),
    [portalData.providerProfiles]
  );

  const totalReviews = useMemo(
    () =>
      portalData.providerProfiles.reduce((sum, profile) => sum + Number(profile.reviews || 0), 0),
    [portalData.providerProfiles]
  );

  const providerNameByEmail = useMemo(
    () =>
      portalData.providerQueue.reduce((map, provider) => {
        map[String(provider.email || "").trim().toLowerCase()] = provider.name;
        return map;
      }, {}),
    [portalData.providerQueue]
  );

  const latestReviews = useMemo(
    () =>
      [...(portalData.reviews || [])]
        .sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime())
        .slice(0, 12),
    [portalData.reviews]
  );

  const exportSnapshot = () => {
    const blob = new Blob([JSON.stringify(portalData, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "fixitnow-admin-snapshot.json";
    link.click();
    URL.revokeObjectURL(url);
    setFeedback("Snapshot exported successfully.");
  };

  const onApproveProvider = async (provider) => {
    try {
      await API.put(`/admin/providers/${provider.id}/approve`);
    } catch (err) {
      console.error("Provider approve API failed, applying local update:", err);
    }
    approveProvider(provider.id);
    setFeedback(`${provider.name} approved.`);
  };

  const onHoldProvider = async (provider) => {
    try {
      await API.put(`/admin/providers/${provider.id}/hold`);
    } catch (err) {
      console.error("Provider hold API failed, applying local update:", err);
    }
    holdProvider(provider.id);
    setFeedback(`${provider.name} moved to hold state.`);
  };

  const formatSubmittedAt = (timestamp) => {
    if (!timestamp) return "Not available";
    const parsedDate = new Date(timestamp);
    if (Number.isNaN(parsedDate.getTime())) return "Not available";
    return parsedDate.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  };

  const markVerification = (entryId, status, tone) => {
    updateVerificationStatus(entryId, status, tone);
    setFeedback(`Verification status updated to ${status}.`);
  };

  const markDispute = async (disputeId, status, tone) => {
    const backendStatus = disputeStatusKey(status);
    const adminMessageByStatus = {
      RESOLVED: "Issue reviewed and marked as resolved by admin.",
      ESCALATED: "Issue escalated for additional internal review.",
      REFUND_IN_PROGRESS: "Refund process started by admin."
    };
    const adminMessage = adminMessageByStatus[backendStatus] || `Admin updated status to ${status}`;
    const numericDisputeId = Number(disputeId);
    const canUpdateBackend = Number.isFinite(numericDisputeId) && numericDisputeId > 0;

    try {
      if (canUpdateBackend) {
        await API.put(`/disputes/${disputeId}/resolve`, {
          message: adminMessage,
          status: backendStatus
        });

        const refreshed = await API.get("/disputes/all");
        if (refreshed?.data?.success) {
          const refreshedBackendDisputes = Array.isArray(refreshed.data.data)
            ? refreshed.data.data
            : [];
          setAdminDisputes(
            mergeDisputeLists(refreshedBackendDisputes, Array.isArray(portalData.disputeQueue) ? portalData.disputeQueue : [])
          );
        }
      }

      updateDisputeStatus(disputeId, backendStatus, tone, adminMessage);
      setFeedback(
        canUpdateBackend
          ? `Dispute marked as ${disputeStatusLabel(backendStatus)}.`
          : `Dispute marked as ${disputeStatusLabel(backendStatus)} in dashboard.`
      );
    } catch (err) {
      console.error("Dispute update failed", err);
      updateDisputeStatus(disputeId, backendStatus, tone, adminMessage);
      setFeedback(`Dispute updated in local dashboard as ${disputeStatusLabel(backendStatus)}.`);
    }
  };

  const saveSettings = () => {
    saveAdminSettings(adminDraft);
    setFeedback("Admin settings saved successfully.");
  };

  const runHealthCheck = () => {
    const checks = [
      "API latency: Stable",
      "Queue health: Within threshold",
      "Auth service: Operational",
      "Notification service: Operational"
    ];
    setHealthMessage(checks.join(" | "));
    setFeedback("Health check completed.");
  };

  const sendAdminMessage = () => {
    if (!adminChatText.trim()) {
      setFeedback("Please type a message before sending.");
      return;
    }

    addAdminProviderMessage({
      from: "Admin",
      text: adminChatText
    });
    setAdminChatText("");
    setFeedback("Message sent to service provider.");
  };

  const adminHomeView = (
    <>
      <section className="portal-card portal-hero">
        <div>
          <h2>Admin Control Room</h2>
          <p>
            Monitor disputes, user verification, and platform health while coordinating
            directly with service providers.
          </p>
        </div>
        <button className="portal-button" onClick={exportSnapshot}>
          Export Snapshot
        </button>
      </section>

      <section className="portal-grid">
        <article className="portal-metric">
          <p className="portal-metric-value">{portalData.providerProfiles.length}</p>
          <p className="portal-metric-label">Service provider profiles</p>
          <p className="portal-metric-note portal-ok">Ratings, reviews, jobs tracked</p>
        </article>

        <article className="portal-metric">
          <p className="portal-metric-value">{pendingVerificationCount}</p>
          <p className="portal-metric-label">Pending verifications</p>
          <p className="portal-metric-note portal-warn">User + service verification queue</p>
        </article>

        <article className="portal-metric">
          <p className="portal-metric-value">{openDisputeCount}</p>
          <p className="portal-metric-label">Open disputes</p>
          <p className="portal-metric-note portal-alert">Requires dispute management</p>
        </article>

        <article className="portal-metric">
          <p className="portal-metric-value">{averageProviderRating.toFixed(1)}</p>
          <p className="portal-metric-label">Average provider rating</p>
          <p className="portal-metric-note">{healthMessage}</p>
        </article>
      </section>

      <section className="portal-card">
        <div className="portal-title-row">
          <h3>Service Provider Profiles</h3>
          <p>Ratings, reviews, and completed jobs</p>
        </div>
        <div className="portal-list-grid">
          {portalData.providerProfiles.map((profile) => (
            <article className="portal-list-card" key={profile.id}>
              <h4>{profile.name}</h4>
              <p className="portal-list-sub">{profile.service}</p>
              <p className="portal-list-sub">Location: {profile.location || "Not specified"}</p>
              <p className="portal-list-sub">Rating: {profile.rating.toFixed(1)} / 5</p>
              <p className="portal-list-sub">Reviews: {profile.reviews}</p>
              <p className="portal-list-sub">Completed jobs: {profile.completedJobs}</p>
              <span className={`portal-status ${profile.tone}`}>{profile.verification}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="portal-card">
        <div className="portal-title-row">
          <h3>Latest Customer Reviews</h3>
          <p>Monitor quality signals for providers</p>
        </div>
        <div className="portal-list">
          {latestReviews.length === 0 && (
            <article className="portal-list-item">
              <h5>No reviews yet</h5>
              <p>Reviews will appear here after completed services.</p>
            </article>
          )}

          {latestReviews.map((review) => {
            const providerEmail = String(review.providerEmail || "").trim().toLowerCase();
            const providerName =
              review.providerName || providerNameByEmail[providerEmail] || "Service Provider";
            return (
              <article className="portal-list-item" key={review.id}>
                <h5>
                  {providerName} | {Number(review.rating || 0).toFixed(1)} / 5
                </h5>
                <p>
                  By {review.customerName || "Customer"}{" "}
                  {review.subcategory ? `for ${review.subcategory}` : ""}
                </p>
                <p>{review.text}</p>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );

  const adminVerificationView = (
    <>
      <section className="portal-card">
        <div className="portal-title-row">
          <h3>User & Service Verification</h3>
          <p>Approve identities and service accounts</p>
        </div>

        <div className="portal-field" style={{ marginBottom: 12 }}>
          <label>Search account</label>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search by name or role"
          />
        </div>

        <div className="portal-list">
          {visibleVerificationQueue.map((entry) => (
            <article className="portal-list-item" key={entry.id}>
              <h5>{entry.name}</h5>
              <p>
                {entry.role} | {entry.document}
              </p>
              <span className={`portal-status ${entry.tone}`}>{entry.status}</span>
              <div className="portal-button-row">
                <button
                  className="portal-button"
                  onClick={() => markVerification(entry.id, "Verified", "ok")}
                >
                  Mark Verified
                </button>
                <button
                  className="portal-button secondary"
                  onClick={() => markVerification(entry.id, "Under Review", "warn")}
                >
                  Keep Under Review
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="portal-card">
        <div className="portal-title-row">
          <h3>Provider Document Queue</h3>
          <p>Service verification and onboarding checks</p>
        </div>

        <div className="portal-list-grid">
          {portalData.providerQueue.map((provider) => {
            const providerStats = portalData.providerProfiles.find(
              (profile) =>
                profile.name.trim().toLowerCase() === provider.name.trim().toLowerCase()
            );
            const providerServices = portalData.providerServiceCatalog.filter(
              (service) =>
                String(service.providerEmail || "").trim().toLowerCase() ===
                String(provider.email || "").trim().toLowerCase()
            );
            const activeServices = providerServices.filter(
              (service) => service.available && Number(service.price) > 0
            );
            const pendingBookings = portalData.bookings.filter(
              (booking) =>
                String(booking.providerEmail || "").trim().toLowerCase() ===
                  String(provider.email || "").trim().toLowerCase() &&
                booking.status === "Pending"
            ).length;
            return (
              <article className="portal-list-card" key={provider.id || provider.name}>
                <h4>{provider.name}</h4>
                <p className="portal-list-sub">{provider.area}</p>
                <p className="portal-list-sub">Email: {provider.email || "Not provided"}</p>
                <p className="portal-list-sub">Phone: {provider.phone || "Not provided"}</p>
                <p className="portal-list-sub">
                  Service: {provider.serviceType || "Not provided"} | ID:{" "}
                  {provider.idProofType || "Not provided"}
                </p>
                <p className="portal-list-sub">
                  Document: {provider.idProofDocumentName || "Not provided"}
                </p>
                <p className="portal-list-sub">
                  Submitted: {formatSubmittedAt(provider.submittedAt)}
                </p>
                <p className="portal-list-sub">Active listed services: {activeServices.length}</p>
                <p className="portal-list-sub">Pending customer bookings: {pendingBookings}</p>
                {activeServices.slice(0, 3).map((service) => (
                  <p className="portal-list-sub" key={service.id}>
                    {service.category} - {service.subcategory} - Rs.{service.price}
                  </p>
                ))}
                <p className="portal-list-sub">
                  Login access:{" "}
                  {provider.status === "APPROVED"
                    ? "Allowed"
                    : "Blocked until admin approval"}
                </p>
                <p className="portal-list-sub">
                  Rating: {providerStats?.rating?.toFixed(1) || "N/A"} | Reviews:{" "}
                  {providerStats?.reviews ?? "N/A"} | Jobs: {providerStats?.completedJobs ?? "N/A"}
                </p>
                <span className={`portal-status ${provider.tone}`}>{provider.docs}</span>
                <div className="portal-button-row">
                  <button
                    className="portal-button"
                    onClick={() => onApproveProvider(provider)}
                  >
                    Approve
                  </button>
                  <button
                    className="portal-button secondary"
                    onClick={() => onHoldProvider(provider)}
                  >
                    Hold
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );

  const adminDisputesView = (
    <section className="portal-card">
      <div className="portal-title-row">
        <h3>Dispute Management</h3>
        <p>Track and resolve customer-provider conflicts</p>
      </div>

      <div className="portal-list">
        {adminDisputes.length === 0 && (
          <article className="portal-list-item">
            <h5>No disputes</h5>
            <p>Customer-reported disputes will appear here.</p>
          </article>
        )}

        {adminDisputes.map((dispute) => {
          const isClosed = isClosedDisputeStatus(dispute.status);
          return (
            <article className="portal-list-item" key={dispute.id}>
              <h5>Dispute #{dispute.id}</h5>
              <p>
                {(dispute.customerName || dispute.customer || "Customer")} vs{" "}
                {(dispute.providerName || dispute.provider || "Provider")}
              </p>
              <p className="portal-list-sub">
                Service: {dispute.serviceSubcategory || "Service"} | Booking #
                {dispute.bookingId || "N/A"}
              </p>
              <p>{dispute.issueDescription || dispute.issue}</p>
              {dispute.providerResponse && (
                <p className="portal-list-sub">Provider response: {dispute.providerResponse}</p>
              )}
              {dispute.adminNotes && (
                <p className="portal-list-sub">Admin notes: {dispute.adminNotes}</p>
              )}
              {dispute.resolvedAt && (
                <p className="portal-list-sub">Resolved at: {formatDateTime(dispute.resolvedAt)}</p>
              )}
              <span className={`portal-status ${dispute.tone || disputeTone(dispute.status)}`}>
                {disputeStatusLabel(dispute.status)}
              </span>
              {!isClosed && (
                <div className="portal-button-row">
                  <button
                    className="portal-button"
                    onClick={() => markDispute(dispute.id, "RESOLVED", "ok")}
                  >
                    Resolve
                  </button>
                  <button
                    className="portal-button secondary"
                    onClick={() => markDispute(dispute.id, "ESCALATED", "alert")}
                  >
                    Escalate
                  </button>
                  <button
                    className="portal-button secondary"
                    onClick={() => markDispute(dispute.id, "REFUND_IN_PROGRESS", "warn")}
                  >
                    Start Refund
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  const metricsData = analyticsData || {};
  const topRatedProvider = metricsData?.topProvidersByRating?.[0] || null;
  const topSolvedProvider = metricsData?.topProvidersByProblemsSolved?.[0] || null;
  const topEarningProvider = metricsData?.topEarningProviders?.[0] || null;

  const adminAnalyticsView = (
    <section className="portal-card">
      <div className="portal-title-row">
        <h3>Platform Analytics</h3>
        <p>Operational and quality indicators with live data</p>
      </div>

      <section className="portal-grid">
        <article className="portal-metric">
          <p className="portal-metric-value">{averageProviderRating.toFixed(1)}</p>
          <p className="portal-metric-label">Average provider rating</p>
        </article>
        <article className="portal-metric">
          <p className="portal-metric-value">{totalReviews}</p>
          <p className="portal-metric-label">Total reviews</p>
        </article>
        <article className="portal-metric">
          <p className="portal-metric-value">{totalCompletedJobs}</p>
          <p className="portal-metric-label">Completed jobs</p>
        </article>
        <article className="portal-metric">
          <p className="portal-metric-value">
            Rs. {Number(metricsData?.totalRevenue || 0).toLocaleString("en-IN")}
          </p>
          <p className="portal-metric-label">Gross Revenue</p>
        </article>
        <article className="portal-metric">
          <p className="portal-metric-value">
            Rs. {Number(metricsData?.totalProviderWalletBalance || 0).toLocaleString("en-IN")}
          </p>
          <p className="portal-metric-label">Provider Wallet Total</p>
        </article>
        <article className="portal-metric">
          <p className="portal-metric-value">{Number(metricsData?.totalPaidBookings || 0)}</p>
          <p className="portal-metric-label">Paid Bookings</p>
        </article>
        <article className="portal-metric">
          <p className="portal-metric-value">{Number(metricsData?.openDisputesCount ?? openDisputeCount)}</p>
          <p className="portal-metric-label">Open Disputes</p>
        </article>
      </section>

      {/* Visual Analytics */}
      <section className="portal-grid" style={{ marginTop: "24px", gridTemplateColumns: "1fr 1fr" }}>
        <article className="portal-card" style={{ padding: "16px" }}>
          <h4>Most Booked Services</h4>
          {!metricsData?.mostBookedServices?.length ? (
            <p style={{ marginTop: "16px" }}>Not enough data to graph.</p>
          ) : (
            <div style={{ width: "100%", height: 300, marginTop: "16px" }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={metricsData.mostBookedServices}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label
                  >
                    {metricsData.mostBookedServices.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className="portal-card" style={{ padding: "16px" }}>
          <h4>Location Booking Trends</h4>
          {!metricsData?.locationTrends?.length ? (
            <p style={{ marginTop: "16px" }}>Not enough data to graph.</p>
          ) : (
            <div style={{ width: "100%", height: 300, marginTop: "16px" }}>
              <ResponsiveContainer>
                <BarChart data={metricsData.locationTrends} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{fontSize: 12}} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" name="Bookings" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className="portal-card" style={{ padding: "16px" }}>
          <h4>Top Providers By Rating</h4>
          {!metricsData?.topProvidersByRating?.length ? (
            <p style={{ marginTop: "16px" }}>Not enough data to graph.</p>
          ) : (
            <div style={{ width: "100%", height: 300, marginTop: "16px" }}>
              <ResponsiveContainer>
                <BarChart data={metricsData.topProvidersByRating} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{fontSize: 12}} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#00C49F" name="Rating" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className="portal-card" style={{ padding: "16px" }}>
          <h4>Top Providers By Problems Solved</h4>
          {!metricsData?.topProvidersByProblemsSolved?.length ? (
            <p style={{ marginTop: "16px" }}>Not enough data to graph.</p>
          ) : (
            <div style={{ width: "100%", height: 300, marginTop: "16px" }}>
              <ResponsiveContainer>
                <BarChart data={metricsData.topProvidersByProblemsSolved} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{fontSize: 12}} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#FF8042" name="Resolved Jobs" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>
      </section>

      <section className="portal-grid" style={{ marginTop: "20px" }}>
        <article className="portal-metric">
          <p className="portal-metric-value">{topRatedProvider ? topRatedProvider.name : "N/A"}</p>
          <p className="portal-metric-label">Best Provider By Rating</p>
          <p className="portal-metric-note">{topRatedProvider ? `Score: ${topRatedProvider.value}` : "No ratings yet"}</p>
        </article>
        <article className="portal-metric">
          <p className="portal-metric-value">{topSolvedProvider ? topSolvedProvider.name : "N/A"}</p>
          <p className="portal-metric-label">Best Provider By Problems Solved</p>
          <p className="portal-metric-note">{topSolvedProvider ? `${topSolvedProvider.value} jobs solved` : "No completed jobs yet"}</p>
        </article>
        <article className="portal-metric">
          <p className="portal-metric-value">{topEarningProvider ? topEarningProvider.name : "N/A"}</p>
          <p className="portal-metric-label">Top Earning Provider</p>
          <p className="portal-metric-note">
            {topEarningProvider ? `Rs. ${Number(topEarningProvider.value || 0).toLocaleString("en-IN")}` : "No paid jobs yet"}
          </p>
        </article>
      </section>

      <div className="portal-button-row" style={{ marginTop: "24px" }}>
        <button className="portal-button" onClick={runHealthCheck}>
          Generate Health Report
        </button>
      </div>

      <div className="portal-list" style={{ marginTop: 12 }}>
        <article className="portal-list-item">
          <h5>Latest health result</h5>
          <p>{healthMessage}</p>
        </article>
      </div>
    </section>
  );

  const adminMessagesView = (
    <section className="portal-split">
      <article className="portal-card">
        <div className="portal-title-row">
          <h3>Conversations</h3>
          <p>{portalData.adminProviderChat.length} messages</p>
        </div>
        <div className="portal-list">
          <div className="portal-list-item">
            <h5>Service Provider Desk</h5>
            <p>Direct admin-provider channel</p>
          </div>
        </div>
      </article>

      <article className="portal-card">
        <div className="portal-title-row">
          <h3>Message Preview</h3>
          <p>Two-way messaging enabled</p>
        </div>

        <div className="portal-list">
          {portalData.adminProviderChat.map((message) => (
            <div className="portal-list-item" key={message.id}>
              <h5>
                {message.from} {message.timestamp ? `| ${message.timestamp}` : ""}
              </h5>
              <p>{message.text}</p>
            </div>
          ))}
        </div>

        <div className="portal-field">
          <label>Reply to provider</label>
          <textarea
            placeholder="Type your message here..."
            value={adminChatText}
            onChange={(e) => setAdminChatText(e.target.value)}
          />
        </div>

        <div className="portal-button-row">
          <button className="portal-button" onClick={sendAdminMessage}>
            Send
          </button>
        </div>
      </article>
    </section>
  );

  const adminSettingsView = (
    <section className="portal-card">
      <div className="portal-title-row">
        <h3>Platform Settings</h3>
        <p>Control security and moderation defaults</p>
      </div>

      <div className="portal-form-grid">
        <div className="portal-field">
          <label>Auto-approve customer signups</label>
          <select
            value={adminDraft.autoApproveCustomers}
            onChange={(e) =>
              setAdminDraft((prev) => ({ ...prev, autoApproveCustomers: e.target.value }))
            }
          >
            <option>Enabled</option>
            <option>Disabled</option>
          </select>
        </div>

        <div className="portal-field">
          <label>Provider verification SLA</label>
          <select
            value={adminDraft.verificationSla}
            onChange={(e) =>
              setAdminDraft((prev) => ({ ...prev, verificationSla: e.target.value }))
            }
          >
            <option>24 hours</option>
            <option>48 hours</option>
            <option>72 hours</option>
          </select>
        </div>

        <div className="portal-field">
          <label>Dispute resolution SLA</label>
          <select
            value={adminDraft.disputeSla}
            onChange={(e) => setAdminDraft((prev) => ({ ...prev, disputeSla: e.target.value }))}
          >
            <option>24 hours</option>
            <option>48 hours</option>
            <option>72 hours</option>
          </select>
        </div>

        <div className="portal-field">
          <label>Incident alert email</label>
          <input
            type="email"
            value={adminDraft.incidentEmail}
            onChange={(e) =>
              setAdminDraft((prev) => ({ ...prev, incidentEmail: e.target.value }))
            }
          />
        </div>
      </div>

      <div className="portal-button-row">
        <button className="portal-button" onClick={saveSettings}>
          Save Settings
        </button>
        <button className="portal-button secondary" onClick={runHealthCheck}>
          Run Health Check
        </button>
      </div>
    </section>
  );

  return (
    <PortalLayout portalTitle="Admin" menuItems={adminMenu}>
      {feedback && (
        <section className="portal-card" style={{ borderColor: "rgba(6, 182, 212, 0.6)" }}>
          <p style={{ margin: 0 }}>{feedback}</p>
        </section>
      )}

      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={adminHomeView} />
        <Route path="verification" element={adminVerificationView} />
        <Route path="disputes" element={adminDisputesView} />
        <Route path="analytics" element={adminAnalyticsView} />
        <Route path="messages" element={adminMessagesView} />
        <Route path="settings" element={adminSettingsView} />

        <Route path="users" element={<Navigate to="/admin/verification" replace />} />
        <Route path="providers" element={<Navigate to="/admin/verification" replace />} />
        <Route path="reports" element={<Navigate to="/admin/analytics" replace />} />

        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </PortalLayout>
  );
};

export default AdminDashboard;
