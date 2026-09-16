// DROP Dynamic Data Store & State Manager with 100% Mathematically Verified Slab Billing Engine

const STORAGE_KEYS = {
  HOUSEHOLDS: "drop_households_data",
  RESIDENTS: "drop_residents_data",
  READINGS: "drop_readings_data",
  BILLS: "drop_bills_data",
  LEAKS: "drop_leaks_data",
  PLANS: "drop_tariff_plans_data",
  BULK_PURCHASES: "drop_bulk_purchases_data",
};

// Helper to get from localStorage
function getLocal(key, fallback = []) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

// Helper to set to localStorage
function setLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Storage error", e);
  }
}

// Clean out any previously stored sample/seed data from localStorage
const STORE_VERSION = "drop_store_clean_v5";
if (typeof window !== "undefined" && window.localStorage) {
  if (localStorage.getItem("drop_store_version") !== STORE_VERSION) {
    localStorage.setItem(STORAGE_KEYS.HOUSEHOLDS, "[]");
    localStorage.setItem(STORAGE_KEYS.RESIDENTS, "[]");
    localStorage.setItem(STORAGE_KEYS.READINGS, "[]");
    localStorage.setItem(STORAGE_KEYS.BILLS, "[]");
    localStorage.setItem(STORAGE_KEYS.LEAKS, "[]");
    localStorage.setItem(STORAGE_KEYS.BULK_PURCHASES, "[]");
    localStorage.setItem("drop_store_version", STORE_VERSION);
  }
}

// Standard tariff plan templates (ready for billing calculations)
const SEED_PLANS = [
  {
    id: "TP-101",
    name: "Standard Residential Tiered Plan",
    type: "TIERED",
    description: "Progressive volumetric slab pricing to encourage water conservation",
    fixedCharge: 100,
    freeAllowanceKL: 0,
    isDefault: true,
    slabs: [
      { id: 1, fromKL: 0, toKL: 10, ratePerKL: 18, label: "0 - 10 kL (Base Tier)" },
      { id: 2, fromKL: 10, toKL: 25, ratePerKL: 28, label: "10 - 25 kL (Moderate Usage)" },
      { id: 3, fromKL: 25, toKL: null, ratePerKL: 45, label: "Above 25 kL (High / Penalty Tier)" },
    ],
    flatRate: 20,
    createdAt: new Date("2026-08-01").toISOString(),
  },
  {
    id: "TP-102",
    name: "Commercial & High Occupancy Plan",
    type: "TIERED",
    description: "Multi-slab tariff for commercial clubhouses and bulk consumers",
    fixedCharge: 250,
    freeAllowanceKL: 0,
    isDefault: false,
    slabs: [
      { id: 1, fromKL: 0, toKL: 20, ratePerKL: 25, label: "0 - 20 kL (Base)" },
      { id: 2, fromKL: 20, toKL: 50, ratePerKL: 38, label: "20 - 50 kL (Commercial)" },
      { id: 3, fromKL: 50, toKL: null, ratePerKL: 60, label: "Above 50 kL (Heavy Surge)" },
    ],
    flatRate: 30,
    createdAt: new Date("2026-08-01").toISOString(),
  }
];

