import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { dataStore } from "../services/store";
import { aiApi } from "../services/api";
import "./AIChatbot.css";

const PAGE_CONFIGS = {
  "/": {
    key: "landing",
    title: "Landing & Overview",
    scope: "Platform features, 20% water conservation benefits, ROI savings calculator, portals explanation, and community onboarding.",
    allowedTopics: ["features", "calculator", "savings", "about", "register", "login", "portals", "overview", "tariffs", "smart meter", "society onboarding", "pricing"],
    suggestions: [
      "How does DROP help save 20%+ water?",
      "How does the Volumetric Slab engine work?",
      "How can a new society register on DROP?",
    ],
  },
  "/login": {
    key: "login",
    title: "Sign In Portal",
    scope: "Account access, signing in as Society Admin vs Resident, credentials recovery, and login troubleshooting.",
    allowedTopics: ["login", "sign in", "password", "username", "credentials", "admin access", "resident access", "roles"],
    suggestions: [
      "How do I sign in as Resident vs Admin?",
      "What should I do if I forgot my password?",
      "How can my community get registered?",
    ],
  },
  "/register": {
    key: "register",
    title: "Community Registration",
    scope: "Registering a new apartment community or society, configuring initial blocks and sub-meters.",
    allowedTopics: ["register", "sign up", "community", "society", "setup", "apartments", "pricing plans", "onboarding"],
    suggestions: [
      "What details are required to register a society?",
      "How are smart sub-meters mapped during registration?",
      "Can I switch tariff plans after registration?",
    ],
  },
  "/admin/dashboard": {
    key: "admin-dashboard",
    title: "Society Overview & Telemetry",
    scope: "Live society metrics: total registered flats, occupancy rate, total invoiced & collected revenue, active leak alerts, and bulk tanker logistics.",
    allowedTopics: ["overview", "summary", "stats", "kpi", "flats", "invoiced", "collected", "pending", "tankers", "leak alerts", "occupancy"],
    suggestions: [
      "Give me a summary of today's society water metrics.",
      "How much revenue is collected vs pending?",
      "Are there any active leaks in the society?",
    ],
  },
  "/admin/households": {
    key: "admin-households",
    title: "Household Directory",
    scope: "Apartment units, block mapping, smart meter serial assignments, resident details, and occupancy status.",
    allowedTopics: ["households", "flats", "units", "blocks", "meters", "meter serial", "residents", "occupancy", "add flat", "assign meter"],
    suggestions: [
      "How many total flats are registered and occupied?",
      "Which flats currently have unassigned residents?",
      "How do I add a new flat or change meter serial?",
    ],
  },
  "/admin/readings": {
    key: "admin-readings",
    title: "Meter Readings & Telemetry",
    scope: "Water meter logs, manual reading entry, IoT smart telemetry pulse records, CSV bulk uploads, and consumption volumes.",
    allowedTopics: ["readings", "meter readings", "consumption", "liters", "kl", "iot", "manual reading", "csv upload", "log readings", "telemetry"],
    suggestions: [
      "What is the total water volume recorded across flats?",
      "How do I enter manual readings or upload CSV?",
      "Which flat logged the highest water consumption?",
    ],
  },
  "/admin/bills": {
    key: "admin-bills",
    title: "Bill Management & Invoices",
    scope: "Monthly billing generation, volumetric tiered slab calculations, due dates, outstanding dues, and mark as paid.",
    allowedTopics: ["bills", "invoices", "billing", "unpaid", "paid", "generate bills", "tariff calculation", "due date", "amount", "revenue"],
    suggestions: [
      "How many bills are currently unpaid?",
      "What is the total billing amount for this cycle?",
      "How does the progressive slab billing formula calculate dues?",
    ],
  },
  "/admin/reports": {
    key: "admin-reports",
    title: "Audits & Consumption Reports",
    scope: "Historical water consumption trends, high-usage consumer audits, 6-month tracking, and efficiency reports.",
    allowedTopics: ["reports", "analytics", "trends", "audit", "consumption history", "charts", "average usage", "high consumers"],
    suggestions: [
      "What are the society's water usage trends over time?",
      "Who are the top water-consuming households?",
      "What is the society's average daily water consumption?",
    ],
  },
  "/admin/leakage": {
    key: "admin-leakage",
    title: "Leakage Detection & Anomaly Alerts",
    scope: "Pipeline acoustic/pressure anomaly alerts, leak severity levels, pipe sections, and repair ticket logs.",
    allowedTopics: ["leak", "leakage", "anomaly", "alerts", "pipeline", "repair", "severity", "flow drop", "incident"],
    suggestions: [
      "How many active leaks are currently detected?",
      "Which pipeline block has the highest severity leak?",
      "How do I mark a leakage incident as resolved?",
    ],
  },
  "/admin/plans": {
    key: "admin-plans",
    title: "Tariff Plans & Pricing Slabs",
    scope: "Configuring volumetric tariff plans, slab tiers (Base Tier, Moderate, High/Penalty), and base monthly fixed charges.",
    allowedTopics: ["plans", "tariffs", "pricing", "slabs", "rates", "rate per kl", "fixed charge", "base fee", "tiered pricing"],
    suggestions: [
      "What are the active tariff slabs and rates per kL?",
      "What is the monthly base fixed fee?",
      "How do progressive volumetric tiers promote conservation?",
    ],
  },
  "/admin/bulk-purchases": {
    key: "admin-bulk-purchases",
    title: "Bulk Water Purchases",
    scope: "Procuring external water tanker shipments, vendor tracking, tanker capacity, and cost allocation per household.",
    allowedTopics: ["bulk", "tankers", "purchases", "water supply", "vendor", "shipments", "allocation", "tanker cost", "capacity"],
    suggestions: [
      "How many external water tankers have been purchased?",
      "What is the total expenditure on water tankers?",
      "How is the tanker cost divided across flats?",
    ],
  },
  "/admin/settings": {
    key: "admin-settings",
    title: "Society Settings & Rules",
    scope: "Society profile configuration, billing automation schedules, meter threshold limits, and notification preferences.",
    allowedTopics: ["settings", "rules", "society profile", "automation", "notifications", "billing cycle", "thresholds"],
    suggestions: [
      "What automated billing cycle schedule is active?",
      "How do I update society contact and profile details?",
      "What are the conservation alert threshold rules?",
    ],
  },
  "/resident/dashboard": {
    key: "resident-dashboard",
    title: "Resident Dashboard",
    scope: "Personal flat water consumption, smart meter status, outstanding dues, quick bill payment, and usage overview.",
    allowedTopics: ["my usage", "my bill", "my meter", "flat", "dues", "pay", "liters", "daily average", "balance", "receipt"],
    suggestions: [
      "What is my current water consumption and daily average?",
      "Do I have any unpaid bills or outstanding dues?",
      "What is my smart meter serial ID?",
    ],
  },
  "/resident/usage": {
    key: "resident-usage",
    title: "Resident Usage Logs & Telemetry",
    scope: "Personal flat meter reading history, daily IoT logs, cumulative flow (kL), and CSV export.",
    allowedTopics: ["usage", "logs", "readings", "history", "flow", "export csv", "telemetry", "daily usage", "meter reading"],
    suggestions: [
      "What was my water consumption in the last logged reading?",
      "How do I export my water usage history to CSV?",
      "Is my household usage within the Tier 1 conservation limit?",
    ],
  },
  "/resident/bills": {
    key: "resident-bills",
    title: "Resident Invoices & Receipts",
    scope: "Itemized official invoices, slab cost breakdowns, base charges, and instant Razorpay online payment (UPI, Cards, NetBanking).",
    allowedTopics: ["bills", "invoices", "receipts", "payment", "razorpay", "pay now", "upi", "cards", "slab breakdown", "due date", "official invoice"],
    suggestions: [
      "Show me my latest invoice number and itemized breakdown.",
      "How do I pay my water bill with Razorpay?",
      "How much was charged for the base fixed fee vs volumetric slabs?",
    ],
  },
  "/resident/reports": {
    key: "resident-reports",
    title: "Tariff Slabs & Conservation",
    scope: "Active tariff slab schedule for your flat, base charges, and household eco-friendly water conservation tips.",
    allowedTopics: ["tariff", "slabs", "rates", "conservation", "eco tips", "saving water", "base fee", "tier limits"],
    suggestions: [
      "What are the tariff rates for my household slabs?",
      "What are top tips to stay within the low-cost Tier 1 slab?",
      "How much can aerators on faucets save per month?",
    ],
  },
};

