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

    function _fmtMoney(n) {
        return "PKR " + (Number(n) || 0).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function _preparePrint() {
        var invNo = document.getElementById("inv-number")?.value || "INV-0000";
        var invDate = document.getElementById("inv-date")?.value || "";
        var doctor = document.getElementById("doctor-name")?.value || "";
        var clinic = document.getElementById("clinic")?.value || "";
        var patient = document.getElementById("patient")?.value || "";
        var shade = document.getElementById("shade")?.value || "";

        var invNoEl = document.getElementById("print-inv-no");
        var invDateEl = document.getElementById("print-inv-date");
        if (invNoEl) invNoEl.textContent = invNo === "Auto-Generated" ? "INV-0000" : invNo;
        if (invDateEl) invDateEl.textContent = invDate || "Enter Date Here";

        var clientEl = document.getElementById("print-client-name");
        var companyEl = document.getElementById("print-company-name");
        if (clientEl) clientEl.textContent = doctor || "Doctor Name";
        if (companyEl) companyEl.textContent = clinic || "Clinic Name";

        var rowsEl = document.getElementById("print-rows");
        if (rowsEl) rowsEl.innerHTML = "";

        var items = (typeof Rows !== 'undefined') ? Rows.collect() : [];

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var desc = item ? item.description : "";
            var qty = item ? item.quantity : "";
            var price = item ? item.price_per_unit : "";
            var total = item ? (item.quantity * item.price_per_unit) : "";
            var rowPatient = item ? (patient || "") : "";
            var rowShade = item ? (shade || "") : "";
            var rowHtml = [
                '<tr>',
                '<td class="c">', (i + 1), '</td>',
                '<td>', rowPatient, '</td>',
                '<td>', rowShade, '</td>',
                '<td>', desc || '', '</td>',
                '<td class="c">', (qty !== "" ? qty : ''), '</td>',
                '<td class="r">', (price !== "" ? _fmtMoney(price) : ''), '</td>',
                '<td class="r">', (total !== "" ? _fmtMoney(total) : ''), '</td>',
                '</tr>'
            ].join("");
            if (rowsEl) rowsEl.insertAdjacentHTML("beforeend", rowHtml);
        }

        var subtotal = (typeof Rows !== 'undefined') ? Rows.subtotal() : 0;
        var subEl = document.getElementById("print-subtotal");
        var totalEl = document.getElementById("print-total");
        if (subEl) subEl.textContent = _fmtMoney(subtotal);
        if (totalEl) totalEl.textContent = _fmtMoney(subtotal);
    }

    // Empty stubs to prevent "undefined" errors if UI calls them
    function print() { _preparePrint(); window.print(); }
    function downloadPDF() { _preparePrint(); window.print(); }
    function exportExcel() { console.log("Exporting..."); }
    async function loadEdit(id) {
        try {
            if (!id || isNaN(id)) {
                if (typeof showToast === 'function') showToast("❌ Invalid invoice id", "error");
                return;
            }
            // Give immediate feedback and switch view
            if (typeof showPage === "function") showPage("invoice");
            if (typeof showToast === 'function') showToast("Loading invoice...", "info");
            if (typeof dbGet !== 'function') throw new Error("dbGet function not found. Check db.js");
            const inv = await dbGet(id);

            _currentId = inv.id || id;
            if (document.getElementById("inv-number")) {
                document.getElementById("inv-number").value = inv.invoice_no || "Auto-Generated";
            }
            if (document.getElementById("inv-date")) {
                const dateStr = inv.date ? String(inv.date).split("T")[0] : "";
                document.getElementById("inv-date").value = dateStr;
            }

            const doctorEl = document.getElementById("doctor-name");
            const clinicEl = document.getElementById("clinic");
            const patientEl = document.getElementById("patient");
            const shadeEl = document.getElementById("shade");
            const receivedEl = document.getElementById("received-input");

            if (doctorEl) doctorEl.value = inv.doctor_name || "";
            if (clinicEl) clinicEl.value = inv.clinic_name || "";
            if (patientEl) patientEl.value = inv.patient_name || "";
            if (shadeEl) shadeEl.value = inv.shade || "";
            if (receivedEl) receivedEl.value = (inv.received_amount || 0);

            if (typeof Rows !== 'undefined' && typeof Rows.load === 'function') {
                Rows.load(inv.items || []);
            }

            if (typeof updateHeaderBadge === 'function') updateHeaderBadge();
            showPage("invoice");
        } catch (err) {
            console.error("Load Error:", err);
            if (typeof showToast === 'function') showToast("❌ Load failed. Check console.", "error");
        }
    }

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
