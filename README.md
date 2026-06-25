# Lee-Ann Appreciation Website

A soft, mobile-first appreciation website designed to open from a QR code attached to flowers.

This version uses generated background image assets instead of the earlier coded floral/petal background.

## Files

- `index.html` — page structure and all messages
- `styles.css` — colours, layout, animations, cards, buttons, and page background assignments
- `script.js` — page navigation, button feedback, response state handling
- `assets/backgrounds/` — generated WebP background images, including the bouquet landing page background

## How to run locally

Open `index.html` in a browser.

For a cleaner local preview, use VS Code Live Server or run:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## How to publish

Simple options:

1. GitHub Pages
2. Netlify Drop
3. Vercel
4. Cloudflare Pages

After publishing, copy the public URL and generate a QR code from it.

## QR note text

For when you get home 🤍  
Scan this, but don’t judge me for being extra 😂  
— BK

## Optional response tracking

The site currently saves her selected response to `localStorage` on the same device.

To receive the response remotely, add your endpoint inside `script.js`:

```js
const RESPONSE_WEBHOOK_URL = 'YOUR_ENDPOINT_HERE';
```

Suggested services:

- Formspree
- EmailJS
- Supabase Edge Function
- Firebase Function

The payload sent is:

```json
{
  "selectedOption": "Yes / Maybe",
  "pageName": "question",
  "timestamp": "ISO timestamp"
}
```
