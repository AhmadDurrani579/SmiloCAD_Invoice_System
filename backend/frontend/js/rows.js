/* ─────────────────────────────────────────
   js/rows.js  —  Service row management
   ───────────────────────────────────────── */

var Rows = (function() {

  var _rowCounter = 0;   // unique key for each row

  /* Build the <select> options HTML for the services list */
  function _serviceOptions(selected) {
    var html = '<option value="">— Select Service —</option>';
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

  /* Renumber the # column sequentially */
  function _renumber() {
    var cells = document.querySelectorAll("#rows-body .row-index");
    cells.forEach(function(cell, i) { cell.textContent = i + 1; });
  }

  /* Recalculate a single row's total and update the summary */
  function update(id) {
    var row   = document.getElementById("row-" + id);
    if (!row) return;

    var inputs = row.querySelectorAll("input[type=number]");
    var qty    = parseFloat(inputs[0].value) || 0;
    var price  = parseFloat(inputs[1].value) || 0;
    var total  = qty * price;

    row.querySelector(".row-total").textContent = fmtNum(total);
    _recalcSummary();
  }

  /* Recalculate subtotal / remaining and refresh the summary panel */
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
    document.getElementById("summary-remaining").style.color =
      remaining > 0 ? "var(--red)" : "var(--green)";
  }

  /* Add a blank row */
  function add() {
    var id   = ++_rowCounter;
    var tbody = document.getElementById("rows-body");
    tbody.insertAdjacentHTML("beforeend", _buildRow(id));
    _renumber();
  }

  /* Remove a row by id */
  function remove(id) {
    var row = document.getElementById("row-" + id);
    if (row) { row.remove(); _renumber(); _recalcSummary(); }
  }

  /* Clear all rows and add two blank ones */
  function reset() {
    document.getElementById("rows-body").innerHTML = "";
    add();
    add();
  }

  /* Load rows from saved data (array of row objects) */
  function load(savedRows) {
    document.getElementById("rows-body").innerHTML = "";
    (savedRows || []).forEach(function(r) {
      var id = ++_rowCounter;
      document.getElementById("rows-body")
              .insertAdjacentHTML("beforeend", _buildRow(id, r.desc, r.qty, r.price, r.total));
    });
    _renumber();
    _recalcSummary();
  }

  /* Collect current row data into an array of plain objects */
  function collect() {
    var result = [];
    document.querySelectorAll("#rows-body tr").forEach(function(row) {
      var sel    = row.querySelector("select");
      var inputs = row.querySelectorAll("input[type=number]");
      var qty    = parseFloat(inputs[0] ? inputs[0].value : 1)  || 1;
      var price  = parseFloat(inputs[1] ? inputs[1].value : 0)  || 0;
      result.push({
        desc:  sel   ? sel.value : "",
        qty:   qty,
        price: price,
        total: qty * price,
      });
    });
    return result;
  }

  /* Get the current subtotal */
  function subtotal() {
    return collect().reduce(function(sum, r) { return sum + r.total; }, 0);
  }

  /* Wire up the received-input to trigger recalc */
  document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("received-input").addEventListener("input", _recalcSummary);
  });

  /* Public API */
  return { add: add, remove: remove, reset: reset, load: load, collect: collect, subtotal: subtotal, update: update };

})();
