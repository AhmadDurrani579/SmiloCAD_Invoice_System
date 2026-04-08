/* ─────────────────────────────────────────
   js/ui.js  —  UI helpers & shared utils
   ───────────────────────────────────────── */

/* Show a toast notification */
function showToast(msg, type) {
  type = type || "success";
  var el = document.getElementById("toast");
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
  document.getElementById("page-invoice").style.display = (page === "invoice") ? "" : "none";
  document.getElementById("page-history").style.display = (page === "history") ? "" : "none";

  document.getElementById("tab-invoice").classList.toggle("active", page === "invoice");
  document.getElementById("tab-history").classList.toggle("active", page === "history");
}

/* Update the live invoice number & status badge */
function updateHeaderBadge() {
  var numInput = document.getElementById("inv-number").value;
  // If the DB hasn't assigned a number yet, show "NEW" in the badge
  var displayNum = (numInput === "Auto-Generated") ? "NEW" : numInput;
  
  var status = document.getElementById("inv-status").value || "Pending";

  document.getElementById("display-inv-number").textContent = "#" + displayNum;

  var badge = document.getElementById("display-status");
  badge.textContent = status;
  badge.className   = "status-badge status-" + status.toLowerCase();
}

/* Wire up listeners */
document.addEventListener("DOMContentLoaded", function() {
  // Listen for the DB update when the invoice is saved
  document.getElementById("inv-number").addEventListener("change", updateHeaderBadge);
  document.getElementById("inv-status").addEventListener("change", updateHeaderBadge);
});