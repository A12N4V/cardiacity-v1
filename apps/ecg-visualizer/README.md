# CardiaCity 🫀

**Advanced ECG Visualization & 3D Heart Beat Simulator**

CardiaCity is a medical-grade ECG (Electrocardiogram) visualization tool with real-time 3D anatomical heart rendering. It combines precision signal analysis with immersive 3D graphics to provide an interactive, educational platform for understanding cardiac electrophysiology.

![CardiaCity Banner](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178C6?logo=typescript&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-0.180.0-000000?logo=three.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?logo=vite&logoColor=white)

---

## ✨ Features

### 📊 ECG Signal Processing
- **Real-time ECG visualization** using Plotly.js with high-fidelity waveform rendering
- **Automated R-peak detection** with QRS complex identification
- **Heart Rate Variability (HRV) analysis**:
  - SDNN (Standard Deviation of NN intervals)
  - RMSSD (Root Mean Square of Successive Differences)
  - RR interval tracking (min/max/average)
- **Interactive cursor inspection** with live waveform segment analysis
- **Clinical classifications**: Tachycardia, Bradycardia, Normal Sinus Rhythm

### 🫀 3D Anatomical Heart Visualization
- **127 anatomically accurate OBJ models** of the human heart
- **Functional color coding**:
  - 🔴 **Arteries** - Bright Red (oxygenated blood)
  - 🔵 **Veins** - Dark Blue (deoxygenated blood)
  - 🟡 **Valves** - Yellow (regulation)
  - 🩷 **Chambers** - Pink/Purple (atria and ventricles)
- **Synchronized heartbeat animation** with ECG signal
- **Electrical impulse visualization**:
  - Atrial depolarization (red wave)
  - AV node conduction (red to blue transition)
  - Ventricular depolarization (blue wave)
- **Interactive camera controls** with OrbitControls (zoom, pan, rotate)
- **Real-time SYSTOLE/DIASTOLE indicators**

### 🎮 Interactive Controls
- **Play/Pause playback** with timeline scrubbing
- **Multi-tab interface**:
  - **Graph**: Live ECG waveform plotting
  - **Stats**: Clinical metrics dashboard
  - **About**: Waveform segment education
- **Responsive design**: Optimized for desktop and mobile devices

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.x or higher
- **npm** 9.x or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/A12N4V/cardiacity-v1.git
cd cardiacity-v1

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at **http://localhost:3000**

