import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getLocalAccounts, normalizeEmail, resolveRole } from "../auth/localAuth";
import API from "../api/api";

const STORAGE_KEY = "fixitnow_portal_data";

const SLOT_OPTIONS = [
  "08:00 AM - 09:00 AM",
  "09:30 AM - 10:30 AM",
  "11:00 AM - 12:00 PM",
  "01:30 PM - 02:30 PM",
  "04:00 PM - 05:00 PM",
  "06:30 PM - 07:30 PM"
];

const SERVICE_CATEGORIES = {
  "Home Service": [
    "House Cleaning",
    "Bathroom Cleaning",
    "Painting",
    "Deep Cleaning",
    "Sofa Cleaning"
  ],
  Electrical: ["Wiring Repair", "Switch/Socket Fix", "Fan Installation", "DB Panel Check"],
  Plumbing: ["Tap Repair", "Pipe Leakage", "Drain Blockage", "Bathroom Fitting"],
  Carpentry: ["Furniture Repair", "Door Lock Fix", "Shelf Installation", "Custom Woodwork"],
  "AC Repair": ["Gas Refill", "Cooling Issue", "AC Installation", "Periodic Servicing"],
  Appliance: ["Washing Machine", "Refrigerator", "Microwave", "Water Purifier"],
  Mechanic: ["Bike Service", "Car Service", "Puncture Repair", "Battery Replacement"]
};

const DEFAULT_PROVIDER_AVAILABILITY = "Mon - Sat, 9 AM - 8 PM";

const providerStatusToVerificationLabel = (status) => {
  if (status === "APPROVED") return "Verified";
  if (status === "ON_HOLD") return "Under Review";
  return "Pending";
};

const toProviderProfileVerification = (providerStatus) => {
  if (providerStatus === "APPROVED") {
    return { verification: "Verified", tone: "ok" };
  }
  if (providerStatus === "ON_HOLD") {
    return { verification: "Under Review", tone: "warn" };
  }
  return { verification: "Pending", tone: "warn" };
};

const normalizeServiceCategory = (value = "") => {
  const incoming = String(value || "").trim();
  if (!incoming) return "Home Service";

  const matchedCategory = Object.keys(SERVICE_CATEGORIES).find(
    (category) => category.toLowerCase() === incoming.toLowerCase()
  );
  return matchedCategory || "Home Service";
};

const normalizeServiceSubcategory = (category, value = "") => {
  const normalizedCategory = normalizeServiceCategory(category);
  const availableSubcategories = SERVICE_CATEGORIES[normalizedCategory] || [];
  const incoming = String(value || "").trim();

  if (!availableSubcategories.length) {
    return incoming || "General Service";
  }

  const matchedSubcategory = availableSubcategories.find(
    (subcategory) => subcategory.toLowerCase() === incoming.toLowerCase()
  );
  return matchedSubcategory || availableSubcategories[0];
};

const sanitizeSlots = (slots) =>
  Array.from(
    new Set(
      (Array.isArray(slots) ? slots : [])
        .map((slot) => String(slot || "").trim())
        .filter(Boolean)
    )
  );

const normalizeProviderStatus = (value = "") => {
  const normalized = String(value || "").trim().toUpperCase();
  if (!normalized) return "PENDING";
  if (normalized.includes("APPROVED") || normalized.includes("VERIFIED")) return "APPROVED";
  if (normalized.includes("HOLD")) return "ON_HOLD";
  return "PENDING";
};

const statusLabelToProviderStatus = (value = "") => {
  const normalized = String(value || "").trim().toUpperCase();
  if (!normalized) return "PENDING";
  if (normalized === "VERIFIED" || normalized.includes("APPROVED")) return "APPROVED";
  if (normalized.includes("UNDER REVIEW") || normalized.includes("HOLD")) return "ON_HOLD";
  if (normalized.includes("PENDING")) return "PENDING";
  return normalizeProviderStatus(normalized);
};

const toProviderDocsLabel = (status) => {
  if (status === "APPROVED") return "Approved";
  if (status === "ON_HOLD") return "On hold";
  return "Pending review";
};

const toProviderTone = (status) => {
  if (status === "APPROVED") return "ok";
  if (status === "ON_HOLD") return "warn";
  return "warn";
};

const normalizeBookingStatus = (value = "") => {
  const normalized = String(value || "").trim().toUpperCase();
  if (!normalized) return "Pending";
  if (normalized.includes("PAID")) return "Paid";
  if (normalized.includes("CANCEL")) return "Cancelled";
  if (normalized.includes("REJECT") || normalized.includes("DECLIN")) return "Cancelled";
  if (normalized.includes("COMPLETE")) return "Completed";
  if (normalized.includes("ACCEPT") || normalized.includes("APPROV") || normalized.includes("CONFIRM")) {
    return "Confirmed";
  }
  if (normalized.includes("PEND")) return "Pending";
  return "Pending";
};

const bookingToneByStatus = (status) => {
  if (status === "Confirmed" || status === "Completed" || status === "Paid") return "ok";
  if (status === "Pending") return "warn";
  return "alert";
};

const bookingStatusLabel = (status) => {
  if (status === "Confirmed") return "Confirmed";
  if (status === "Completed") return "Completed";
  if (status === "Paid") return "Paid";
  if (status === "Cancelled") return "Cancelled";
  return "Pending";
};

