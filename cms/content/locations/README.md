# Chennai area pages: content files

One JSON file per area guide under `/home-construction/<slug>/`. The import
script (`cms/scripts/import-locations.mjs`) writes them to the CMS through the
REST API and publishes them (which also pings IndexNow).

The short facts shown in the "Area at a glance" panel (pincodes, approvals,
nearby areas) are not here: they live in `src/app/shared/seo/areas.ts`, keyed
by the same slug.

## Format

```json
{
  "slug": "builders-in-omr",
  "mode": "create",
  "title": "Builders in OMR: Building a House on Chennai's IT Corridor",
  "seo": {
    "metaTitle": "Builders in OMR, Chennai | House Construction | Hunter Property",
    "metaDescription": "150–158 characters, says what the page offers and ends with a reason to click."
  },
  "excerpt": "One or two plain sentences summarising the page.",
  "content": "<h2>…</h2><p>…</p>",
  "faqTitle": "Building in OMR: questions owners ask",
  "faqs": [
    { "question": "…?", "answer": "<p>…</p>" }
  ],
  "clientInputs": ["Not imported. Notes on where a real project photo or detail from the client would strengthen the page."]
}
```

- `mode: "create"` makes a new page in the Home Construction category.
- `mode: "update"` changes an existing page found by slug. Only the fields
  present are written; leave out `content` to keep the existing article body.
  The editor's HTML comment notes at the top of an existing body are removed
  either way.
- `title` is the page's H1. `seo.metaTitle` is the `<title>`, at most 65 characters.
- `content` is HTML (h2/h3/p/ul/ol/table/strong). No H1: the page renders the title as the H1.
- `faqs` become a "FAQs" block below the article and FAQPage structured data.

## Writing rules

- Every page must be specific to its area. Swapping in a different place name
  must not produce a sensible page: Google treats near-identical location pages
  as doorway pages.
- Only established public facts about an area. No invented statistics, project
  counts, testimonials, years in business, or "we built N homes here".
- Costs come only from our published packages: Basic ₹2,199, Standard ₹2,399,
  Premium ₹2,699, Ultra Luxury ₹3,199 per sq ft of built-up area.
- Approval bodies match `areas.ts`.
