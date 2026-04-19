/* ─────────────────────────────────────────
   js/history.js  —  Live Neon History Page
   ───────────────────────────────────────── */

var History = (function() {

  var _allInvoices = [];   // cache of loaded invoices
  var _boundClicks = false;

  /* Format PKR */
  function _fmt(n) { return fmt(n); }

  /* Build HTML for a single history card (Updated for Neon fields) */
/* Build HTML for a single history card (Updated for Neon fields + Notes) */
  function _buildCard(inv) {
    // Check if there is a note, and create a small snippet for the UI
    var notePreview = inv.notes 
      ? '<div class="hist-detail" style="color:var(--amber); font-style:italic;">📝 Note: ' + inv.notes.substring(0, 30) + (inv.notes.length > 30 ? '...' : '') + '</div>'
      : '';

    return [
      '<div class="hist-item">',
        '<div class="hist-inv-no">' + (inv.invoice_no || "—") + '</div>',
        '<div>',
          '<div class="hist-client-name">Dr. ' + (inv.doctor_name || "Unknown Doctor") + '</div>',
          '<div class="hist-date">📅 ' + (inv.date ? inv.date.split('T')[0] : "—") + ' &nbsp;·&nbsp; Clinic: ' + (inv.clinic_name || "—") + '</div>',
        '</div>',
        '<div>',
          notePreview,
        '</div>',
        '<div>',
          '<div class="hist-amount">' + _fmt(inv.total_amount || 0) + '</div>',
          '<div style="font-size:0.75rem;color:var(--green);text-align:right;margin-top:2px">Rcvd: ' + _fmt(inv.received_amount || 0) + '</div>',
        '</div>',
        '<div class="hist-actions">',
          '<button class="btn-xs btn-xs-blue" type="button" data-action="load" data-id="' + inv.id + '">✏️ Load</button>',
          '<button class="btn-xs btn-xs-red"  type="button" data-action="delete" data-id="' + inv.id + '">🗑️</button>',
        '</div>',
      '</div>',
    ].join("");
  }
  
  /* Load all invoices from DB and render */
  function load() {
    // dbAll() now calls fetch('/invoices/')
    dbAll().then(function(all) {
      // API already returns newest first if you used .order_by(Invoice.id.desc())
      _allInvoices = all; 
      filter();
    }).catch(err => {
      console.error("Failed to load history:", err);
      showToast("❌ Could not load history", "error");
    });
  }

  /* Filter the cached list by search term and re-render */
  function filter() {
    var q = (document.getElementById("search-input").value || "").toLowerCase();
    var filtered = _allInvoices.filter(function(inv) {
      if (!q) return true;
      return (
        (inv.invoice_no  || "").toLowerCase().includes(q) ||
        (inv.doctor_name || "").toLowerCase().includes(q) ||
        (inv.clinic_name || "").toLowerCase().includes(q)
      );
    });
    _render(filtered);
  }

  /* Delete an invoice after confirmation */
  function deleteInvoice(id) {
    if (!confirm("Delete this invoice permanently from Neon?")) return;
    dbDelete(id).then(function() {
      showToast("🗑️ Invoice deleted", "success");
      load();   // refresh the list
    }).catch(err => {
      showToast("❌ Delete failed", "error");
    });
  }

  /* Get a single invoice by id from cache */
  function getById(id) {
    return _allInvoices.find(function(inv) { return inv.id === id; }) || null;
  }

  /* Internal render function (No changes needed) */
  function _render(list) {
    var container = document.getElementById("hist-list");
    var count     = document.getElementById("history-count");
    if (!container || !count) return;

    _bindClicks();
    count.textContent = list.length + " invoice" + (list.length !== 1 ? "s" : "");

    if (list.length === 0) {
      var q = document.getElementById("search-input").value;
      container.innerHTML = '<div class="empty-state"><h3>No invoices found</h3></div>';
    } else {
      container.innerHTML = list.map(_buildCard).join("");
    }
  }

  function _bindClicks() {
    if (_boundClicks) return;
    document.addEventListener("click", function(e) {
      var btn = e.target.closest("button[data-action]");
      if (!btn) return;
      var id = parseInt(btn.getAttribute("data-id"), 10);
      var action = btn.getAttribute("data-action");
      if (action === "load") {
        if (typeof showToast === "function") showToast("Loading invoice...", "info");
        if (typeof App !== "undefined" && typeof App.loadEdit === "function") {
          App.loadEdit(id);
        } else if (typeof showToast === "function") {
          showToast("Load handler missing", "error");
        }
      } else if (action === "delete") {
        deleteInvoice(id);
      }
    });
    _boundClicks = true;
  }

  return { load: load, filter: filter, deleteInvoice: deleteInvoice, getById: getById };

})();
