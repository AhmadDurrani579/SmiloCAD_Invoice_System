/* js/rows.js - Service row management */

var Rows = (function() {
  var _rowCounter = 0;

  function _escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function _serviceOptions(selected) {
    var html = '<option value="">Select service</option>';
    var services = (typeof SERVICES !== "undefined" && SERVICES) ? SERVICES : [];
    services.forEach(function(service) {
      html += '<option' + (service === selected ? ' selected' : '') + '>' + _escapeHtml(service) + '</option>';
    });
    return html;
  }

  function _shadeOptions(selected) {
    var html = '<option value="">Select shade</option>';
    var shades = (typeof SHADES !== "undefined" && SHADES) ? SHADES : [];
    shades.forEach(function(shade) {
      if (!shade) return;
      html += '<option' + (shade === selected ? ' selected' : '') + '>' + _escapeHtml(shade) + '</option>';
    });
    return html;
  }

  function _buildRow(id, item) {
    item = item || {};
    var patient = item.patient_name || "";
    var shade = item.shade || "";
    var desc = item.description || "";
    var qty = item.quantity !== undefined ? item.quantity : 1;
    var price = item.price_per_unit !== undefined ? item.price_per_unit : "";
    var total = qty && price ? (qty * price) : 0;

    return [
      '<tr id="row-' + id + '">',
        '<td class="sno row-index"></td>',
        '<td><input type="text" class="tbl-input row-patient" value="' + _escapeHtml(patient) + '" placeholder="Patient name"></td>',
        '<td><select class="tbl-select row-shade" onchange="Rows.update(' + id + ')">' + _shadeOptions(shade) + '</select></td>',
        '<td><select class="tbl-select row-desc" onchange="Rows.update(' + id + ')">' + _serviceOptions(desc) + '</select></td>',
        '<td><input type="number" class="tbl-input row-qty" min="1" value="' + _escapeHtml(qty) + '" style="text-align:center" oninput="Rows.update(' + id + ')"></td>',
        '<td><input type="number" class="tbl-input right row-price" min="0" value="' + _escapeHtml(price) + '" placeholder="0" oninput="Rows.update(' + id + ')"></td>',
        '<td class="total-cell row-total">' + fmtNum(total) + '</td>',
        '<td class="action-cell"><button class="btn-del" onclick="Rows.remove(' + id + ')">x</button></td>',
      '</tr>'
    ].join("");
  }

  function _renumber() {
    var cells = document.querySelectorAll("#rows-body .row-index");
    cells.forEach(function(cell, i) {
      cell.textContent = i + 1;
    });
  }

  function _rowTotals(row) {
    var qtyEl = row.querySelector(".row-qty");
    var priceEl = row.querySelector(".row-price");
    var qty = parseFloat(qtyEl ? qtyEl.value : 0) || 0;
    var price = parseFloat(priceEl ? priceEl.value : 0) || 0;
    return {
      qty: qty,
      price: price,
      total: qty * price
    };
  }

  function update(id) {
    var row = document.getElementById("row-" + id);
    if (!row) return;
    row.querySelector(".row-total").textContent = fmtNum(_rowTotals(row).total);
    _recalcSummary();
  }

  function _recalcSummary() {
    var subtotal = 0;
    document.querySelectorAll("#rows-body tr").forEach(function(row) {
      subtotal += _rowTotals(row).total;
    });

    var receivedEl = document.getElementById("received-input");
    var received = parseFloat(receivedEl ? receivedEl.value : 0) || 0;
    var remaining = subtotal - received;

    var subtotalEl = document.getElementById("summary-subtotal");
    var totalEl = document.getElementById("summary-total");
    var remainingEl = document.getElementById("summary-remaining");
    if (subtotalEl) subtotalEl.textContent = fmt(subtotal);
    if (totalEl) totalEl.textContent = fmt(subtotal);
    if (remainingEl) {
      remainingEl.textContent = fmt(remaining);
      remainingEl.style.color = remaining > 0 ? "var(--red)" : "var(--green)";
    }
  }

  function collect() {
    var result = [];
    document.querySelectorAll("#rows-body tr").forEach(function(row) {
      var patientEl = row.querySelector(".row-patient");
      var shadeEl = row.querySelector(".row-shade");
      var descEl = row.querySelector(".row-desc");
      var totals = _rowTotals(row);

      var description = descEl ? descEl.value : "";
      if (!description) return;

      result.push({
        patient_name: patientEl ? patientEl.value : "",
        shade: shadeEl ? shadeEl.value : "",
        description: description,
        quantity: totals.qty || 1,
        price_per_unit: totals.price || 0,
        total_price: totals.total
      });
    });
    return result;
  }

  function add() {
    var id = ++_rowCounter;
    document.getElementById("rows-body").insertAdjacentHTML("beforeend", _buildRow(id, {}));
    _renumber();
  }

  function remove(id) {
    var row = document.getElementById("row-" + id);
    if (row) {
      row.remove();
      _renumber();
      _recalcSummary();
    }
  }

  function reset() {
    _rowCounter = 0;
    var body = document.getElementById("rows-body");
    if (body) body.innerHTML = "";
    add();
    add();
  }

  function load(savedItems) {
    _rowCounter = 0;
    var body = document.getElementById("rows-body");
    if (body) body.innerHTML = "";

    (savedItems || []).forEach(function(item) {
      var id = ++_rowCounter;
      body.insertAdjacentHTML("beforeend", _buildRow(id, item));
    });

    if (_rowCounter === 0) {
      add();
      add();
    }

    _renumber();
    _recalcSummary();
  }

  function subtotal() {
    return collect().reduce(function(sum, row) {
      return sum + (row.quantity * row.price_per_unit);
    }, 0);
  }

  document.addEventListener("DOMContentLoaded", function() {
    var received = document.getElementById("received-input");
    if (received) received.addEventListener("input", _recalcSummary);
  });

  return {
    add: add,
    remove: remove,
    reset: reset,
    load: load,
    collect: collect,
    subtotal: subtotal,
    update: update
  };
})();
