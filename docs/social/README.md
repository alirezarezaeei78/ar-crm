# AR CRM launch assets

The LinkedIn launch copy is in [linkedin-post.txt](linkedin-post.txt). The images are 1080 × 1440 portrait frames containing real screenshots of the sample CRM, with no real customer information. This 3:4 format matches the portrait panels observed in LinkedIn's multi-image feed, so the headings and CRM views stay inside the visible panel instead of being cropped from a wide image.

Recommended order:

1. [01-overview.jpg](01-overview.jpg) — Open-source launch and sales dashboard.
2. [02-customers.jpg](02-customers.jpg) — Customer profile, purchase history, value, and loyalty.
3. [03-pipeline.jpg](03-pipeline.jpg) — Retail sales opportunities and forecasts.
4. [04-retail.jpg](04-retail.jpg) — Products, orders, inventory, and reporting.

Suggested alternative text:

- **Overview:** AR CRM, an MIT-licensed open-source retail CRM, with a dashboard showing revenue, order count, customer activity, sales channels, and recent orders.
- **Customers:** AR CRM customer profile showing fictional customer Sophie Anderson, purchase history, lifetime value, loyalty points, notes, and marketing preferences.
- **Pipeline:** AR CRM sales board with opportunities grouped into New lead, Contacted, Proposal, Negotiation, and Won, alongside pipeline value and weighted forecasts.
- **Retail:** AR CRM product catalog displaying illustrated retail products with prices, stock levels, and margin information.

The editable portrait composition is [portrait.html](portrait.html), with `?slide=0` through `?slide=3` selecting the frame. To preview it locally from the repository root:

```sh
python -m http.server 8848 --bind 127.0.0.1
```

Open `http://localhost:8848/docs/social/portrait.html?slide=0`. Export each frame at exactly 1080 × 1440, then upload the four JPEG files directly to LinkedIn. Wait for media processing to finish and check the live feed after publishing. Original screenshots are in [docs/images](../images/). The older [launch.html](launch.html) composition is retained for landscape previews; use the portrait exports for LinkedIn.
