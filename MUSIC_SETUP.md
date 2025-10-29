# Music Widget Setup Guide

Your startpage now supports **Spotify**, **Apple Music**, and **YouTube Music**! Here's how to set up each service:

---

## 🎵 Spotify

**Requirements:** Spotify account (free or premium)

**Setup Steps:**
1. Go to [Spotify Developer Console](https://developer.spotify.com/console/get-users-currently-playing-track/)
2. Click "Get Token" button
3. Select these scopes:
   - `user-read-currently-playing`
   - `user-read-playback-state`
4. Click "Request Token"
5. Copy the access token
6. In your startpage settings:
   - Select "Spotify" from music service dropdown
   - Paste the token in "music api token" field
   - Check "show now playing widget"

**Notes:**
- Token expires after 1 hour - you'll need to get a new one
- Works with Spotify desktop app, web player, or mobile (as long as you're logged in)
- Shows real-time playback with progress bar

---

## 📺 YouTube Music

**Requirements:** YouTube Music (free or premium)

**Setup Steps:**
1. In your startpage settings:
   - Select "YouTube Music" from music service dropdown
   - Enter `media-session` in the "music api token" field
   - Check "show now playing widget"
2. Open YouTube Music in a browser tab and play a song
3. The widget will automatically detect playback!

**Alternative - Extension Mode:**
- Enter `extension` instead of `media-session`
- This allows the extension to directly access YouTube Music tabs
- More reliable but requires extension permissions

**Notes:**
- Keep YouTube Music playing in a browser tab
- Works best in Chrome/Edge browsers
- Uses browser's Media Session API (built-in, no tokens needed!)
- Also works with YouTube Music desktop app if it exposes Media Session

---

## ✨ Features (All Services)

- 🎵 Currently playing track name
- 🎤 Artist name
- 💿 Album name
- 🖼️ Album artwork
- 📊 Animated equalizer bars (when playing)
- 📈 Real-time progress bar
- 🔗 Click to open in music app
- ⚡ Auto-updates every 5 seconds

---

## 🔧 Troubleshooting

**Nothing showing up?**
- Make sure music is actually playing
- Check that the token is correct
- For YouTube Music: ensure it's playing in a browser tab
- Check browser console for errors (F12)

**Spotify token expired?**
- Tokens last 1 hour - get a new one from the console
- Or set up a proper OAuth flow for longer-lasting tokens

**YouTube Music not detected?**
- Try playing/pausing the track once
- Make sure you're using Chrome or Edge browser
- Check that YouTube Music tab is open
- Try switching from `media-session` to `extension` mode

**Apple Music not working?**
- Verify your developer token is valid
- Make sure you authorized access
- Check that you have an active Apple Music subscription

---

## 🎨 Customization

All music services support:
- Toggle widget on/off in settings
- Same animations and styling
- Consistent UI across all platforms
- Works alongside banner, GitHub widget, weather, etc.

Enjoy your music! 🎶
