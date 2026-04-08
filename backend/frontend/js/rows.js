/* ─────────────────────────────────────────
   js/rows.js  —  Service row management (Live Version)
   ───────────────────────────────────────── */

var Rows = (function() {

  var _rowCounter = 0;

  /* Build the <select> options HTML */
  function _serviceOptions(selected) {
    var html = '<option value="">— Select Service —</option>';
    // Ensure SERVICES is defined in your data.js
    SERVICES.forEach(function(s) {
      html += '<option' + (s === selected ? ' selected' : '') + '>' + s + '</option>';
    });
    return html;
  }

  /* Create one table row of HTML */
  function _buildRow(id, desc, qty, price, total) {
    desc  = desc  || "";
    qty   = qty   !== undefined ? qty   : 1;
    price = price !== undefined ? price : "";
    total = total || 0;

    return [
      '<tr id="row-' + id + '">',
        '<td class="sno row-index"></td>',
        '<td>',
          '<select class="tbl-select" onchange="Rows.update(' + id + ')">' + _serviceOptions(desc) + '</select>',
        '</td>',
        '<td>',
          '<input type="number" class="tbl-input" min="1" value="' + qty + '"',
          ' style="text-align:center" oninput="Rows.update(' + id + ')"/>',
        '</td>',
        '<td>',
          '<input type="number" class="tbl-input right" min="0" value="' + price + '" placeholder="0"',
          ' oninput="Rows.update(' + id + ')"/>',
        '</td>',
        '<td class="total-cell row-total">' + fmtNum(total) + '</td>',
        '<td class="action-cell">',
          '<button class="btn-del" onclick="Rows.remove(' + id + ')">×</button>',
        '</td>',
      '</tr>',
    ].join("");
  }

  /* Renumber, update, and summary logic (No changes needed here) */
  function _renumber() {
    var cells = document.querySelectorAll("#rows-body .row-index");
    cells.forEach(function(cell, i) { cell.textContent = i + 1; });
  }

  function update(id) {
    var row = document.getElementById("row-" + id);
    if (!row) return;
    var inputs = row.querySelectorAll("input[type=number]");
    var qty    = parseFloat(inputs[0].value) || 0;
    var price  = parseFloat(inputs[1].value) || 0;
    var total  = qty * price;
    row.querySelector(".row-total").textContent = fmtNum(total);
    _recalcSummary();
  }

  function _recalcSummary() {
    var subtotal = 0;
    document.querySelectorAll("#rows-body tr").forEach(function(row) {
      var inputs = row.querySelectorAll("input[type=number]");
      var qty    = parseFloat(inputs[0] ? inputs[0].value : 0) || 0;
      var price  = parseFloat(inputs[1] ? inputs[1].value : 0) || 0;
      subtotal  += qty * price;
    });

    var received  = parseFloat(document.getElementById("received-input").value) || 0;
    var remaining = subtotal - received;

    document.getElementById("summary-subtotal").textContent  = fmt(subtotal);
    document.getElementById("summary-total").textContent     = fmt(subtotal);
    document.getElementById("summary-remaining").textContent = fmt(remaining);
    document.getElementById("summary-remaining").style.color = remaining > 0 ? "var(--red)" : "var(--green)";
  }

  /* ── Collect current row data (UPDATED FOR FASTAPI) ── */
  function collect() {
    var result = [];
    document.querySelectorAll("#rows-body tr").forEach(function(row) {
      var sel    = row.querySelector("select");
      var inputs = row.querySelectorAll("input[type=number]");
      var qty    = parseInt(inputs[0] ? inputs[0].value : 1)  || 1;
      var price  = parseFloat(inputs[1] ? inputs[1].value : 0)  || 0;
      
      var serviceName = sel ? sel.value : "";
      
      // We only collect rows that actually have a service selected
      if (serviceName) {
        result.push({
          description:    serviceName,       // Matches Pydantic
          quantity:       qty,               // Matches Pydantic
          price_per_unit: price,             // Matches Pydantic
          total_price:    qty * price        // Optional, backend recalculates anyway
        });
      }
    });
    return result;
  }

  /* Helper methods */
  function add() {
    var id = ++_rowCounter;
    document.getElementById("rows-body").insertAdjacentHTML("beforeend", _buildRow(id));
    _renumber();
  }

  function remove(id) {
    var row = document.getElementById("row-" + id);
    if (row) { row.remove(); _renumber(); _recalcSummary(); }
  }

  function reset() {
    document.getElementById("rows-body").innerHTML = "";
    add(); add();
  }

  /* Loading from DB (Updated keys) */
  function load(savedItems) {
    document.getElementById("rows-body").innerHTML = "";
    (savedItems || []).forEach(function(item) {
      var id = ++_rowCounter;
      // Note the mapping: description -> desc, etc.
      document.getElementById("rows-body")
              .insertAdjacentHTML("beforeend", _buildRow(
                  id, 
                  item.description, 
                  item.quantity, 
                  item.price_per_unit, 
                  (item.quantity * item.price_per_unit)
              ));
    });
    _renumber();
    _recalcSummary();
  }

  function subtotal() {
    return collect().reduce(function(sum, r) { return sum + (r.quantity * r.price_per_unit); }, 0);
  }

  document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("received-input").addEventListener("input", _recalcSummary);
  });

  return { add: add, remove: remove, reset: reset, load: load, collect: collect, subtotal: subtotal, update: update };

})();