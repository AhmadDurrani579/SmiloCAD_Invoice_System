/* ─────────────────────────────────────────
   js/app.js  —  Main application controller (Live Version)
   ───────────────────────────────────────── */

var App = (function() {

  var _currentId = null; 

  /* ── Collect values into the format FastAPI expects ── */
  function _collect() {
    // Rows.collect() should return objects with: description, quantity, price_per_unit
    var items = Rows.collect().map(row => ({
      description: row.desc || "Service",
      quantity: parseInt(row.qty) || 1,
      price_per_unit: parseFloat(row.price) || 0
    }));

    return {
      // Note: we don't send invoice_no anymore, DB generates it
      date: document.getElementById("inv-date").value + "T00:00:00", // Ensure ISO format
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
        
        // If we are editing (not supported yet in your backend, but good for future)
        if (_currentId) data.id = _currentId;

        // Calls the new dbSave we wrote in db.js
        var result = await dbSave(data);
        
        // Update the UI with the real Invoice Number from Neon
        document.getElementById("inv-number").value = result.invoice_no;
        _currentId = result.id;

        showToast(`✅ Saved! ${result.invoice_no}`, "success");
        updateHeaderBadge();
    } catch (err) {
        showToast("❌ Save failed. Check console.", "error");
    }
  }

  /* ── Reset form (Updated for Auto-Increment) ── */
  async function _resetForm() {
    _currentId = null;
    // Set to placeholder since DB decides the real number on save
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

  /* ... rest of your public methods (print, clear, etc.) ... */

  /* ── Boot ── */
  document.addEventListener("DOMContentLoaded", async function() {
    await dbOpen();
    // Start with a clean form
    document.getElementById("inv-number").value = "Auto-Generated";
    document.getElementById("inv-date").value   = todayStr();
    updateHeaderBadge();
    Rows.reset();
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