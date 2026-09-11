#!/usr/bin/env node
// Rewrites the header nav, footer "Pages" links, header/drawer CTA, and
// (on index.html only) the hardcoded mobile drawer nav across every page,
// from one canonical source in this file. Re-run after any nav change
// instead of hand-editing each page.
//
// Usage: node scripts/sync-nav.mjs [--dry-run]

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DRY_RUN = process.argv.includes("--dry-run");

// Files intentionally excluded: 2026_brand_report.html is a meta-refresh
// stub with no header/footer at all.
const EXCLUDE = new Set(["2026_brand_report.html"]);

function findHtmlFiles(dir, base = "") {
  const out = [];
  for (const entry of readdirSync(join(dir, base), { withFileTypes: true })) {
    const relPath = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      out.push(...findHtmlFiles(dir, relPath));
    } else if (entry.name.endsWith(".html")) {
      out.push(relPath);
    }
  }
  return out;
}

const files = findHtmlFiles(ROOT)
  .filter((f) => !EXCLUDE.has(f))
  .sort();

function prefixFor(relPath) {
  const depth = relPath.split("/").length - 1; // segments before filename
  return "../".repeat(depth);
}

// ---- Canonical nav content (uses {{P}} as the root-relative prefix) ----

function desktopNavInner(p) {
  return `
      <a data-page-link="home" href="${p}index.html">Home</a>
      <div class="nav-dropdown">
        <a class="nav-dropdown-toggle" data-page-link="services" href="${p}services.html" aria-haspopup="true">Solutions</a>
        <div class="nav-dropdown-panel nav-dropdown-panel-grouped" aria-label="Solutions">
          <div class="nav-dropdown-group">
            <p class="nav-dropdown-group-title">Business Systems</p>
            <a data-page-link="business-systems" href="${p}business-systems.html">Business Systems</a>
            <a data-page-link="crm" href="${p}crm-integrations.html">CRM &amp; Integrations</a>
          </div>
          <div class="nav-dropdown-group">
            <p class="nav-dropdown-group-title">Websites &amp; Ecommerce</p>
            <a data-page-link="web" href="${p}web-design.html">Web Design</a>
            <a data-page-link="ecommerce" href="${p}ecommerce-systems.html">Ecommerce Systems</a>
            <a data-page-link="conversion" href="${p}conversion.html">Conversion &amp; Landing Pages</a>
          </div>
          <div class="nav-dropdown-group">
            <p class="nav-dropdown-group-title">Marketing &amp; Growth</p>
            <a data-page-link="seo" href="${p}seo.html">SEO</a>
            <a data-page-link="services" href="${p}meta-ads.html">Meta Ads</a>
            <a data-page-link="content" href="${p}content.html">Content Marketing</a>
          </div>
        </div>
      </div>
      <a data-page-link="it-support" href="${p}contact.html">IT Support</a>
      <a data-page-link="results" href="${p}results.html">Our Work</a>
      <a data-page-link="about" href="${p}about.html">About</a>
      <div class="nav-dropdown">
        <a class="nav-dropdown-toggle" data-page-link="blog" href="${p}blog/" aria-haspopup="true">Insights</a>
        <div class="nav-dropdown-panel" aria-label="Insights">
          <a data-page-link="blog" href="${p}blog/">Blog</a>
          <a data-page-link="tools" href="${p}tools/">Tools</a>
          <a href="${p}tools/ad-profit-command-centre/">Ad Profit Command Centre</a>
          <a href="${p}tools/discount-margin/">Discount Margin Calculator</a>
          <a href="${p}tools/break-even-roas/">Break-even ROAS Calculator</a>
          <a href="${p}tools/cac-ceiling/">CAC Ceiling Calculator</a>
          <a href="${p}tools/lead-value/">Lead Value Calculator</a>
          <a href="${p}tools/cvr-impact/">CVR Impact Calculator</a>
          <a href="${p}tools/meta-ads-report/">Meta Ads Report</a>
          <a data-page-link="services" href="${p}website-seo-audit.html">Free Website Audit</a>
        </div>
      </div>
    `;
}

