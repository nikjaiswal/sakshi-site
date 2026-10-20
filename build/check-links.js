'use strict';
// Checks that every internal link and asset reference in the built site
// resolves to a file, and that fragment links point at an existing id.
// Usage: node build/check-links.js site
const fs = require('fs');
const path = require('path');

const root = path.resolve(process.argv[2] || 'site');
const BASE = (process.env.SITE_BASE || '').replace(/\/$/, '');
if (!fs.existsSync(root)) {
  console.error('Site directory not found: ' + root + ' (run npm run build first)');
  process.exit(2);
}

function walk(dir, out) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (d) {
    var p = path.join(dir, d.name);
    if (d.isDirectory()) walk(p, out);
    else if (d.name.endsWith('.html')) out.push(p);
  });
  return out;
}

var pages = walk(root, []);
var idCache = {};
function idsOf(file) {
  if (!idCache[file]) {
    var html = fs.readFileSync(file, 'utf8');
    var ids = new Set();
    var re = /\sid="([^"]+)"/g, m;
    while ((m = re.exec(html))) ids.add(m[1]);
    idCache[file] = ids;
  }
  return idCache[file];
}

function resolveTarget(fromFile, href) {
  var clean = href.split('#')[0].split('?')[0];
  var frag = href.indexOf('#') >= 0 ? href.split('#')[1] : '';
  var target;
  if (clean === '') target = fromFile;
  else if (clean.startsWith('/')) {
    if (BASE && clean.startsWith(BASE + '/')) clean = clean.slice(BASE.length);
    else if (BASE && clean === BASE) clean = '/';
    target = path.join(root, clean);
  }
  else target = path.resolve(path.dirname(fromFile), clean);
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    target = path.join(target, 'index.html');
  }
  return { target: target, frag: frag };
}

var errors = [];
var checked = 0;
pages.forEach(function (file) {
  var html = fs.readFileSync(file, 'utf8');
  var re = /\s(?:href|src)="([^"]*)"/g, m;
  while ((m = re.exec(html))) {
    var href = m[1];
    if (/^(https?:|mailto:|tel:|data:|javascript:)/i.test(href)) continue;
    checked += 1;
    var r = resolveTarget(file, href);
    var rel = path.relative(root, file);
    if (!fs.existsSync(r.target)) {
      errors.push(rel + ': missing target for "' + href + '"');
      continue;
    }
    if (r.frag && r.target.endsWith('.html') && !idsOf(r.target).has(r.frag)) {
      errors.push(rel + ': no element with id "' + r.frag + '" in "' + href + '"');
    }
  }
});

console.log('Checked ' + checked + ' internal references across ' + pages.length + ' pages.');
if (errors.length) {
  errors.forEach(function (e) { console.error('  ' + e); });
  console.error(errors.length + ' broken reference(s).');
  process.exit(1);
}
console.log('All internal links resolve.');
