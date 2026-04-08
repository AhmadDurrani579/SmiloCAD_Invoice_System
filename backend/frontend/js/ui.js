/* ─────────────────────────────────────────
   js/ui.js  —  UI helpers & shared utils
   ───────────────────────────────────────── */

/* Show a toast notification
   type: "success" | "error" | "info"        */
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

/* Format a number with commas (no currency prefix) */
function fmtNum(n) {
  return (Number(n) || 0).toLocaleString("en-PK");
}

/* Return today's date as YYYY-MM-DD */
function todayStr() {
  return new Date().toISOString().split("T")[0];
}

/* Show/hide the two main pages and set the active tab */
function switchPage(page) {
  document.getElementById("page-invoice").style.display = (page === "invoice") ? "" : "none";
  document.getElementById("page-history").style.display = (page === "history") ? "" : "none";

  document.getElementById("tab-invoice").classList.toggle("active", page === "invoice");
  document.getElementById("tab-history").classList.toggle("active", page === "history");
}

/* Update the live invoice number & status badge in the header band */
function updateHeaderBadge() {
  var num    = document.getElementById("inv-number").value || "INV-0001";
  var status = document.getElementById("inv-status").value || "Pending";

  document.getElementById("display-inv-number").textContent = "#" + num;

  var badge = document.getElementById("display-status");
  badge.textContent = status;
  badge.className   = "status-badge status-" + status.toLowerCase();
}

/* Wire up live badge updates once DOM is ready */
document.addEventListener("DOMContentLoaded", function() {
  document.getElementById("inv-number").addEventListener("input",  updateHeaderBadge);
  document.getElementById("inv-status").addEventListener("change", updateHeaderBadge);
});
