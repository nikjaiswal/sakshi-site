'use strict';
// Shared page layout for the SAKSHI site. The design system is adapted from
// the DOJO site by MIT Critical Data (MIT License; see
// site/assets/vendor/LICENSE-dojo.txt). Used by build/render-profiles.js and
// by the page assembler; the static pages in site/ are generated from it.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Short content hash appended to asset URLs so browsers and CDNs pick up
// new versions after a deploy.
function assetUrl(rel) {
  try {
    var file = path.join(__dirname, '..', 'site', rel.replace(/^\//, ''));
    var hash = crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex').slice(0, 8);
    return rel + '?v=' + hash;
  } catch (e) {
    return rel;
  }
}

// Base path for a site served under a subpath (GitHub Pages project sites
// live at https://<user>.github.io/<repo>/). Empty for a domain root.
const BASE = (process.env.SITE_BASE || '').replace(/\/$/, '');

const SITE = {
  name: 'SAKSHI',
  longName: 'Structured Accountability through Knowledge, Scrutiny, and Health Integrity',
  repoUrl: 'https://github.com/nikjaiswal/sakshi-site',
  paper: {
    authors: 'Al-Louzi R, Ali HN, Bank AMC, Celi LA, Cocucci C, Gameiro R, Gorijavolu R, Jaiswal N, et al.',
    title: 'SAKSHI: A Community-Operated Investigative Platform for Accountability in Clinical AI Deployment',
    venue: 'COLM 2026, DAIH workshop',
    url: 'https://openreview.net/forum?id=gnMnqG08xo',
    pdf: 'https://openreview.net/pdf?id=gnMnqG08xo'
  },
  status: 'SAKSHI is a proposal under development. No profiles have been published, and the framework’s claims have not yet been tested.'
};

const NAV = [
  ['/#what-is-sakshi', 'What is SAKSHI'],
  ['/#protocol', 'Protocol'],
  ['/governance/', 'Governance'],
  ['/case-study/', 'Case Study'],
  ['/template/', 'Template'],
  ['/profiles/', 'Profiles'],
  ['/#team', 'Contributors'],
  ['/#contact', 'Contact']
];

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// The witness mark: an open eye, used inside the brand ring.
function eye() {
  return '<svg viewBox="0 0 32 20" aria-hidden="true" focusable="false">' +
    '<path d="M1.5 10C6 3 11 1.5 16 1.5S26 3 30.5 10C26 17 21 18.5 16 18.5S6 17 1.5 10Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>' +
    '<circle cx="16" cy="10" r="3.8" fill="currentColor"/></svg>';
}
// Kept for callers that still import it.
function mark() { return eye(); }

function brand() {
  return '<a class="brand" href="/" aria-label="SAKSHI home"><span class="brand__mark" aria-hidden="true">' + eye() +
    '</span><span class="brand__name">SAKSHI</span></a>';
}
function institutionalMark(variant) {
  return '<a class="institutional-mark institutional-mark--' + variant + '" href="https://criticaldata.mit.edu" target="_blank" rel="noopener noreferrer" aria-label="MIT Critical Data">' +
    '<img src="/assets/mit-critical-data-logo.svg" alt="" aria-hidden="true"><span>MIT Critical Data</span></a>';
}

function nav(current) {
  return '<nav id="primary-navigation" class="site-nav" data-mobile-menu aria-label="Primary navigation">' +
    NAV.map(function (item) {
      var active = item[0].indexOf('#') < 0 && current.indexOf(item[0]) === 0;
      return '<a href="' + item[0] + '"' + (active ? ' aria-current="page"' : '') + '>' + esc(item[1]) + '</a>';
    }).join('') + '</nav>';
}

function header(current) {
  return '<header class="site-header">\n<div class="site-header__inner container">\n' +
    '<div class="site-header__identity">' + brand() + institutionalMark('header') + '</div>\n' +
    '<button class="menu-toggle" type="button" data-mobile-menu-toggle aria-label="Toggle navigation" aria-controls="primary-navigation" aria-expanded="false"><span aria-hidden="true">☰</span></button>\n' +
    nav(current) + '\n</div>\n</header>\n';
}
function statusLine() {
  return '<div class="status-line"><div class="container"><p><strong>Status.</strong> ' + esc(SITE.status) + '</p></div></div>\n';
}
function footer() {
  return '<footer class="site-footer">\n<div class="container site-footer__inner">\n' +
    '<div class="site-footer__identity">' + brand() + institutionalMark('footer') + '</div>\n' +
    '<p>SAKSHI, a project of MIT Critical Data, Laboratory for Computational Physiology, MIT.</p>\n' +
    '<div class="site-footer__links">' +
    (SITE.repoUrl ? '<a class="text-link" href="' + esc(SITE.repoUrl) + '" target="_blank" rel="noopener noreferrer">GitHub <span aria-hidden="true">↗</span></a>' : '') +
    '<a class="text-link" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0 <span aria-hidden="true">↗</span></a>' +
    '</div>\n</div>\n</footer>\n';
}

// Citation block placed on every page that draws on the paper.
function cite(note) {
  return '<aside class="cite" aria-label="Source">' +
    '<p><span class="cite-label">Source</span> ' +
    'The content on this page is drawn from the SAKSHI paper: ' + esc(SITE.paper.authors) + ' ' +
    '<cite>' + esc(SITE.paper.title) + '</cite>. ' + esc(SITE.paper.venue) + '. ' +
    '<a href="' + SITE.paper.url + '">OpenReview</a>, <a href="' + SITE.paper.pdf + '">PDF</a>. ' +
    'See <a href="/about/#publications">Publications</a>.' + (note ? ' ' + note : '') + '</p></aside>';
}

// Inner pages start with an eyebrow, a title and a lede; lift them into the
// section heading and wrap the rest as prose.
function innerPage(body) {
  var m = body.match(/^\s*<p class="eyebrow">([\s\S]*?)<\/p>\s*<h1>([\s\S]*?)<\/h1>\s*(?:<p class="lede">([\s\S]*?)<\/p>)?/);
  var heading = '', rest = body;
  if (m) {
    heading = '<div class="section-heading"><p class="eyebrow">' + m[1] + '</p><h1>' + m[2] + '</h1>' +
      (m[3] ? '<p class="lede">' + m[3] + '</p>' : '') + '</div>\n';
    rest = body.slice(m[0].length);
  }
  return '<section class="section section--page"><div class="container compact-section">\n' + heading +
    '<div class="page-prose">\n' + rest + '\n</div>\n</div></section>';
}

function renderPage(opts) {
  var title = opts.title ? esc(opts.title) + ' | SAKSHI' : 'SAKSHI | Structured Accountability through Knowledge, Scrutiny, and Health Integrity';
  var current = opts.path || '/';
  var main = opts.raw ? opts.body : innerPage(opts.body);
  var html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
    '<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>' + title + '</title>\n' +
    '<meta name="description" content="' + esc(opts.description || '') + '">\n' +
    '<link rel="icon" href="/assets/mark.svg" type="image/svg+xml">\n' +
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
    '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet">\n' +
    '<link rel="stylesheet" href="' + assetUrl('/assets/style.css') + '">\n' +
    '<script src="' + assetUrl('/assets/site.js') + '" defer></script>\n' +
    '</head>\n<body>\n' +
    '<a class="skip-link" href="#main">Skip to content</a>\n' +
    header(current) +
    (opts.raw ? '' : statusLine()) +
    '<main id="main">\n' + main + '\n</main>\n' +
    footer() +
    '</body>\n</html>\n';
  // Prefix every root-relative link and asset reference with the base path.
  if (BASE) html = html.replace(/(href|src)="\/(?!\/)/g, '$1="' + BASE + '/');
  return html;
}

module.exports = { BASE: BASE, SITE: SITE, NAV: NAV, esc: esc, mark: mark, eye: eye, cite: cite, renderPage: renderPage };
