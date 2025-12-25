# FlowerStore Radar

A district-focused landing page that surfaces flower shops from `google-FlowerStore-2025-12-25.csv`, cleans the data into JSON, and renders sortable/filterable cards with clear CTAs (立即訂花、導航、打電話).

## Getting started

1. **Convert the CSV to JSON**
   ```bash
   node scripts/transform-data.js
   ```
   This writes `data/shops.json` using the bundled CSV. The script handles quoted commas and stamps a default district when none is present.

2. **Preview the page**
   Open `index.html` in a browser (no bundler required). The page loads `data/shops.json`, groups stores by district, and applies your sort/filter selections.

3. **Key interactions**
   - Sort by 評分 or 評價數 (both descending)
   - Filter by district, keyword, or minimum rating
   - Use CTAs on each card: 立即訂花 (map page), 導航 (Google Maps directions), 打電話 (tel link when available)

The legacy `package-sample.json` remains if you want to restore the original build tooling, but the current page works as a static site without extra setup.
