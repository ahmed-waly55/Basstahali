# Basstahali — بسطهالي

Angular 22 and Tailwind CSS frontend for live online private lessons. Application dependencies and the npm lockfile are unchanged by the UI update.

## Development

Use Node.js 24.15 or later in the 24.x line (validated with 24.19.0) and npm 11.10.0, as pinned in `package.json`.

```bash
npm ci
NG_CLI_ANALYTICS=false npm start -- --host 0.0.0.0 --port 4200
npm test -- --watch=false
npm run build
npm run serve:ssr:basstahali
```

In the managed cloud environment, use `NODE_USE_ENV_PROXY=1` for Node HTTPS requests through the supplied proxy. Public API reads require network access to `api.basstahali.com`. Images and existing icon styles additionally use `api.dicebear.com`, `images.unsplash.com`, and `cdnjs.cloudflare.com`. No secret is needed for the public curriculum endpoints.

## UI behaviour

- Curricula, grade levels and subjects come from the existing API. The original catalog cards support loading, retry, empty results and Arabic/English names supplied by the API. No sample curriculum data is shipped.
- All public pages, cards, forms, badges, hover states, footer and the 404 screen follow the selected theme. Gold actions retain dark text for contrast.
- Arabic uses the self-hosted variable Alexandria font and English uses Inter; font files and their original OFL licenses are in `public/fonts`. No remote font stylesheet or new application dependency is required.
- Language and theme controls are available in the header. Preferences are saved locally; the initial language is Arabic and the initial theme follows the device preference.
- The photorealistic illustrative student image moves continuously while visible, with a pause/play control, gentle scroll movement and reduced-motion support. Motion pauses outside the viewport. The optimized WebP asset and the interaction use Angular and CSS without a new animation dependency.
- AOS sections animate once and remain visible when scrolling back up. Phone headings and large paragraphs use smaller reading sizes while desktop sizes and form controls are preserved.
- The landing feedback carousel contains ten clearly labelled, temporary illustrative examples. Its controls support Arabic and English scroll directions.
- Privacy and terms pages are available at `/privacy` and `/terms`, in Arabic and English with the selected theme. They explain the existing registration, email/WhatsApp contact, browser preferences and external resources, including Google AdSense. Both pages have working footer links, their own SEO metadata and prerendered content.
- The existing right-click and developer shortcut handlers are preserved. These are browser interactions, not a security boundary; sensitive information must stay on the backend.

## SEO and deployment

The app sets route-specific titles, descriptions, canonical URLs, social metadata and breadcrumb structured data. Arabic remains the primary server-rendered language. The robots file and static sitemap list valid public routes; unknown routes are marked `noindex`.

Run the generated Node SSR server to render live API-backed curriculum and subject pages for crawlers. The existing `vercel.json` uses an SPA fallback; that deployment must be configured for Angular SSR to deliver server-rendered dynamic pages. Static hosting depends on client rendering for those pages. Verify the production canonical hostname and submit `https://www.basstahali.com/sitemap.xml` through Google Search Console after deployment. Search ranking is not guaranteed by technical SEO changes.

## Application status API

The tracking panel shows only a numeric application-number input. Registration states are decoded from the API payload (`Pending`, `Approved`, `Rejected`), independently of an outer HTTP/status field. Unknown states are reported rather than silently presented as pending.

The current backend Swagger contract and a read-only validation check require `whatsAppNumber` for `GET /api/v1/teacher-forms/{requestId}/status`. The frontend reuses the number already entered during registration when available, without storing it in local storage. A fresh visit with only an application number remains blocked by the backend requirement; supporting that workflow needs an API change. No application was created and no real teacher record was queried during validation.

The HTTP interceptor counts concurrent API requests, handles cancellation, applies a 20-second timeout, preserves errors and never retries writes automatically. The teacher registration screen handles its own errors to avoid duplicate notifications. The contact form opens an email draft; it does not falsely claim delivery.

API loading uses a slim progress bar and a compact, non-blocking status card with the Basstahali owl. The indicator appears after 180ms, cancels its pending reveal when requests finish, follows language/theme preferences and respects reduced motion. The hero copy and actions are centered in the single-column mobile/tablet layout. Public contact and WhatsApp links use +971 56 330 6087.

The About illustration follows the selected theme: the original image is used in light mode and an optimized, locally stored dark WebP variant in dark mode. The illustration keeps the student, educational graphics and original Arabic labels.

The original page layouts were restored at the user’s request. The current header and photorealistic hero are retained; Courses and Features are available in both desktop and mobile header navigation. API, status parsing, interceptor and SEO corrections are preserved. The header uses touch-friendly controls, a scrollable mobile menu below 1120px and a prominent gold mobile login button; branded notifications and confirmation dialogs follow the selected theme and fit narrow screens.
