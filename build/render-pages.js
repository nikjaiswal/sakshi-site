'use strict';
// Renders the static pages in content/pages/ into site/ using the shared
// layout in build/lib.js. content/pages.json lists each page's file, output
// path, title, description and citation note. Set SITE_BASE (for example
// "/sakshi-site") to render for a site served under a subpath.
const fs = require('fs');
const path = require('path');
const lib = require('./lib');

const ROOT = path.resolve(__dirname, '..');
const pages = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'pages.json'), 'utf8'));

pages.forEach(function (p) {
  var body = fs.readFileSync(path.join(ROOT, 'content', 'pages', p.file), 'utf8').replace(/\n$/, '');
  if (p.cite) body += '\n' + lib.cite(typeof p.cite === 'string' ? p.cite : '');
  var out = path.join(ROOT, 'site', p.out);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, lib.renderPage({ title: p.title, description: p.description, path: p.path, body: body, raw: !!p.raw }));
});
console.log('Rendered ' + pages.length + ' page(s) into site/' + (lib.BASE ? ' with base path ' + lib.BASE : '') + '.');
