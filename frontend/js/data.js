/* ─────────────────────────────────────────
   js/data.js  —  All static data constants
   ───────────────────────────────────────── */

const LAB = {
  name:    "SmiloCAD Dental Laboratory",
  phone:   "0328-9577771",
  address: "Al Anayat Plaza, G11 Markaz Islamabad",
  tech:    "Dt. Sajid",
};

const SERVICES = [
  "Veneer",
  "Zirconium Crown",
  "Zirconium Implant",
  "PFM Crown",
  "PFM Implant",
  "D-sign Porcelain",
  "Night Guard",
  "Retainer",
  "Bleaching Tary",
  "Soft Denture",
  "EMAX Veneer",
  "EMAX Crown",
  "Zirconium bridge + I bar"
];
// Expose globally so rows.js can always access it
window.SERVICES = SERVICES;

const DOCTORS = [
  "Dr. Haroon Shah",
  "Dr. Ahmad Raza",
  "Dr. Sara Khan",
  "Dr. Imran Ali",
  "Dr. Fatima Malik",
  "Other",
];

const SHADES = [
  "—","A1","A2","A3","A3.5","A4",
  "B1","B2","B3","B4",
  "C1","C2","C3","C4",
  "D2","D3","D4",
  "BL1","BL2","BL3","BL4","Custom",
];
