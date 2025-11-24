# Cardiacity - ECG & 3D Heart Visualization Platform

A comprehensive cardiac visualization platform featuring real-time ECG analysis and interactive 3D anatomical heart models with synchronized beat animation.

## 📁 Project Structure

```
cardiacity-v1/
├── components/
│   ├── ECGPlot.tsx         # Interactive ECG plotting with Plotly
│   └── Heart3D.tsx         # 3D heart model with click interactions
├── lib/
│   └── ecgUtils.ts         # ECG processing utilities (HRV, R-peak detection)
├── public/
│   ├── cardiacity-models/  # Symlink to 3D models (128 OBJ files)
│   └── sample_ecg.csv      # Symlink to sample ECG data
├── shared/
│   └── models/             # Actual 3D model files (11MB)
│       ├── cardiacity-models/
│       └── sample_ecg.csv
├── App.tsx                 # Main application
├── index.tsx               # Entry point
├── index.html             # HTML template
├── package.json           # Dependencies
├── vite.config.ts         # Vite configuration
└── tsconfig.json          # TypeScript configuration
```

## 🎯 Features

### ECG Analysis
- **R-Peak Detection:** Automatic heartbeat detection using derivative thresholding
- **HRV Analysis:** SDNN, RMSSD, and other heart rate variability metrics
- **Interactive Plotting:** Real-time ECG visualization with Plotly.js
- **Multiple View Modes:** Standard, segmented waveform, and morphology views
- **Preset Patterns:** Normal sinus, tachycardia, atrial fibrillation, QT prolongation
- **CSV Upload:** Import your own ECG data

### 3D Heart Visualization
- **Anatomically Accurate:** 128 individual heart part models
- **Interactive Labels:** Click any heart part to learn about its anatomy and function
- **Color-Coded:** Functional color coding by blood type and chamber function
- **Beat Synchronization:** Real-time animation synchronized with detected heartbeats
- **Smooth Animations:** GSAP-powered transitions and beat pulsations

### UI/UX
- **Responsive Layout:** Split-screen design with ECG graph and 3D heart
- **Dark Theme:** Professional medical interface optimized for visibility
- **Tabbed Interface:** Graph, Stats, and About tabs for organized information
- **Playback Controls:** Play/pause, timeline scrubbing, and progress tracking
- **Real-time Feedback:** Live cursor inspection showing voltage and ECG segment

## 🔧 Tech Stack

- **Framework:** Vite + React 19
- **3D Rendering:** Three.js + React Three Fiber + Drei
- **Plotting:** Plotly.js + react-plotly.js
- **Animation:** GSAP
- **Data Processing:** PapaParse (CSV parsing)
- **UI Components:** Lucide React (icons)
- **Language:** TypeScript

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ recommended
- npm or yarn

### Installation & Running

```bash
# Clone the repository
git clone https://github.com/A12N4V/cardiacity-v1.git
cd cardiacity-v1

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## 💡 How It Works

### ECG Processing Pipeline

1. **Data Loading:** Load ECG data from CSV or use preset patterns
2. **Preprocessing:** Normalize voltage values and calculate time points
3. **R-Peak Detection:** Identify heartbeats using derivative-based algorithm
4. **HRV Calculation:** Compute RR intervals, SDNN, and RMSSD
5. **Visualization:** Plot waveform and sync with 3D heart animation

### 3D Heart Rendering

1. **Model Loading:** Load 128 OBJ files representing different heart parts
2. **Color Coding:** Apply functional colors based on anatomy
3. **Animation:** GSAP timelines for beat pulsation and electrical impulse
4. **Interaction:** Raycasting for click detection and part identification
5. **Labeling:** Display detailed anatomical information on click

### Heart Part Color Coding

- **Atria:** Blue shades (blood reception)
- **Ventricles:** Red shades (pumping chambers)
- **Valves:** Yellow (regulation)
- **Coronary Arteries:** Bright red (oxygenated blood)
- **Coronary Veins:** Dark blue (deoxygenated blood)
- **Myocardium/Walls:** Pink shades (cardiac muscle)

## 📊 ECG Metrics Explained

### Basic Metrics
- **BPM (Beats Per Minute):** Heart rate
- **RR Interval:** Time between consecutive R-peaks
- **QRS Duration:** Width of QRS complex (~80-120ms normal)

### HRV (Heart Rate Variability)
- **SDNN:** Standard deviation of RR intervals (health indicator)
  - < 50ms: Low variability (stress/health concerns)
  - 50-100ms: Normal range
  - > 100ms: High variability (good cardiovascular health)
- **RMSSD:** Root mean square of successive differences (parasympathetic activity)

## 🎨 UI Components

### Navigation Tabs

**Graph Tab:**
- Full ECG waveform with interactive cursor
- Beat markers and QRS complex highlighting
- Real-time voltage display

**Stats Tab:**
- Clinical report with BPM classification
- HRV analysis (SDNN, RMSSD)
- Interval measurements (RR, QRS)

**About Tab:**
- Cursor inspection (timestamp, voltage)
- ECG segment identification (P-wave, QRS, T-wave)
- Educational waveform analysis

## 🧬 Anatomical Information

The 3D heart model includes detailed information for all major structures:
- Chambers (atria, ventricles)
- Valves (tricuspid, mitral, pulmonary, aortic)
- Major vessels (aorta, vena cava, pulmonary arteries/veins)
- Coronary circulation (128 arteries and veins)
- Conduction system components

Click any part in the 3D view to learn about its function!

## 📈 Performance

- **Optimized Loading:** Lazy loading of 3D models
- **Smooth Animations:** 60 FPS rendering with Three.js
- **Responsive:** Works on desktop and large tablets
- **Memory Efficient:** Shared geometry instances for duplicate parts

## 🐛 Known Issues

- Mobile support is limited due to 3D rendering requirements
- Large ECG files (>10,000 points) may cause performance issues
- Some browsers may require WebGL 2.0 for optimal performance

## 🔮 Future Enhancements

- [ ] Real-time ECG input from devices
- [ ] More ECG arrhythmia patterns
- [ ] Export functionality (PDF reports, screenshots)
- [ ] Multi-lead ECG support (12-lead)
- [ ] VR/AR mode for immersive anatomy exploration

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 🙏 Acknowledgments

- 3D heart models from open medical databases
- ECG algorithms based on established clinical standards
- Built with modern web technologies for accessibility

---

**Built with ❤️ for cardiac education and visualization**
