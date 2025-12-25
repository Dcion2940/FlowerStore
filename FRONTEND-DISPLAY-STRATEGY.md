# Front-end display strategy for missing phone numbers

When a store listing lacks a phone number, avoid leaving a blank column by promoting alternative contact and action paths.

## Display rules
- **Primary CTA**: Render a prominent button labeled `立即線上洽詢` ("Chat with us now") that opens the preferred online chat channel (e.g., Line, Messenger, or in-site chat widget).
- **Secondary options**: If chat is unavailable, show a `留下需求` ("Leave your request") link that opens a short form modal capturing name, inquiry, and email. Confirm submission inline without a page reload.
- **Contextual link**: Always keep the map/detail link visible so users can still click through to Google Maps for more info.
- **Badges instead of blanks**: Replace the empty phone cell with a neutral badge such as `未提供電話` ("Phone not provided") to maintain layout alignment.
- **Responsive layout**: Ensure the badge/CTA stack vertically on small screens to prevent overflow.

## Data-handling notes
- Use the `phone_status` column in `google-FlowerStore-2025-12-25.csv` to decide when to show the fallback UI. Rows marked `missing` should trigger the CTA + badge treatment; rows marked `present` continue to show the phone number as usual.
- If a phone number becomes available later, populate it in the data source and switch `phone_status` to `present` to restore the standard layout automatically.
