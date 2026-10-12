'use strict';
// Shared page layout for the SAKSHI site.
// Used by build/render-profiles.js to render profile pages. The static pages
// in site/ carry the same header, status line and footer by hand; keep the
// three in step when editing this file.

const SITE = {
  name: 'SAKSHI',
  longName: 'Structured Accountability through Knowledge, Scrutiny, and Health Integrity',
  email: 'lcp-sakshi@mit.edu',
  // Set to the public GitHub repository URL once the repository exists.
  // When empty, the footer omits the repository link.
  repoUrl: '',
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
  ['/', 'Home'],
  ['/protocol/', 'The Protocol'],
  ['/governance/', 'Governance'],
  ['/case-study/', 'Case Study'],
  ['/profiles/', 'Profiles'],
  ['/get-involved/', 'Get Involved'],
  ['/about/', 'About']
];

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// The witness mark: an open eye drawn as a single stroke with a filled pupil.
function mark(cls) {
  return '<svg class="' + (cls || 'mark') + '" viewBox="0 0 32 20" width="32" height="20" aria-hidden="true" focusable="false">' +
    '<path d="M1.5 10C6 3 11 1.5 16 1.5S26 3 30.5 10C26 17 21 18.5 16 18.5S6 17 1.5 10Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>' +
    '<circle cx="16" cy="10" r="3.6" fill="currentColor"/></svg>';
}

function nav(current) {
  return '<nav class="site-nav" aria-label="Primary"><ul>' + NAV.map(function (item) {
    var active = item[0] === current || (item[0] !== '/' && current.indexOf(item[0]) === 0);
    return '<li><a href="' + item[0] + '"' + (active ? ' aria-current="page"' : '') + '>' + esc(item[1]) + '</a></li>';
  }).join('') + '</ul></nav>';
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

function renderPage(opts) {
  var title = opts.title ? esc(opts.title) + ' | SAKSHI' : 'SAKSHI';
  var repoLink = SITE.repoUrl
    ? '<p><a href="' + esc(SITE.repoUrl) + '">Source and edit history on GitHub</a></p>' : '';
  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
    '<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<title>' + title + '</title>\n' +
    '<meta name="description" content="' + esc(opts.description || '') + '">\n' +
    '<meta name="color-scheme" content="light dark">\n' +
    '<link rel="stylesheet" href="/assets/style.css">\n' +
    '<link rel="icon" href="/assets/mark.svg" type="image/svg+xml">\n' +
    '</head>\n<body' + (opts.bodyClass ? ' class="' + esc(opts.bodyClass) + '"' : '') + '>\n' +
    '<a class="skip" href="#main">Skip to content</a>\n' +
    '<header class="site-header">\n<div class="wrap bar">\n' +
    '<a class="brand" href="/">' + mark('mark') + '<span>SAKSHI</span></a>\n' +
    nav(opts.path || '/') + '\n</div>\n' +
    '<div class="status-line"><div class="wrap"><p><strong>Status.</strong> ' + esc(SITE.status) + '</p></div></div>\n' +
    '</header>\n' +
    '<main id="main" class="wrap" tabindex="-1">\n' + opts.body + '\n</main>\n' +
    '<footer class="site-footer">\n<div class="wrap foot">\n' +
    '<div class="foot-id">' + mark('mark') + '<p><strong>SAKSHI</strong>, a project of MIT Critical Data, Laboratory for Computational Physiology, MIT.</p></div>\n' +
    '<div class="foot-contact"><p>Contact: <a href="mailto:' + SITE.email + '">' + SITE.email + '</a> ' +
    '<button type="button" class="copy" data-copy="' + SITE.email + '">Copy address</button></p>' +
    repoLink +
    '<p>Content licensed <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.</p></div>\n' +
    '</div>\n</footer>\n' +
    '<script src="/assets/site.js"></script>\n' +
    '</body>\n</html>\n';
}

module.exports = { SITE: SITE, NAV: NAV, esc: esc, mark: mark, cite: cite, renderPage: renderPage };
