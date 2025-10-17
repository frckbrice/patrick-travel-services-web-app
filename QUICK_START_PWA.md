# PWA Quick Start Guide
**Fast setup guide for PWA testing**

---

## 🚀 Quick Setup (3 Steps)

### **Step 1: Generate Icons**

**Option A - Online Tool (Easiest):**
1. Go to https://www.pwabuilder.com/imageGenerator
2. Upload your logo (1024x1024 PNG)
3. Download all icons
4. Place in `/public/icons/`

**Option B - Use Placeholder Icons (For Testing Only):**
```bash
# Create icons directory
mkdir -p public/icons

# Download placeholder (replace with real icons later)
# Or use any square logo you have
```

### **Step 2: Build & Test**

```bash
# Install dependencies (if not done)
pnpm install

# Build for production
pnpm build

# Start production server
pnpm start
```

### **Step 3: Test PWA**

1. Open http://localhost:3000
2. Wait 30 seconds for install prompt
3. Open DevTools > Application > Service Workers
4. Check "Offline" in Network tab
5. Navigate around - should work offline!

---

## 📱 Test on Mobile

### **Android:**
1. Deploy to staging (Vercel/Netlify)
2. Visit on Android phone
3. Chrome menu > "Install app"

### **iOS:**
1. Deploy to staging
2. Visit on iPhone
3. Safari > Share > "Add to Home Screen"

---

## 🎨 Icon Sizes Needed

```
/public/icons/
├── icon-16x16.png
├── icon-32x32.png
├── icon-72x72.png
├── icon-96x96.png
├── icon-128x128.png
├── icon-144x144.png
├── icon-152x152.png
├── icon-192x192.png
├── icon-384x384.png
├── icon-512x512.png
└── apple-touch-icon.png (180x180)
```

---

## ✅ Testing Checklist

- [ ] Build runs successfully (`pnpm build`)
- [ ] Service worker registers (DevTools > Application)
- [ ] Works offline (Network > Offline checkbox)
- [ ] Install prompt appears (wait 30s or check console)
- [ ] Lighthouse score > 90 (DevTools > Lighthouse)

---

## 🐛 Common Issues

**Service worker not registering?**
- Make sure you're in production mode (`pnpm build` then `pnpm start`)
- Check browser console for errors
- Verify HTTPS (or localhost)

**Install prompt not showing?**
- Wait 30 seconds
- Check localStorage hasn't dismissed it
- Verify all manifest requirements met

**Icons not showing?**
- Check files exist in `/public/icons/`
- Verify paths in `manifest.json`
- Clear cache and hard reload

---

## 📚 Full Documentation

See [docs/PWA_IMPLEMENTATION_GUIDE.md](docs/PWA_IMPLEMENTATION_GUIDE.md) for complete details.

---

**Next Steps:**
1. Generate real icons (replace placeholders)
2. Test on real devices
3. Deploy to production
4. Monitor install metrics
