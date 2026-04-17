/* ─────────────────────────────────────────
   js/ui.js  —  UI helpers & shared utils
   ───────────────────────────────────────── */

/* Show a toast notification */
function showToast(msg, type) {
  type = type || "success";
  var el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.className   = "show " + type;
  clearTimeout(el._timer);
  el._timer = setTimeout(function() { el.className = ""; }, 3000);
}

/* Format a number as PKR currency */
function fmt(n) {
  return "PKR " + (Number(n) || 0).toLocaleString("en-PK", { minimumFractionDigits: 0 });
}

/* Format a number with commas */
function fmtNum(n) {
  return (Number(n) || 0).toLocaleString("en-PK");
}

/* Return today's date as YYYY-MM-DD */
function todayStr() {
  return new Date().toISOString().split("T")[0];
}

/* Show/hide pages */
function switchPage(page) {
  const invPage = document.getElementById("page-invoice");
  const histPage = document.getElementById("page-history");
  const invTab = document.getElementById("tab-invoice");
  const histTab = document.getElementById("tab-history");

  if (invPage) invPage.style.display = (page === "invoice") ? "" : "none";
  if (histPage) histPage.style.display = (page === "history") ? "" : "none";

  if (invTab) invTab.classList.toggle("active", page === "invoice");
  if (histTab) histTab.classList.toggle("active", page === "history");
}

/* Update the live invoice number badge in the header */
function updateHeaderBadge() {
  const numInput = document.getElementById("inv-number");
  const displayPill = document.getElementById("display-inv-number");

  if (numInput && displayPill) {
    const val = numInput.value;
    // Show "NEW" if it hasn't been saved to Neon yet
    const displayNum = (val === "Auto-Generated" || !val) ? "NEW" : val;
    displayPill.textContent = "#" + displayNum;
  }
}

/* Wire up listeners */
document.addEventListener("DOMContentLoaded", function() {
  const invNumEl = document.getElementById("inv-number");
  
  // Update badge whenever the invoice number changes (e.g., after saving)
  if (invNumEl) {
    invNumEl.addEventListener("change", updateHeaderBadge);
    // Initial call to set badge to #NEW
    updateHeaderBadge();
  }
});