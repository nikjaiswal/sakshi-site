// Minimum Viable Template: adds status and notes controls to each checklist
// row, saves entries in this browser (localStorage) and exports them as
// Markdown or JSON. The page is a complete printable checklist without it.
(function () {
  'use strict';
  var KEY = 'sakshi-mvt-v1';
  var STATUSES = ['', 'Verified', 'Unverified', 'Absent', 'Refused', 'Not applicable'];

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; }
  }
  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); return true; } catch (e) { return false; }
  }
  var state = load();
  state.items = state.items || {};
  state.fields = state.fields || {};

  // Add controls to each checklist row.
  var rows = document.querySelectorAll('tr[data-item]');
  Array.prototype.forEach.call(rows, function (tr) {
    var id = tr.getAttribute('data-item');
    var cells = tr.querySelectorAll('td');
    var statusCell = cells[1], notesCell = cells[2];
    var entry = state.items[id] || {};

    var select = document.createElement('select');
    select.id = 'status-' + id;
    select.setAttribute('aria-label', 'Status for item ' + id);
    STATUSES.forEach(function (s) {
      var o = document.createElement('option');
      o.value = s; o.textContent = s || 'Select';
      if (entry.status === s) o.selected = true;
      select.appendChild(o);
    });
    select.addEventListener('change', function () {
      state.items[id] = state.items[id] || {};
      state.items[id].status = select.value;
      tr.setAttribute('data-status', select.value);
      persist();
    });
    tr.setAttribute('data-status', entry.status || '');
    statusCell.appendChild(select);

    var ta = document.createElement('textarea');
    ta.id = 'notes-' + id;
    ta.rows = 2;
    ta.setAttribute('aria-label', 'Notes and evidence for item ' + id);
    ta.value = entry.notes || '';
    ta.addEventListener('input', function () {
      state.items[id] = state.items[id] || {};
      state.items[id].notes = ta.value;
      persist();
    });
    notesCell.appendChild(ta);
  });

  // Free-text fields (setup and synthesis).
  var fields = document.querySelectorAll('[data-field]');
  Array.prototype.forEach.call(fields, function (el) {
    var name = el.getAttribute('data-field');
    if (state.fields[name]) el.value = state.fields[name];
    el.addEventListener('input', function () {
      state.fields[name] = el.value;
      persist();
    });
  });

  var toolbar = document.getElementById('toolbar');
  var saveState = document.getElementById('save-state');
  toolbar.hidden = false;
  function persist() {
    var ok = save(state);
    saveState.textContent = ok
      ? 'Saved in this browser at ' + new Date().toLocaleTimeString() + '. Nothing is sent anywhere.'
      : 'Could not save in this browser (storage unavailable). Download your entries before leaving.';
  }

  function itemRows() {
    return Array.prototype.map.call(rows, function (tr) {
      var id = tr.getAttribute('data-item');
      var cells = tr.querySelectorAll('td');
      var e = state.items[id] || {};
      return { id: id, item: cells[0].textContent.trim(), status: e.status || '', notes: e.notes || '' };
    });
  }
  function fieldLabel(el) {
    var l = document.querySelector('label[for="' + el.id + '"]');
    return l ? l.textContent.trim() : el.getAttribute('data-field');
  }
  function fieldRows(prefix) {
    return Array.prototype.filter.call(fields, function (el) {
      return el.getAttribute('data-field').indexOf(prefix) === 0;
    }).map(function (el) { return { label: fieldLabel(el), value: el.value || '' }; });
  }

  function toMarkdown() {
    var out = ['# SAKSHI Minimum Viable Template', '', 'Exported ' + new Date().toISOString().slice(0, 10) + '. For community auditor use. Not a regulatory instrument.', ''];
    out.push('## Investigation setup', '');
    fieldRows('setup.').forEach(function (f) { out.push('- **' + f.label + ':** ' + f.value.replace(/\n/g, ' ')); });
    out.push('');
    ['A', 'B', 'C'].forEach(function (d) {
      var h = document.querySelector('#domain-' + d.toLowerCase() + ' h2').textContent;
      out.push('## ' + h, '', '| Item | Checklist item | Status | Notes and evidence |', '| --- | --- | --- | --- |');
      itemRows().filter(function (r) { return r.id.charAt(0) === d; }).forEach(function (r) {
        out.push('| ' + r.id + ' | ' + r.item.replace(/\|/g, '\\|') + ' | ' + r.status + ' | ' + r.notes.replace(/\|/g, '\\|').replace(/\n/g, ' ') + ' |');
      });
      out.push('');
    });
    out.push('## Synthesis. Reading the gaps', '');
    fieldRows('synthesis.').forEach(function (f) { out.push('### ' + f.label, '', f.value || '_Not yet recorded._', ''); });
    return out.join('\n');
  }
  function toJSON() {
    return JSON.stringify({
      template: 'SAKSHI Minimum Viable Template',
      exported: new Date().toISOString(),
      setup: fieldRows('setup.'),
      items: itemRows(),
      synthesis: fieldRows('synthesis.')
    }, null, 2);
  }
  function download(name, type, text) {
    var blob = new Blob([text], { type: type });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function slug() {
    var p = (state.fields['setup.product'] || 'draft').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return 'sakshi-mvt-' + (p || 'draft');
  }

  document.getElementById('export-md').addEventListener('click', function () {
    download(slug() + '.md', 'text/markdown', toMarkdown());
  });
  document.getElementById('export-json').addEventListener('click', function () {
    download(slug() + '.json', 'application/json', toJSON());
  });
  var clearBtn = document.getElementById('clear-all');
  var armed = false;
  clearBtn.addEventListener('click', function () {
    if (!armed) {
      armed = true;
      clearBtn.textContent = 'Click again to confirm clearing';
      setTimeout(function () { armed = false; clearBtn.textContent = 'Clear all entries'; }, 4000);
      return;
    }
    state = { items: {}, fields: {} };
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    window.location.reload();
  });
})();