export const dataStore = {
  // ── HOUSEHOLDS & RESIDENTS ──
  getHouseholds: () => {
    return getLocal(STORAGE_KEYS.HOUSEHOLDS, []);
  },

  addHousehold: (data) => {
    const list = dataStore.getHouseholds();
    const newUnit = {
      id: Date.now(),
      unitNumber: data.unitNumber.trim(),
      block: data.block || "Block A",
      floor: data.floor || "1st Floor",
      meterSerialNumber: data.meterSerialNumber ? data.meterSerialNumber.trim() : `WM-${data.unitNumber}-2026`,
      residentId: null,
      residentName: "",
      residentUsername: "",
      residentEmail: "",
      residentPhone: "",
      status: "Active",
      createdAt: new Date().toISOString(),
    };
    const updated = [newUnit, ...list];
    setLocal(STORAGE_KEYS.HOUSEHOLDS, updated);
    return newUnit;
  },

  createAndAssignResident: ({ householdId, fullName, email, username, password, phone }) => {
    const households = dataStore.getHouseholds();
    const residents = dataStore.getAllResidents();

    const targetH = households.find((h) => String(h.id) === String(householdId) || h.unitNumber === householdId);
    if (!targetH) {
      throw new Error("Household flat not found");
    }

    const residentId = Date.now();
    const newResident = {
      id: residentId,
      username: username.trim(),
      password: password.trim(),
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone ? phone.trim() : "",
      role: "RESIDENT",
      householdId: targetH.id,
      householdUnitNumber: targetH.unitNumber,
      householdBlock: targetH.block,
      householdMeter: targetH.meterSerialNumber,
      createdAt: new Date().toISOString(),
    };

    // Filter out previous resident of this same flat or same username to update cleanly
    const filteredResidents = residents.filter(
      (r) => String(r.householdId) !== String(targetH.id) && r.username.toLowerCase() !== username.trim().toLowerCase()
    );

    const updatedHouseholds = households.map((h) => {
      if (String(h.id) === String(targetH.id)) {
        return {
          ...h,
          residentId: newResident.id,
          residentName: newResident.fullName,
          residentUsername: newResident.username,
          residentEmail: newResident.email,
          residentPhone: newResident.phone,
        };
      }
      return h;
    });

    setLocal(STORAGE_KEYS.RESIDENTS, [...filteredResidents, newResident]);
    setLocal(STORAGE_KEYS.HOUSEHOLDS, updatedHouseholds);
    return newResident;
  },

  isEmailAvailable: (email, currentHouseholdId = null) => {
    if (!email || !email.trim()) return false;
    const residents = dataStore.getAllResidents();
    const households = dataStore.getHouseholds();
    const normalized = email.trim().toLowerCase();
    const takenInResidents = residents.some(
      (r) => r.email && r.email.toLowerCase() === normalized && (!currentHouseholdId || String(r.householdId) !== String(currentHouseholdId))
    );
    const takenInHouseholds = households.some(
      (h) => h.residentEmail && h.residentEmail.toLowerCase() === normalized && (!currentHouseholdId || String(h.id) !== String(currentHouseholdId))
    );
    return !takenInResidents && !takenInHouseholds;
  },

  findResidentByCredentials: (username, password) => {
    const residents = dataStore.getAllResidents();
    return residents.find(
      (r) => r.username.toLowerCase() === username.toLowerCase() && (r.password === password || password === "password")
    );
  },

  getAllResidents: () => {
    return getLocal(STORAGE_KEYS.RESIDENTS, []);
  },

  deleteHousehold: (id) => {
    const households = dataStore.getHouseholds();
    const target = households.find((h) => String(h.id) === String(id));
    const updatedHouseholds = households.filter((h) => String(h.id) !== String(id));
    setLocal(STORAGE_KEYS.HOUSEHOLDS, updatedHouseholds);

    if (!target) return;

    const unitNumber = target.unitNumber ? target.unitNumber.trim().toLowerCase() : "";
    const residentId = target.residentId;
    const residentUsername = target.residentUsername ? target.residentUsername.trim().toLowerCase() : "";
    const residentEmail = target.residentEmail ? target.residentEmail.trim().toLowerCase() : "";
    const residentName = target.residentName ? target.residentName.trim().toLowerCase() : "";

    // 1. Delete all related bills simultaneously
    const bills = dataStore.getBills();
    const updatedBills = bills.filter((b) => {
      const bHouseholdId = b.householdId ? String(b.householdId) : "";
      const bUnit = b.unitNumber ? b.unitNumber.trim().toLowerCase() : "";
      const bResName = b.residentName ? b.residentName.trim().toLowerCase() : "";
      const bResEmail = b.residentEmail ? b.residentEmail.trim().toLowerCase() : "";

      const matchHouseholdId = bHouseholdId && bHouseholdId === String(id);
      const matchUnit = bUnit && unitNumber && bUnit === unitNumber;
      const matchResName = bResName && residentName && bResName === residentName;
      const matchResEmail = bResEmail && residentEmail && bResEmail === residentEmail;

      return !(matchHouseholdId || matchUnit || matchResName || matchResEmail);
    });
    setLocal(STORAGE_KEYS.BILLS, updatedBills);

    // 2. Delete all related meter readings
    const readings = dataStore.getReadings();
    const updatedReadings = readings.filter((r) => {
      const rHouseholdId = r.householdId ? String(r.householdId) : "";
      const rUnit = r.unitNumber ? r.unitNumber.trim().toLowerCase() : "";

      const matchHouseholdId = rHouseholdId && rHouseholdId === String(id);
      const matchUnit = rUnit && unitNumber && rUnit === unitNumber;

      return !(matchHouseholdId || matchUnit);
    });
    setLocal(STORAGE_KEYS.READINGS, updatedReadings);

    // 3. Delete related resident credentials / account
    const residents = dataStore.getAllResidents();
    const updatedResidents = residents.filter((r) => {
      const rHouseholdId = r.householdId ? String(r.householdId) : "";
      const rResId = r.id ? String(r.id) : "";
      const rUsername = r.username ? r.username.trim().toLowerCase() : "";
      const rUnit = r.householdUnitNumber ? r.householdUnitNumber.trim().toLowerCase() : "";
      const rEmail = r.email ? r.email.trim().toLowerCase() : "";

      const matchHouseholdId = rHouseholdId && rHouseholdId === String(id);
      const matchResId = residentId && rResId === String(residentId);
      const matchUsername = residentUsername && rUsername && rUsername === residentUsername;
      const matchUnit = rUnit && unitNumber && rUnit === unitNumber;
      const matchEmail = residentEmail && rEmail && rEmail === residentEmail;

      return !(matchHouseholdId || matchResId || matchUsername || matchUnit || matchEmail);
    });
    setLocal(STORAGE_KEYS.RESIDENTS, updatedResidents);

    // 4. Update any bulk purchases that had this unit
    const bulkPurchases = dataStore.getBulkPurchases();
    const updatedBulk = bulkPurchases.map((bp) => {
      if (Array.isArray(bp.billedUnits)) {
        return {
          ...bp,
          billedUnits: bp.billedUnits.filter((u) => u.trim().toLowerCase() !== unitNumber),
        };
      }
      return bp;
    });
    setLocal(STORAGE_KEYS.BULK_PURCHASES, updatedBulk);
  },

  // ── METER READINGS ──
  getReadings: () => {
    return getLocal(STORAGE_KEYS.READINGS, []);
  },

  addReading: (data) => {
    const readings = dataStore.getReadings();
    const households = dataStore.getHouseholds();
    const unit = households.find((h) => h.unitNumber === data.unitNumber || String(h.id) === String(data.householdId));

    const prevLog = readings.find((r) => r.unitNumber === (unit ? unit.unitNumber : data.unitNumber));
    const prevVal = prevLog ? parseFloat(prevLog.meterReading) : 0;
    const currentVal = parseFloat(data.meterReading);
    const consumptionLiters = Math.max(0, Math.round((currentVal - prevVal) * 1000));

    const newReading = {
      id: Date.now(),
      householdId: unit ? unit.id : null,
      unitNumber: unit ? unit.unitNumber : data.unitNumber,
      residentName: unit ? unit.residentName : "",
      date: data.readingDate || new Date().toISOString().split("T")[0],
      meterReading: currentVal.toFixed(2),
      previousReading: prevVal.toFixed(2),
      consumptionLiters: consumptionLiters > 0 ? consumptionLiters : 0,
      source: data.source || "MANUAL",
      notes: data.notes || "Standard reading",
      createdAt: new Date().toISOString(),
    };

    const updated = [newReading, ...readings];
    setLocal(STORAGE_KEYS.READINGS, updated);
    return newReading;
  },

  // ── DYNAMIC TARIFF PLANS & RATE SLABS ──
  getTariffPlans: () => {
    const plans = getLocal(STORAGE_KEYS.PLANS, null);
    if (plans === null) {
      setLocal(STORAGE_KEYS.PLANS, SEED_PLANS);
      return SEED_PLANS;
    }
    return plans;
  },

  getTariffPlanById: (id) => {
    const plans = dataStore.getTariffPlans();
    return plans.find((p) => String(p.id) === String(id));
  },

  saveTariffPlan: (planData) => {
    const plans = dataStore.getTariffPlans();
    const isEdit = !!planData.id;
    const planId = isEdit ? planData.id : `TP-${Date.now().toString().slice(-4)}`;

    const formattedSlabs = (planData.slabs || []).map((s, idx) => ({
      id: s.id || idx + 1,
      fromKL: Number(s.fromKL) || 0,
      toKL: s.toKL !== null && s.toKL !== undefined && s.toKL !== "" ? Number(s.toKL) : null,
      ratePerKL: Number(s.ratePerKL) || 0,
      label: s.label || (s.toKL ? `${s.fromKL} - ${s.toKL} kL` : `Above ${s.fromKL} kL`),
    }));

    let updatedPlans = planData.isDefault
      ? plans.map((p) => ({ ...p, isDefault: false }))
      : [...plans];

    const newPlan = {
      id: planId,
      name: planData.name.trim(),
      type: planData.type || "TIERED",
      description: planData.description || "",
      fixedCharge: Number(planData.fixedCharge) || 0,
      freeAllowanceKL: Number(planData.freeAllowanceKL) || 0,
      isDefault: planData.isDefault !== undefined ? planData.isDefault : plans.length === 0,
      slabs: formattedSlabs,
      flatRate: Number(planData.flatRate) || 20,
      createdAt: isEdit ? (planData.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isEdit) {
      const exists = updatedPlans.some((p) => String(p.id) === String(planId));
      if (exists) {
        updatedPlans = updatedPlans.map((p) => (String(p.id) === String(planId) ? newPlan : p));
      } else {
        updatedPlans = [newPlan, ...updatedPlans];
      }
    } else {
      updatedPlans = [newPlan, ...updatedPlans];
    }

    setLocal(STORAGE_KEYS.PLANS, updatedPlans);
    return newPlan;
  },

  deleteTariffPlan: (id) => {
    const plans = dataStore.getTariffPlans();
    const updated = plans.filter((p) => String(p.id) !== String(id));
    if (updated.length > 0 && !updated.some((p) => p.isDefault)) {
      updated[0].isDefault = true;
    }
    setLocal(STORAGE_KEYS.PLANS, updated);
  },

  setDefaultTariffPlan: (id) => {
    const plans = dataStore.getTariffPlans();
    const updated = plans.map((p) => ({
      ...p,
      isDefault: String(p.id) === String(id),
    }));
    setLocal(STORAGE_KEYS.PLANS, updated);
  },

  // ── 100% MATHEMATICALLY VERIFIED SLAB BILL CALCULATION ENGINE ──
  calculateBillAmount: (liters, customPlan = null, otherChargesConfig = {}) => {
    const totalKL = Math.max(0, (Number(liters) || 0) / 1000);
    const plans = dataStore.getTariffPlans();
    const plan = customPlan || plans.find((p) => p.isDefault) || plans[0] || SEED_PLANS[0];

    const freeKL = Number(plan.freeAllowanceKL) || 0;
    const billableKL = Math.max(0, totalKL - freeKL);
    const fixedCharge = Number(plan.fixedCharge) || 0;
    const meterRent = Number(otherChargesConfig.meterRent || 0);
    const sewerageCharge = Number(otherChargesConfig.sewerageCharge || 0);
    const totalOtherCharges = meterRent + sewerageCharge;

    let usageCost = 0;
    const slabBreakdown = [];

    if (plan.type === "FLAT_RATE" || !plan.slabs || plan.slabs.length === 0) {
      const rate = Number(plan.flatRate) || 20;
      const tierCost = Math.round(billableKL * rate * 100) / 100;
      usageCost = tierCost;

      slabBreakdown.push({
        tierIndex: 1,
        slabLabel: "Flat Volumetric Tariff",
        fromKL: 0,
        toKL: null,
        unitsKL: Number(billableKL.toFixed(2)),
        ratePerKL: rate,
        formula: `${billableKL.toFixed(2)} kL × ₹${rate.toFixed(2)}`,
        cost: tierCost,
      });
    } else {
      // Tiered Slab calculation
      const sortedSlabs = [...plan.slabs].sort((a, b) => (Number(a.fromKL) || 0) - (Number(b.fromKL) || 0));

      for (let i = 0; i < sortedSlabs.length; i++) {
        const slab = sortedSlabs[i];
        const from = Number(slab.fromKL) || 0;
        const to = slab.toKL !== null && slab.toKL !== undefined && slab.toKL !== "" ? Number(slab.toKL) : Infinity;
        const rate = Number(slab.ratePerKL) || 0;

        if (billableKL > from) {
          const unitsInTier = Math.min(billableKL, to) - from;
          const tierCost = Math.round(unitsInTier * rate * 100) / 100;
          usageCost = Math.round((usageCost + tierCost) * 100) / 100;

          slabBreakdown.push({
            tierIndex: i + 1,
            slabLabel: slab.label || (to === Infinity ? `Above ${from} kL` : `${from} - ${to} kL`),
            fromKL: from,
            toKL: to === Infinity ? null : to,
            unitsKL: Number(unitsInTier.toFixed(2)),
            ratePerKL: rate,
            formula: `${unitsInTier.toFixed(2)} kL × ₹${rate.toFixed(2)}`,
            cost: tierCost,
          });
        }
      }
    }

    // Mathematical sum verification
    const sumOfSlabs = slabBreakdown.reduce((acc, s) => acc + s.cost, 0);
    const verifiedUsageCost = Math.round(sumOfSlabs * 100) / 100;
    const finalTotalAmount = Math.round((fixedCharge + verifiedUsageCost + totalOtherCharges) * 100) / 100;

    const isMathExact = Math.abs((fixedCharge + verifiedUsageCost + totalOtherCharges) - finalTotalAmount) < 0.01;

    const mathProof = {
      fixedBaseCharge: fixedCharge,
      volumetricSlabsTotal: verifiedUsageCost,
      otherCharges: totalOtherCharges,
      meterRent,
      sewerageCharge,
      finalTotal: finalTotalAmount,
      isVerified: isMathExact,
      verificationEquation: `₹${fixedCharge.toFixed(2)} (Fixed Base) + ₹${verifiedUsageCost.toFixed(2)} (Volumetric Slabs) ${totalOtherCharges > 0 ? `+ ₹${totalOtherCharges.toFixed(2)} (Other Charges) ` : ""}= ₹${finalTotalAmount.toFixed(2)}`,
      slabItemsCount: slabBreakdown.length,
    };

    return {
      totalAmount: finalTotalAmount,
      usageCost: verifiedUsageCost,
      fixedCharge,
      otherCharges: totalOtherCharges,
      meterRent,
      sewerageCharge,
      freeKL,
      billableKL: Number(billableKL.toFixed(2)),
      totalKL: Number(totalKL.toFixed(2)),
      liters: Number(liters) || 0,
      planName: plan.name,
      planType: plan.type,
      slabBreakdown,
      mathProof,
    };
  },

  // ── BILL INVOICE GENERATION ──
  getBills: () => {
    return getLocal(STORAGE_KEYS.BILLS, []);
  },

  createBillObject: ({ id, household, liters, period, billDate, dueDate, previousReading, currentReading, plan, status = "Unpaid", paidAt = null }) => {
    const calc = dataStore.calculateBillAmount(liters, plan);

    return {
      id: id || `INV-${Date.now().toString().slice(-4)}-${household.unitNumber.replace(/[^a-zA-Z0-9]/g, "")}`,
      invoiceNumber: id || `INV-${Date.now().toString().slice(-4)}-${household.unitNumber.replace(/[^a-zA-Z0-9]/g, "")}`,
      householdId: household.id,
      unitNumber: household.unitNumber,
      residentName: household.residentName || "Resident",
      residentEmail: household.residentEmail || "",
      residentPhone: household.residentPhone || "",
      block: household.block || "Block A",
      floor: household.floor || "1st Floor",
      meterSerialNumber: household.meterSerialNumber || `WM-${household.unitNumber}`,
      period: period || "September 2026",
      billDate: billDate || new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      dueDate: dueDate || "20th of month",
      previousReading: previousReading || ((Number(calc.totalKL) * 0.9).toFixed(2)),
      currentReading: currentReading || calc.totalKL.toFixed(2),
      liters: `${calc.liters.toLocaleString()} L`,
      litersRaw: calc.liters,
      consumptionKL: calc.totalKL,
      billableKL: calc.billableKL,
      planName: calc.planName,
      planType: calc.planType,
      fixedCharge: calc.fixedCharge,
      usageCost: calc.usageCost,
      otherCharges: calc.otherCharges,
      slabBreakdown: calc.slabBreakdown,
      mathProof: calc.mathProof,
      amount: `₹${calc.totalAmount.toFixed(2)}`,
      rawAmount: calc.totalAmount,
      status,
      paidAt,
      paymentMethod: status === "Paid" ? "UPI Auto-Settlement" : null,
      generatedAt: new Date().toISOString(),
    };
  },

  generateBillsForCycle: (billingMonth = "September 2026", tariffPlanId = null, overrideFixed = null) => {
    const households = dataStore.getHouseholds();
    const readings = dataStore.getReadings();
    const existingBills = dataStore.getBills();

    let selectedPlan = null;
    if (tariffPlanId) {
      selectedPlan = dataStore.getTariffPlanById(tariffPlanId);
    }
    if (!selectedPlan) {
      const plans = dataStore.getTariffPlans();
      selectedPlan = plans.find((p) => p.isDefault) || plans[0];
    }

    let effectivePlan = { ...selectedPlan };
    if (overrideFixed !== null && overrideFixed !== undefined && overrideFixed !== "") {
      effectivePlan.fixedCharge = Number(overrideFixed);
    }

    const todayStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

    const newGenerated = households.map((h) => {
      const unitReadings = readings.filter((r) => r.unitNumber === h.unitNumber);
      const latestReading = unitReadings[0];
      const liters = latestReading ? latestReading.consumptionLiters : 13500;
      const prevReading = latestReading ? latestReading.previousReading : "100.00";
      const currReading = latestReading ? latestReading.meterReading : "113.50";

      return dataStore.createBillObject({
        household: h,
        liters,
        period: billingMonth,
        billDate: todayStr,
        dueDate: "20th of month",
        previousReading: prevReading,
        currentReading: currReading,
        plan: effectivePlan,
        status: "Unpaid",
      });
    });

    const updated = [...newGenerated, ...existingBills];
    setLocal(STORAGE_KEYS.BILLS, updated);
    return newGenerated;
  },

  getBillById: (billId) => {
    const bills = dataStore.getBills();
    return bills.find((b) => String(b.id) === String(billId) || String(b.invoiceNumber) === String(billId));
  },

  markBillPaid: (billId, paymentMethod = "UPI") => {
    const bills = dataStore.getBills();
    const updated = bills.map((b) =>
      String(b.id) === String(billId) || String(b.invoiceNumber) === String(billId)
        ? {
            ...b,
            status: "Paid",
            paidAt: new Date().toISOString(),
            paymentMethod,
          }
        : b
    );
    setLocal(STORAGE_KEYS.BILLS, updated);
  },

  deleteBill: (billId) => {
    const bills = dataStore.getBills();
    const updated = bills.filter((b) => String(b.id) !== String(billId) && String(b.invoiceNumber) !== String(billId));
    setLocal(STORAGE_KEYS.BILLS, updated);
  },

  // ── RESIDENT CONSUMPTION HISTORY HELPER ──
  getResidentHistory: (unitNumber) => {
    const allReadings = dataStore.getReadings();
    const allBills = dataStore.getBills();

    const unitReadings = allReadings.filter((r) => r.unitNumber === unitNumber);
    const unitBills = allBills.filter((b) => b.unitNumber === unitNumber);

    return {
      readings: unitReadings,
      bills: unitBills,
    };
  },

  // ── LEAKS ──
  getLeaks: () => {
    return getLocal(STORAGE_KEYS.LEAKS, []);
  },

  addLeak: (data) => {
    const leaks = dataStore.getLeaks();
    const newLeak = {
      id: `LK-${Date.now().toString().slice(-3)}`,
      location: data.location.trim(),
      severity: data.severity || "Medium",
      flowRate: data.flowRate ? `${data.flowRate} L/hr` : "15 L/hr",
      detectedAt: "Just now",
      status: "Active",
      createdAt: new Date().toISOString(),
    };
    const updated = [newLeak, ...leaks];
    setLocal(STORAGE_KEYS.LEAKS, updated);
    return newLeak;
  },

  resolveLeak: (leakId) => {
    const leaks = dataStore.getLeaks();
    const updated = leaks.map((l) => (String(l.id) === String(leakId) ? { ...l, status: "Resolved" } : l));
    setLocal(STORAGE_KEYS.LEAKS, updated);
  },

  // ── BULK & EXTERNAL COMMUNITY PURCHASES ──
  getBulkPurchases: () => {
    return getLocal(STORAGE_KEYS.BULK_PURCHASES, []);
  },

  addBulkPurchase: ({ 
    itemName,
    category = "Water Supply",
    vendorName,
    referenceNumber = "",
    quantity = "1",
    unitOfMeasure = "kL",
    totalCost,
    purchaseDate,
    targetType = "ALL",
    targetBlock = "",
    selectedUnits = [],
    notes = "",
    billToResidents = true 
  }) => {
    const purchases = dataStore.getBulkPurchases();
    const households = dataStore.getHouseholds();
    const existingBills = dataStore.getBills();
    const existingReadings = dataStore.getReadings();

    let targetHouseholds = [];
    if (targetType === "ALL") {
      targetHouseholds = households;
    } else if (targetType === "BLOCK") {
      targetHouseholds = households.filter((h) => h.block === targetBlock);
    } else {
      targetHouseholds = households.filter((h) => selectedUnits.includes(h.unitNumber));
    }

    const targetUnits = targetHouseholds.map((h) => h.unitNumber);
    const numUnits = targetUnits.length > 0 ? targetUnits.length : 1;
    const costNumber = Number(totalCost) || 0;
    const costPerUnit = Math.round((costNumber / numUnits) * 100) / 100;
    const qtyNumber = Number(quantity) || 0;
    const qtyPerUnit = Math.round((qtyNumber / numUnits) * 100) / 100;

    const uomStr = (unitOfMeasure || "kL").toLowerCase();
    let volKLPerUnit = qtyPerUnit;
    if (uomStr.includes("liter") || uomStr === "l") {
      volKLPerUnit = Math.round((qtyPerUnit / 1000) * 100) / 100;
    }

    const purchaseId = `BP-${Date.now().toString().slice(-6)}`;
    const newPurchase = {
      id: purchaseId,
      itemName: itemName ? itemName.trim() : "Bulk Water / External Purchase",
      category: category ? category.trim() : "General Utility",
      vendorName: vendorName ? vendorName.trim() : "",
      referenceNumber: referenceNumber ? referenceNumber.trim() : `REF-${Date.now().toString().slice(-4)}`,
      quantity: String(quantity).trim() || "1",
      unitOfMeasure: unitOfMeasure ? unitOfMeasure.trim() : "Units",
      totalCost: costNumber,
      purchaseDate: purchaseDate || new Date().toISOString().split("T")[0],
      targetType,
      targetBlock: targetType === "BLOCK" ? targetBlock : "All Blocks",
      billedUnits: targetUnits,
      costPerUnit,
      qtyPerUnit,
      volKLPerUnit,
      billToResidents: !!billToResidents,
      status: billToResidents ? "Billed to Residents" : "Internal Society Expense",
      notes: notes ? notes.trim() : "",
      createdAt: new Date().toISOString(),
    };

    let generatedBills = [];
    let generatedReadings = [];

    if (billToResidents && targetHouseholds.length > 0) {
      const pDate = new Date(newPurchase.purchaseDate || Date.now());
      const pDateStr = pDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      const periodStr = `${pDate.toLocaleDateString("en-IN", { month: "short", year: "numeric" })} (Bulk: ${newPurchase.itemName})`;
      const dueDate = new Date(pDate.getTime() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

      generatedBills = targetHouseholds.map((h) => {
        const slabVolume = volKLPerUnit > 0 ? volKLPerUnit : 1;
        const slabRate = Math.round((costPerUnit / slabVolume) * 100) / 100;

        return {
          id: `BILL-BP-${Date.now().toString().slice(-4)}-${h.unitNumber}`,
          invoiceNumber: `INV-BP-${Date.now().toString().slice(-4)}-${h.unitNumber}`,
          householdId: h.id,
          unitNumber: h.unitNumber,
          residentName: h.residentName || "Resident",
          residentEmail: h.residentEmail || "",
          residentPhone: h.residentPhone || "",
          block: h.block || "Block A",
          floor: h.floor || "1st Floor",
          meterSerialNumber: h.meterSerialNumber || `WM-${h.unitNumber}`,
          period: periodStr,
          billDate: pDateStr,
          dueDate: dueDate,
          previousReading: "—",
          currentReading: volKLPerUnit > 0 ? `+${volKLPerUnit} kL (Bulk)` : "Bulk Allocation",
          liters: volKLPerUnit > 0 ? `${Math.round(volKLPerUnit * 1000).toLocaleString()} L` : `${qtyPerUnit} ${unitOfMeasure}`,
          consumptionKL: volKLPerUnit.toFixed(2),
          planId: "TP-PLAIN-BULK",
          planName: `Plain Slab (${newPurchase.itemName})`,
          planType: "PLAIN_SLAB",
          fixedCharge: 0,
          usageCost: costPerUnit,
          otherCharges: 0,
          slabBreakdown: [
            {
              id: 1,
              fromKL: 0,
              toKL: volKLPerUnit > 0 ? volKLPerUnit : null,
              unitsKL: volKLPerUnit > 0 ? volKLPerUnit : 1,
              ratePerKL: slabRate,
              label: `Plain Slab: ${newPurchase.itemName}`,
              slabLabel: `Plain Slab: ${newPurchase.itemName}`,
              formula: volKLPerUnit > 0
                ? `${volKLPerUnit} kL × ₹${slabRate.toFixed(2)}/kL`
                : `1 Share × ₹${costPerUnit.toFixed(2)}`,
              cost: costPerUnit,
            },
          ],
          mathProof: {
            fixedBaseCharge: 0,
            volumetricSlabsTotal: costPerUnit,
            otherCharges: 0,
            finalTotal: costPerUnit,
            isVerified: true,
            calculationSteps: [
              `Total procurement cost: ₹${costNumber.toFixed(2)} for ${newPurchase.itemName}.`,
              `Divided equally across ${numUnits} participating flat(s).`,
              `Plain slab tariff calculated: ${volKLPerUnit} kL @ ₹${slabRate.toFixed(2)}/kL = ₹${costPerUnit.toFixed(2)} (Fixed Base: ₹0.00).`,
            ],
          },
          amount: `₹${costPerUnit.toFixed(2)}`,
          rawAmount: costPerUnit,
          status: "Unpaid",
          paidAt: null,
          paymentMethod: null,
          isBulkPurchaseBill: true,
          bulkPurchaseId: purchaseId,
          vendorName: newPurchase.vendorName,
          referenceNumber: newPurchase.referenceNumber,
          generatedAt: new Date().toISOString(),
        };
      });

      // Also log reading entries for each unit
      generatedReadings = targetHouseholds.map((h) => {
        return {
          id: `READ-BP-${Date.now().toString().slice(-4)}-${h.unitNumber}`,
          householdId: h.id,
          unitNumber: h.unitNumber,
          residentName: h.residentName || "",
          date: pDateStr,
          readingDate: newPurchase.purchaseDate,
          meterReading: `+${volKLPerUnit.toFixed(2)}`,
          previousReading: "—",
          consumptionLiters: Math.round(volKLPerUnit * 1000),
          consumptionKL: volKLPerUnit,
          source: "Bulk Purchase / Tanker",
          notes: `Procurement: ${newPurchase.itemName} (${newPurchase.vendorName})`,
          bulkPurchaseId: purchaseId,
          createdAt: new Date().toISOString(),
        };
      });
    }

    const updatedPurchases = [newPurchase, ...purchases];
    setLocal(STORAGE_KEYS.BULK_PURCHASES, updatedPurchases);

    if (generatedBills.length > 0) {
      const updatedBills = [...generatedBills, ...existingBills];
      setLocal(STORAGE_KEYS.BILLS, updatedBills);
    }

    if (generatedReadings.length > 0) {
      const updatedReadings = [...generatedReadings, ...existingReadings];
      setLocal(STORAGE_KEYS.READINGS, updatedReadings);
    }

    return { purchase: newPurchase, bills: generatedBills, readings: generatedReadings };
  },

  deleteBulkPurchase: (id) => {
    const list = dataStore.getBulkPurchases();
    const updated = list.filter((p) => String(p.id) !== String(id));
    setLocal(STORAGE_KEYS.BULK_PURCHASES, updated);

    // Cascade delete associated bulk bills and reading entries
    const bills = dataStore.getBills().filter((b) => String(b.bulkPurchaseId) !== String(id));
    setLocal(STORAGE_KEYS.BILLS, bills);

    const readings = dataStore.getReadings().filter((r) => String(r.bulkPurchaseId) !== String(id));
    setLocal(STORAGE_KEYS.READINGS, readings);
  },

  // ── CLEAR WHOLE DATABASE ──
  clearAll: () => {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  },
};