const disputeStatusKey = (status = "") =>
  String(status || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

const normalizeDisputeStatus = (status = "") => {
  const normalized = disputeStatusKey(status);
  if (!normalized) return "OPEN";
  if (normalized.includes("REFUND_IN_PROGRESS")) return "REFUND_IN_PROGRESS";
  if (normalized.includes("PROVIDER_RESPONDED")) return "PROVIDER_RESPONDED";
  if (normalized.includes("UNDER_REVIEW")) return "UNDER_REVIEW";
  if (normalized.includes("ESCAL")) return "ESCALATED";
  if (normalized.includes("REJECT")) return "REJECTED";
  if (normalized.includes("REFUND")) return "REFUNDED";
  if (normalized.includes("RESOLV")) return "RESOLVED";
  if (normalized.includes("OPEN")) return "OPEN";
  return normalized;
};

const isClosedDisputeStatus = (status = "") => {
  const normalized = normalizeDisputeStatus(status);
  return normalized === "RESOLVED" || normalized === "REFUNDED" || normalized === "REJECTED";
};

const disputeToneByStatus = (status = "") => {
  const normalized = normalizeDisputeStatus(status);
  if (isClosedDisputeStatus(normalized)) return "ok";
  if (normalized === "ESCALATED") return "alert";
  return "warn";
};

const createId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createMessageId = () => createId("msg");

const extractTimestampFromMessageId = (messageId = "") => {
  const match = String(messageId || "").match(/^msg-(\d+)-/);
  if (!match) return 0;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const normalizeMessageCreatedAt = (createdAt, messageId) => {
  const parsedCreatedAt = new Date(createdAt || "").getTime();
  if (Number.isFinite(parsedCreatedAt) && parsedCreatedAt > 0) {
    return new Date(parsedCreatedAt).toISOString();
  }

  const fromId = extractTimestampFromMessageId(messageId);
  if (fromId > 0) {
    return new Date(fromId).toISOString();
  }

  return "";
};

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const dedupeBy = (list, getKey) => {
  const map = new Map();
  ensureArray(list).forEach((item) => {
    const key = getKey(item);
    if (!key) return;
    map.set(key, item);
  });
  return Array.from(map.values());
};

const providerIdentityKey = (provider = {}) =>
  normalizeEmail(provider.email || "") || String(provider.name || "").trim().toLowerCase();

const getRegisteredProviderEmailSet = () => {
  const providerAccounts = getLocalAccounts().filter(
    (account) => resolveRole(account?.role) === "PROVIDER"
  );
  return new Set(
    providerAccounts
      .map((account) => normalizeEmail(account?.email || ""))
      .filter(Boolean)
  );
};

const buildProviderQueueEntry = (provider = {}) => {
  const status = normalizeProviderStatus(provider.status || provider.docs);
  const name = String(provider.name || provider.displayName || "").trim() || "Unnamed Provider";
  const email = normalizeEmail(provider.email || provider.providerEmail || "");
  const area = String(provider.area || provider.address || provider.location || "").trim();

  return {
    id: provider.id || createId("pq"),
    name,
    email,
    phone: String(provider.phone || "").trim(),
    area: area || "Not specified",
    address: area,
    serviceType: normalizeServiceCategory(provider.serviceType || provider.category),
    idProofType: provider.idProofType || "Not provided",
    idProofDocumentName: provider.idProofDocumentName || "Not provided",
    selectedSlots: sanitizeSlots(provider.selectedSlots || provider.availabilitySlots),
    submittedAt: provider.submittedAt || provider.createdAt || new Date().toISOString(),
    status,
    docs: toProviderDocsLabel(status),
    tone: toProviderTone(status)
  };
};

const createProviderVerificationEntry = (providerEntry) => ({
  id: `ver-provider-${providerEntry.email || providerEntry.id}`,
  name: providerEntry.name,
  role: "Provider",
  document: `${providerEntry.idProofType} | ${providerEntry.idProofDocumentName}`,
  status: providerStatusToVerificationLabel(providerEntry.status),
  tone: toProviderTone(providerEntry.status)
});

const mergeVerificationQueue = (existingQueue, providerQueue) => {
  const nonProviderEntries = ensureArray(existingQueue)
    .filter((entry) => String(entry?.role || "").trim().toLowerCase() !== "provider")
    .map((entry) => ({
      id: entry.id || createId("ver"),
      name: entry.name || "User",
      role: entry.role || "Customer",
      document: entry.document || "Not provided",
      status: entry.status || "Pending",
      tone: entry.tone || "warn"
    }));

  const providerEntries = ensureArray(providerQueue).map((provider) =>
    createProviderVerificationEntry(provider)
  );

  return dedupeBy([...providerEntries, ...nonProviderEntries], (entry) =>
    String(entry.id || `${entry.name}-${entry.role}`).trim().toLowerCase()
  );
};

const buildDefaultProviderSetting = (values = {}) => ({
  displayName: String(values.displayName || "").trim() || "Service Provider",
  category: normalizeServiceCategory(values.category),
  radius: String(values.radius || "10 km").trim() || "10 km",
  availability:
    String(values.availability || DEFAULT_PROVIDER_AVAILABILITY).trim() ||
    DEFAULT_PROVIDER_AVAILABILITY,
  selectedSlots: sanitizeSlots(values.selectedSlots),
  online: Boolean(values.online),
  location: String(values.location || "").trim()
});

const buildProviderServiceEntry = (service = {}, providerEntry = null) => {
  const providerEmail = normalizeEmail(service.providerEmail || providerEntry?.email || "");
  const category = normalizeServiceCategory(service.category || providerEntry?.serviceType);
  const subcategory = normalizeServiceSubcategory(category, service.subcategory || service.name);
  const numericPrice = Number(service.price);
  const price = Number.isFinite(numericPrice) && numericPrice > 0 ? Math.round(numericPrice) : 0;

  return {
    id: service.id || createId("svc"),
    providerEmail,
    providerName: String(service.providerName || providerEntry?.name || "").trim(),
    providerLocation: String(
      service.providerLocation || providerEntry?.area || providerEntry?.address || ""
    ).trim(),
    category,
    subcategory,
    price,
    available: service.available !== false,
    createdAt: service.createdAt || new Date().toISOString(),
    updatedAt: service.updatedAt || service.createdAt || new Date().toISOString()
  };
};

const buildBookingEntry = (booking = {}) => {
  const status = normalizeBookingStatus(booking.status);
  const category = normalizeServiceCategory(booking.category);
  const subcategory = normalizeServiceSubcategory(category, booking.subcategory || booking.title);
  const numericPrice = Number(booking.price);
  const price = Number.isFinite(numericPrice) && numericPrice > 0 ? Math.round(numericPrice) : 0;

  return {
    id: booking.id || createId("bk"),
    customerName: String(booking.customerName || "Customer").trim(),
    customerEmail: normalizeEmail(booking.customerEmail || ""),
    customerLocation: String(booking.customerLocation || "").trim(),
    providerName: String(booking.providerName || booking.partner || "").trim(),
    providerEmail: normalizeEmail(booking.providerEmail || ""),
    providerLocation: String(booking.providerLocation || "").trim(),
    serviceId: String(booking.serviceId || "").trim(),
    category,
    subcategory,
    price,
    bookingDate: String(booking.bookingDate || booking.scheduledDate || "").trim(),
    selectedSlot: String(booking.selectedSlot || "").trim(),
    problemDescription: String(booking.problemDescription || booking.problem_description || "").trim(),
    status,
    tone: bookingToneByStatus(status),
    createdAt: booking.createdAt || new Date().toISOString(),
    updatedAt: booking.updatedAt || booking.createdAt || new Date().toISOString()
  };
};

const buildDisputeEntry = (dispute = {}) => {
  const normalizedStatus = normalizeDisputeStatus(dispute.status);
  const createdAt = dispute.createdAt || new Date().toISOString();
  const updatedAt = dispute.updatedAt || createdAt;
  const shouldBeClosed = isClosedDisputeStatus(normalizedStatus);

  return {
    id: dispute.id || createId("dsp"),
    bookingId: dispute.bookingId != null ? dispute.bookingId : "",
    customerId: dispute.customerId ?? null,
    providerId: dispute.providerId ?? null,
    ticket: String(dispute.ticket || "").trim() || "DSP-0000",
    customerName:
      String(dispute.customerName || dispute.customer || "").trim() || "Customer",
    customer:
      String(dispute.customerName || dispute.customer || "").trim() || "Customer",
    customerEmail: normalizeEmail(dispute.customerEmail || ""),
    providerName:
      String(dispute.providerName || dispute.provider || "").trim() || "Provider",
    provider:
      String(dispute.providerName || dispute.provider || "").trim() || "Provider",
    providerEmail: normalizeEmail(dispute.providerEmail || ""),
    serviceCategory: String(dispute.serviceCategory || dispute.category || "").trim(),
    serviceSubcategory:
      String(dispute.serviceSubcategory || dispute.subcategory || "").trim(),
    bookingAmount: Number(dispute.bookingAmount || dispute.amount || 0),
    bookingDate: String(dispute.bookingDate || "").trim(),
    bookingTimeSlot: String(dispute.bookingTimeSlot || dispute.timeSlot || "").trim(),
    issueDescription:
      String(dispute.issueDescription || dispute.issue || "").trim() || "Not specified",
    issue:
      String(dispute.issueDescription || dispute.issue || "").trim() || "Not specified",
    providerResponse: String(dispute.providerResponse || "").trim(),
    adminNotes: String(dispute.adminNotes || "").trim(),
    status: normalizedStatus,
    tone: dispute.tone || disputeToneByStatus(normalizedStatus),
    resolvedAt:
      dispute.resolvedAt ||
      (shouldBeClosed ? dispute.updatedAt || updatedAt || new Date().toISOString() : null),
    createdAt,
    updatedAt
  };
};

const buildLegacyCustomerBookings = (bookings) =>
  ensureArray(bookings).map((booking) => ({
    title: booking.subcategory || booking.category,
    partner: booking.providerName,
    status: bookingStatusLabel(booking.status),
    tone: bookingToneByStatus(booking.status)
  }));

const findProviderIndexByIdOrName = (providerQueue, providerId) => {
  const id = String(providerId || "").trim();
  const normalizedId = id.toLowerCase();
  if (!id) return -1;

  return ensureArray(providerQueue).findIndex((provider) => {
    const providerName = String(provider.name || "").trim().toLowerCase();
    const providerEmail = normalizeEmail(provider.email || "");
    return provider.id === id || providerName === normalizedId || providerEmail === normalizedId;
  });
};

const defaultData = {
  customerProfile: {
    name: "",
    email: "",
    phone: "",
    location: ""
  },
  providerProfile: {
    displayName: "",
    category: "Home Service",
    radius: "10 km",
    availability: DEFAULT_PROVIDER_AVAILABILITY
  },
  providerOnline: false,
  providerSlotOptions: SLOT_OPTIONS,
  providerSelectedSlots: [],
  providerSettings: {},
  providerQueue: [],
  providerProfiles: [],
  providerServiceCatalog: [],
  bookings: [],
  bookingMessages: {},
  customerBookings: [],
  userVerificationQueue: [],
  disputeQueue: [],
  adminProviderChat: [],
  customerProviderChat: [],
  reviews: [],
  adminSettings: {
    autoApproveCustomers: "Enabled",
    verificationSla: "24 hours",
    disputeSla: "48 hours",
    incidentEmail: "admin@fixitnow.com"
  },
  serviceCategories: SERVICE_CATEGORIES
};

const withDerivedData = (incomingData) => {
  const baseData = {
    ...defaultData,
    ...incomingData
  };

  const providerQueue = dedupeBy(
    ensureArray(baseData.providerQueue).map((provider) => buildProviderQueueEntry(provider)),
    providerIdentityKey
  );

  const providerSettingsInput =
    baseData.providerSettings && typeof baseData.providerSettings === "object"
      ? baseData.providerSettings
      : {};

  const providerSettings = {};
  providerQueue.forEach((provider) => {
    providerSettings[provider.email] = buildDefaultProviderSetting({
      ...(providerSettingsInput[provider.email] || {}),
      displayName: providerSettingsInput[provider.email]?.displayName || provider.name,
      category: providerSettingsInput[provider.email]?.category || provider.serviceType,
      location:
        providerSettingsInput[provider.email]?.location || provider.area || provider.address,
      selectedSlots:
        providerSettingsInput[provider.email]?.selectedSlots || provider.selectedSlots || []
    });
  });

  const normalizedProviderQueue = providerQueue.map((provider) => {
    const setting = providerSettings[provider.email];
    return buildProviderQueueEntry({
      ...provider,
      name: setting?.displayName || provider.name,
      serviceType: setting?.category || provider.serviceType,
      area: setting?.location || provider.area,
      address: setting?.location || provider.address,
      selectedSlots: setting?.selectedSlots || provider.selectedSlots
    });
  });

  const providerByEmail = new Map(
    normalizedProviderQueue.map((provider) => [provider.email, provider])
  );

  const providerServiceCatalogInput = ensureArray(baseData.providerServiceCatalog)
    .map((service) => {
      const providerEmail = normalizeEmail(service.providerEmail || "");
      const provider = providerByEmail.get(providerEmail);
      if (!provider) return null;
      return buildProviderServiceEntry(
        {
          ...service,
          providerEmail,
          providerName: provider.name,
          providerLocation: provider.area || provider.address
        },
        provider
      );
    })
    .filter(Boolean);

  const providerServiceCatalog = dedupeBy(
    providerServiceCatalogInput,
    (service) => `${service.providerEmail}|${service.category}|${service.subcategory}`
  );

  normalizedProviderQueue.forEach((provider) => {
    const alreadyHasService = providerServiceCatalog.some(
      (service) => service.providerEmail === provider.email
    );
    if (alreadyHasService) return;

    const category = normalizeServiceCategory(provider.serviceType);
    providerServiceCatalog.push(
      buildProviderServiceEntry(
        {
          providerEmail: provider.email,
          providerName: provider.name,
          providerLocation: provider.area || provider.address,
          category,
          subcategory: SERVICE_CATEGORIES[category][0],
          price: 499,
          available: true
        },
        provider
      )
    );
  });

  const providerNameToEmail = new Map(
    normalizedProviderQueue.map((provider) => [provider.name.trim().toLowerCase(), provider.email])
  );

  const providerProfilesMap = new Map();
  ensureArray(baseData.providerProfiles).forEach((profile) => {
    const profileEmail = normalizeEmail(
      profile.providerEmail ||
      profile.email ||
      providerNameToEmail.get(String(profile.name || "").trim().toLowerCase()) ||
      ""
    );
    const provider = providerByEmail.get(profileEmail);
    if (!provider) return;

    const profileStatus = toProviderProfileVerification(provider.status);
    providerProfilesMap.set(profileEmail, {
      id: profile.id || `prv-${profileEmail || provider.id}`,
      providerEmail: profileEmail,
      name: String(profile.name || provider.name).trim() || provider.name,
      service: normalizeServiceCategory(profile.service || provider.serviceType),
      rating: Number(profile.rating || 0),
      reviews: Number(profile.reviews || 0),
      completedJobs: Number(profile.completedJobs || 0),
      verification: profileStatus.verification,
      tone: profileStatus.tone,
      location: provider.area || provider.address
    });
  });

  normalizedProviderQueue.forEach((provider) => {
    if (providerProfilesMap.has(provider.email)) return;

    const profileStatus = toProviderProfileVerification(provider.status);
    providerProfilesMap.set(provider.email, {
      id: `prv-${provider.email || provider.id}`,
      providerEmail: provider.email,
      name: provider.name,
      service: normalizeServiceCategory(provider.serviceType),
      rating: 0,
      reviews: 0,
      completedJobs: 0,
      verification: profileStatus.verification,
      tone: profileStatus.tone,
      location: provider.area || provider.address
    });
  });

  const providerProfiles = Array.from(providerProfilesMap.values());
  const userVerificationQueue = mergeVerificationQueue(
    baseData.userVerificationQueue,
    normalizedProviderQueue
  );

  const bookings = dedupeBy(
    ensureArray(baseData.bookings)
      .map((booking) => {
        const providerEmail =
          normalizeEmail(booking.providerEmail || "") ||
          normalizeEmail(
            providerNameToEmail.get(String(booking.providerName || "").trim().toLowerCase()) || ""
          );
        const provider = providerByEmail.get(providerEmail);
        if (!provider) return null;

        return buildBookingEntry({
          ...booking,
          providerEmail,
          providerName: provider.name,
          providerLocation: provider.area || provider.address
        });
      })
      .filter(Boolean),
    (booking) => booking.id
  );

  const bookingIds = new Set(bookings.map((booking) => booking.id));
  const bookingMessagesInput =
    baseData.bookingMessages && typeof baseData.bookingMessages === "object"
      ? baseData.bookingMessages
      : {};
  const bookingMessages = {};

  Object.entries(bookingMessagesInput).forEach(([bookingId, thread]) => {
    if (!bookingIds.has(bookingId)) return;

    const normalizedThread = ensureArray(thread)
      .map((message) => {
        const text = String(message?.text || "").trim();
        if (!text) return null;

        const messageId = message.id || createMessageId();

        return {
          id: messageId,
          from: String(message.from || "System"),
          text,
          timestamp: String(message.timestamp || ""),
          senderRole: String(message.senderRole || ""),
          senderEmail: normalizeEmail(message.senderEmail || ""),
          createdAt: normalizeMessageCreatedAt(message.createdAt, messageId)
        };
      })
      .filter(Boolean);

    bookingMessages[bookingId] = normalizedThread;
  });

  const providerSlotOptions = sanitizeSlots(baseData.providerSlotOptions);
  const normalizedSlotOptions = providerSlotOptions.length ? providerSlotOptions : SLOT_OPTIONS;

  const primaryProvider = normalizedProviderQueue[0] || null;
  const primaryProviderSetting = primaryProvider
    ? providerSettings[primaryProvider.email]
    : buildDefaultProviderSetting({
      displayName: baseData.providerProfile?.displayName,
      category: baseData.providerProfile?.category,
      radius: baseData.providerProfile?.radius,
      availability: baseData.providerProfile?.availability,
      selectedSlots: baseData.providerSelectedSlots,
      online: baseData.providerOnline
    });

  const customerProfile = {
    ...defaultData.customerProfile,
    ...(baseData.customerProfile || {})
  };

  const adminSettings = {
    ...defaultData.adminSettings,
    ...(baseData.adminSettings || {})
  };

  const disputeQueue = dedupeBy(
    ensureArray(baseData.disputeQueue)
      .map((dispute) => buildDisputeEntry(dispute))
      .sort((a, b) => {
        const left = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const right = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return right - left;
      }),
    (dispute) => String(dispute.id || "").trim()
  );

  const adminProviderChat = ensureArray(baseData.adminProviderChat)
    .map((message) => {
      const messageId = message.id || createMessageId();
      return {
        id: messageId,
        from: message.from || "System",
        text: String(message.text || "").trim(),
        timestamp: message.timestamp || "",
        createdAt: normalizeMessageCreatedAt(message.createdAt, messageId)
      };
    })
    .filter((message) => Boolean(message.text));

  const customerProviderChat = ensureArray(baseData.customerProviderChat)
    .map((message) => {
      const messageId = message.id || createMessageId();
      return {
        id: messageId,
        from: message.from || "System",
        text: String(message.text || "").trim(),
        timestamp: message.timestamp || "",
        createdAt: normalizeMessageCreatedAt(message.createdAt, messageId)
      };
    })
    .filter((message) => Boolean(message.text));

  const reviews = ensureArray(baseData.reviews).map((review) => ({
    id: review.id || createId("rev"),
    providerEmail: normalizeEmail(review.providerEmail || ""),
    customerEmail: normalizeEmail(review.customerEmail || ""),
    bookingId: String(review.bookingId || "").trim(),
    serviceId: String(review.serviceId || "").trim(),
    customerName: String(review.customerName || "Customer"),
    providerName: String(review.providerName || "").trim(),
    subcategory: String(review.subcategory || "").trim(),
    rating: Math.min(5, Math.max(0, Number(review.rating || 0))),
    text: String(review.text || "").trim(),
    createdAt: review.createdAt || new Date().toISOString()
  })).filter((r) => r.providerEmail && r.text);

  const completedJobsByProvider = {};
  bookings.forEach((booking) => {
    if (booking.status !== "Completed" && booking.status !== "Paid") return;
    if (!booking.providerEmail) return;
    completedJobsByProvider[booking.providerEmail] =
      Number(completedJobsByProvider[booking.providerEmail] || 0) + 1;
  });

  const reviewsByProvider = {};
  reviews.forEach((r) => {
    if (!reviewsByProvider[r.providerEmail]) reviewsByProvider[r.providerEmail] = [];
    reviewsByProvider[r.providerEmail].push(r);
  });

  const updatedProviderProfiles = providerProfiles.map((profile) => {
    const providerReviewList = reviewsByProvider[profile.providerEmail] || [];
    const completedJobs = Math.max(
      Number(completedJobsByProvider[profile.providerEmail] || 0),
      Number(profile.completedJobs || 0)
    );
    if (providerReviewList.length === 0) {
      return {
        ...profile,
        completedJobs
      };
    }

    const sum = providerReviewList.reduce((acc, r) => acc + r.rating, 0);
    return {
      ...profile,
      rating: sum / providerReviewList.length,
      reviews: providerReviewList.length,
      completedJobs
    };
  });

  return {
    ...baseData,
    customerProfile,
    adminSettings,
    providerQueue: normalizedProviderQueue,
    providerSettings,
    providerProfiles: updatedProviderProfiles,
    providerServiceCatalog,
    userVerificationQueue,
    bookings,
    bookingMessages,
    reviews,
    customerBookings: buildLegacyCustomerBookings(bookings),
    providerSlotOptions: normalizedSlotOptions,
    providerProfile: {
      displayName: primaryProviderSetting.displayName,
      category: primaryProviderSetting.category,
      radius: primaryProviderSetting.radius,
      availability: primaryProviderSetting.availability
    },
    providerSelectedSlots: primaryProviderSetting.selectedSlots,
    providerOnline: Boolean(primaryProviderSetting.online),
    disputeQueue,
    adminProviderChat,
    customerProviderChat,
    serviceCategories: SERVICE_CATEGORIES
  };
};

const mergeWithDefaults = (raw) => {
  let parsed = {};
  try {
    parsed = raw ? JSON.parse(raw) : {};
  } catch {
    parsed = {};
  }

  const providerEmailSet = getRegisteredProviderEmailSet();
  const localProviderAccounts = getLocalAccounts().filter(
    (account) => resolveRole(account?.role) === "PROVIDER"
  );

  const providerQueue = dedupeBy(
    ensureArray(parsed.providerQueue)
      .map((provider) => buildProviderQueueEntry(provider))
      .filter((provider) => provider.email && providerEmailSet.has(provider.email)),
    providerIdentityKey
  );

  const providerSettings = {};
  const parsedProviderSettings =
    parsed.providerSettings && typeof parsed.providerSettings === "object"
      ? parsed.providerSettings
      : {};

  providerQueue.forEach((provider) => {
    providerSettings[provider.email] = buildDefaultProviderSetting({
      ...(parsedProviderSettings[provider.email] || {}),
      displayName: provider.name,
      category: provider.serviceType,
      selectedSlots:
        parsedProviderSettings[provider.email]?.selectedSlots ||
        provider.selectedSlots ||
        parsed.providerSelectedSlots,
      location: provider.area || provider.address
    });
  });

  localProviderAccounts.forEach((account) => {
    const providerEmail = normalizeEmail(account.email || "");
    if (!providerEmail) return;

    const exists = providerQueue.some((provider) => provider.email === providerEmail);
    if (exists) return;

    const generatedEntry = buildProviderQueueEntry({
      name: account.name || providerEmail.split("@")[0],
      email: providerEmail,
      phone: account.phone || "",
      area: account.address || "Not specified",
      address: account.address || "Not specified",
      serviceType: account.serviceType || "Home Service",
      idProofType: account.idProofType || "Not provided",
      idProofDocumentName: account.idProofDocumentName || "Not provided",
      status: "PENDING",
      selectedSlots: providerSettings[providerEmail]?.selectedSlots || []
    });

    providerQueue.push(generatedEntry);
    providerSettings[providerEmail] = buildDefaultProviderSetting({
      ...(providerSettings[providerEmail] || {}),
      displayName: generatedEntry.name,
      category: generatedEntry.serviceType,
      selectedSlots: generatedEntry.selectedSlots,
      location: generatedEntry.area || generatedEntry.address
    });
  });

  const parsedBookings = ensureArray(parsed.bookings);
  const parsedServiceCatalog = ensureArray(parsed.providerServiceCatalog);
  const parsedProviderProfiles = ensureArray(parsed.providerProfiles);

  const legacyBookingsFromOldShape = ensureArray(parsed.customerBookings)
    .map((booking) => {
      const providerMatch = providerQueue.find(
        (provider) =>
          provider.name.trim().toLowerCase() === String(booking.partner || "").trim().toLowerCase()
      );
      if (!providerMatch) return null;

      return buildBookingEntry({
        customerName: parsed.customerProfile?.name || "Customer",
        customerEmail: parsed.customerProfile?.email || "",
        customerLocation: parsed.customerProfile?.location || "",
        providerName: providerMatch.name,
        providerEmail: providerMatch.email,
        providerLocation: providerMatch.area || providerMatch.address,
        category: providerMatch.serviceType,
        subcategory: booking.title || providerMatch.serviceType,
        status: booking.status || "PENDING"
      });
    })
    .filter(Boolean);

  return withDerivedData({
    ...defaultData,
    ...parsed,
    providerQueue,
    providerSettings,
    bookings: parsedBookings.length ? parsedBookings : legacyBookingsFromOldShape,
    providerServiceCatalog: parsedServiceCatalog,
    providerProfiles: parsedProviderProfiles
  });
};

const AppDataContext = createContext(null);

export const AppDataProvider = ({ children }) => {
  const [portalData, setPortalData] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return mergeWithDefaults(raw);
    } catch {
      return withDerivedData(defaultData);
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(portalData));
  }, [portalData]);

  const hasSyncedRef = useRef(false);
  useEffect(() => {
    if (hasSyncedRef.current) return;
    hasSyncedRef.current = true;

    const token = localStorage.getItem("token");
    if (!token) return;

    const syncFromBackend = async () => {
      try {
        const [servicesRes, categoriesRes, bookingsRes] = await Promise.allSettled([
          API.get("/services"),
          API.get("/categories"),
          API.get("/customer/bookings")
        ]);

        const backendServices =
          servicesRes.status === "fulfilled"
            ? servicesRes.value?.data?.data?.content || servicesRes.value?.data?.content || []
            : [];

        const backendCategories =
          categoriesRes.status === "fulfilled"
            ? categoriesRes.value?.data?.data || categoriesRes.value?.data || []
            : [];

        const backendBookings =
          bookingsRes.status === "fulfilled"
            ? backendBookingsFromResponse(bookingsRes.value?.data?.data || bookingsRes.value?.data || [])
            : [];

        const categoryMap = {};
        (Array.isArray(backendCategories) ? backendCategories : []).forEach((cat) => {
          const subs = (cat.subcategories || []).map((sub) => sub.name);
          if (subs.length) categoryMap[cat.name] = subs;
        });

        const providerMap = new Map();
        const serviceCatalog = [];
        (Array.isArray(backendServices) ? backendServices : []).forEach((svc) => {
          const providerEmail = `provider-${svc.providerId}@fixitnow.local`;
          if (!providerMap.has(providerEmail)) {
            providerMap.set(providerEmail, {
              id: `pq-backend-${svc.providerId}`,
              name: svc.providerName || "Provider",
              email: providerEmail,
              phone: "",
              area: svc.location || "Not specified",
              address: svc.location || "Not specified",
              serviceType: svc.category || "Home Service",
              idProofType: "Verified",
              idProofDocumentName: "Backend Verified",
              status: "APPROVED",
              selectedSlots: SLOT_OPTIONS.slice(0, 4)
            });
          }

          serviceCatalog.push({
            id: `svc-backend-${svc.id}`,
            backendId: svc.id,
            providerEmail,
            providerName: svc.providerName || "Provider",
            providerLocation: svc.location || "",
            category: svc.category || "Home Service",
            subcategory: svc.subcategory || "General Service",
            description: svc.description || "",
            price: Number(svc.price) || 499,
            available: true,
            availability: svc.availability || "Mon-Sat 9AM-6PM",
            averageRating: Number(svc.averageRating) || 0,
            reviewCount: Number(svc.reviewCount) || 0,
            durationMinutes: Number(svc.durationMinutes) || 0,
            latitude: svc.latitude,
            longitude: svc.longitude,
            createdAt: svc.createdAt || new Date().toISOString()
          });
        });

        const backendProviderQueue = Array.from(providerMap.values());
        const backendProviderSettings = {};
        backendProviderQueue.forEach((p) => {
          backendProviderSettings[p.email] = {
            displayName: p.name,
            category: p.serviceType,
            radius: "10 km",
            availability: DEFAULT_PROVIDER_AVAILABILITY,
            selectedSlots: p.selectedSlots || [],
            online: true,
            location: p.area || p.address
          };
        });

        const backendProviderProfiles = backendProviderQueue.map((p) => ({
          id: `prv-${p.email}`,
          providerEmail: p.email,
          name: p.name,
          category: p.serviceType,
          location: p.area,
          rating: 0,
          reviews: 0,
          completedJobs: 0,
          verification: "Verified",
          tone: "ok"
        }));

        setPortalData((prev) => {
          const existingProviderEmails = new Set(
            prev.providerQueue.map((p) => normalizeEmail(p.email))
          );
          const existingServiceKeys = new Set(
            prev.providerServiceCatalog.map(
              (s) => `${normalizeEmail(s.providerEmail)}|${s.category}|${s.subcategory}`
            )
          );
          const existingBookingIds = new Set(
            prev.bookings.map((b) => String(b.id))
          );

          const newProviders = backendProviderQueue.filter(
            (p) => !existingProviderEmails.has(normalizeEmail(p.email))
          );
          const newServices = serviceCatalog.filter(
            (s) =>
              !existingServiceKeys.has(
                `${normalizeEmail(s.providerEmail)}|${s.category}|${s.subcategory}`
              )
          );
          const newBookings = backendBookings.filter(
            (b) => !existingBookingIds.has(String(b.id))
          );

          const mergedCategories = { ...SERVICE_CATEGORIES };
          Object.entries(categoryMap).forEach(([catName, subs]) => {
            if (!mergedCategories[catName]) {
              mergedCategories[catName] = subs;
            } else {
              const existing = new Set(mergedCategories[catName]);
              subs.forEach((sub) => {
                if (!existing.has(sub)) mergedCategories[catName].push(sub);
              });
            }
          });

          const mergedProviderSettings = { ...prev.providerSettings };
          Object.entries(backendProviderSettings).forEach(([email, settings]) => {
            if (!mergedProviderSettings[email]) {
              mergedProviderSettings[email] = settings;
            }
          });

          const existingProfileEmails = new Set(
            prev.providerProfiles.map((p) => normalizeEmail(p.providerEmail))
          );
          const newProfiles = backendProviderProfiles.filter(
            (p) => !existingProfileEmails.has(normalizeEmail(p.providerEmail))
          );

          if (
            newProviders.length === 0 &&
            newServices.length === 0 &&
            newBookings.length === 0 &&
            newProfiles.length === 0
          ) {
            return prev;
          }

          return withDerivedData({
            ...prev,
            providerQueue: [...prev.providerQueue, ...newProviders],
            providerServiceCatalog: [...prev.providerServiceCatalog, ...newServices],
            providerSettings: mergedProviderSettings,
            providerProfiles: [...prev.providerProfiles, ...newProfiles],
            bookings: [...prev.bookings, ...newBookings],
            serviceCategories: mergedCategories
          });
        });
      } catch (err) {
        console.warn("[AppDataContext] Backend sync skipped:", err?.message || err);
      }
    };

    const backendBookingsFromResponse = (data) => {
      const bookingsList = Array.isArray(data)
        ? data
        : data?.content || [];
      return bookingsList.map((b) => ({
        id: `bk-backend-${b.id}`,
        backendId: b.id,
        customerName: b.customerName || "Customer",
        customerEmail: normalizeEmail(b.customerEmail || ""),
        providerName: b.providerName || "Provider",
        providerEmail: `provider-${b.providerId}@fixitnow.local`,
        category: b.serviceCategory || b.category || "",
        subcategory: b.serviceSubcategory || b.subcategory || "",
        price: Number(b.price || b.amount || 0),
        bookingDate: b.bookingDate || "",
        selectedSlot: b.timeSlot || "",
        status: b.status || "PENDING",
        createdAt: b.createdAt || new Date().toISOString()
      }));
    };

    syncFromBackend();
  }, []);

  const value = useMemo(() => {
    const resolveProviderEmail = (providerEmail, sourceData) => {
      const normalized = normalizeEmail(providerEmail || "");
      if (normalized) return normalized;
      return normalizeEmail(sourceData.providerQueue?.[0]?.email || "");
    };

    const saveCustomerProfile = (profile) => {
      setPortalData((prev) =>
        withDerivedData({
          ...prev,
          customerProfile: {
            ...prev.customerProfile,
            ...profile
          }
        })
      );
    };

    const resetCustomerProfile = () => {
      setPortalData((prev) =>
        withDerivedData({
          ...prev,
          customerProfile: { ...defaultData.customerProfile }
        })
      );
    };

    const saveProviderProfile = (profile, providerEmail) => {
      setPortalData((prev) => {
        const resolvedProviderEmail = resolveProviderEmail(providerEmail, prev);
        if (!resolvedProviderEmail) return prev;

        const provider = prev.providerQueue.find((entry) => entry.email === resolvedProviderEmail);
        if (!provider) return prev;

        const currentSetting =
          prev.providerSettings[resolvedProviderEmail] ||
          buildDefaultProviderSetting({
            displayName: provider.name,
            category: provider.serviceType,
            location: provider.area || provider.address,
            selectedSlots: provider.selectedSlots
          });

        return withDerivedData({
          ...prev,
          providerSettings: {
            ...prev.providerSettings,
            [resolvedProviderEmail]: buildDefaultProviderSetting({
              ...currentSetting,
              ...profile
            })
          }
        });
      });
    };

    const setProviderOnline = (isOnline, providerEmail) => {
      setPortalData((prev) => {
        const resolvedProviderEmail = resolveProviderEmail(providerEmail, prev);
        if (!resolvedProviderEmail) return prev;
        const provider = prev.providerQueue.find((entry) => entry.email === resolvedProviderEmail);
        if (!provider) return prev;

        const currentSetting =
          prev.providerSettings[resolvedProviderEmail] ||
          buildDefaultProviderSetting({
            displayName: provider.name,
            category: provider.serviceType,
            location: provider.area || provider.address,
            selectedSlots: provider.selectedSlots
          });

        return withDerivedData({
          ...prev,
          providerSettings: {
            ...prev.providerSettings,
            [resolvedProviderEmail]: buildDefaultProviderSetting({
              ...currentSetting,
              online: Boolean(isOnline)
            })
          }
        });
      });
    };

    const saveProviderSelectedSlots = (slots, providerEmail) => {
      setPortalData((prev) => {
        const resolvedProviderEmail = resolveProviderEmail(providerEmail, prev);
        if (!resolvedProviderEmail) return prev;
        const provider = prev.providerQueue.find((entry) => entry.email === resolvedProviderEmail);
        if (!provider) return prev;

        const currentSetting =
          prev.providerSettings[resolvedProviderEmail] ||
          buildDefaultProviderSetting({
            displayName: provider.name,
            category: provider.serviceType,
            location: provider.area || provider.address,
            selectedSlots: provider.selectedSlots
          });

        return withDerivedData({
          ...prev,
          providerSettings: {
            ...prev.providerSettings,
            [resolvedProviderEmail]: buildDefaultProviderSetting({
              ...currentSetting,
              selectedSlots: sanitizeSlots(slots)
            })
          }
        });
      });
    };

    const saveProviderServices = (providerEmail, services) => {
      setPortalData((prev) => {
        const resolvedProviderEmail = resolveProviderEmail(providerEmail, prev);
        if (!resolvedProviderEmail) return prev;
        const provider = prev.providerQueue.find((entry) => entry.email === resolvedProviderEmail);
        if (!provider) return prev;

        const normalizedServices = dedupeBy(
          ensureArray(services).map((service) =>
            buildProviderServiceEntry(
              {
                ...service,
                providerEmail: resolvedProviderEmail
              },
              provider
            )
          ),
          (service) => `${service.providerEmail}|${service.category}|${service.subcategory}`
        );

        const withoutCurrentProvider = prev.providerServiceCatalog.filter(
          (service) => service.providerEmail !== resolvedProviderEmail
        );

        const primaryCategory =
          normalizedServices[0]?.category || normalizeServiceCategory(provider.serviceType);
        const currentSetting =
          prev.providerSettings[resolvedProviderEmail] ||
          buildDefaultProviderSetting({
            displayName: provider.name,
            category: provider.serviceType,
            location: provider.area || provider.address,
            selectedSlots: provider.selectedSlots
          });

        return withDerivedData({
          ...prev,
          providerServiceCatalog: [...withoutCurrentProvider, ...normalizedServices],
          providerSettings: {
            ...prev.providerSettings,
            [resolvedProviderEmail]: buildDefaultProviderSetting({
              ...currentSetting,
              category: primaryCategory
            })
          }
        });
      });
    };

    const upsertProviderService = (providerEmail, service) => {
      setPortalData((prev) => {
        const resolvedProviderEmail = resolveProviderEmail(providerEmail, prev);
        if (!resolvedProviderEmail) return prev;
        const provider = prev.providerQueue.find((entry) => entry.email === resolvedProviderEmail);
        if (!provider) return prev;

        const normalizedService = buildProviderServiceEntry(
          {
            ...service,
            providerEmail: resolvedProviderEmail
          },
          provider
        );

        const withoutDuplicate = prev.providerServiceCatalog.filter(
          (entry) =>
            !(
              entry.providerEmail === resolvedProviderEmail &&
              entry.category === normalizedService.category &&
              entry.subcategory === normalizedService.subcategory
            )
        );

        return withDerivedData({
          ...prev,
          providerServiceCatalog: [...withoutDuplicate, normalizedService]
        });
      });
    };

    const saveAdminSettings = (settings) => {
      setPortalData((prev) =>
        withDerivedData({
          ...prev,
          adminSettings: {
            ...prev.adminSettings,
            ...settings
          }
        })
      );
    };

    const submitProviderVerification = (providerDetails) => {
      const providerEmail = normalizeEmail(providerDetails?.email || "");
      if (!providerEmail) return;

      setPortalData((prev) => {
        const nextEntry = buildProviderQueueEntry({
          ...providerDetails,
          email: providerEmail,
          area: providerDetails?.area || providerDetails?.address || "",
          address: providerDetails?.address || providerDetails?.area || "",
          serviceType: providerDetails?.serviceType || providerDetails?.category,
          selectedSlots: providerDetails?.selectedSlots || providerDetails?.availabilitySlots,
          status: "PENDING",
          submittedAt: new Date().toISOString()
        });

        const nextQueue = [...prev.providerQueue];
        const existingIndex = nextQueue.findIndex((provider) => {
          if (provider.email && providerEmail) return provider.email === providerEmail;
          return (
            String(provider.name || "").trim().toLowerCase() ===
            String(nextEntry.name || "").trim().toLowerCase()
          );
        });

        if (existingIndex === -1) {
          nextQueue.unshift(nextEntry);
        } else {
          const existing = nextQueue[existingIndex];
          nextQueue[existingIndex] = {
            ...existing,
            ...nextEntry,
            id: existing.id,
            status: "PENDING",
            docs: toProviderDocsLabel("PENDING"),
            tone: toProviderTone("PENDING"),
            submittedAt: new Date().toISOString()
          };
        }

        const settingBase =
          prev.providerSettings[providerEmail] ||
          buildDefaultProviderSetting({
            displayName: nextEntry.name,
            category: nextEntry.serviceType,
            location: nextEntry.area || nextEntry.address,
            selectedSlots: nextEntry.selectedSlots
          });

        const nextProviderSettings = {
          ...prev.providerSettings,
          [providerEmail]: buildDefaultProviderSetting({
            ...settingBase,
            displayName: nextEntry.name,
            category: nextEntry.serviceType,
            location: nextEntry.area || nextEntry.address,
            selectedSlots: nextEntry.selectedSlots
          })
        };

        const hasServices = prev.providerServiceCatalog.some(
          (service) => service.providerEmail === providerEmail
        );
        let nextServiceCatalog = prev.providerServiceCatalog;

        if (!hasServices) {
          const defaultCategory = normalizeServiceCategory(nextEntry.serviceType);
          nextServiceCatalog = [
            ...prev.providerServiceCatalog,
            buildProviderServiceEntry(
              {
                providerEmail,
                providerName: nextEntry.name,
                providerLocation: nextEntry.area || nextEntry.address,
                category: defaultCategory,
                subcategory: SERVICE_CATEGORIES[defaultCategory][0],
                price: 499,
                available: true
              },
              nextEntry
            )
          ];
        }

        return withDerivedData({
          ...prev,
          providerQueue: dedupeBy(nextQueue, providerIdentityKey),
          providerSettings: nextProviderSettings,
          providerServiceCatalog: nextServiceCatalog
        });
      });
    };

    const approveProvider = (providerId) => {
      setPortalData((prev) => {
        const targetIndex = findProviderIndexByIdOrName(prev.providerQueue, providerId);
        if (targetIndex === -1) return prev;

        const providerQueue = prev.providerQueue.map((provider, index) => {
          if (index !== targetIndex) return buildProviderQueueEntry(provider);
          return buildProviderQueueEntry({
            ...provider,
            status: "APPROVED",
            docs: toProviderDocsLabel("APPROVED"),
            tone: toProviderTone("APPROVED")
          });
        });

        return withDerivedData({
          ...prev,
          providerQueue
        });
      });
    };

    const holdProvider = (providerId) => {
      setPortalData((prev) => {
        const targetIndex = findProviderIndexByIdOrName(prev.providerQueue, providerId);
        if (targetIndex === -1) return prev;

        const providerQueue = prev.providerQueue.map((provider, index) => {
          if (index !== targetIndex) return buildProviderQueueEntry(provider);
          return buildProviderQueueEntry({
            ...provider,
            status: "ON_HOLD",
            docs: toProviderDocsLabel("ON_HOLD"),
            tone: toProviderTone("ON_HOLD")
          });
        });

        return withDerivedData({
          ...prev,
          providerQueue
        });
      });
    };

    const getProviderAccessStatus = (email) => {
      const normalized = normalizeEmail(email || "");
      if (!normalized) {
        return { provider: null, status: "NOT_FOUND", isApproved: false };
      }

      const provider =
        portalData.providerQueue.find((entry) => normalizeEmail(entry.email) === normalized) ||
        null;
      if (!provider) {
        return { provider: null, status: "NOT_FOUND", isApproved: false };
      }

      return {
        provider,
        status: provider.status,
        isApproved: provider.status === "APPROVED"
      };
    };

    const updateVerificationStatus = (entryId, status, tone = "warn") => {
      setPortalData((prev) => {
        const targetEntry = prev.userVerificationQueue.find((entry) => entry.id === entryId);
        const isProviderEntry =
          String(targetEntry?.role || "").trim().toLowerCase() === "provider" ||
          String(entryId || "").startsWith("ver-provider-");

        if (!isProviderEntry) {
          const userVerificationQueue = prev.userVerificationQueue.map((entry) =>
            entry.id === entryId ? { ...entry, status, tone } : entry
          );
          return withDerivedData({
            ...prev,
            userVerificationQueue
          });
        }

        const providerStatus = statusLabelToProviderStatus(status);
        const providerEmailFromId = String(entryId || "").startsWith("ver-provider-")
          ? normalizeEmail(String(entryId).slice("ver-provider-".length))
          : "";
        const providerNameFromEntry = String(targetEntry?.name || "").trim().toLowerCase();

        const providerQueue = prev.providerQueue.map((provider) => {
          const emailMatches = providerEmailFromId && provider.email === providerEmailFromId;
          const nameMatches =
            !providerEmailFromId &&
            providerNameFromEntry &&
            provider.name.trim().toLowerCase() === providerNameFromEntry;

          if (!emailMatches && !nameMatches) {
            return buildProviderQueueEntry(provider);
          }

          return buildProviderQueueEntry({
            ...provider,
            status: providerStatus,
            docs: toProviderDocsLabel(providerStatus),
            tone: toProviderTone(providerStatus)
          });
        });

        return withDerivedData({
          ...prev,
          providerQueue
        });
      });
    };

    const raiseDispute = (payload = {}) => {
      const issueDescription = String(payload.issueDescription || payload.issue || "").trim();
      if (!issueDescription) return null;

      const bookingKey = String(payload.bookingId ?? "").trim();
      const nowIso = new Date().toISOString();
      let created = null;

      setPortalData((prev) => {
        const duplicateActiveDispute = prev.disputeQueue.find((dispute) => {
          const existingBookingKey = String(dispute.bookingId ?? "").trim();
          if (!bookingKey || existingBookingKey !== bookingKey) return false;
          return !isClosedDisputeStatus(dispute.status);
        });

        if (duplicateActiveDispute) {
          created = duplicateActiveDispute;
          return prev;
        }

        const disputeEntry = buildDisputeEntry({
          id: payload.id,
          bookingId: payload.bookingId,
          customerId: payload.customerId,
          customerName: payload.customerName,
          customerEmail: payload.customerEmail,
          providerId: payload.providerId,
          providerName: payload.providerName,
          providerEmail: payload.providerEmail,
          serviceCategory: payload.serviceCategory,
          serviceSubcategory: payload.serviceSubcategory,
          bookingAmount: payload.bookingAmount,
          bookingDate: payload.bookingDate,
          bookingTimeSlot: payload.bookingTimeSlot,
          issueDescription,
          status: payload.status || "OPEN",
          tone: payload.tone || disputeToneByStatus(payload.status || "OPEN"),
          createdAt: payload.createdAt || nowIso,
          updatedAt: payload.updatedAt || nowIso
        });

        created = disputeEntry;
        return withDerivedData({
          ...prev,
          disputeQueue: [disputeEntry, ...prev.disputeQueue]
        });
      });

      return created;
    };

    const updateDisputeStatus = (disputeId, status, tone = "", adminNotes = "") => {
      const normalizedStatus = normalizeDisputeStatus(status);
      const nowIso = new Date().toISOString();

      setPortalData((prev) =>
        withDerivedData({
          ...prev,
          disputeQueue: prev.disputeQueue.map((dispute) => {
            if (dispute.id !== disputeId) return dispute;
            const resolvedAt = isClosedDisputeStatus(normalizedStatus)
              ? dispute.resolvedAt || nowIso
              : null;
            return {
              ...dispute,
              status: normalizedStatus,
              tone: tone || disputeToneByStatus(normalizedStatus),
              adminNotes: String(adminNotes || dispute.adminNotes || "").trim(),
              resolvedAt,
              updatedAt: nowIso
            };
          })
        })
      );
    };

    const addAdminProviderMessage = (message) => {
      const text = String(message?.text || "").trim();
      if (!text) return;

      const createdAt = new Date().toISOString();
      const timestamp = new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit"
      });

      setPortalData((prev) =>
        withDerivedData({
          ...prev,
          adminProviderChat: [
            ...prev.adminProviderChat,
            {
              id: createMessageId(),
              from: message.from || "System",
              text,
              timestamp,
              createdAt
            }
          ]
        })
      );
    };

    const addCustomerProviderMessage = (message) => {
      const text = String(message?.text || "").trim();
      if (!text) return;

      const createdAt = new Date().toISOString();
      const timestamp = new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit"
      });

      setPortalData((prev) =>
        withDerivedData({
          ...prev,
          customerProviderChat: [
            ...prev.customerProviderChat,
            {
              id: createMessageId(),
              from: message.from || "System",
              text,
              timestamp,
              createdAt
            }
          ]
        })
      );
    };

    const createBookingRequest = (bookingDetails) => {
      setPortalData((prev) => {
        const providerEmail = normalizeEmail(bookingDetails?.providerEmail || "");
        if (!providerEmail) return prev;

        const provider = prev.providerQueue.find((entry) => entry.email === providerEmail);
        if (!provider || provider.status !== "APPROVED") return prev;

        const category = normalizeServiceCategory(
          bookingDetails?.category || bookingDetails?.serviceType || provider.serviceType
        );
        const subcategory = normalizeServiceSubcategory(
          category,
          bookingDetails?.subcategory || bookingDetails?.serviceName
        );
        const customerEmail = normalizeEmail(
          bookingDetails?.customerEmail || prev.customerProfile.email || ""
        );

        if (!customerEmail) return prev;

        const duplicatePendingRequest = prev.bookings.some(
          (booking) =>
            booking.customerEmail === customerEmail &&
            booking.providerEmail === providerEmail &&
            booking.category === category &&
            booking.subcategory === subcategory &&
            booking.status === "Pending"
        );

        if (duplicatePendingRequest) {
          return prev;
        }

        const booking = buildBookingEntry({
          customerName: bookingDetails?.customerName || prev.customerProfile.name || "Customer",
          customerEmail,
          customerLocation:
            bookingDetails?.customerLocation || prev.customerProfile.location || "Not specified",
          providerName: provider.name,
          providerEmail: provider.email,
          providerLocation: provider.area || provider.address,
          serviceId: bookingDetails?.serviceId,
          category,
          subcategory,
          price: bookingDetails?.price,
          bookingDate: bookingDetails?.bookingDate,
          selectedSlot: bookingDetails?.selectedSlot,
          problemDescription: bookingDetails?.problemDescription,
          status: "Pending"
        });

        return withDerivedData({
          ...prev,
          bookings: [booking, ...prev.bookings]
        });
      });
    };

    const updateBookingStatus = (bookingId, status, providerEmail) => {
      setPortalData((prev) => {
        const normalizedStatus = normalizeBookingStatus(status);
        const normalizedProviderEmail = normalizeEmail(providerEmail || "");

        let statusChanged = false;
        const bookings = prev.bookings.map((booking) => {
          if (booking.id !== bookingId) return booking;
          if (normalizedProviderEmail && booking.providerEmail !== normalizedProviderEmail) {
            return booking;
          }
          if (normalizedStatus === "Completed" && !normalizedProviderEmail) {
            return booking;
          }

          if (booking.status === normalizedStatus) return booking;

          statusChanged = true;
          return {
            ...booking,
            status: normalizedStatus,
            tone: bookingToneByStatus(normalizedStatus),
            updatedAt: new Date().toISOString()
          };
        });

        if (!statusChanged) return prev;

        let statusText = "";
        if (normalizedStatus === "Confirmed") {
          statusText = "Booking confirmed. Chat is now enabled for this booking.";
        } else if (normalizedStatus === "Completed") {
          statusText = "Service marked as completed by provider. Please submit your rating and review.";
        } else if (normalizedStatus === "Paid") {
          statusText = "Payment completed. Amount has been credited to provider wallet.";
        } else if (normalizedStatus === "Cancelled") {
          statusText = normalizedProviderEmail
            ? "Booking was cancelled by provider."
            : "Booking was cancelled.";
        }

        const existingThread = ensureArray(prev.bookingMessages[bookingId]);
        let bookingMessages = prev.bookingMessages;
        if (statusText) {
          const lastMessage = existingThread[existingThread.length - 1];
          const shouldAppend = String(lastMessage?.text || "").trim() !== statusText;
          if (shouldAppend) {
            bookingMessages = {
              ...prev.bookingMessages,
              [bookingId]: [
                ...existingThread,
                {
                  id: createMessageId(),
                  from: "System",
                  text: statusText,
                  timestamp: new Date().toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit"
                  }),
                  createdAt: new Date().toISOString(),
                  senderRole: "SYSTEM",
                  senderEmail: ""
                }
              ]
            };
          }
        }

        return withDerivedData({
          ...prev,
          bookings,
          bookingMessages
        });
      });
    };

    const addBookingMessage = (message) => {
      const bookingId = String(message?.bookingId || "").trim();
      const text = String(message?.text || "").trim();
      if (!bookingId || !text) return;

      setPortalData((prev) => {
        const booking = prev.bookings.find((entry) => entry.id === bookingId);
        if (!booking) return prev;
        if (booking.status !== "Confirmed") return prev;

        const createdAt = new Date().toISOString();
        const timestamp = new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit"
        });

        const nextThread = [
          ...ensureArray(prev.bookingMessages[bookingId]),
          {
            id: createMessageId(),
            from: message.from || "User",
            text,
            timestamp,
            createdAt,
            senderRole: String(message.senderRole || ""),
            senderEmail: normalizeEmail(message.senderEmail || "")
          }
        ];

        return withDerivedData({
          ...prev,
          bookingMessages: {
            ...prev.bookingMessages,
            [bookingId]: nextThread
          }
        });
      });
    };

    const addBooking = (booking) => {
      setPortalData((prev) => {
        const providerName = String(booking?.partner || booking?.provider || "")
          .trim()
          .toLowerCase();
        const provider = prev.providerQueue.find(
          (entry) => entry.name.trim().toLowerCase() === providerName
        );
        if (!provider) return prev;

        const normalizedBooking = buildBookingEntry({
          customerName: prev.customerProfile.name || "Customer",
          customerEmail: prev.customerProfile.email || "",
          customerLocation: prev.customerProfile.location || "",
          providerName: provider.name,
          providerEmail: provider.email,
          providerLocation: provider.area || provider.address,
          category: booking?.category || provider.serviceType,
          subcategory: booking?.title || booking?.serviceName || provider.serviceType,
          price: booking?.price || 0,
          status: booking?.status || "Pending"
        });

        return withDerivedData({
          ...prev,
          bookings: [normalizedBooking, ...prev.bookings]
        });
      });
    };

    const addReview = (review) => {
      const providerEmail = normalizeEmail(review?.providerEmail || "");
      const customerEmail = normalizeEmail(review?.customerEmail || "");
      if (!providerEmail || !customerEmail) return;
      if (!review?.text?.trim()) return;
      const requestedBookingId = String(review?.bookingId || "").trim();
      const requestedServiceId = String(review?.serviceId || "").trim();
      const rating = Math.min(5, Math.max(1, Number(review.rating || 0)));
      if (!rating) return;

      setPortalData((prev) => {
        const completedBookings = prev.bookings.filter((booking) => {
          if (booking.status !== "Completed") return false;
          if (booking.providerEmail !== providerEmail) return false;
          if (booking.customerEmail !== customerEmail) return false;
          if (requestedBookingId && booking.id !== requestedBookingId) return false;
          if (requestedServiceId && String(booking.serviceId || "") !== requestedServiceId) {
            return false;
          }
          return true;
        });
        if (!completedBookings.length) return prev;

        const bookedReviewIds = new Set(
          prev.reviews
            .map((entry) => String(entry.bookingId || "").trim())
            .filter(Boolean)
        );

        const targetBooking =
          completedBookings.find((booking) => !bookedReviewIds.has(booking.id)) || null;
        if (!targetBooking) return prev;

        const alreadyReviewedByLegacyRule = prev.reviews.some((entry) => {
          if (entry.providerEmail !== providerEmail || entry.customerEmail !== customerEmail) {
            return false;
          }
          if (!entry.bookingId && !requestedServiceId) return true;
          if (!entry.bookingId && requestedServiceId) {
            return String(entry.serviceId || "") === requestedServiceId;
          }
          return false;
        });
        if (alreadyReviewedByLegacyRule) return prev;

        return withDerivedData({
          ...prev,
          reviews: [
            ...prev.reviews,
            {
              id: createId("rev"),
              bookingId: targetBooking.id,
              serviceId: String(targetBooking.serviceId || requestedServiceId || ""),
              providerEmail,
              customerEmail,
              customerName: String(review.customerName || "Customer"),
              providerName: String(targetBooking.providerName || review.providerName || ""),
              subcategory: String(targetBooking.subcategory || review.subcategory || ""),
              rating,
              text: review.text.trim(),
              createdAt: new Date().toISOString()
            }
          ]
        });
      });
    };

    return {
      portalData,
      saveCustomerProfile,
      resetCustomerProfile,
      saveProviderProfile,
      setProviderOnline,
      saveProviderSelectedSlots,
      saveProviderServices,
      upsertProviderService,
      saveAdminSettings,
      submitProviderVerification,
      approveProvider,
      holdProvider,
      getProviderAccessStatus,
      updateVerificationStatus,
      raiseDispute,
      updateDisputeStatus,
      addAdminProviderMessage,
      addCustomerProviderMessage,
      createBookingRequest,
      updateBookingStatus,
      addBookingMessage,
      addBooking,
      addReview,
      bookingStatusLabel
    };
  }, [portalData]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider");
  }
  return context;
};