function getPageConfig(pathname) {
  if (PAGE_CONFIGS[pathname]) return PAGE_CONFIGS[pathname];
  if (pathname.startsWith("/admin/")) {
    const sub = pathname.split("/admin/")[1];
    const match = PAGE_CONFIGS[`/admin/${sub}`];
    if (match) return match;
    return PAGE_CONFIGS["/admin/dashboard"];
  }
  if (pathname.startsWith("/resident/")) {
    const sub = pathname.split("/resident/")[1];
    const match = PAGE_CONFIGS[`/resident/${sub}`];
    if (match) return match;
    return PAGE_CONFIGS["/resident/dashboard"];
  }
  return PAGE_CONFIGS["/"];
}

function getBackendContext(pageKey, user) {
  const households = dataStore.getHouseholds();
  const readings = dataStore.getReadings();
  const bills = dataStore.getBills();
  const leaks = dataStore.getLeaks();
  const plans = dataStore.getTariffPlans();
  const bulkPurchases = dataStore.getBulkPurchases();
  const activePlan = plans.find((p) => p.isDefault) || plans[0];

  const currentUnit = user?.householdUnitNumber || (households[0] ? households[0].unitNumber : "B-402");
  const myBills = bills.filter((b) => b.unitNumber === currentUnit);
  const myReadings = readings.filter((r) => r.unitNumber === currentUnit);
  const myUnpaidBill = myBills.find((b) => b.status === "Unpaid");
  const myLatestBill = myBills[0];

  return {
    pageKey,
    user: {
      username: user?.username || "Guest",
      fullName: user?.fullName || "User",
      role: user?.role || "GUEST",
      unitNumber: currentUnit,
      apartmentName: user?.apartmentName || "Palm Meadows Society",
    },
    societySummary: {
      totalFlats: households.length,
      occupiedFlats: households.filter((h) => h.residentName).length,
      vacantFlats: households.filter((h) => !h.residentName).length,
      totalInvoicedAmount: bills.reduce((acc, b) => acc + (b.rawAmount || 0), 0),
      totalCollectedAmount: bills.filter((b) => b.status === "Paid").reduce((acc, b) => acc + (b.rawAmount || 0), 0),
      unpaidBillsCount: bills.filter((b) => b.status === "Unpaid").length,
      activeLeaksCount: leaks.filter((l) => l.status === "Active").length,
      totalBulkPurchasesKL: bulkPurchases.reduce((acc, p) => acc + (Number(p.quantity || p.capacityKL) || 0), 0),
      totalBulkCost: bulkPurchases.reduce((acc, p) => acc + (Number(p.totalCost) || 0), 0),
      tariffPlanName: activePlan?.name || "Standard Tiered Plan",
      tariffFixedCharge: activePlan?.fixedCharge || 100,
      slabs: activePlan?.slabs || [],
    },
    residentSpecific: {
      unitNumber: currentUnit,
      residentName: user?.fullName || "Resident",
      unpaidAmount: myUnpaidBill ? myUnpaidBill.amount : "₹0.00",
      unpaidDueDate: myUnpaidBill ? myUnpaidBill.dueDate : "None",
      latestConsumptionKL: myLatestBill ? myLatestBill.consumptionKL : "0.00",
      totalReadingsLogged: myReadings.length,
      latestReading: myReadings[0] || null,
      billsCount: myBills.length,
    },
    liveLists: {
      householdsSample: households.slice(0, 5),
      activeLeaks: leaks.filter((l) => l.status === "Active"),
      recentBills: bills.slice(0, 5),
      recentPurchases: bulkPurchases.slice(0, 5),
      recentReadings: readings.slice(0, 5),
    },
  };
}

