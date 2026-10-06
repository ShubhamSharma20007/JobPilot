# JobPilot Chrome Extension

> Select any email on any webpage → instantly add it to your JobPilot recruiter sheet.

## What it does

- **Text selection popup** – highlight an email address on any page and a JobPilot mini-popup appears below the selection with an "Add to your sheet" button.
- **Toolbar popup** – click the JobPilot icon in the Chrome toolbar to manually type/paste an email, see your login status, or open your sheet.
- **Auth-aware** – if you're already logged into [JobPilot](http://localhost:5173) in the same browser profile, it works immediately. If not, it opens the JobPilot login page.

## Installing locally (Developer mode)

1. Open Chrome and go to `chrome://extensions/`
2. Toggle **"Developer mode"** on (top-right corner)
3. Click **"Load unpacked"**
4. Select the `extension/` folder from this project
5. The **JobPilot** icon appears in your toolbar

## Usage

### Method 1 – Select email on any page
1. Browse to a page with a recruiter's email (LinkedIn, company site, Gmail, etc.)
2. **Select** the email address with your mouse
3. A JobPilot popup appears — click **"Add to your sheet"**
4. Done! The email is queued in your sheet and JobPilot will send it at the next scheduled time.

### Method 2 – Toolbar popup
1. Click the **JobPilot** icon in the Chrome toolbar
2. Type or paste an email in the "Add manually" field
3. Press **Enter** or click **Add**

## Authentication

The extension shares the same session cookie as the JobPilot web app. As long as you're signed into `http://localhost:5173` (or the production domain) in Chrome, the extension is authenticated automatically.

If you're not signed in, the extension will open the JobPilot sign-in page.

## Configuration

Before building for production, update these two constants in both `background.js` and `popup.js`:

```js
const API_BASE    = "https://your-backend.com";   // was: http://localhost:8001
const JOBPILOT_URL = "https://your-app.com";       // was: http://localhost:5173
```

And update `manifest.json` → `host_permissions` to include your production backend domain.

## Files

```
extension/
├── manifest.json      – Extension config (MV3)
├── background.js      – Service worker: handles API calls & auth
├── content.js         – Injected into every page: detects selected emails
├── content.css        – Styles for the floating tooltip popup
├── popup.html         – Toolbar popup UI
├── popup.js           – Toolbar popup logic
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```
