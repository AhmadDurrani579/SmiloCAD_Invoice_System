/* ─────────────────────────────────────────
   js/app.js  —  Main application controller
   ───────────────────────────────────────── */

var App = (function() {
    var _currentId = null;

    // ── Internal Helper: Collect form data ──
    function _collect() {
    // 1. Get the raw rows from your table component
        var rowData = (typeof Rows !== 'undefined') ? Rows.collect() : [];
        
        // 2. Map items to match your Python ItemCreate schema EXACTLY
        var items = rowData.map(function(row) {
            return {
                patient_name: row.patient_name || "",
                shade: row.shade || "",
                description: row.description || row.desc || "Service",
                quantity: parseInt(row.quantity || row.qty) || 1,
                price_per_unit: parseFloat(row.price_per_unit || row.price) || 0
            };
        });

        // 3. Build the Invoice object
        // IMPORTANT: Remove patient_name and shade from here!
        return {
            // Send ONLY the date string (YYYY-MM-DD), no extra "T00:00:00"
            date: document.getElementById("inv-date")?.value || new Date().toISOString().split('T')[0],
            doctor_name: document.getElementById("doctor-name")?.value || "",
            clinic_name: document.getElementById("clinic")?.value || "",
            received_amount: parseFloat(document.getElementById("received-input")?.value) || 0,
            notes: document.getElementById("notes")?.value || "",
            items: items 
        }; 
    }
    // ── Public: Save to Neon ──
    async function save() {
        console.log("Save initiated...");
        try {
            // 1. Collect the items (rows)
            const itemsList = _collect(); 
            if (!itemsList || itemsList.length === 0) {
                throw new Error("Please add at least one item.");
            }

            // 2. Safe Date Extraction
            const dateEl = document.getElementById("invoice-date");
            let formattedDate;
            try {
                // If element exists and has a value, convert to ISO, else use NOW
                formattedDate = (dateEl && dateEl.value) 
                    ? new Date(dateEl.value).toISOString() 
                    : new Date().toISOString();
            } catch (e) {
                formattedDate = new Date().toISOString();
            }

            // 3. Build the data object with "Optional Chaining" (?.)
            const invoiceData = {
                doctor_name: document.getElementById("doctor-name")?.value || "Unknown Doctor",
                clinic_name: document.getElementById("clinic-name")?.value || "Unknown Clinic",
                date: formattedDate,
                received_amount: parseFloat(document.getElementById("received-input")?.value) || 0,
                notes: document.getElementById("notes-area")?.value || "",
                items: itemsList
            };

            // If we are editing an existing invoice
            if (typeof _currentId !== 'undefined' && _currentId) {
                invoiceData.id = _currentId;
            }

            // 4. Send to Database
            if (typeof dbSave !== 'function') {
                throw new Error("Database save function (dbSave) is missing!");
            }

            const result = await dbSave(invoiceData);
            
            // 5. Update UI with result
            const invNumEl = document.getElementById("inv-number");
            if (invNumEl) {
                invNumEl.value = result.invoice_no || "";
            }
            
            _currentId = result.id;

            if (typeof showToast === 'function') {
                showToast(`✅ Saved! ${result.invoice_no}`, "success");
            }
            
            if (typeof updateHeaderBadge === 'function') {
                updateHeaderBadge();
            }
            
        } catch (err) {
            console.error("Detailed Save Error:", err);
            if (typeof showToast === 'function') {
                // This will now show the specific error (like "null is not an object")
                showToast(`❌ Save failed: ${err.message}`, "error");
            }
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
            var rowPatient = item ? (item.patient_name || "") : "";
            var rowShade = item ? (item.shade || "") : "";
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
            const receivedEl = document.getElementById("received-input");

            if (doctorEl) doctorEl.value = inv.doctor_name || "";
            if (clinicEl) clinicEl.value = inv.clinic_name || "";
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
