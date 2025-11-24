# Cardiacity - ECG & 3D Heart Visualization Platform

A comprehensive cardiac visualization platform featuring ECG analysis and 3D anatomical heart models with real-time beat synchronization.

## 📁 Project Structure

```
cardiacity-v1/
├── apps/
│   ├── ecg-visualizer/      # Full-featured ECG analysis with 3D heart
│   │   ├── components/      # ECGPlot, Heart3D (with click interactions)
│   │   ├── lib/            # ECG processing utilities
│   │   ├── public/         # Symlinks to shared assets
│   │   ├── App.tsx         # Main application
│   │   ├── package.json    # Vite + React + Plotly
│   │   └── ...
│   │
│   └── heart-viewer/        # Standalone 3D heart beat visualizer
│       ├── app/            # Next.js app directory
│       ├── components/     # Heart3D, ThemeProvider
│       ├── public/         # Symlinks to shared assets
│       ├── package.json    # Next.js + React + Three.js
│       └── ...
│
└── shared/
    ├── models/             # Shared 3D models (single source of truth)
    │   ├── cardiacity-models/  # 128 OBJ files (11MB)
    │   └── sample_ecg.csv      # Sample ECG data
    ├── components/         # (Reserved for future shared components)
    └── lib/               # (Reserved for future shared utilities)
```

## 🎯 Applications

### 1. ECG Visualizer (`apps/ecg-visualizer/`)

**Full-featured ECG analysis tool with interactive 3D heart visualization**

**Features:**
- ECG signal processing (R-peak detection, HRV analysis)
- Interactive ECG plotting with Plotly.js
- Multiple view modes (standard, segmented, morphology)
- 3D heart model with anatomical labels and click interactions
- Real-time heart beat synchronization
- Preset ECG patterns (normal, tachycardia, afib, QT prolongation)
- CSV file upload support

**Tech Stack:**
- **Framework:** Vite + React 19
- **3D Rendering:** Three.js + React Three Fiber
- **Plotting:** Plotly.js
- **Animation:** GSAP

**Running:**
```bash
cd apps/ecg-visualizer
npm install
npm run dev
```

### 2. Heart Viewer (`apps/heart-viewer/`)

**Standalone 3D heart beat visualizer with BPM control**

**Features:**
- Real-time 3D heart beat animation
- Adjustable BPM (30-200)
- Camera position controls
- Simple, focused interface for beat visualization
- Dark/light theme support

**Tech Stack:**
- **Framework:** Next.js 16 + React 19
- **3D Rendering:** Three.js + React Three Fiber
- **Styling:** Tailwind CSS
- **Animation:** GSAP

**Running:**
```bash
cd apps/heart-viewer
npm install
npm run dev
```

## 🔧 Architecture Decisions

### Why Two Separate Apps?

1. **Different Use Cases:**
   - ECG Visualizer: Medical/educational tool for ECG analysis
   - Heart Viewer: Simplified 3D visualization for presentations/demos

2. **Different Tech Stacks:**
   - ECG Visualizer uses Vite for faster development
   - Heart Viewer uses Next.js for better production deployment

3. **Component Differences:**
   - `Heart3D` in ECG Visualizer has click interactions and detailed anatomical info
   - `Heart3D` in Heart Viewer is simpler, optimized for pure visualization

### Shared Resources

- **3D Models:** Single source in `shared/models/` (11MB), accessed via symlinks
- **Saves:** ~11MB by deduplicating the 128 OBJ heart model files
- **Symlinks:** Each app's `public/` directory symlinks to `shared/models/`

## 📊 Component Breakdown

### Heart3D Component Variants

**ECG Visualizer Version:**
- `onPartClick` prop for interactive anatomy exploration
- `HeartPartInfo` interface with detailed anatomical data
- Hover effects with cursor changes
- Click handlers for educational information display

**Heart Viewer Version:**
- Simplified interface without click interactions
- Optimized for pure visualization performance
- Cleaner codebase for BPM-driven animation

### Shared Color Coding

Both variants use the same functional color coding:
- **Atria:** Blue shades (deoxygenated blood reception)
- **Ventricles:** Red shades (pumping chambers)
- **Valves:** Yellow (regulation)
- **Arteries:** Bright red (oxygenated blood)
- **Veins:** Dark blue (deoxygenated blood)

## 🚀 Development

### Prerequisites
- Node.js 18+ recommended
- npm or yarn

### Quick Start

1. **Clone the repository**
```bash
git clone <repository-url>
cd cardiacity-v1
```

2. **Choose your app and run it**

For ECG Visualizer:
```bash
cd apps/ecg-visualizer
npm install
npm run dev
```

For Heart Viewer:
```bash
cd apps/heart-viewer
npm install
npm run dev
```

## 📈 Metrics

**Before Refactoring:**
- Duplicated code: ~30%
- Wasted disk space: ~11MB (duplicate 3D models)
- Unused files: 4 Vite config files in Next.js app
- Organization: Confusing "3d canvas" directory name

**After Refactoring:**
- Code duplication: Eliminated (except intentional variants)
- Disk space saved: 11MB
- Unused files: Removed
- Organization: Clear separation of concerns

## 📄 License

See individual app directories for license information.

## 🤝 Contributing

This is an organized monorepo structure. When contributing:
1. Identify which app your changes belong to
2. Keep shared resources in `shared/`
3. Don't duplicate 3D model files - use symlinks
4. Maintain component variants when they serve different purposes

---

**Built with ❤️ for cardiac education and visualization**
