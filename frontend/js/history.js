/* ─────────────────────────────────────────
   js/history.js  —  Invoice history page
   ───────────────────────────────────────── */

var History = (function() {

  var _allInvoices = [];   // cache of loaded invoices

  /* Format PKR */
  function _fmt(n) { return fmt(n); }

  /* Build HTML for a single history card */
  function _buildCard(inv) {
    var itemCount = (inv.rows || []).filter(function(r) { return r.desc; }).length;
    return [
      '<div class="hist-item">',
        '<div class="hist-inv-no">' + (inv.invNumber || "—") + '</div>',
        '<div>',
          '<div class="hist-client-name">' + (inv.doctor || "Unknown Doctor") + '</div>',
          '<div class="hist-date">📅 ' + (inv.invDate || "—") + ' &nbsp;·&nbsp; ' + (inv.clinic || "—") + '</div>',
        '</div>',
        '<div>',
          '<div class="hist-detail">Patient: <span>' + (inv.patient || "—") + '</span></div>',
          '<div class="hist-detail">Items: <span>' + itemCount + '</span> &nbsp;·&nbsp; Status: <span>' + (inv.status || "—") + '</span></div>',
        '</div>',
        '<div>',
          '<div class="hist-amount">' + _fmt(inv.subtotal || 0) + '</div>',
          '<div style="font-size:0.75rem;color:var(--green);text-align:right;margin-top:2px">Rcvd: ' + _fmt(inv.received || 0) + '</div>',
        '</div>',
        '<div class="hist-actions">',
          '<button class="btn-xs btn-xs-blue" onclick="App.loadEdit(' + inv.id + ')">✏️ Load</button>',
          '<button class="btn-xs btn-xs-red"  onclick="History.deleteInvoice(' + inv.id + ')">🗑️</button>',
        '</div>',
      '</div>',
    ].join("");
  }

  /* Render the list — optionally filtered by a search term */
  function _render(list) {
    var container = document.getElementById("hist-list");
    var count     = document.getElementById("history-count");

    count.textContent = list.length + " invoice" + (list.length !== 1 ? "s" : "");

    if (list.length === 0) {
      var q = document.getElementById("search-input").value;
      container.innerHTML = [
        '<div class="empty-state">',
          '<div class="ico">📋</div>',
          '<h3>' + (q ? "No matching invoices" : "No invoices yet") + '</h3>',
          '<p>' + (q ? "Try a different search term." : "Create your first invoice to see it here.") + '</p>',
        '</div>',
      ].join("");
    } else {
      container.innerHTML = list.map(_buildCard).join("");
    }
  }

  /* Load all invoices from DB and render */
  function load() {
    dbAll().then(function(all) {
      _allInvoices = all.reverse();   // newest first
      filter();
    });
  }

  /* Filter the cached list by search term and re-render */
  function filter() {
    var q = (document.getElementById("search-input").value || "").toLowerCase();
    var filtered = _allInvoices.filter(function(inv) {
      if (!q) return true;
      return (
        (inv.invNumber || "").toLowerCase().includes(q) ||
        (inv.doctor    || "").toLowerCase().includes(q) ||
        (inv.clinic    || "").toLowerCase().includes(q) ||
        (inv.patient   || "").toLowerCase().includes(q) ||
        (inv.status    || "").toLowerCase().includes(q)
      );
    });
    _render(filtered);
  }

  /* Delete an invoice after confirmation */
  function deleteInvoice(id) {
    if (!confirm("Delete this invoice permanently?")) return;
    dbDelete(id).then(function() {
      showToast("🗑️ Invoice deleted", "error");
      load();   // refresh the list
    });
  }

  /* Get a single invoice by id from cache */
  function getById(id) {
    return _allInvoices.find(function(inv) { return inv.id === id; }) || null;
  }

  /* Public API */
  return { load: load, filter: filter, deleteInvoice: deleteInvoice, getById: getById };

})();
