# Cardiacity - 3D Heart Beat Visualization

![Cardiacity Banner](https://img.shields.io/badge/Cardiacity-3D%20Heart%20Visualization-red?style=for-the-badge&logo=heart)

A standalone real-time 3D heart visualization system that animates a complete cardiac anatomy model synchronized with beat timestamps. Features anatomically accurate color coding and electrical impulse animation.

## 🎯 Features

### ❤️ Complete Heart Anatomy
- **127 anatomical models** including:
  - Heart chambers (atria, ventricles)
  - Cardiac valves (tricuspid, mitral, pulmonary, aortic)
  - Coronary arteries (bright red)
  - Coronary veins (dark blue)
  - Heart walls and septa

### 🎨 Functional Color Coding
- **Atria**: Blue/red shades (blood reception)
- **Ventricles**: Red/purple shades (pumping chambers)
- **Valves**: Yellow (regulation)
- **Arteries**: Bright red (oxygenated blood)
- **Veins**: Dark blue (deoxygenated blood)
- **Walls**: Pink shades (structural tissue)

### ⚡ Electrical Impulse Animation
- Realistic cardiac conduction system visualization
- **RED** at atrium → **DARK BLUE** at ventricles
- 4-phase animation:
  1. Atrial depolarization (0.1s)
  2. AV node conduction (0.15s)
  3. Ventricular depolarization (0.2s)
  4. Fade out (0.15s)

### 🎮 Interactive Controls
- **BPM adjustment**: 30-200 beats per minute
- **Camera controls**: Position, target, and zoom
- **Mouse interaction**: Rotate, pan, zoom
- **Real-time status**: Heart rate, beat interval, queue

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install

# Run development server (port 3001)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### First Run

1. Navigate to `http://localhost:3001`
2. Click **Start** to begin heartbeat animation
3. Adjust BPM slider to change heart rate
4. Use mouse to interact with 3D model
5. Click **Settings** icon to adjust camera

## 📦 Project Structure

```
cardiacity/
├── app/
│   ├── layout.tsx              # Root layout with theme provider
│   ├── page.tsx                # Main cardiacity page
│   └── globals.css             # Global styles with Tailwind
├── components/
│   ├── Heart3D.tsx             # 3D heart visualization component
│   └── ThemeProvider.tsx       # Dark/light theme provider
├── public/
│   └── cardiacity-models/      # 127 OBJ heart model files
├── lib/
│   └── utils.ts                # Utility functions
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── next.config.js              # Next.js configuration
└── README.md                   # This file
```

## 🎓 Usage

### Basic Integration

```tsx
import Heart3D from "@/components/Heart3D";

function MyApp() {
  const [beatTimes, setBeatTimes] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  // Generate beat times at 60 BPM
  useEffect(() => {
    const interval = 1000; // 60 BPM
    const beats = Array.from({ length: 60 }, (_, i) =>
      Date.now() + i * interval
    );
    setBeatTimes(beats);
  }, []);

  return (
    <Heart3D
      beatTimes={beatTimes}
      isPlaying={isPlaying}
      cameraPosition={{ x: 0, y: 0, z: 300 }}
      cameraTarget={{ x: 0, y: 0, z: 0 }}
    />
  );
}
```

### Props API

#### `Heart3D` Component

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `beatTimes` | `number[]` | ✅ Yes | `[]` | Array of Unix timestamps (ms) for beats |
| `isPlaying` | `boolean` | ❌ No | `false` | Enable/disable animations |
| `cameraPosition` | `{x,y,z}` | ❌ No | `{0,0,300}` | Camera position in 3D space |
| `cameraTarget` | `{x,y,z}` | ❌ No | `{0,0,0}` | Camera look-at target |
| `onCameraUpdate` | `Function` | ❌ No | - | Callback for camera position changes |

### ECG Integration Example

```typescript
// From ECG analysis
const ecgBeats = analyzedECGData.rPeaks.map(peak =>
  Date.now() + peak.timestamp
);

setBeatTimes(ecgBeats);
```

## 🎨 Customization

### Modify Animation Speed

Edit `components/Heart3D.tsx`:

```typescript
// Faster contraction
timeline.to(meshRef.current.scale, {
  x: 0.85,
  y: 0.85,
  z: 0.85,
  duration: 0.1,  // ← Reduce for faster
  ease: "power2.in",
});
```

### Change Heart Colors

Edit `HEART_COLORS` in `components/Heart3D.tsx`:

```typescript
const HEART_COLORS = {
  'left_ventricle': 0xFF0000,  // Custom red
  'artery': 0xFF6600,          // Custom orange
  // ... more customization
};
```

### Adjust Camera Defaults

Edit `app/page.tsx`:

```typescript
const [cameraPosition, setCameraPosition] = useState({
  x: 0,
  y: 50,   // ← Adjust Y
  z: 200   // ← Adjust distance
});
```

## 🔧 Dependencies

### Core Technologies
- **Next.js 16**: React framework
- **React 19**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS 4**: Styling

### 3D Rendering
- **Three.js 0.180**: 3D graphics engine
- **@react-three/fiber 9.4**: React renderer for Three.js
- **@react-three/drei 10.7**: Useful Three.js helpers

### Animation & UI
- **GSAP 3.13**: Timeline-based animations
- **Lucide React**: Icon library
- **next-themes**: Dark/light mode

## 📊 Performance

### Expected Metrics
- **FPS**: 60 (smooth)
- **Load Time**: 2-5 seconds (127 models)
- **Memory**: ~150MB
- **GPU**: Medium usage

### Optimization Tips
1. Limit `beatTimes` array to next 60 seconds
2. Clean up past timestamps periodically
3. Enable hardware acceleration in browser
4. Use production build for better performance

## 🐛 Troubleshooting

### Issue: Heart Not Visible
**Solution**:
- Check console for loading errors
- Verify all 127 OBJ files are in `/public/cardiacity-models/`
- Adjust camera position (try z: 400 for wider view)

### Issue: No Animation
**Solution**:
- Ensure `isPlaying={true}`
- Check `beatTimes` contains future timestamps
- Verify BPM is between 30-200

### Issue: Low FPS
**Solution**:
- Enable hardware acceleration in browser settings
- Reduce window size
- Check GPU usage in task manager
- Use production build (`npm run build && npm start`)

### Issue: Dark Rendering
**Solution**:
- Lighting has been optimized (ambient: 1.2, directional: 2.5)
- Check theme settings (dark mode vs light mode)
- Adjust `emissiveIntensity` in `Heart3D.tsx`

## 🌐 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

```bash
docker build -t cardiacity .
docker run -p 3001:3001 cardiacity
```

## 📚 Documentation

For detailed documentation, see:
- [Integration Guide](../../INTEGRATION_GUIDE.md)
- [Technical README](../../CARDIACITY_README.md)
- [React Three Fiber Docs](https://docs.pmnd.rs/react-three-fiber)
- [Three.js Manual](https://threejs.org/manual/)

## 🤝 Integration with ECG Systems

This standalone app can be integrated with:
- Real-time ECG monitoring systems
- Pre-recorded ECG analysis tools
- Heart rate variability (HRV) analyzers
- Medical simulation platforms

Simply provide beat timestamps via the `beatTimes` prop!

## 🛠️ Development

### File Watching
```bash
npm run dev
```
Hot reload enabled - changes auto-refresh

### Type Checking
```bash
npx tsc --noEmit
```

### Linting
```bash
npm run lint
```

## 📄 License

MIT License - Part of the Homonin simulation project

## 🎯 Roadmap

- [ ] ECG waveform overlay
- [ ] Heart rate variability (HRV) analysis
- [ ] Multiple camera presets
- [ ] Export animation to video
- [ ] VR/AR support
- [ ] Multi-heart comparison view
- [ ] Custom beat patterns (arrhythmias)

## 🙏 Credits

Built with ❤️ using:
- [React Three Fiber](https://github.com/pmndrs/react-three-fiber)
- [Three.js](https://threejs.org/)
- [GSAP](https://gsap.com/)
- [BodyParts3D](https://lifesciencedb.jp/bp3d/) - Anatomical models
- [Next.js](https://nextjs.org/)

---

**Ready to visualize heartbeats in 3D? Run `npm install && npm run dev`!** 🚀
