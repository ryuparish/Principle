# Sharing Guide for Principle Users

## Table of Contents

1. [Overview](#overview)
2. [How to Share a Concept Map](#how-to-share-a-concept-map)
3. [Public vs Unlisted](#public-vs-unlisted)
4. [Downloading & Exporting](#downloading--exporting)
5. [Viewing Shared Maps](#viewing-shared-maps)
6. [Disabling Sharing](#disabling-sharing)
7. [FAQ](#faq)
8. [Troubleshooting](#troubleshooting)

---

## Overview

Principle allows you to share your concept maps with others through public URLs or secret links. You can also export them as standalone files that work offline.

**Sharing Features**:
- 🌐 **Public Sharing** - Anyone with the link can view
- 🔒 **Unlisted Sharing** - Secret link with token for privacy
- 📄 **JSON Export** - Machine-readable format for backups
- 🌍 **HTML Export** - Standalone viewer that works offline
- 👁️ **Read-Only Access** - Viewers can't edit your map

---

## How to Share a Concept Map

### Step 1: Open Your Concept Map

Navigate to the concept map you want to share.

### Step 2: Click the Share Button

Look for the **Share** button in the map toolbar or menu.

### Step 3: Enable Sharing

In the Share modal that appears:

1. Click **"Make Public"** for a public share link
2. OR click **"Unlisted (Secret Link)"** for a private share link

### Step 4: Copy the Share URL

Once enabled, you'll see a share URL like:
```
http://yourapp.com/share/my-concept-map-abc123
```

Click the **"Copy"** button to copy it to your clipboard.

### Step 5: Share the Link

Send the link to anyone you want to share with via:
- Email
- Slack/Teams message
- Social media
- Text message

---

## Public vs Unlisted

### Public Sharing

**When to use**:
- Sharing educational content
- Public documentation
- Open knowledge sharing
- Portfolio work

**Characteristics**:
- ✅ Anyone with the link can view
- ✅ Simple, clean URL
- ⚠️ No password protection
- ⚠️ Potentially discoverable

**Example URL**:
```
http://yourapp.com/share/introduction-to-react-abc123
```

### Unlisted Sharing

**When to use**:
- Sharing with specific people
- Sensitive or private information
- Work-in-progress content
- Confidential project planning

**Characteristics**:
- ✅ Requires secret token in URL
- ✅ Not publicly discoverable
- ✅ Token can't be guessed
- ⚠️ URL is longer (includes token)

**Example URL**:
```
http://yourapp.com/share/my-private-map-xyz789?token=xK7p9mNqW2vR4zL8sJ3fT6hY5nB1cV0
```

**Security Note**: Anyone with the full URL (including token) can access the map. Treat unlisted links like passwords.

---

## Downloading & Exporting

### JSON Export

**What it is**: A machine-readable file containing all your map data.

**When to use**:
- Backing up your maps
- Version control (commit to git)
- Programmatic analysis
- Migrating to other tools

**How to download**:
1. Open the Share modal
2. Click **"Download as JSON"**
3. File downloads as `{map-name}.json`

**What's included**:
- All nodes with titles, content, positions
- All edges with connections and labels
- Media references (URLs, not files)
- Map metadata (name, description, viewport)

### HTML Export

**What it is**: A standalone HTML file with embedded React viewer.

**When to use**:
- Sharing for offline viewing
- Archiving final versions
- Presenting without internet
- Embedding in documentation

**How to download**:
1. Open the Share modal
2. Click **"Download as HTML"**
3. File downloads as `{map-name}.html`

**Features**:
- ✅ Works completely offline
- ✅ No installation needed
- ✅ Pan, zoom, and navigation
- ✅ Click nodes to view content
- ✅ Export JSON button included
- ⚠️ Images require internet (they're URLs)

**File Size**: 700KB - 2MB depending on map complexity

**Browser Compatibility**: Works in Chrome, Firefox, Safari, Edge

---

## Viewing Shared Maps

### As a Viewer

When someone shares a concept map with you:

1. **Click the link** they sent you
2. The map opens in **read-only mode**
3. You can:
   - Pan by clicking and dragging
   - Zoom with mouse wheel or pinch gesture
   - Click nodes to see detailed content
   - Search for specific nodes (if search is enabled)
   - Export as JSON for your own use

4. You **cannot**:
   - Edit nodes or edges
   - Add new content
   - Delete anything
   - Change the map structure

### Using the Viewer

**Navigation**:
- **Pan**: Click and drag on empty space
- **Zoom**: Mouse wheel or pinch gesture
- **Click Node**: Opens detailed modal with full content

**Modal View**:
- See node title and rich text content
- View attached images (if online)
- See tags and metadata
- Close with X button or click outside

**Export** (in standalone HTML):
- Click "Export JSON" button to download raw data

---

## Disabling Sharing

### How to Stop Sharing

1. Open your concept map
2. Click the **Share** button
3. Click **"Disable Sharing"**
4. Confirm the action

**What happens**:
- ✅ Share URL stops working immediately
- ✅ Map becomes private again
- ✅ Previous viewers lose access
- ⚠️ Downloaded HTML files still work (they're offline copies)

**Re-enabling**:
- You can re-enable sharing anytime
- You'll get a **new share URL** (old one won't work)

---

## FAQ

### Q: Can viewers edit my map?

**A**: No, all shared maps are read-only. Viewers can only view, navigate, and export to JSON.

### Q: How do I know who's viewing my shared map?

**A**: Currently, there's no view tracking or analytics. This feature is planned for a future update.

### Q: Can I share with specific users only?

**A**: Use "Unlisted" sharing and only send the link (with token) to those users. Full user-based permissions are planned for a future update.

### Q: What happens if I edit a shared map?

**A**: Changes appear immediately for anyone viewing the share URL. Downloaded HTML files remain unchanged (they're snapshots).

### Q: Can I password-protect a share link?

**A**: Not directly, but "Unlisted" sharing provides a secret token that serves a similar purpose. Share the full URL only with trusted recipients.

### Q: Do images work in exported HTML files?

**A**: Images are referenced by URL, so they require an internet connection. Fully offline image embedding is planned for a future update.

### Q: Can I customize the HTML viewer?

**A**: Not currently, but theme customization is planned for a future update.

### Q: How long do share links last?

**A**: Share links are permanent until you disable sharing. There's no expiration.

### Q: Can I share multiple maps with one link?

**A**: No, each map has its own unique share URL.

### Q: What happens if I delete a shared map?

**A**: The share link stops working. Downloaded HTML files still work (they're offline copies).

---

## Troubleshooting

### Share Link Returns "Not Found"

**Possible causes**:
- Sharing was disabled by the map owner
- Map was deleted
- Incorrect share URL (typo)

**Solution**: Contact the person who shared it.

### Share Link Returns "Forbidden"

**Possible causes**:
- Map is set to "Unlisted" and you don't have the token
- Map was set to private

**Solution**: Ask the sharer for the complete URL (including token).

### Downloaded HTML File Won't Open

**Possible causes**:
- File didn't download completely
- Browser blocking local HTML files

**Solutions**:
1. Re-download the file
2. Try opening in a different browser
3. Check that file extension is `.html`

### Images Don't Load in HTML File

**Expected behavior**: Images require internet connection (they're URLs, not embedded).

**Solution**: Make sure you're online when viewing the HTML file.

### HTML File Shows Blank Page

**Possible causes**:
- JavaScript disabled in browser
- File corrupted during download
- Very old browser

**Solutions**:
1. Enable JavaScript
2. Re-download the file
3. Try a modern browser (Chrome, Firefox, Safari, Edge)

### "Too Many Requests" Error

**Cause**: Rate limit exceeded (100 requests per minute per IP).

**Solution**: Wait 1 minute and try again.

---

## Tips & Best Practices

1. **Test Before Sharing**: Open the share link in an incognito/private window to verify it works.

2. **Use Unlisted for Sensitive Content**: If your map contains confidential information, use Unlisted sharing.

3. **Keep Backups**: Regularly download JSON exports for backup purposes.

4. **Version Control**: Download JSON files and commit them to git for version history.

5. **Offline Presentations**: Download HTML files before presentations in case WiFi fails.

6. **Descriptive Names**: Give your maps clear names - they appear in the share URL and download filenames.

7. **Update vs Re-share**: Edits to a shared map appear immediately - no need to re-share.

---

## Privacy & Security

### What We Track

Currently, we do **not** track:
- Who views your shared maps
- How many times they're viewed
- What actions viewers take

### What's Shared

When you share a map, viewers can see:
- ✅ Map name and description
- ✅ All nodes and their content
- ✅ All edges and connections
- ✅ Tags and metadata
- ⚠️ Creation and update timestamps
- ❌ Your identity (unless in map content)

### Security Recommendations

1. **Review Before Sharing**: Check that no sensitive info is in node content
2. **Use Unlisted for Private Maps**: Public links are less secure
3. **Rotate Tokens**: Disable and re-enable sharing to get a new URL/token
4. **Don't Share Tokens Publicly**: Treat unlisted URLs like passwords
5. **Disable When Done**: Turn off sharing when you no longer need it

---

## Support

### Need Help?

- Check the [FAQ](#faq) section
- Review [Troubleshooting](#troubleshooting)
- Open an issue on GitHub
- Contact support team

### Feature Requests

We're actively developing the sharing feature! Upcoming features:
- View analytics
- User authentication
- Team sharing with permissions
- Expiring share links
- Embedded images in HTML export
- Custom viewer themes

---

**Last Updated**: December 31, 2025
