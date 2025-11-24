# Cardiacity - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies
```bash
cd sub-projects/cardiacity
npm install
```

This will install all required packages including:
- Next.js, React, TypeScript
- Three.js and React Three Fiber
- GSAP for animations
- Tailwind CSS for styling

**Installation time**: ~2-3 minutes

---

### Step 2: Run Development Server
```bash
npm run dev
```

The app will start on **http://localhost:3001**

**Why port 3001?** To avoid conflicts with the main Homonin app on port 3000

---

### Step 3: Open in Browser

Navigate to: **http://localhost:3001**

You should see:
- ✅ Cardiacity header
- ✅ 3D heart model (may take 2-5s to load all 127 parts)
- ✅ BPM controls
- ✅ Start/Stop button
- ✅ Camera settings icon

---

## 🎮 Try It Out

1. **Click "Start"** - Heart begins beating
2. **Adjust BPM** - Change heart rate (30-200)
3. **Rotate view** - Left-click + drag
4. **Zoom** - Scroll wheel
5. **Pan** - Right-click + drag
6. **Camera settings** - Click ⚙️ icon

---

## 🎨 What You'll See

### Color Coding
- **Red parts**: Arteries (oxygenated blood)
- **Blue parts**: Veins (deoxygenated blood)
- **Yellow parts**: Valves (blood flow regulation)
- **Pink parts**: Heart walls and chambers

### Electrical Impulse
When playing:
- **RED glow** starts at top (atria)
- **Transitions to DARK BLUE** as it travels down
- **BLUE glow** reaches bottom (ventricles)
- Synced with heartbeat timing

---

## 🐛 Common Issues

### Issue: "Cannot find module"
**Solution**: Run `npm install` again

### Issue: Port 3001 already in use
**Solution**:
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or change port in package.json
"dev": "next dev -p 3002"
```

### Issue: Heart model not loading
**Solution**: Check that `/public/cardiacity-models/` contains 127 `.obj` files

### Issue: Dark/nothing visible
**Solution**: Wait 2-5 seconds for models to load. Check browser console for errors.

---

## 📦 Folder Check

Verify these exist:
```
✅ app/page.tsx
✅ app/layout.tsx
✅ components/Heart3D.tsx
✅ public/cardiacity-models/ (127 files)
✅ package.json
✅ tsconfig.json
```

---

## 🎓 Next Steps

1. **Read full README.md** for detailed documentation
2. **Customize colors** in `components/Heart3D.tsx`
3. **Adjust camera** in `app/page.tsx`
4. **Integrate with ECG data** using `beatTimes` prop
5. **Deploy to production** with `npm run build`

---

## 🆘 Need Help?

- Check `README.md` for full documentation
- Review `../../INTEGRATION_GUIDE.md` for ECG integration
- Check `../../CARDIACITY_README.md` for technical details
- Open browser console (F12) to see loading logs

---

**Enjoy visualizing heartbeats in 3D! ❤️**
