# Textpro-me-unofficial-puppeteer-API (Bun + Vercel)

A **TextPro.me scraper** written in **TypeScript**, powered by **Bun**, and deployed to **Vercel**.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/theone2277/Textpro-me-unofficial-puppeteer-API&env=BUN_VERSION=latest&build-command=bun%20i)

> This deploy link sets `BUN_VERSION=latest` during deployment and runs `bun i` as the install step.

---

## Endpoints

### `GET /`

Basic health check.

**Response**

```json
{ "status": "API is running", "endpoints": "/textpro" }
```

---

### `GET /textpro?text=YOUR_TEXT[&effect=EFFECT_URL]`

Generates an image from TextPro.

**Query parameters**

* `text` (required) — Text to render.
* `effect` (optional) — Full TextPro effect page URL. Defaults to the neon example.

**Example**

```bash
curl "https://<YOUR_DEPLOYMENT>.vercel.app/textpro?text=Hello%20World&effect=https://textpro.me/neon-light-text-effect-online-882.html"
```

---

## License

MIT

---
