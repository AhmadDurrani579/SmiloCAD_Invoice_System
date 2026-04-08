/* ─────────────────────────────────────────
   js/app.js  —  Main application controller
   ───────────────────────────────────────── */

var App = (function() {
    var _currentId = null;

    // ── Internal Helper: Collect form data ──
    function _collect() {
        // Safe check for Rows object
        var rowData = (typeof Rows !== 'undefined') ? Rows.collect() : [];
        
        var items = rowData.map(row => ({
            description: row.description || row.desc || "Service",
            quantity: parseInt(row.quantity || row.qty) || 1,
            price_per_unit: parseFloat(row.price_per_unit || row.price) || 0
        }));

        return {
            date: document.getElementById("inv-date")?.value ? document.getElementById("inv-date").value + "T00:00:00" : new Date().toISOString(),
            doctor_name: document.getElementById("doctor-name")?.value || "",
            clinic_name: document.getElementById("clinic")?.value || "",
            patient_name: document.getElementById("patient")?.value || "",
            shade: document.getElementById("shade")?.value || "",
            received_amount: parseFloat(document.getElementById("received-input")?.value) || 0,
            items: items,
            notes: document.getElementById("notes")?.value || ""
        };
    }

    // ── Public: Save to Neon ──
    async function save() {
        console.log("Save initiated...");
        try {
            var data = _collect();
            if (_currentId) data.id = _currentId;

            // Ensure dbSave exists from db.js
            if (typeof dbSave !== 'function') throw new Error("dbSave function not found. Check db.js");

            var result = await dbSave(data);
            
            if (document.getElementById("inv-number")) {
                document.getElementById("inv-number").value = result.invoice_no;
            }
            _currentId = result.id;

            if (typeof showToast === 'function') showToast(`✅ Saved! ${result.invoice_no}`, "success");
            if (typeof updateHeaderBadge === 'function') updateHeaderBadge();
            
        } catch (err) {
            console.error("Save Error:", err);
            if (typeof showToast === 'function') showToast("❌ Save failed. Check console.", "error");
        }
    }

    // ── Public: New/Reset ──
    async function _resetForm() {
        _currentId = null;
        if (document.getElementById("inv-number")) document.getElementById("inv-number").value = "Auto-Generated";
        if (document.getElementById("inv-date")) document.getElementById("inv-date").value = (typeof todayStr !== 'undefined') ? todayStr() : "";
        
        const fields = ["doctor-name", "clinic", "patient", "shade", "notes", "received-input"];
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = "";
        });

        if (typeof Rows !== 'undefined') Rows.reset();
        if (typeof updateHeaderBadge === 'function') updateHeaderBadge();
    }

    function showPage(page) {
        if (typeof switchPage === 'function') switchPage(page);
        if (page === "history" && typeof History !== 'undefined') History.load();
    }

    async function newInvoice() {
        await _resetForm();
        showPage("invoice");
    }

    function clear() {
        if (confirm("Clear form?")) _resetForm();
    }

    // Empty stubs to prevent "undefined" errors if UI calls them
    function print() { window.print(); }
    function downloadPDF() { window.print(); }
    function exportExcel() { console.log("Exporting..."); }
    function loadEdit(id) { console.log("Loading ID:", id); }

    // ── Boot ──
    document.addEventListener("DOMContentLoaded", async function() {
        console.log("App Booting...");
        try {
            if (typeof dbOpen === 'function') await dbOpen();
            if (document.getElementById("inv-number")) document.getElementById("inv-number").value = "Auto-Generated";
            if (document.getElementById("inv-date") && typeof todayStr !== 'undefined') {
                document.getElementById("inv-date").value = todayStr();
            }
            if (typeof updateHeaderBadge === 'function') updateHeaderBadge();
            if (typeof Rows !== 'undefined') Rows.reset();
        } catch(e) {
            console.error("Boot failure:", e);
        }
    });

    return {
        showPage: showPage,
        save: save,
        newInvoice: newInvoice,
        clear: clear,
        print: print,
        downloadPDF: downloadPDF,
        exportExcel: exportExcel,
        loadEdit: loadEdit
    };
})();