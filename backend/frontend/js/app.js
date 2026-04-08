/* ─────────────────────────────────────────
   js/app.js  —  Main application controller (Live Version)
   ───────────────────────────────────────── */

var App = (function() {

  var _currentId = null; 

  /* ── Collect values into the format FastAPI expects ── */
  function _collect() {
    var items = Rows.collect().map(row => ({
      description: row.description || row.desc || "Service",
      quantity: parseInt(row.quantity || row.qty) || 1,
      price_per_unit: parseFloat(row.price_per_unit || row.price) || 0
    }));

    return {
      date: document.getElementById("inv-date").value ? document.getElementById("inv-date").value + "T00:00:00" : new Date().toISOString(),
      doctor_name: document.getElementById("doctor-name").value,
      clinic_name: document.getElementById("clinic").value,
      patient_name: document.getElementById("patient").value,
      shade: document.getElementById("shade").value,
      received_amount: parseFloat(document.getElementById("received-input").value) || 0,
      items: items,
      notes: document.getElementById("notes").value
    };
  }

  /* ── Save current invoice to Neon ── */
  async function save() {
    try {
        var data = _collect();
        if (_currentId) data.id = _currentId;

        var result = await dbSave(data);
        
        document.getElementById("inv-number").value = result.invoice_no;
        _currentId = result.id;

        showToast(`✅ Saved! ${result.invoice_no}`, "success");
        updateHeaderBadge();
    } catch (err) {
        console.error("Save error:", err);
        showToast("❌ Save failed. Check console.", "error");
    }
  }

  /* ── Reset form ── */
  async function _resetForm() {
    _currentId = null;
    document.getElementById("inv-number").value  = "Auto-Generated";
    document.getElementById("inv-date").value    = todayStr();
    document.getElementById("doctor-name").value = "";
    document.getElementById("clinic").value   = "";
    document.getElementById("patient").value  = "";
    document.getElementById("shade").value    = "";
    document.getElementById("notes").value    = "";
    document.getElementById("received-input").value = "";
    Rows.reset();
    updateHeaderBadge();
  }

  /* ── Public Methods ── */
  function showPage(page) {
    switchPage(page);
    if (page === "history") History.load();
  }

  async function newInvoice() {
    await _resetForm();
    showPage("invoice");
    showToast("📄 New invoice ready", "info");
  }

  function clear() {
    if (!confirm("Clear the current form?")) return;
    _resetForm();
    showToast("🗑️ Form cleared", "info");
  }

  function print() {
    window.print();
  }

  function downloadPDF() {
    showToast("📄 Choose 'Save as PDF' in the print dialog", "info");
    window.print();
  }

  function exportExcel() {
    showToast("📊 Excel Export is processing...", "info");
    // Simplified export logic for now
  }

  async function loadEdit(id) {
    var inv = History.getById(id);
    if (!inv) return showToast("❌ Invoice not found", "error");
    _currentId = inv.id;
    // Mapping back from DB names to UI
    document.getElementById("inv-number").value = inv.invoice_no;
    document.getElementById("inv-date").value = inv.date ? inv.date.split('T')[0] : "";
    document.getElementById("doctor-name").value = inv.doctor_name || "";
    document.getElementById("clinic").value = inv.clinic_name || "";
    document.getElementById("patient").value = inv.patient_name || "";
    document.getElementById("shade").value = inv.shade || "";
    document.getElementById("notes").value = inv.notes || "";
    document.getElementById("received-input").value = inv.received_amount || "";
    
    Rows.load(inv.items || []);
    showPage("invoice");
    updateHeaderBadge();
  }

  /* ── Boot ── */
  document.addEventListener("DOMContentLoaded", async function() {
    try {
        await dbOpen();
        document.getElementById("inv-number").value = "Auto-Generated";
        document.getElementById("inv-date").value = todayStr();
        updateHeaderBadge();
        Rows.reset();
    } catch(e) { console.error("Boot error:", e); }
  });

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