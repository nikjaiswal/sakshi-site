'use strict';
// Renders site/profiles/ from profiles-data/*.json.
// - Validates each data file against profile-schema.json (a small built-in
//   validator; no dependencies). Invalid files fail the build.
// - Writes site/profiles/index.html and site/profiles/<slug>/index.html.
// - Copies profile-schema.json to site/profiles/ so the format is public.
const fs = require('fs');
const path = require('path');
const lib = require('./lib');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'profiles-data');
const OUT_DIR = path.join(ROOT, 'site', 'profiles');
const SCHEMA_PATH = path.join(ROOT, 'profile-schema.json');

const esc = lib.esc;
const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));

// ---- Minimal JSON Schema validator (subset used by profile-schema.json) ----
function deref(node) {
  if (node && node.$ref) {
    var parts = node.$ref.replace(/^#\//, '').split('/');
    var target = schema;
    parts.forEach(function (p) { target = target[p]; });
    return deref(target);
  }
  return node;
}
function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}
function validate(node, value, at, errors) {
  node = deref(node);
  if (!node) return;
  if (node.allOf) node.allOf.forEach(function (sub) { validate(sub, value, at, errors); });
  if (node.const !== undefined && value !== node.const) {
    errors.push(at + ': must equal ' + JSON.stringify(node.const));
  }
  if (node.type) {
    var t = typeOf(value);
    var ok = node.type === 'integer' ? (t === 'number' && Number.isInteger(value)) : t === node.type;
    if (!ok) { errors.push(at + ': expected ' + node.type + ', got ' + t); return; }
  }
  if (node.enum && node.enum.indexOf(value) < 0) {
    errors.push(at + ': must be one of ' + node.enum.join(', '));
  }
  if (typeof value === 'string') {
    if (node.pattern && !new RegExp(node.pattern).test(value)) errors.push(at + ': does not match ' + node.pattern);
    if (node.format === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) errors.push(at + ': expected a date in YYYY-MM-DD form');
    if (node.format === 'uri' && !/^https?:\/\/\S+$/.test(value)) errors.push(at + ': expected an http(s) URL');
  }
  if (Array.isArray(value)) {
    if (node.minItems != null && value.length < node.minItems) errors.push(at + ': needs at least ' + node.minItems + ' item(s)');
    if (node.items) value.forEach(function (v, i) { validate(node.items, v, at + '[' + i + ']', errors); });
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    (node.required || []).forEach(function (k) {
      if (!(k in value)) errors.push(at + ': missing required field "' + k + '"');
    });
    var known = Object.assign({}, node.properties || {});
    // Properties declared on allOf members count as known.
    (node.allOf || []).forEach(function (sub) { Object.assign(known, deref(sub).properties || {}); });
    Object.keys(value).forEach(function (k) {
      if (known[k]) validate(known[k], value[k], at + '.' + k, errors);
      else if (node.additionalProperties === false) errors.push(at + ': unknown field "' + k + '"');
    });
  }
}

// ---- Rendering helpers ----
const DOMAINS = [
  ['clinical_evidence_audit', 'Clinical evidence audit', 'Published claims against the actual evidence base.'],
  ['regulatory_pathway_analysis', 'Regulatory pathway analysis', 'How the product entered the market and what oversight it is subject to.'],
  ['financial_disclosure_map', 'Financial disclosure map', 'Investor and board relationships; incentive structures.'],
  ['patient_experience_reporting', 'Patient experience reporting', 'Informed consent, workflow integration, recourse mechanisms.']
];
const STATUS_LABEL = {
  'published': 'Published',
  'response-window-open': 'Response window open',
  'company-responded': 'Company responded',
  'under-reassessment': 'Under reassessment',
  'corrected': 'Corrected',
  'withdrawn': 'Withdrawn'
};
const EVIDENCE_LABEL = {
  'independent-evidence-available': 'Independent evidence available',
  'evidence-incomplete': 'Evidence incomplete',
  'no-independent-evidence': 'No independent evidence',
  'company-did-not-engage': 'Company did not engage',
  'not-yet-examined': 'Not yet examined'
};
function label(map, v) { return map[v] || v; }
function list(items, fn) {
  if (!items || !items.length) return '<p class="muted">None recorded.</p>';
  return '<ul>' + items.map(fn).join('') + '</ul>';
}
function dl(pairs) {
  return '<dl class="facts">' + pairs.filter(function (p) { return p[1]; }).map(function (p) {
    return '<div><dt>' + esc(p[0]) + '</dt><dd>' + p[1] + '</dd></div>';
  }).join('') + '</dl>';
}