### Build for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build
npm run preview
```

---

## 📁 Project Structure

```
cardiacity-v1/
├── components/
│   ├── ECGPlot.tsx          # ECG waveform plotting component (Plotly.js)
│   └── Heart3D.tsx          # 3D heart visualization (Three.js)
├── lib/
│   └── ecgUtils.ts          # ECG signal processing utilities
├── public/
│   ├── cardiacity-models/   # 127 anatomical OBJ models (FJ2417-FJ2737)
│   └── sample_ecg.csv       # Sample ECG data
├── App.tsx                  # Main application component
├── index.tsx                # React entry point
├── index.html               # HTML shell with Tailwind CDN
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies and scripts
```

---

## 🛠️ Technology Stack

### Frontend Framework
- **React 19.2.0** - Component-based UI
- **TypeScript 5.8.2** - Type-safe development
- **Vite 6.2.0** - Lightning-fast build tool

### 3D Graphics Engine
- **Three.js 0.180.0** - WebGL 3D rendering
- **@react-three/fiber 9.4.0** - React renderer for Three.js
- **@react-three/drei 10.7.6** - Three.js helpers (OrbitControls, Environment, etc.)
- **GSAP 3.13.0** - High-performance animation timeline

### Data Visualization
- **Plotly.js** (via react-plotly.js 2.6.0) - Interactive ECG graphs
- **PapaParse 5.5.3** - CSV parsing for ECG data

### UI Components
- **Lucide React 0.554.0** - Icon library
- **Tailwind CSS** (via CDN) - Utility-first styling

---

## 📖 How It Works

### ECG Signal Flow
1. **Data Loading**: Sample ECG data is loaded from `public/sample_ecg.csv`
2. **R-Peak Detection**: QRS complexes are identified using derivative-based peak detection
3. **HRV Calculation**: RR intervals are analyzed to compute SDNN and RMSSD
4. **Waveform Rendering**: ECG trace is plotted with interactive cursor and annotations
5. **Playback Sync**: Timeline cursor synchronizes with 3D heart animation

### 3D Heart Animation Flow
1. **Model Loading**: 127 OBJ files are loaded and grouped into a single heart mesh
2. **Color Coding**: Meshes are classified by file ID and name patterns (arteries, veins, chambers)
3. **Beat Synchronization**: Beat timestamps from ECG are converted to millisecond format
4. **Animation Timeline**:
   - **Systole** (contraction): Heart scales to 85% over 150ms
   - **Diastole** (expansion): Heart expands to 105% over 200ms
   - **Settling**: Returns to 100% over 150ms
5. **Electrical Impulse**: Spherical wave propagates from atria (red) to ventricles (blue)

### File ID Ranges
- **FJ2417-FJ2439**: Heart chambers and valves
- **FJ2631-FJ2677**: Coronary arteries (bright red)
- **FJ2678-FJ2737**: Coronary veins (dark blue)

---

## 🎨 Customization

### Change ECG Data Source
Replace `public/sample_ecg.csv` with your own ECG data in CSV format:
```csv
time,voltage
0.000,-0.123
0.004,-0.118
...
```

### Adjust Heart Beat Animation
Edit `/components/Heart3D.tsx` - `triggerHeartbeat()` function:
```typescript
// Modify systole contraction intensity
timeline.to(meshRef.current.scale, {
  x: 0.85,  // 0.85 = 15% contraction
  y: 0.85,
  z: 0.85,
  duration: 0.15,
  ease: "power2.in",
});
```

### Customize Color Scheme
Edit `/components/Heart3D.tsx` - `HEART_COLORS` object:
```typescript
const HEART_COLORS = {
  'artery': 0xFF0000,     // Bright Red
  'vein': 0x0000CD,       // Dark Blue
  'valve': 0xFFDD44,      // Yellow
  // ... customize colors here
};
```

---

## 🔬 Educational Use Cases

### Medical Training
- **ECG interpretation**: Learn to identify P, Q, R, S, T waves
- **Arrhythmia detection**: Compare normal vs abnormal rhythms
- **Electrophysiology**: Visualize electrical impulse propagation through heart

### Research Applications
- **HRV analysis**: Study autonomic nervous system function
- **Cardiac modeling**: Understand 3D anatomy and function
- **Data visualization**: Explore creative medical data presentation

### Academic Demonstrations
- **Classroom teaching**: Interactive heart physiology lessons
- **Conference presentations**: Engaging cardiac science demos
- **Science fairs**: Showcase biomedical engineering concepts

---

## 🐛 Troubleshooting

### 3D Models Not Loading
**Issue**: Console shows "404 Not Found" for `.obj` files
**Solution**: Ensure `/public/cardiacity-models/` contains all 127 OBJ files

### Slow Performance
**Issue**: Low frame rate during 3D animation
**Solution**:
- Reduce model quality in `Heart3D.tsx` by limiting loaded files
- Lower `dpr` in Canvas component: `dpr={[1, 1]}` (instead of `[1, 2]`)

### ECG Data Not Displaying
**Issue**: Graph shows "No data"
**Solution**: Verify `public/sample_ecg.csv` exists and has correct format (time, voltage columns)

### Build Errors
**Issue**: TypeScript errors during build
**Solution**: Run `npm install` to ensure all dependencies are installed

---

## 📊 Performance Metrics

- **Model Count**: 127 anatomical meshes
- **Total Vertices**: ~500,000 (varies by model detail)
- **Frame Rate**: 60 FPS (on modern hardware)
- **Bundle Size**: ~2.5 MB (gzipped)
- **Load Time**: ~3-5 seconds (127 models + textures)

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines
- Follow existing code style (ESLint + Prettier)
- Add TypeScript types for all new code
- Test on multiple browsers (Chrome, Firefox, Safari)
- Document new features in README

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **ECG Data**: Sample data derived from publicly available ECG datasets
- **3D Models**: Anatomical heart models from medical imaging sources
- **Icons**: Lucide React icon library
- **Inspiration**: Medical visualization tools and cardiac education platforms

---

## 📞 Contact & Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/A12N4V/cardiacity-v1/issues)
- **Documentation**: See inline code comments for technical details
- **Community**: Join discussions in GitHub Discussions

---

## 🔮 Roadmap

- [ ] **Multi-lead ECG support** (12-lead ECG visualization)
- [ ] **Custom data upload** (drag-and-drop CSV files)
- [ ] **Real-time heart rate monitoring** (WebRTC integration)
- [ ] **AR/VR mode** (immersive 3D heart exploration)
- [ ] **Export animations** (video recording of heartbeat cycles)
- [ ] **Advanced analytics** (frequency domain analysis, Poincaré plots)

---

**Built with ❤️ for cardiac science education**

*CardiaCity - Visualizing the rhythm of life*
