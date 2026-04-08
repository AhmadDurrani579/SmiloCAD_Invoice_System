/* ─────────────────────────────────────────
   js/app.js  —  Main application controller
   ───────────────────────────────────────── */

var App = (function() {

  var _currentId = null;   // id of the invoice being edited (null = new)

  /* ── Collect all form values into one plain object ── */
  function _collect() {
    var subtotal  = Rows.subtotal();
    var received  = parseFloat(document.getElementById("received-input").value) || 0;

    return {
      invNumber: document.getElementById("inv-number").value,
      invDate:   document.getElementById("inv-date").value,
      doctor:    document.getElementById("doctor-name").value,
      clinic:    document.getElementById("clinic").value,
      patient:   document.getElementById("patient").value,
      shade:     document.getElementById("shade").value,
      status:    document.getElementById("inv-status").value,
      rows:      Rows.collect(),
      subtotal:  subtotal,
      received:  received,
      remaining: subtotal - received,
      notes:     document.getElementById("notes").value,
      savedAt:   new Date().toISOString(),
    };
  }

  /* ── Populate all form fields from a saved invoice object ── */
  function _populate(inv) {
    document.getElementById("inv-number").value  = inv.invNumber || "";
    document.getElementById("inv-date").value    = inv.invDate   || "";
    document.getElementById("inv-status").value  = inv.status    || "Pending";
    document.getElementById("doctor-name").value = inv.doctor    || "";
    document.getElementById("clinic").value      = inv.clinic    || "";
    document.getElementById("patient").value     = inv.patient   || "";
    document.getElementById("shade").value       = inv.shade     || "";
    document.getElementById("notes").value       = inv.notes     || "";
    document.getElementById("received-input").value = inv.received != null ? inv.received : "";

    Rows.load(inv.rows || []);
    updateHeaderBadge();
  }

  /* ── Generate the next invoice number from DB count ── */
  async function _nextInvNumber() {
    var all  = await dbAll();
    var next = String(all.length + 1).padStart(4, "0");
    return "INV-" + next;
  }

  /* ── Reset form to a blank new invoice ── */
  async function _resetForm() {
    _currentId = null;
    var num = await _nextInvNumber();
    document.getElementById("inv-number").value  = num;
    document.getElementById("inv-date").value    = todayStr();
    document.getElementById("inv-status").value  = "Pending";
    document.getElementById("doctor-name").value = "";
    document.getElementById("clinic").value   = "";
    document.getElementById("patient").value  = "";
    document.getElementById("shade").value    = "";
    document.getElementById("notes").value    = "";
    document.getElementById("received-input").value = "";
    Rows.reset();
    updateHeaderBadge();
  }

  /* ────────────────────────────────────────
     PUBLIC METHODS
     ──────────────────────────────────────── */

  /* Switch visible page */
  function showPage(page) {
    switchPage(page);
    if (page === "history") History.load();
  }

  /* Save current invoice */
  async function save() {
    var data = _collect();
    if (_currentId) data.id = _currentId;
    var id = await dbSave(data);
    _currentId = data.id || id;
    showToast("✅ Invoice saved successfully!", "success");
  }

  /* New blank invoice */
  async function newInvoice() {
    await _resetForm();
    showPage("invoice");
    showToast("📄 New invoice ready", "info");
  }

  /* Clear the current form fields (keep invoice number & date) */
  function clear() {
    if (!confirm("Clear the current form?")) return;
    document.getElementById("doctor-name").value = "";
    document.getElementById("clinic").value   = "";
    document.getElementById("patient").value  = "";
    document.getElementById("shade").value    = "";
    document.getElementById("inv-status").value = "Pending";
    document.getElementById("notes").value    = "";
    document.getElementById("received-input").value = "";
    Rows.reset();
    updateHeaderBadge();
    showToast("🗑️ Form cleared", "info");
  }

  /* Print the invoice */
  function print() {
    showPage("invoice");
    setTimeout(function() { window.print(); }, 200);
  }

  /* Download as PDF (uses browser print dialog) */
  function downloadPDF() {
    showToast("📄 Choose 'Save as PDF' in the print dialog", "info");
    setTimeout(function() { window.print(); }, 400);
  }

  /* Export as CSV (opens in Excel) */
  function exportExcel() {
    var data = _collect();
    var lines = [
      ["SmiloCAD Dental Laboratory"],
      [LAB.address],
      ["Phone:", LAB.phone],
      [],
      ["Invoice No.", data.invNumber, "Date:", data.invDate],
      ["Doctor:", data.doctor, "Clinic:", data.clinic],
      ["Patient:", data.patient, "Shade:", data.shade],
      ["Status:", data.status],
      [],
      ["S.No", "Description", "Quantity", "Price/Unit", "Total"],
    ];

    data.rows.filter(function(r) { return r.desc || r.qty || r.price; })
             .forEach(function(r, i) {
               lines.push([i + 1, r.desc, r.qty, r.price, r.total]);
             });

    lines = lines.concat([
      [],
      ["", "", "", "Total:",     data.subtotal],
      ["", "", "", "Received:",  data.received],
      ["", "", "", "Remaining:", data.remaining],
      [],
      ["Notes:", data.notes],
      ["Lab Technician:", LAB.tech],
    ]);

    var csv = lines.map(function(row) {
      return row.map(function(cell) {
        return '"' + String(cell != null ? cell : "").replace(/"/g, '""') + '"';
      }).join(",");
    }).join("\n");

    var a = document.createElement("a");
    a.href     = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = data.invNumber + ".csv";
    a.click();
    showToast("📊 Exported as CSV (open in Excel)", "success");
  }

  /* Load a saved invoice into the form for editing */
  async function loadEdit(id) {
    /* Try the History cache first, then fall back to a fresh DB read */
    var inv = History.getById(id);
    if (!inv) {
      var all = await dbAll();
      inv = all.find(function(r) { return r.id === id; });
    }
    if (!inv) { showToast("❌ Invoice not found", "error"); return; }

    _currentId = inv.id;
    _populate(inv);
    showPage("invoice");
    showToast("✏️ Invoice loaded for editing", "info");
  }

  /* ── Boot: open DB, set defaults, render two blank rows ── */
  document.addEventListener("DOMContentLoaded", async function() {
    await dbOpen();
    var num = await _nextInvNumber();
    document.getElementById("inv-number").value = num;
    document.getElementById("inv-date").value   = todayStr();
    updateHeaderBadge();
    Rows.reset();
  });

  /* Public API */
  return {
    showPage:    showPage,
    save:        save,
    newInvoice:  newInvoice,
    clear:       clear,
    print:       print,
    downloadPDF: downloadPDF,
    exportExcel: exportExcel,
    loadEdit:    loadEdit,
  };

})();