function renderDomain(key, title, blurb, d) {
  var html = '<section class="domain" id="' + key.replace(/_/g, '-') + '">' +
    '<h3>' + esc(title) + '</h3><p class="muted">' + esc(blurb) + '</p>' +
    '<p class="badge badge-' + esc(d.evidence_status) + '">' + esc(label(EVIDENCE_LABEL, d.evidence_status)) + '</p>' +
    '<p>' + esc(d.summary) + '</p>';
  if (d.key_questions && d.key_questions.length) {
    html += '<h4>Key investigative questions</h4><dl class="qa">' + d.key_questions.map(function (q) {
      return '<div><dt>' + esc(q.question) + '</dt><dd>' + esc(q.answer) + '</dd></div>';
    }).join('') + '</dl>';
  }
  html += '<h4>Evidence examined</h4>' + list(d.evidence_examined, function (e) {
    var s = esc(e.description);
    if (e.source_url) s += ' (<a href="' + esc(e.source_url) + '">source</a>' + (e.accessed_on ? ', accessed ' + esc(e.accessed_on) : '') + ')';
    return '<li>' + s + '</li>';
  });
  html += '<h4>Gaps</h4>' + list(d.gaps, function (g) { return '<li>' + esc(g) + '</li>'; });
  if (key === 'clinical_evidence_audit') {
    if (d.reporting_guidelines_applied && d.reporting_guidelines_applied.length) {
      html += '<p>Reporting guidelines applied: ' + d.reporting_guidelines_applied.map(esc).join(', ') + '.</p>';
    }
    if (d.technical_evaluation) {
      var te = d.technical_evaluation;
      var rows = [['Calibration', te.calibration], ['Subgroup fairness', te.subgroup_fairness], ['Robustness', te.robustness], ['Dataset shift', te.dataset_shift]];
      html += '<h4>Technical evaluation layer</h4><div class="table-wrap"><table><thead><tr><th scope="col">Dimension</th><th scope="col">Reported by company</th><th scope="col">Note</th></tr></thead><tbody>' +
        rows.filter(function (r) { return r[1]; }).map(function (r) {
          return '<tr><th scope="row">' + esc(r[0]) + '</th><td>' + (r[1].reported ? 'Yes' : 'No') + '</td><td>' + esc(r[1].note || '') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }
  }
  return html + '</section>';
}

function renderProfile(p) {
  var body = '<p class="eyebrow">Profile</p>' +
    '<h1>' + esc(p.company.name) + '</h1>' +
    '<p class="lede">' + esc(p.system.name) + (p.system.category ? ', ' + esc(p.system.category) : '') + '</p>' +
    '<article class="profile">' +
    '<p class="badge badge-status-' + esc(p.status) + '">' + esc(label(STATUS_LABEL, p.status)) + '</p>' +
    dl([
      ['Deployment contexts', '<ul class="plain">' + p.deployment_contexts.map(function (c) {
        var s = esc(c.country) + ': ' + esc(c.setting);
        if (c.sites_reported) s += ' (' + esc(c.sites_reported) + ')';
        if (c.entry_pathway) s += '. Entry pathway: ' + esc(c.entry_pathway) + '.';
        if (c.since) s += ' Since ' + esc(c.since) + '.';
        return '<li>' + s + '</li>';
      }).join('') + '</ul>'],
      ['Clinical autonomy observed', esc(p.system.clinical_autonomy)],
      ['Intended use (as stated by the company)', p.system.intended_use ? esc(p.system.intended_use) : ''],
      ['Version observed', p.system.version_observed ? esc(p.system.version_observed) : ''],
      ['Produced by', esc(p.hub.name) + (p.hub.region ? ', ' + esc(p.hub.region) : '')],
      ['First published', esc(p.dates.first_published)],
      ['Last updated', esc(p.dates.last_updated)],
      ['Next review', p.dates.next_review ? esc(p.dates.next_review) : '']
    ]) +
    (p.company.description ? '<p>' + esc(p.company.description) + '</p>' : '') +
    '<p class="note">This profile is a structured summary, domain by domain. It carries no single numerical score. Companies may respond through the <a href="/governance/#appeals">appeals and correction process</a>; responses and corrections are published below.</p>' +
    '<h2>Findings</h2>' +
    DOMAINS.map(function (d) { return renderDomain(d[0], d[1], d[2], p.findings[d[0]]); }).join('') +
    '<h2 id="company-response">Company response</h2>' +
    dl([
      ['Status', esc(p.company_response.status)],
      ['Notified on', p.company_response.notified_on ? esc(p.company_response.notified_on) : ''],
      ['Response window closes', p.company_response.window_closes ? esc(p.company_response.window_closes) : ''],
      ['Received on', p.company_response.received_on ? esc(p.company_response.received_on) : ''],
      ['Position', p.company_response.position ? esc(p.company_response.position) : '']
    ]) +
    (p.company_response.summary ? '<p>' + esc(p.company_response.summary) + '</p>' : '') +
    (p.company_response.full_text ? '<details><summary>Full text of the response</summary><blockquote>' + esc(p.company_response.full_text) + '</blockquote></details>' : '') +
    '<h2 id="correction-log">Correction log</h2>' +
    (p.correction_log.length
      ? '<div class="table-wrap"><table><thead><tr><th scope="col">Date</th><th scope="col">Change</th><th scope="col">Trigger</th></tr></thead><tbody>' +
        p.correction_log.map(function (c) {
          return '<tr><td>' + esc(c.date) + '</td><td>' + esc(c.description) + (c.fields_changed && c.fields_changed.length ? '<br><small>Fields: ' + c.fields_changed.map(esc).join(', ') + '</small>' : '') + '</td><td>' + esc(c.trigger) + '</td></tr>';
        }).join('') + '</tbody></table></div>'
      : '<p class="muted">No corrections have been recorded.</p>') +
    (p.conflicts_noted && p.conflicts_noted.length
      ? '<h2>Disclosed relationships below the recusal threshold</h2>' + list(p.conflicts_noted, function (c) { return '<li>' + esc(c) + '</li>'; })
      : '') +
    (p.editorial_review
      ? '<h2>Editorial review</h2>' + dl([
          ['Reviewed on', p.editorial_review.reviewed_on ? esc(p.editorial_review.reviewed_on) : ''],
          ['Board composition and disclosures', p.editorial_review.board_disclosures_url ? '<a href="' + esc(p.editorial_review.board_disclosures_url) + '">published here</a>' : '']
        ])
      : '') +
    '<p class="note">Rendered from <code>profiles-data/' + esc(p.slug) + '.json</code>. The data file and its full edit history are public.</p>' +
    '</article>';
  return lib.renderPage({
    title: p.company.name + ' profile',
    description: 'SAKSHI profile of ' + p.company.name + ' (' + p.system.name + ').',
    path: '/profiles/' + p.slug + '/',
    body: body
  });
}

function renderIndex(profiles) {
  var body = '<p class="eyebrow">Profiles</p><h1>Published profiles</h1>';
  if (!profiles.length) {
    body += '<p class="lede">No profiles have been published. SAKSHI is a proposal under development, and the first regional hubs are not yet operating.</p>' +
      '<h2>What a profile will be</h2>' +
      '<ul>' +
      '<li><strong>Public.</strong> Every profile is published on this site under the consortium’s institutional name, with its full data file and edit history in the public repository.</li>' +
      '<li><strong>Regularly updated.</strong> The system under review keeps changing after deployment, so the profile is updated as it changes rather than on a fixed review cycle.</li>' +
      '<li><strong>Structured for cross-context comparison.</strong> Every profile applies the same four-domain protocol and the same data format, so a finding from one country can be read next to one from another.</li>' +
      '<li><strong>Subject to appeals.</strong> On publication the company is notified and given a set window to respond. Its response is published with the profile, and verified corrections are appended with a date. See <a href="/governance/#appeals">Governance</a>.</li>' +
      '</ul>' +
      '<h2>Format</h2>' +
      '<p>Profiles are rendered from structured data files, one per profile, not from hand-edited pages. The format is documented in the <a href="/profiles/profile-schema.json">profile schema</a>. It covers the company and system, deployment contexts, a status badge, findings in each of the four domains, the company’s response, and a dated correction log.</p>' +
      '<p>The <a href="/case-study/">case study</a> walks through what a completed profile examines, using a hypothetical composite that depicts no real company.</p>';
  } else {
    body += '<p class="lede">' + profiles.length + ' profile' + (profiles.length === 1 ? '' : 's') + ', each rendered from a public data file and subject to the <a href="/governance/#appeals">appeals and correction process</a>.</p>' +
      '<div class="table-wrap"><table><thead><tr><th scope="col">Company</th><th scope="col">System</th><th scope="col">Deployment contexts</th><th scope="col">Status</th><th scope="col">Last updated</th></tr></thead><tbody>' +
      profiles.map(function (p) {
        return '<tr><th scope="row"><a href="/profiles/' + esc(p.slug) + '/">' + esc(p.company.name) + '</a></th>' +
          '<td>' + esc(p.system.name) + '</td>' +
          '<td>' + p.deployment_contexts.map(function (c) { return esc(c.country); }).join(', ') + '</td>' +
          '<td><span class="badge badge-status-' + esc(p.status) + '">' + esc(label(STATUS_LABEL, p.status)) + '</span></td>' +
          '<td>' + esc(p.dates.last_updated) + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<p>Format: <a href="/profiles/profile-schema.json">profile schema</a>.</p>';
  }
  body += lib.cite();
  return lib.renderPage({
    title: 'Profiles',
    description: 'Public, regularly updated SAKSHI profiles of health AI deployments, structured for cross-context comparison and subject to an appeals process.',
    path: '/profiles/',
    body: body
  });
}

// ---- Main ----
function main() {
  var files = fs.existsSync(DATA_DIR)
    ? fs.readdirSync(DATA_DIR).filter(function (f) { return f.endsWith('.json'); }).sort()
    : [];
  var profiles = [];
  var failed = false;
  files.forEach(function (f) {
    var data;
    try {
      data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8'));
    } catch (e) {
      console.error(f + ': invalid JSON (' + e.message + ')');
      failed = true; return;
    }
    var errors = [];
    validate(schema, data, 'profile', errors);
    var expectedSlug = f.replace(/\.json$/, '');
    if (data && data.slug !== expectedSlug) errors.push('profile.slug: must equal filename "' + expectedSlug + '"');
    if (errors.length) {
      console.error(f + ': ' + errors.length + ' validation error(s)');
      errors.forEach(function (e) { console.error('  ' + e); });
      failed = true; return;
    }
    profiles.push(data);
  });
  if (failed) {
    console.error('Build failed: fix the data files above.');
    process.exit(1);
  }

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), renderIndex(profiles));
  fs.copyFileSync(SCHEMA_PATH, path.join(OUT_DIR, 'profile-schema.json'));
  profiles.forEach(function (p) {
    var dir = path.join(OUT_DIR, p.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), renderProfile(p));
  });
  console.log('Rendered ' + profiles.length + ' profile(s) from ' + files.length + ' data file(s) into site/profiles/.');
}

main();
