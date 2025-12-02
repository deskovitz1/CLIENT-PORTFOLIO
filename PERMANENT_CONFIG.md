# Permanent Configuration - DO NOT CHANGE

## ⚠️ CRITICAL: Splash Page Video URL

**The splash page video URL is PERMANENT and should NEVER be changed.**

### Splash Video URL (Spinning Tent Intro)
```
https://f8itx2l7pd6t7gmj.public.blob.vercel-storage.com/CIRCUS%20TENT%20INTRO%20VID.mp4
```

**Location:** `app/config/intro.ts` → `SPLASH_VIDEO_URL`

**Status:** This URL has NEVER been changed and should remain as-is permanently.

**Why:** This is the correct, working URL for the spinning tent intro video that plays on the splash page. Changing this URL will break the splash page.

---

## ⚠️ CRITICAL: Enter Video URL (Click to Enter)

**The enter video URL is PERMANENT and should NEVER be changed.**

### Enter Video URL (Click to Enter Video)
```
https://f8itx2l7pd6t7gmj.public.blob.vercel-storage.com/FINAL%20INTRO%20viD.mp4
```

**Location:** `app/config/intro.ts` → `ENTER_VIDEO_URL`

**Status:** This URL has NEVER been changed and should remain as-is permanently.

**Why:** This is the correct, working URL for the "click to enter" video that plays after the splash page. Changing this URL will break the enter page.

---

## Notes for Developers

- If you see any code that modifies `SPLASH_VIDEO_URL` or `ENTER_VIDEO_URL`, it is likely a bug
- Both video URLs are hardcoded and should not be dynamically fetched
- Always verify both video URLs match the URLs above before deploying
- If the splash page is broken, check that `SPLASH_VIDEO_URL` in `app/config/intro.ts` matches the URL above
- If the enter page is broken, check that `ENTER_VIDEO_URL` in `app/config/intro.ts` matches the URL above
- Both URLs have NEVER been changed and should remain as permanent configuration