function buildSystemPrompt(pageConfig, backendData) {
  const currentLangCode = (typeof window !== "undefined" && window.localStorage) ? localStorage.getItem("selected_lang_code") || "en" : "en";

  return `You are DROP AI — the interactive, intelligent Water Management Operations Partner for the DROP platform.
Current Page: "${pageConfig.title}"
Current Portal Context: "${pageConfig.key.startsWith("admin-") ? "Community Administration Portal" : pageConfig.key.startsWith("resident-") ? "Resident Occupant Portal" : "Public Platform Portal"}"
Active Page Scope: "${pageConfig.scope}"

=== CORE OPERATING GUIDELINES ===
1. DYNAMIC LIVE CALCULATIONS & ARITHMETIC:
   - When asked ANY calculation (e.g. volumetric tiered slab charges, total bill estimation for X kL, savings percentages, daily average consumption per unit, collection percentages, tanker cost per flat), LIVELY CALCULATE the mathematical result step-by-step with clear arithmetic and unit labels (₹, Liters, kL, %).
   - Never output generic static templates when exact live numbers or formulas are requested.

2. INTERACTIVE & ENGAGING CONVERSATION:
   - Provide lively, helpful, conversational, and energetic answers tailored to the user's specific question.
   - Never end with a cold wall of text. ALWAYS conclude your answer with an interactive follow-up question, proactive recommendation, or next action step tailored to the user's situation.

3. COMMON LANGUAGE FLUENCY:
   - Reply fluently and naturally in the exact language used by the user (Hindi, Hinglish, Spanish, French, Telugu, Tamil, German, etc.).

4. STRICT OUT-OF-SCOPE REJECTION:
   - If the user asks to write code, do software programming, or answer non-water general trivia/entertainment/sports, politely and formally decline:
     "I am sorry, I am not able to do that. I am dedicated exclusively to assisting with DROP Smart Water Platform operations and data for this portal. Please let me know how I may assist you with your water consumption, invoices, or telemetry."

5. PORTAL BOUNDARIES & DATA AUTHORIZATION:
   - Resident: Strictly authorized for their own flat records and personal water telemetry.
   - Admin: Full access to society-wide telemetry, flat directory, batch billing, leakage alerts, and bulk tankers.
   - Public: Platform overview, 20% conservation benefits, volumetric billing formula, and registration.

=== LIVE DATABASE TELEMETRY & TARIFF CONTEXT ===
Society: ${backendData.user.apartmentName}
User Logged In: ${backendData.user.fullName} (Role: ${backendData.user.role}, Flat: ${backendData.user.unitNumber})

Society Aggregates:
- Registered Flats: ${backendData.societySummary.totalFlats} (Occupied: ${backendData.societySummary.occupiedFlats}, Vacant: ${backendData.societySummary.vacantFlats})
- Total Invoiced Revenue: ₹${backendData.societySummary.totalInvoicedAmount.toLocaleString()}
- Total Collected Revenue: ₹${backendData.societySummary.totalCollectedAmount.toLocaleString()}
- Unpaid Invoices Count: ${backendData.societySummary.unpaidBillsCount} (Pending: ₹${(backendData.societySummary.totalInvoicedAmount - backendData.societySummary.totalCollectedAmount).toLocaleString()})
- Active Leak Incidents: ${backendData.societySummary.activeLeaksCount}
- External Water Tankers: ${backendData.societySummary.totalBulkPurchasesKL} kL (Expenditure: ₹${backendData.societySummary.totalBulkCost.toLocaleString()})
- Active Tariff Plan: ${backendData.societySummary.tariffPlanName} (Base Fee: ₹${backendData.societySummary.tariffFixedCharge}/mo)
- Volumetric Slabs: ${JSON.stringify(backendData.societySummary.slabs)}

Resident Data (Flat ${backendData.residentSpecific.unitNumber} - ${backendData.residentSpecific.residentName}):
- Outstanding Dues: ${backendData.residentSpecific.unpaidAmount} (Due Date: ${backendData.residentSpecific.unpaidDueDate})
- Current Cycle Consumption: ${backendData.residentSpecific.latestConsumptionKL} kL
- Smart Meter ID: WM-${backendData.residentSpecific.unitNumber}-2026
- Logged Readings Count: ${backendData.residentSpecific.totalReadingsLogged}

Active Leaks: ${JSON.stringify(backendData.liveLists.activeLeaks)}
Sample Households: ${JSON.stringify(backendData.liveLists.householdsSample)}
Sample Bills: ${JSON.stringify(backendData.liveLists.recentBills)}

Answer the user interactively and perform live mathematical calculations dynamically.`;
}

const GEMINI_CANDIDATE_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro",
  "gemini-pro",
];

let cachedWorkingModel = (typeof window !== "undefined" && window.sessionStorage) ? sessionStorage.getItem("drop_gemini_working_model") : null;

