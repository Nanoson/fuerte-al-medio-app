# 🎨 Frontend Integration Guide - Phase 1

## What's Been Integrated

### ✅ Authentication System
- **AuthContext** (`src/context/AuthContext.jsx`) - Global auth state management
- **LoginForm** (`src/components/LoginForm.jsx`) - Login/Signup modal
- **Header Updates** - Shows user info & login button

### ✅ Social Features on Articles
- **ReactionBar** - 5 emoji reactions (👍❤️😂😮😠) on every article
- **ShareButtons** - Social sharing (Twitter, WhatsApp, Telegram, Facebook)
- Both components integrated into `NewsCard.jsx`

### ✅ Sidebar Widgets
- **Leaderboard** - Top 10 predictors by accuracy
- **TrendingSection** - Trending reactions & shares
- **Sidebar.jsx** - Tabbed widget showing both
- Sticky sidebar on desktop, full-width on mobile

## File Structure

```
src/
├── context/
│   └── AuthContext.jsx          (Auth state management)
├── components/
│   ├── Header.jsx               (Updated with auth buttons)
│   ├── LoginForm.jsx            (Login/signup modal)
│   ├── NewsCard.jsx             (Updated with reactions & shares)
│   ├── Sidebar.jsx              (NEW: Leaderboard & Trending)
│   ├── ReactionBar.jsx          (Already created)
│   ├── ShareButtons.jsx         (Already created)
│   ├── Leaderboard.jsx          (Already created)
│   └── TrendingSection.jsx      (Already created)
└── styles/
    ├── auth.css                 (Login form styles)
    ├── reactions.css            (Reaction bar styles)
    ├── share.css                (Share buttons styles)
    ├── sidebar.css              (NEW: Sidebar styles)
    ├── leaderboard.css          (Leaderboard styles)
    └── trending.css             (Trending styles)
```

## How It Works

### 1. User Flow
```
User visits app
  → Sees "Login / Sign Up" button in header
  → Clicks button → LoginForm modal opens
  → Creates account OR logs in
  → User info displayed in header (username + FAM balance)
  → Full UI unlocked with reactions & shares
```

### 2. Article Interactions
```
User clicks article
  → Full article view opens
  → Sees emoji reactions (👍❤️😂😮😠)
  → Can click to add reaction
  → Sees share buttons below
  → Can share to social media
  → Reaction count updates in real-time
  → FAM credits earn for engagement
```

### 3. Sidebar
```
Main feed
  → Right sidebar shows:
    ├─ Trending reactions (by time window)
    ├─ Trending shares (by platform)
    └─ Top 10 predictors (by accuracy)
  → Tabs to switch between views
  → Shows FAM credit info
```

## Testing Checklist

### Phase 1: Authentication ✅
- [ ] Click "Login / Sign Up" button
- [ ] Sign up with email, password, username
- [ ] See success → User info in header
- [ ] See "Logout" button appears
- [ ] Click logout → Button changes back to "Login"
- [ ] Refresh page → User still logged in (token saved)

### Phase 2: Reactions ✅
- [ ] Open an article
- [ ] See emoji reaction buttons
- [ ] Click a reaction (e.g., 👍)
- [ ] See count increment
- [ ] Click same reaction again → Count decrements
- [ ] Change reaction → Updates correctly

### Phase 3: Shares ✅
- [ ] See share buttons below reactions
- [ ] Click Twitter → Opens share dialog
- [ ] Click "Copy Link" → Clipboard confirmation
- [ ] Verify share count appears

### Phase 4: Sidebar ✅
- [ ] Right sidebar visible on desktop
- [ ] Click "Trending" tab → Shows trending items
- [ ] Click "Predictores" tab → Shows leaderboard
- [ ] See your FAM balance info
- [ ] Sidebar sticky on scroll (desktop)

## Backend Connection

Your frontend connects to backend at: `http://localhost:3001`

**Required:**
- Backend running on port 3001
- Node server with SQLite database
- All 24 API endpoints active

**Check:**
```bash
# Backend health check
curl http://localhost:3001/api/markets
```

## Environment Setup

Create `.env.local` in the frontend root (optional):

```bash
VITE_API_URL=http://localhost:3001
```

If not set, defaults to `http://localhost:3001`

## Starting Frontend

```bash
cd "/c/Users/francisco.pizarro/OneDrive - Saludonnet Spain SL/Documents/Personal/Fuerte al medio/fuerte-al-medio-app"
npm run dev
```

Opens at: `http://localhost:5173`

## Common Issues

### "Cannot GET /api/auth/signup"
- ✅ Backend must be running on port 3001
- ✅ Run `node server.js` in backend folder

### Reactions not loading
- ✅ Check browser console for API errors
- ✅ Verify VITE_API_URL is correct
- ✅ Ensure user is authenticated

### Sidebar not showing
- ✅ Only shows on desktop (>1024px width)
- ✅ Hidden on small screens
- ✅ On mobile, full width

## Next Steps: Phase 2

When ready:
1. **Prediction Markets** - Polymarket-style betting
2. **Guest Contributions** - Anonymous articles
3. **B2B API** - Sell aggregated data
4. **Crowdsourced Journalism** - Community content

---

**Need help?** Check the component files - they have detailed comments!