function footerPagesInner(p) {
  return `<h3>Pages</h3><a data-page-link="home" href="${p}index.html">Home</a><a data-page-link="services" href="${p}services.html">Solutions</a><a data-page-link="it-support" href="${p}contact.html">IT Support</a><a data-page-link="business-systems" href="${p}business-systems.html">Business Systems</a><a data-page-link="web" href="${p}web-design.html">Web Design</a><a data-page-link="ecommerce" href="${p}ecommerce-systems.html">Ecommerce Systems</a><a data-page-link="crm" href="${p}crm-integrations.html">CRM &amp; Integrations</a><a data-page-link="seo" href="${p}seo.html">SEO</a><a data-page-link="results" href="${p}results.html">Our Work</a><a data-page-link="about" href="${p}about.html">About</a><a data-page-link="blog" href="${p}blog/">Blog</a><a data-page-link="tools" href="${p}tools/">Tools</a><a data-page-link="contact" href="${p}contact.html">Contact</a><a data-page-link="privacy" href="${p}privacy-policy.html">Privacy Policy</a>`;
}

// Flat list for index.html's hardcoded mobile drawer (mirrors what
// setupMobileNavigation() would produce on every other page: every <a
// href> inside the header nav, in order, drawer JS clones them flat).
function drawerNavInner(p) {
  return `
        <a data-page-link="home" href="${p}index.html">Home</a>
        <a data-page-link="services" href="${p}services.html">Solutions</a>
        <a data-page-link="business-systems" href="${p}business-systems.html">Business Systems</a>
        <a data-page-link="crm" href="${p}crm-integrations.html">CRM &amp; Integrations</a>
        <a data-page-link="web" href="${p}web-design.html">Web Design</a>
        <a data-page-link="ecommerce" href="${p}ecommerce-systems.html">Ecommerce Systems</a>
        <a data-page-link="conversion" href="${p}conversion.html">Conversion &amp; Landing Pages</a>
        <a data-page-link="seo" href="${p}seo.html">SEO</a>
        <a data-page-link="services" href="${p}meta-ads.html">Meta Ads</a>
        <a data-page-link="content" href="${p}content.html">Content Marketing</a>
        <a data-page-link="it-support" href="${p}contact.html">IT Support</a>
        <a data-page-link="results" href="${p}results.html">Our Work</a>
        <a data-page-link="about" href="${p}about.html">About</a>
        <a data-page-link="blog" href="${p}blog/">Blog</a>
        <a data-page-link="tools" href="${p}tools/">Tools</a>
        <a href="${p}tools/ad-profit-command-centre/">Ad Profit Command Centre</a>
        <a href="${p}tools/discount-margin/">Discount Margin Calculator</a>
        <a href="${p}tools/break-even-roas/">Break-even ROAS Calculator</a>
        <a href="${p}tools/cac-ceiling/">CAC Ceiling Calculator</a>
        <a href="${p}tools/lead-value/">Lead Value Calculator</a>
        <a href="${p}tools/cvr-impact/">CVR Impact Calculator</a>
        <a href="${p}tools/meta-ads-report/">Meta Ads Report</a>
        <a data-page-link="services" href="${p}website-seo-audit.html">Free Website Audit</a>
      `;
}

const NAV_CTA_LABEL = "Request a free tech review";

let changedCount = 0;

for (const relPath of files) {
  const abs = join(ROOT, relPath);
  const original = readFileSync(abs, "utf8");
  let out = original;
  const p = prefixFor(relPath);

  // 1. Header nav: keep whatever the opening <nav ...> tag already is
  // (index.html carries an extra class), replace only the inner content.
  out = out.replace(
    /(<nav[^>]*aria-label="Primary"[^>]*>)[\s\S]*?(<\/nav>)/,
    (_m, open, close) => `${open}${desktopNavInner(p)}${close}`
  );

  // 2. Footer "Pages" column (tolerate both the compact single-line form
  // and index.html's multi-line form).
  out = out.replace(
    /<div>\s*<h3>Pages<\/h3>[\s\S]*?<\/div>/,
    `<div>${footerPagesInner(p)}</div>`
  );

  // 3. Header / drawer CTA button(s) — every `.nav-cta` anchor on the page.
  // Points at business-tech-review.html now that page exists (Phase 2).
  out = out.replace(
    /<a class="nav-cta" href="[^"]*">[^<]*<\/a>/g,
    `<a class="nav-cta" href="${p}business-tech-review.html">${NAV_CTA_LABEL}</a>`
  );

  // 4. index.html only: hardcoded mobile drawer nav.
  if (relPath === "index.html") {
    out = out.replace(
      /(<nav class="index3-drawer-nav" aria-label="Mobile">)[\s\S]*?(<\/nav>)/,
      (_m, open, close) => `${open}${drawerNavInner(p)}${close}`
    );
  }

  if (out !== original) {
    changedCount++;
    if (!DRY_RUN) writeFileSync(abs, out, "utf8");
  }
}

console.log(`${DRY_RUN ? "[dry-run] " : ""}nav sync: ${changedCount}/${files.length} files updated`);