async function discoverWorkingGeminiModel(apiKey) {
  if (cachedWorkingModel) return cachedWorkingModel;
  
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (res.ok) {
      const data = await res.json();
      const supported = data.models?.filter((m) => 
        m.supportedGenerationMethods?.includes("generateContent")
      );
      if (supported && supported.length > 0) {
        const preferred = 
          supported.find((m) => m.name.includes("2.0-flash")) ||
          supported.find((m) => m.name.includes("1.5-flash")) ||
          supported.find((m) => m.name.includes("flash")) ||
          supported[0];
        
        const cleanName = preferred.name.replace("models/", "");
        cachedWorkingModel = cleanName;
        sessionStorage.setItem("drop_gemini_working_model", cleanName);
        return cleanName;
      }
    }
  } catch (err) {
    console.warn("Could not query Gemini models list:", err);
  }

  return "gemini-2.0-flash";
}

async function callGeminiAPI(apiKey, userPrompt, pageConfig, backendData, chatHistory) {
  const systemPrompt = buildSystemPrompt(pageConfig, backendData);

  // Format previous history into Gemini contents format
  const historyTurns = [];
  const recentMessages = chatHistory.slice(-6);
  recentMessages.forEach((m) => {
    historyTurns.push({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    });
  });

  const modelToTry = await discoverWorkingGeminiModel(apiKey);
  const modelsToAttempt = [modelToTry, ...GEMINI_CANDIDATE_MODELS.filter((m) => m !== modelToTry)];

  let lastError = null;

  for (const model of modelsToAttempt) {
    try {
      // 1. Try standard request with systemInstruction in v1beta
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          ...historyTurns,
          { role: "user", parts: [{ text: userPrompt }] }
        ],
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1000
        }
      };

      let response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      // If systemInstruction is rejected (e.g. on older models like gemini-pro), retry without systemInstruction field
      if (!response.ok && (response.status === 400 || response.status === 404)) {
        const fallbackPayload = {
          contents: [
            { role: "user", parts: [{ text: `[SYSTEM INSTRUCTION]\n${systemPrompt}\n\n[USER MESSAGE]\n${userPrompt}` }] }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1000
          }
        };
        response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fallbackPayload)
        });
      }

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          cachedWorkingModel = model;
          sessionStorage.setItem("drop_gemini_working_model", model);
          return text;
        }
      } else {
        const errJson = await response.json().catch(() => ({}));
        lastError = new Error(errJson?.error?.message || `Model ${model} returned HTTP ${response.status}`);
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("Unable to connect to Gemini API with provided key.");
}

async function callOpenAIAPI(apiKey, userPrompt, pageConfig, backendData, chatHistory) {
  const systemPrompt = buildSystemPrompt(pageConfig, backendData);

  const messages = [
    { role: "system", content: systemPrompt },
  ];

  const recentMessages = chatHistory.slice(-6);
  recentMessages.forEach((m) => {
    messages.push({
      role: m.sender === "user" ? "user" : "assistant",
      content: m.text,
    });
  });

  messages.push({ role: "user", content: userPrompt });

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.3,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || `OpenAI API returned status ${response.status}`;
    throw new Error(message);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("No response returned by OpenAI API.");
  }
  return text;
}

function renderFormattedInlineText(text) {
  if (!text) return null;
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  const tokens = text.split(regex);

  return tokens.map((token, idx) => {
    if (token.startsWith("**") && token.endsWith("**")) {
      return <strong key={idx} className="ai-chatbot__text-bold">{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith("`") && token.endsWith("`")) {
      return <code key={idx} className="ai-chatbot__text-code">{token.slice(1, -1)}</code>;
    }
    return token;
  });
}

// Clean and structured message renderer for neat and readable AI responses
function FormattedMessage({ text }) {
  if (!text) return null;

  // Clean out any unwanted note disclaimers, brackets, or meta notes
  const cleanedText = text
    .replace(/\*?\(Note:.*?\)\*?/gi, "")
    .replace(/\[Note:.*?\]/gi, "")
    .replace(/^\s*\*Note:.*$/gmi, "")
    .trim();

  const lines = cleanedText.split("\n");
  const elements = [];
  let currentList = [];
  let listType = null; // 'ul' or 'ol'

  const flushList = () => {
    if (currentList.length > 0) {
      if (listType === "ol") {
        elements.push(
          <ol key={`list-${elements.length}`} className="ai-chatbot__msg-ol">
            {currentList.map((item, i) => (
              <li key={i}>{renderFormattedInlineText(item)}</li>
            ))}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`list-${elements.length}`} className="ai-chatbot__msg-ul">
            {currentList.map((item, i) => (
              <li key={i}>{renderFormattedInlineText(item)}</li>
            ))}
          </ul>
        );
      }
      currentList = [];
      listType = null;
    }
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      return;
    }

    // Unordered list item: • or - or *
    if (/^[•\-\*]\s+/.test(line)) {
      const itemContent = line.replace(/^[•\-\*]\s+/, "");
      if (listType === "ol") flushList();
      listType = "ul";
      currentList.push(itemContent);
      return;
    }

    // Ordered list item: 1. 2. etc.
    if (/^\d+\.\s+/.test(line)) {
      const itemContent = line.replace(/^\d+\.\s+/, "");
      if (listType === "ul") flushList();
      listType = "ol";
      currentList.push(itemContent);
      return;
    }

    // Not a list item -> flush any open list
    flushList();

    // Headers like ### Title
    if (line.startsWith("### ")) {
      elements.push(
        <h4 key={`h-${idx}`} className="ai-chatbot__msg-h4">
          {renderFormattedInlineText(line.replace(/^###\s+/, ""))}
        </h4>
      );
      return;
    }

    // Headers like ## Title
    if (line.startsWith("## ")) {
      elements.push(
        <h4 key={`h-${idx}`} className="ai-chatbot__msg-h4">
          {renderFormattedInlineText(line.replace(/^##\s+/, ""))}
        </h4>
      );
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${idx}`} className="ai-chatbot__msg-p">
        {renderFormattedInlineText(line)}
      </p>
    );
  });

  flushList();

  return <div className="ai-chatbot__formatted-body">{elements}</div>;
}

function generateLocalAIResponse(userPrompt, pageConfig, backendData) {
  const q = userPrompt.toLowerCase().trim();
  const { societySummary, residentSpecific, liveLists, user } = backendData;
  const isResident = pageConfig.key.startsWith("resident-");
  const isAdmin = pageConfig.key.startsWith("admin-");

  // Rejection of out-of-scope tasks (e.g. coding requests, general trivia)
  const isCodingRequest = 
    q.includes("write code") || q.includes("write a code") || q.includes("write a program") ||
    q.includes("write python") || q.includes("write javascript") || q.includes("write java") ||
    q.includes("can you write code") || q.includes("code for me") || q.includes("coding") ||
    q.includes("generate code") || q.includes("create a script") || q.includes("write an algorithm") ||
    q.includes("write an essay");

  const isGeneralUnrelated = 
    isCodingRequest ||
    q.includes("who is the president") || q.includes("weather in") || q.includes("recipe") ||
    q.includes("movie") || q.includes("joke") || q.includes("football") || q.includes("cricket score") ||
    q.includes("capital of");

  if (isGeneralUnrelated) {
    const isHindi = /[\u0900-\u097F]/.test(userPrompt) || q.includes("kya") || q.includes("kaise") || q.includes("karo");
    if (isHindi) {
      return `मुझे खेद है, मैं यह कार्य करने में असमर्थ हूँ। मैं विशेष रूप से **DROP स्मार्ट वाटर मैनेजमेंट प्लेटफ़ॉर्म** के कार्यों और डेटा में सहायता के लिए समर्पित हूँ।\n\nकृपया मुझे बताएं कि मैं आपके पानी की खपत, बिलों या टेलीमेट्री में कैसे सहायता कर सकता हूँ।`;
    }
    return `I am sorry, I am not able to do that. I am dedicated exclusively to assisting with **DROP Smart Water Platform** operations and water management data for this portal.\n\nPlease let me know how I may assist you with your water consumption, invoices, or telemetry.`;
  }

  // Polite General Conversation Greetings (Interactive and Portal-Aware)
  const isGreeting = /^(hi|hello|hey|good morning|good afternoon|good evening|namaste|hola|bonjour|hallo|vanakkam|namaskaram|adaab|greetings|help|start)\b/i.test(q);
  if (isGreeting) {
    if (isResident) {
      return `Hello **${residentSpecific.residentName}**! Welcome to your Resident Water Assistant for **${pageConfig.title}**.\n\nHere is a quick snapshot of Flat **${residentSpecific.unitNumber}**:\n• Outstanding Balance: **${residentSpecific.unpaidAmount}**\n• Current Usage: **${residentSpecific.latestConsumptionKL} kL**\n• Smart Meter ID: \`WM-${residentSpecific.unitNumber}-2026\`\n\nWhat would you like to do next? You can ask me to **view your itemized invoice**, **check payment options**, or **review your water usage trends**.`;
    }
    if (isAdmin) {
      return `Good day, **Administrator ${user.fullName}**! I am ready to assist you with **${pageConfig.title}** operations.\n\nLive Snapshot:\n• Registered Units: **${societySummary.totalFlats} Flats**\n• Active Leak Alerts: **${societySummary.activeLeaksCount}**\n• Total Billed Revenue: **₹${societySummary.totalInvoicedAmount.toLocaleString()}**\n\nHow can I help you today? Would you like to **inspect pending invoices**, **review leakage alerts**, or **check meter telemetry**?`;
    }
    return `Hello and welcome to **DROP Smart Water Platform**! I am your interactive assistant for **${pageConfig.title}**.\n\nHow may I help you explore DROP today? Would you like to:\n1. Learn how DROP saves **20%+ water** via sub-metering?\n2. Understand our **volumetric tiered tariff calculator**?\n3. Get started with **community registration**?`;
  }

  // Polite Acknowledgements
  const isThanks = /^(thank you|thanks|dhanyawad|shukriya|gracias|merci|danke|thank u|perfect|great|ok|okay)\b/i.test(q);
  if (isThanks) {
    return `You're very welcome! I'm always here to help. Is there anything else you'd like to check regarding **${pageConfig.title}**?`;
  }

  // Portal Authorization Boundary Checks
  if (isResident && (q.includes("bulk purchase") || q.includes("tanker") || q.includes("add household") || q.includes("configure slab plan") || q.includes("admin settings") || q.includes("delete flat") || q.includes("generate batch bills"))) {
    return `This operation is restricted to Community Administrators. As an authenticated resident of **Flat ${residentSpecific.unitNumber}**, your access is designated for personal flat consumption, itemized invoices, payment receipts, and smart meter telemetry.\n\nWould you like me to show you your household's current billing dues or latest usage readings instead?`;
  }

  if (pageConfig.key === "login" && (q.includes("leak") || q.includes("tanker") || q.includes("slab rate") || q.includes("meter reading") || q.includes("bill ledger"))) {
    return `You are currently on the **Sign In Portal**. Live telemetry and society accounting data are restricted to authenticated accounts.\n\n• For Resident Access: Enter your flat credentials.\n• For Society Admin Access: Enter your administrative credentials.\n\nWould you like guidance on password recovery or new society registration?`;
  }

  // 1. LANDING PAGE
  if (pageConfig.key === "landing") {
    if (q.includes("20%") || q.includes("save") || q.includes("conserve")) {
      return `**Water Conservation Framework on DROP:**\n\n• **Individual Sub-Metering:** Provides transparent consumption accounting, reducing wasteful usage patterns by over 20%.\n• **Volumetric Tiered Slabs:** Progressive tariffs incentivize conservation by keeping essential low usage at economical base rates.\n• **Continuous IoT Telemetry:** Real-time pulse monitoring detects concealed pipeline leaks before substantial water loss occurs.\n• **Resident Analytics:** Usage benchmarks and insights empower households to optimize daily efficiency.\n\nWould you like to calculate your community's estimated annual savings or explore our tariff slab structure?`;
    }
    if (q.includes("slab") || q.includes("volumetric") || q.includes("engine") || q.includes("formula") || q.includes("calculate")) {
      return `**Volumetric Slab Engine Methodology:**\n\nDROP computes monthly billing using continuous progressive slabs:\n• **Tier 1 (Base Slab):** Subsidized rate for essential domestic usage.\n• **Tier 2 (Moderate Slab):** Standard volumetric rate for regular household consumption.\n• **Tier 3 (High Usage Slab):** Premium rate designed to deter excess consumption.\n• **Base Fixed Fee:** Covers pipeline infrastructure maintenance and meter calibration.\n\nWould you like me to explain how this model calculates an example household bill?`;
    }
    if (q.includes("register") || q.includes("onboard") || q.includes("new society") || q.includes("get started")) {
      return `**Society Onboarding Process:**\n\n1. Select **"Get Started"** or **"Register Community"** in the top navigation.\n2. Provide society details, total block count, and initial administrator credentials.\n3. Configure your community's preferred tariff model (Progressive Tiered vs Flat Rate).\n4. Map sub-meter serials to begin automated billing.\n\nShall I guide you through the registration steps now?`;
    }
    return `**DROP Smart Water Platform Overview:**\n\n• **Intelligent Sub-Metering:** Automated volume telemetry for residential societies.\n• **Progressive Tariff Slabs:** 100% verified fair-usage billing engine.\n• **IoT Pipeline Telemetry:** Continuous flow monitoring and leak detection.\n• **Dedicated Portals:** Tailored interfaces for Administrators and Residents.\n\nWhich area would you like to explore first?`;
  }

  // 2. ADMIN OVERVIEW / DASHBOARD
  if (pageConfig.key === "admin-dashboard") {
    if (q.includes("summary") || q.includes("overview") || q.includes("kpi") || q.includes("today") || q.includes("metrics") || q.includes("status")) {
      return `**Society Water Command Summary (${backendData.user.apartmentName}):**\n\n• **Registered Households:** **${societySummary.totalFlats} Flats** (${societySummary.occupiedFlats} Occupied, ${societySummary.vacantFlats} Vacant)\n• **Total Invoiced:** **₹${societySummary.totalInvoicedAmount.toLocaleString()}**\n• **Total Collections:** **₹${societySummary.totalCollectedAmount.toLocaleString()}**\n• **Outstanding Invoices:** **${societySummary.unpaidBillsCount} Bills** (₹${(societySummary.totalInvoicedAmount - societySummary.totalCollectedAmount).toLocaleString()} pending)\n• **External Water Tankers:** **${societySummary.totalBulkPurchasesKL} kL** procured (₹${societySummary.totalBulkCost.toLocaleString()})\n• **Leak Incidents:** **${societySummary.activeLeaksCount} Active Alerts** ${societySummary.activeLeaksCount > 0 ? "(Attention required)" : "(Normal status)"}\n\nWould you like me to highlight the overdue flats or inspect active leak locations?`;
    }
    if (q.includes("revenue") || q.includes("collected") || q.includes("pending") || q.includes("financial") || q.includes("collection")) {
      return `**Financial Summary:**\n\n• **Total Invoiced Revenue:** ₹${societySummary.totalInvoicedAmount.toLocaleString()}\n• **Settled Collections:** ₹${societySummary.totalCollectedAmount.toLocaleString()}\n• **Outstanding Balance:** ₹${(societySummary.totalInvoicedAmount - societySummary.totalCollectedAmount).toLocaleString()}\n• **Unpaid Invoices Count:** ${societySummary.unpaidBillsCount} bills.\n\nWould you like to review itemized flat statements in **Bill Management** or check payment receipts?`;
    }
    if (q.includes("leak") || q.includes("alert")) {
      return `**Leakage Telemetry Status:**\n\n• **Active Incidents:** **${societySummary.activeLeaksCount}**\n${liveLists.activeLeaks.length > 0 ? liveLists.activeLeaks.map((l) => `• Location: **${l.location}** | Severity: **${l.severity}** | Est. Loss: ${l.estimatedLossLiters || 850} L/hr`).join("\n") : "• All pipeline pressure sensors report normal parameters."}\n\nShall I navigate you to the **Leakage Detection** page to manage repair tickets?`;
    }
    return `**Society Overview Assistance:**\n\nCurrently monitoring **${societySummary.totalFlats} units** with **${societySummary.unpaidBillsCount} pending invoices** and **${societySummary.activeLeaksCount} active leak alerts**.\n\nWhat specific metric would you like to drill into?`;
  }

  // 3. ADMIN HOUSEHOLDS
  if (pageConfig.key === "admin-households") {
    return `**Household Directory Status:**\n\n• **Total Registered Units:** **${societySummary.totalFlats} flats**\n• **Occupancy Rate:** **${societySummary.occupiedFlats} occupied** (${societySummary.totalFlats > 0 ? Math.round((societySummary.occupiedFlats / societySummary.totalFlats) * 100) : 0}%), **${societySummary.vacantFlats} vacant**\n\nSample Directory Records:\n${liveLists.householdsSample.map((h) => `• Unit **${h.unitNumber}** (${h.block}) | Meter ID: \`${h.meterSerialNumber}\` | Occupant: ${h.residentName || "Unassigned"}`).join("\n")}\n\nWould you like guidance on adding a new flat unit or updating smart meter assignments?`;
  }

  // 4. ADMIN READINGS
  if (pageConfig.key === "admin-readings") {
    return `**Meter Reading Ledger:**\n\n• Reading entries support both **manual logging** and **bulk CSV uploads** (\`UnitNumber,ReadingDate,MeterReading,Source\`).\n• All volume consumption calculations are derived automatically from consecutive meter index logs.\n\nWould you like instructions on uploading a CSV reading batch or logging an individual flat reading?`;
  }

  // 5. ADMIN BILLS
  if (pageConfig.key === "admin-bills") {
    return `**Billing Management Status:**\n\n• **Total Billed:** **₹${societySummary.totalInvoicedAmount.toLocaleString()}**\n• **Collected Revenue:** **₹${societySummary.totalCollectedAmount.toLocaleString()}**\n• **Unpaid Bills:** **${societySummary.unpaidBillsCount} invoices** pending\n• **Active Tariff Model:** **${societySummary.tariffPlanName}** (Fixed Base: ₹${societySummary.tariffFixedCharge}/mo)\n\nWould you like me to guide you through batch bill generation or marking invoices as settled?`;
  }

  // 6. RESIDENT DASHBOARD & INVOICES
  if (isResident) {
    if (q.includes("due") || q.includes("unpaid") || q.includes("pay") || q.includes("balance") || q.includes("bill") || q.includes("invoice") || q.includes("razorpay")) {
      return `**Billing Statement for Flat ${residentSpecific.unitNumber} (${residentSpecific.residentName}):**\n\n• **Outstanding Balance:** **${residentSpecific.unpaidAmount}**\n• **Payment Due Date:** ${residentSpecific.unpaidDueDate}\n• **Last Cycle Consumption:** **${residentSpecific.latestConsumptionKL} kL** (${(Number(residentSpecific.latestConsumptionKL) * 1000).toLocaleString()} Liters)\n\n${residentSpecific.unpaidAmount !== "₹0.00" ? "You can complete your payment instantly via **Razorpay Payment Gateway** (supporting UPI, Google Pay, PhonePe, Cards, and NetBanking) using the **'Pay Current Bill'** button at the top.\n\nWould you like me to walk you through the payment steps or view your itemized slab charges?" : "All utility dues for your flat are settled!\n\nWould you like to review your previous Razorpay payment receipts or inspect your daily consumption average?"}`;
    }
    if (q.includes("usage") || q.includes("consumption") || q.includes("liters") || q.includes("meter")) {
      return `**Water Usage Data for Flat ${residentSpecific.unitNumber}:**\n\n• **Latest Recorded Usage:** **${residentSpecific.latestConsumptionKL} kL**\n• **Logged Meter Logs:** **${residentSpecific.totalReadingsLogged} entries**\n• **Smart Meter ID:** \`WM-${residentSpecific.unitNumber}-2026\` (Online telemetry active)\n• Your consumption is within the economical Tier 1 allocation.\n\nWould you like to see how to export your logs to CSV or compare your usage with the community average?`;
    }
    return `**Resident Portal Assistance (Flat ${residentSpecific.unitNumber}):**\n\n• **Outstanding Balance:** **${residentSpecific.unpaidAmount}**\n• **Consumption:** **${residentSpecific.latestConsumptionKL} kL**\n• **Smart Meter ID:** \`WM-${residentSpecific.unitNumber}-2026\`\n\nHow can I help you right now? Would you like to check your bill breakdown, payment methods, or water saving tips?`;
  }

  return `**${pageConfig.title} Assistance:**\n\nI am currently active for the **${pageConfig.title}** page with live backend database integration.\n\nWhat would you like to review or accomplish next?`;
}

export function AIChatbot() {
  const location = useLocation();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const pageConfig = getPageConfig(location.pathname);

  // Initialize clean welcome greeting when navigating between pages
  useEffect(() => {
    const greetingMsg = {
      id: `welcome-${pageConfig.key}-${Date.now()}`,
      sender: "bot",
      text: `Hello! How can I assist you with your water usage, billing, or telemetry today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages([greetingMsg]);
  }, [location.pathname]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleCopyText = (msgId, text) => {
    if (!text) return;
    const cleanText = text
      .replace(/\*?\(Note:.*?\)\*?/gi, "")
      .replace(/\[Note:.*?\]/gi, "")
      .trim();
    navigator.clipboard.writeText(cleanText).then(() => {
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    const backendData = getBackendContext(pageConfig.key, user);
    const currentLangCode = (typeof window !== "undefined" && window.localStorage) ? localStorage.getItem("selected_lang_code") || "en" : "en";

    try {
      let aiResponse = "";
      
      try {
        // 1. Try Backend AI Endpoint first
        const res = await aiApi.chat({
          prompt: text,
          pageTitle: pageConfig.title,
          pageKey: pageConfig.key,
          pageScope: pageConfig.scope,
          portalContext: pageConfig.key.startsWith("admin-") ? "Community Administration Portal" : pageConfig.key.startsWith("resident-") ? "Resident Occupant Portal" : "Public Platform Portal",
          userLanguage: currentLangCode,
          backendData,
          chatHistory: messages.slice(-6).map((m) => ({ sender: m.sender, text: m.text })),
        });

        if (res && res.data && res.data.response && res.data.provider !== "backend-grounded") {
          aiResponse = res.data.response;
        } else if (import.meta.env.VITE_GEMINI_API_KEY) {
          // If backend fell back or returned template, execute live generative calculation
          aiResponse = await callGeminiAPI(import.meta.env.VITE_GEMINI_API_KEY, text, pageConfig, backendData, messages);
        } else if (res && res.data && res.data.response) {
          aiResponse = res.data.response;
        } else {
          aiResponse = generateLocalAIResponse(text, pageConfig, backendData);
        }
      } catch (apiErr) {
        console.warn("Backend AI call failed, attempting direct live Gemini calculation engine:", apiErr);
        if (import.meta.env.VITE_GEMINI_API_KEY) {
          try {
            aiResponse = await callGeminiAPI(import.meta.env.VITE_GEMINI_API_KEY, text, pageConfig, backendData, messages);
          } catch (clientErr) {
            console.warn("Direct live AI call error:", clientErr);
            aiResponse = generateLocalAIResponse(text, pageConfig, backendData);
          }
        } else {
          aiResponse = generateLocalAIResponse(text, pageConfig, backendData);
        }
      }

      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: aiResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("Chatbot processing error:", err);
      const errorMsg = {
        id: `bot-err-${Date.now()}`,
        sender: "bot",
        text: generateLocalAIResponse(text, pageConfig, backendData),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    const greetingMsg = {
      id: `welcome-${pageConfig.key}-${Date.now()}`,
      sender: "bot",
      text: `Chat reset. How can I assist you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages([greetingMsg]);
  };

  return (
    <div className="ai-chatbot-root notranslate" translate="no" id="ai-chatbot-root">
      {/* Floating Trigger Button on Bottom Right */}
      {!isOpen && (
        <button
          type="button"
          className="ai-chatbot__trigger notranslate"
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Assistant"
          id="ai-chatbot-trigger"
          title="Open DROP AI Assistant"
          translate="no"
        >
          <div className="ai-chatbot__trigger-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
              <rect x="4" y="8" width="16" height="12" rx="4" />
              <circle cx="9" cy="13" r="1.5" fill="currentColor" />
              <circle cx="15" cy="13" r="1.5" fill="currentColor" />
              <path d="M9 17h6" />
            </svg>
          </div>
          <span className="ai-chatbot__trigger-title">Ask DROP AI</span>
        </button>
      )}

      {/* Expandable Chatbot Window */}
      {isOpen && (
        <div className="ai-chatbot__window notranslate" id="ai-chatbot-window" translate="no">
          {/* Light Modern Header */}
          <div className="ai-chatbot__header notranslate" translate="no">
            <div className="ai-chatbot__header-left notranslate">
              <div className="ai-chatbot__avatar notranslate">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
                  <rect x="4" y="8" width="16" height="12" rx="4" />
                  <circle cx="9" cy="13" r="1.5" fill="currentColor" />
                  <circle cx="15" cy="13" r="1.5" fill="currentColor" />
                  <path d="M9 17h6" />
                </svg>
              </div>
              <div className="ai-chatbot__header-info notranslate">
                <h3 className="ai-chatbot__header-title notranslate">DROP Assistant</h3>
                <span className="ai-chatbot__status-online notranslate">
                  <span className="ai-chatbot__status-dot"></span>
                  AI Online
                </span>
              </div>
            </div>

            <div className="ai-chatbot__header-actions notranslate">
              <button
                type="button"
                className="ai-chatbot__action-btn notranslate"
                onClick={handleClearChat}
                title="Reset Chat"
                aria-label="Clear chat"
                translate="no"
              >
                ↺
              </button>
              <button
                type="button"
                className="ai-chatbot__action-btn ai-chatbot__close-btn notranslate"
                onClick={() => setIsOpen(false)}
                title="Close Assistant"
                aria-label="Close chatbot"
                translate="no"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="ai-chatbot__messages notranslate" id="ai-chatbot-messages" translate="no">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`ai-chatbot__bubble-row ai-chatbot__bubble-row--${msg.sender} notranslate`}
                translate="no"
              >
                {msg.sender === "bot" && (
                  <div className="ai-chatbot__bubble-avatar notranslate" title="DROP AI">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "15px", height: "15px" }}>
                      <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
                      <rect x="4" y="8" width="16" height="12" rx="4" />
                      <circle cx="9" cy="13" r="1.5" fill="currentColor" />
                      <circle cx="15" cy="13" r="1.5" fill="currentColor" />
                    </svg>
                  </div>
                )}
                <div className={`ai-chatbot__bubble ai-chatbot__bubble--${msg.sender} notranslate`} translate="no">
                  <div className="ai-chatbot__bubble-text notranslate" translate="no">
                    <FormattedMessage text={msg.text} />
                  </div>
                  <div className="ai-chatbot__bubble-footer notranslate">
                    <span className="ai-chatbot__bubble-time notranslate">{msg.timestamp}</span>
                    {msg.sender === "bot" && (
                      <button
                        type="button"
                        className="ai-chatbot__copy-btn notranslate"
                        onClick={() => handleCopyText(msg.id, msg.text)}
                        title="Copy answer"
                        aria-label="Copy answer"
                        translate="no"
                      >
                        {copiedId === msg.id ? "✓ Copied" : "📋 Copy"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="ai-chatbot__bubble-row ai-chatbot__bubble-row--bot notranslate">
                <div className="ai-chatbot__bubble-avatar notranslate">🤖</div>
                <div className="ai-chatbot__bubble ai-chatbot__bubble--bot ai-chatbot__typing notranslate">
                  <span className="ai-chatbot__dot"></span>
                  <span className="ai-chatbot__dot"></span>
                  <span className="ai-chatbot__dot"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Quick Question Chips */}
          <div className="ai-chatbot__suggestions notranslate" translate="no">
            <span className="ai-chatbot__suggestions-label notranslate">Suggestions:</span>
            <div className="ai-chatbot__chips-wrap notranslate">
              {pageConfig.suggestions.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="ai-chatbot__chip notranslate"
                  onClick={() => handleSendMessage(prompt)}
                  translate="no"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input Bar */}
          <div className="ai-chatbot__input-bar notranslate" translate="no">
            <input
              ref={inputRef}
              type="text"
              className="ai-chatbot__input notranslate"
              placeholder="Ask a question..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              id="ai-chatbot-input"
              translate="no"
            />
            <button
              type="button"
              className="ai-chatbot__send-btn notranslate"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
              aria-label="Send message"
              id="ai-chatbot-send"
              translate="no"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIChatbot;
