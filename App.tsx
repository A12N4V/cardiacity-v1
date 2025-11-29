import React, { useState, useCallback, useRef, useEffect } from 'react';
import ECGPlot, { PointDetails } from './components/ECGPlot';
import Heart3D, { HeartPartInfo, HeartLabel } from './components/Heart3D';
import { Heart, Activity, BrainCircuit, Waves, Info, MonitorPlay, Crosshair, Play, Pause, ChartBar, Stethoscope, Zap, X, GraduationCap } from 'lucide-react';
import { ECGStatistics, getSegmentDescription, getHRVStatus, WaveSegment } from './lib/ecgUtils';

/**
 * Complex 3D Logo Animation Component
 * Renders a rotating Icosahedron core with gyroscopic rings and orbiting particles
 */
const Logo3D: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        let time = 0;

        // --- GEOMETRY GENERATION ---
        
        // Icosahedron Vertices (Golden Ratio construction)
        const t = (1 + Math.sqrt(5)) / 2;
        const vertices = [
            [-1,  t,  0], [ 1,  t,  0], [-1, -t,  0], [ 1, -t,  0],
            [ 0, -1,  t], [ 0,  1,  t], [ 0, -1, -t], [ 0,  1, -t],
            [ t,  0, -1], [ t,  0,  1], [-t,  0, -1], [-t,  0,  1]
        ].map(([x,y,z]) => ({x,y,z}));

        // Calculate Edges (Distance approx 2.0)
        const edges: [number, number][] = [];
        for (let i = 0; i < vertices.length; i++) {
            for (let j = i + 1; j < vertices.length; j++) {
                const dx = vertices[i].x - vertices[j].x;
                const dy = vertices[i].y - vertices[j].y;
                const dz = vertices[i].z - vertices[j].z;
                const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
                if (dist > 1.9 && dist < 2.1) {
                    edges.push([i, j]);
                }
            }
        }

        const render = () => {
            time += 0.02;
            const width = canvas.width;
            const height = canvas.height;
            const cx = width / 2;
            const cy = height / 2;

            ctx.clearRect(0, 0, width, height);

            // Pulse Factor (Arrhythmia simulation: double beat then pause)
            const beat = (Math.sin(time * 3) + Math.sin(time * 3 + Math.PI)) * 0.5; 
            const pulseScale = 1 + Math.max(0, Math.sin(time * 4) * 0.1);

            // --- DRAW GYROSCOPIC RINGS ---
            ctx.save();
            ctx.translate(cx, cy);
            ctx.lineWidth = 1;
            ctx.shadowBlur = 5;
            ctx.shadowColor = 'rgba(239, 68, 68, 0.5)'; // Red glow
            
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(239, 68, 68, ${0.3 + Math.sin(time + i) * 0.2})`;
                
                // Rotate the context for each ring
                ctx.rotate(Math.PI / 3);
                
                const rx = 22 * pulseScale;
                const ry = 8 * pulseScale * Math.cos(time * 0.5);
                
                ctx.ellipse(0, 0, rx, Math.abs(ry), time * 0.2, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();

            // --- DRAW ICOSAHEDRON CORE ---
            const coreScale = 9 * pulseScale;
            
            // Rotation Functions
            const rotate = (v: {x:number, y:number, z:number}) => {
                let x = v.x, y = v.y, z = v.z;
                
                // Rotate Y
                let tx = x * Math.cos(time) - z * Math.sin(time);
                let tz = x * Math.sin(time) + z * Math.cos(time);
                x = tx; z = tz;

                // Rotate X
                let ty = y * Math.cos(time * 0.7) - z * Math.sin(time * 0.7);
                tz = y * Math.sin(time * 0.7) + z * Math.cos(time * 0.7);
                y = ty; z = tz;

                return {x, y, z};
            };

            const projected = vertices.map(v => {
                const r = rotate(v);
                // Simple perspective
                const scaleFactor = 4 / (4 - r.z * 0.1); 
                return {
                    x: cx + r.x * coreScale * scaleFactor,
                    y: cy + r.y * coreScale * scaleFactor,
                    z: r.z
                };
            });

            // Draw Edges
            ctx.beginPath();
            ctx.strokeStyle = '#fecaca'; // Light red/white
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#ef4444';

            edges.forEach(([i, j]) => {
                const p1 = projected[i];
                const p2 = projected[j];
                // Opacity based on depth (fog)
                const depth = (p1.z + p2.z) / 2;
                ctx.globalAlpha = Math.max(0.2, (depth + 2) / 4); 
                
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
            });
            ctx.stroke();
            ctx.globalAlpha = 1.0;

            // Draw Vertices (Nodes)
            ctx.fillStyle = '#fff';
            projected.forEach(p => {
                const size = Math.max(0.5, (p.z + 2) * 0.8);
                ctx.beginPath();
                ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
                ctx.fill();
            });

            // --- ORBITING DATA PARTICLES ---
            ctx.fillStyle = '#06b6d4'; // Cyan
            ctx.shadowColor = '#06b6d4';
            for (let i = 0; i < 4; i++) {
                const offset = i * (Math.PI / 2);
                const r = 26;
                const speed = time * 1.5;
                const px = cx + Math.cos(speed + offset) * r;
                const py = cy + Math.sin(speed + offset) * r * Math.sin(time * 0.2); // Oscillating orbit tilt
                
                ctx.beginPath();
                ctx.arc(px, py, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }

            animationId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationId);
    }, []);

    return <canvas ref={canvasRef} width={64} height={64} className="block w-full h-full object-contain" />;
};

const App: React.FC = () => {
  const [beatTimestamps, setBeatTimestamps] = useState<number[]>([]);
  const [stats, setStats] = useState<ECGStatistics>({
    bpm: 0, rrIntervals: [], sdnn: 0, rmssd: 0, qrsDuration: 0, duration: 10, minRR: 0, maxRR: 0
  });
  const [activeBeat, setActiveBeat] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Tab State: 'graph' | 'stats' | 'about'
  const [activeTab, setActiveTab] = useState<'graph' | 'stats' | 'about'>('graph');

  // Playback & Selection State
  const [cursorTimestamp, setCursorTimestamp] = useState(0);
  const [pointDetails, setPointDetails] = useState<PointDetails | null>(null);

  // Heart part labeling state
  const [heartLabels, setHeartLabels] = useState<HeartLabel[]>([]);

  // Tutorial mode state
  const [tutorialMode, setTutorialMode] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  // Tutorial steps configuration
  const tutorialSteps = [
    { segment: 'p' as WaveSegment, title: 'P-Wave', description: 'Atrial Depolarization' },
    { segment: 'qrs' as WaveSegment, title: 'QRS Complex', description: 'Ventricular Depolarization' },
    { segment: 't' as WaveSegment, title: 'T-Wave', description: 'Ventricular Repolarization' },
  ];

  // Animation Refs
  const lastFrameTimeRef = useRef<number>(0);

  const handleBeatsDetected = useCallback((timestamps: number[]) => {
    setBeatTimestamps(timestamps);
    setIsPlaying(true); 
  }, []);

  const handleStatsUpdate = useCallback((newStats: ECGStatistics) => {
    setStats(newStats);
  }, []);

  const handleShowAllLabels = useCallback((labels: HeartLabel[]) => {
    setHeartLabels(labels);
  }, []);

  // Force Graph tab when tutorial mode is enabled
  useEffect(() => {
    if (tutorialMode) {
      setActiveTab('graph');
    }
  }, [tutorialMode]);

  // Loop Animation Frame
  useEffect(() => {
    let animationFrameId: number;

    const animate = (time: number) => {
      // Pause if tutorial mode is active or not playing
      if (!isPlaying || tutorialMode) {
          lastFrameTimeRef.current = time;
          animationFrameId = requestAnimationFrame(animate);
          return;
      }

      if (lastFrameTimeRef.current === 0) lastFrameTimeRef.current = time;
      const delta = (time - lastFrameTimeRef.current) / 1000; // seconds
      lastFrameTimeRef.current = time;

      // Update cursor
      setCursorTimestamp(prev => {
          let next = prev + delta;
          if (next > stats.duration) next = 0; // Loop
          return next;
      });

      // Check for beats at current cursor time
      const isBeat = beatTimestamps.some(t => Math.abs(t - cursorTimestamp) < 0.08);
      setActiveBeat(isBeat);

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, tutorialMode, beatTimestamps, stats.duration, cursorTimestamp]);

  const handleCursorChange = (t: number) => {
      setCursorTimestamp(t);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setCursorTimestamp(val);
  };

  // Helper for Theme Colors
  const getThemeColor = () => {
      switch(activeTab) {
          case 'graph': return 'cardio-cyan';
          case 'stats': return 'purple-500';
          case 'about': return 'emerald-500';
          default: return 'cardio-cyan';
      }
  };

  const segmentInfo = pointDetails ? getSegmentDescription(pointDetails.segment) : null;
  const hrvStatus = getHRVStatus(stats.sdnn);

  return (
    <div className="fixed inset-0 w-full h-full bg-cardio-bg text-gray-100 font-sans flex flex-col overflow-hidden">
      
      {/* --- Navbar (Fixed Height) --- */}
      <header className="flex-none h-16 border-b border-cardio-border bg-black/90 backdrop-blur-xl z-50 flex items-center justify-between px-4 md:px-6 shrink-0">
          
          {/* Logo & Title Section */}
          <div className="flex items-center gap-4">
            {/* 3D Animated Logo */}
            <div className="w-12 h-12 bg-black/50 rounded flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.2)] overflow-hidden p-1">
                <Logo3D />
            </div>
            
            {/* Technical Title - Font Updated, Strikethrough Removed */}
            <div className="flex items-center relative group cursor-default select-none">
                 <div className="relative z-10 flex items-baseline font-tech uppercase">
                     <span className="text-2xl md:text-3xl font-bold text-white tracking-[0.15em] drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">Cardia</span>
                     <span className="text-2xl md:text-3xl font-bold text-white tracking-[0.15em] drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">City</span>
                 </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
             {/* Tutorial Mode Toggle - Circular Button with Logo */}
             <button
               onClick={() => {
                 setTutorialMode(!tutorialMode);
                 if (!tutorialMode) {
                   setTutorialStep(0); // Reset to first step
                   setIsPlaying(false); // Pause the feed
                 }
               }}
               className={`w-12 h-12 rounded-full border-2 transition-all flex items-center justify-center relative overflow-hidden ${
                 tutorialMode
                   ? 'border-emerald-500 bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                   : 'border-gray-700 bg-gray-900 hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]'
               }`}
               title="Tutorial Mode"
             >
               <GraduationCap className={`w-6 h-6 transition-colors ${tutorialMode ? 'text-emerald-400' : 'text-gray-400'}`} />
             </button>
          </div>
      </header>

      {/* --- Main Content Split --- */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* === SECTION 1: TABS & DATA === */}
        {/* Mobile: 60% Height (Bottom) | Desktop: 50% Width (Left) */}
        <div className="h-[60%] lg:h-full lg:w-1/2 order-2 lg:order-1 flex flex-col min-w-0 border-t lg:border-t-0 lg:border-r border-cardio-border bg-cardio-bg relative z-10 shrink-0">
            
            {/* Tab Navigation */}
            <div className="flex-none flex items-center border-b border-cardio-border bg-cardio-panel/50">
                <button
                    onClick={() => !tutorialMode && setActiveTab('graph')}
                    disabled={tutorialMode}
                    className={`flex-1 py-3 text-xs font-medium uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
                        activeTab === 'graph'
                        ? 'bg-cardio-bg text-cardio-cyan border-b-2 border-cardio-cyan'
                        : tutorialMode
                        ? 'text-gray-700 cursor-not-allowed border-b-2 border-transparent'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border-b-2 border-transparent'
                    }`}
                >
                    <MonitorPlay className="w-3 h-3" />
                    <span>Graph</span>
                </button>
                <div className="w-px h-4 bg-cardio-border"></div>
                <button
                    onClick={() => !tutorialMode && setActiveTab('stats')}
                    disabled={tutorialMode}
                    className={`flex-1 py-3 text-xs font-medium uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
                        activeTab === 'stats'
                        ? 'bg-cardio-bg text-purple-500 border-b-2 border-purple-500'
                        : tutorialMode
                        ? 'text-gray-700 cursor-not-allowed border-b-2 border-transparent'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border-b-2 border-transparent'
                    }`}
                >
                    <ChartBar className="w-3 h-3" />
                    <span>Stats</span>
                </button>
                <div className="w-px h-4 bg-cardio-border"></div>
                <button
                    onClick={() => !tutorialMode && setActiveTab('about')}
                    disabled={tutorialMode}
                    className={`flex-1 py-3 text-xs font-medium uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
                        activeTab === 'about'
                        ? 'bg-cardio-bg text-emerald-500 border-b-2 border-emerald-500'
                        : tutorialMode
                        ? 'text-gray-700 cursor-not-allowed border-b-2 border-transparent'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border-b-2 border-transparent'
                    }`}
                >
                    <Info className="w-3 h-3" />
                    <span>About</span>
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 relative overflow-hidden flex flex-col">
                
                {/* >>> GRAPH TAB <<< */}
                <div className={`absolute inset-0 flex flex-col ${activeTab === 'graph' ? 'z-20 opacity-100 pointer-events-auto' : 'z-0 opacity-0 pointer-events-none'}`}>
                    <div className="flex-1 bg-cardio-panel overflow-hidden relative">
                        {/* Always mounted to preserve WebGL context */}
                        <div className={`w-full h-full ${activeTab === 'graph' ? 'visible' : 'invisible'}`}>
                             <ECGPlot
                                onBeatsDetected={handleBeatsDetected}
                                onStatsUpdate={handleStatsUpdate}
                                onError={(e) => console.error(e)}
                                cursorTimestamp={cursorTimestamp}
                                onCursorChange={handleCursorChange}
                                onPointDetailsChange={setPointDetails}
                                tutorialMode={tutorialMode}
                                tutorialSegment={tutorialMode ? tutorialSteps[tutorialStep].segment : undefined}
                            />
                        </div>
                    </div>

                    {/* Tutorial Dialog - Below Graph */}
                    {tutorialMode && (
                      <div className="flex-none bg-black/95 backdrop-blur-xl border-t-2 border-emerald-500/50 p-4 shadow-2xl shadow-emerald-500/10">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              tutorialSteps[tutorialStep].segment === 'p' ? 'bg-yellow-500/20 border-2 border-yellow-500' :
                              tutorialSteps[tutorialStep].segment === 'qrs' ? 'bg-cyan-500/20 border-2 border-cyan-500' :
                              tutorialSteps[tutorialStep].segment === 't' ? 'bg-purple-500/20 border-2 border-purple-500' :
                              'bg-gray-500/20 border-2 border-gray-500'
                            }`}>
                              <Activity className={`w-6 h-6 ${
                                tutorialSteps[tutorialStep].segment === 'p' ? 'text-yellow-500' :
                                tutorialSteps[tutorialStep].segment === 'qrs' ? 'text-cyan-500' :
                                tutorialSteps[tutorialStep].segment === 't' ? 'text-purple-500' :
                                'text-gray-500'
                              }`} />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h2 className="text-xl font-bold text-white">{tutorialSteps[tutorialStep].title}</h2>
                              <span className="text-xs text-emerald-400 font-mono">Step {tutorialStep + 1} of {tutorialSteps.length}</span>
                            </div>
                            <p className="text-xs text-emerald-400 font-mono uppercase tracking-wide mb-2">{tutorialSteps[tutorialStep].description}</p>
                            <p className="text-xs text-gray-300 leading-relaxed mb-3">{getSegmentDescription(tutorialSteps[tutorialStep].segment).description}</p>

                            {/* Biological action description */}
                            <div className="mb-3 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                              <h3 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide mb-1 flex items-center">
                                <Heart className="w-3 h-3 mr-1" />
                                Heart Action
                              </h3>
                              <p className="text-xs text-white">
                                {tutorialSteps[tutorialStep].segment === 'p' && "The atria (upper chambers) are contracting, pushing blood into the ventricles below."}
                                {tutorialSteps[tutorialStep].segment === 'qrs' && "The ventricles (lower chambers) are contracting powerfully, pumping blood to the lungs and body."}
                                {tutorialSteps[tutorialStep].segment === 't' && "The ventricles are relaxing and refilling with blood from the atria, preparing for the next beat."}
                              </p>
                            </div>

                            {/* Navigation Buttons */}
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setTutorialStep(Math.max(0, tutorialStep - 1))}
                                disabled={tutorialStep === 0}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                  tutorialStep === 0
                                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30'
                                }`}
                              >
                                Previous
                              </button>
                              {tutorialStep < tutorialSteps.length - 1 ? (
                                <button
                                  onClick={() => setTutorialStep(tutorialStep + 1)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30 transition-all"
                                >
                                  Next
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setTutorialMode(false);
                                    setTutorialStep(0);
                                  }}
                                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-black border-2 border-emerald-400 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/50"
                                >
                                  Finish!
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                </div>

                {/* >>> STATS TAB <<< */}
                <div className={`absolute inset-0 overflow-y-auto p-4 space-y-4 bg-cardio-bg transition-opacity duration-300 ${activeTab === 'stats' ? 'z-20 opacity-100' : 'z-0 opacity-0 pointer-events-none'}`}>
                     
                     {/* Heart Rate Card */}
                     <div className="bg-cardio-panel rounded-xl border border-purple-500/30 p-5 relative overflow-hidden shadow-[0_0_20px_rgba(139,92,246,0.05)]">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Heart className="w-24 h-24 text-purple-500" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center space-x-2 mb-2 text-purple-400">
                                <Stethoscope className="w-4 h-4" />
                                <h3 className="text-xs font-bold uppercase tracking-wider">Clinical Report</h3>
                            </div>
                            
                            <div className="flex items-baseline space-x-3 mb-1">
                                <span className="text-5xl font-bold text-white tracking-tighter">{stats.bpm}</span>
                                <span className="text-sm text-purple-400 font-bold">BPM</span>
                            </div>
                            <div className="inline-block px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-300 uppercase font-bold tracking-wide">
                                {stats.bpm > 100 ? 'Tachycardia' : stats.bpm < 60 ? 'Bradycardia' : 'Normal Sinus Rhythm'}
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* HRV Metrics */}
                        <div className="bg-cardio-panel rounded-xl border border-cardio-border p-4">
                            <div className="flex items-center space-x-2 mb-3 text-gray-400">
                                <BrainCircuit className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase">HRV Analysis</span>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs text-gray-500 mb-0.5"><span>SDNN</span></div>
                                    <div className="flex items-baseline space-x-2">
                                        <span className="text-xl font-mono text-white">{stats.sdnn}</span>
                                        <span className="text-[10px] text-gray-600">ms</span>
                                    </div>
                                    <div className={`text-[9px] mt-1 ${hrvStatus.color}`}>{hrvStatus.status}</div>
                                </div>
                                <div className="h-px bg-white/5"></div>
                                <div>
                                    <div className="flex justify-between text-xs text-gray-500 mb-0.5"><span>RMSSD</span></div>
                                    <div className="flex items-baseline space-x-2">
                                        <span className="text-xl font-mono text-white">{stats.rmssd}</span>
                                        <span className="text-[10px] text-gray-600">ms</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Intervals */}
                         <div className="bg-cardio-panel rounded-xl border border-cardio-border p-4">
                            <div className="flex items-center space-x-2 mb-3 text-gray-400">
                                <Waves className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase">Intervals</span>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-xs text-gray-500 mb-0.5"><span>Avg RR Interval</span></div>
                                    <div className="text-xl font-mono text-white">
                                        {(stats.rrIntervals.reduce((a,b)=>a+b,0)/Math.max(1, stats.rrIntervals.length)*1000).toFixed(0)} 
                                        <span className="text-[10px] text-gray-600">ms</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs text-gray-500 mb-0.5"><span>RR Range</span></div>
                                    <div className="text-xs font-mono text-gray-400">
                                        {(stats.minRR * 1000).toFixed(0)} - {(stats.maxRR * 1000).toFixed(0)} ms
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs text-gray-500 mb-0.5"><span>QRS Width</span></div>
                                    <div className="text-xl font-mono text-white">~{stats.qrsDuration} <span className="text-[10px] text-gray-600">ms</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* >>> ABOUT TAB <<< */}
                <div className={`absolute inset-0 overflow-y-auto p-4 space-y-4 bg-cardio-bg transition-opacity duration-300 ${activeTab === 'about' ? 'z-20 opacity-100' : 'z-0 opacity-0 pointer-events-none'}`}>
                     
                     {/* Cursor Analysis Card */}
                     <div className="bg-cardio-panel rounded-xl border border-emerald-500/30 p-4 relative overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                        <div className="flex items-center space-x-2 mb-4 text-emerald-500">
                            <Crosshair className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase">Cursor Inspection</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-black/40 rounded p-2 border border-white/5">
                                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Timestamp</div>
                                <div className="font-mono text-lg text-white">
                                    {pointDetails ? pointDetails.time.toFixed(3) : '0.000'} <span className="text-[10px] text-gray-600">s</span>
                                </div>
                            </div>
                            <div className="bg-black/40 rounded p-2 border border-white/5">
                                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Amplitude</div>
                                <div className="font-mono text-lg text-white">
                                    {pointDetails ? pointDetails.voltage.toFixed(3) : '0.000'} <span className="text-[10px] text-gray-600">mV</span>
                                </div>
                            </div>
                        </div>

                        {/* Segment Identifier */}
                        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                            <div>
                                <div className="text-[10px] text-emerald-400/70 uppercase font-bold mb-0.5">Current Segment</div>
                                <div className="text-lg font-bold text-emerald-400">
                                    {segmentInfo ? segmentInfo.title : 'No Data'}
                                </div>
                            </div>
                            <Activity className="w-6 h-6 text-emerald-500/50" />
                        </div>

                         {/* Time Progress Bar */}
                         <div className="mt-4 w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                             <div 
                                className="h-full bg-emerald-500 transition-all duration-75"
                                style={{ width: `${(cursorTimestamp / stats.duration) * 100}%` }}
                             ></div>
                         </div>
                     </div>

                     {/* Educational Context */}
                     {segmentInfo && (
                        <div className="bg-cardio-panel rounded-xl border border-cardio-border p-4">
                            <div className="flex items-center space-x-2 mb-3 text-gray-300">
                                <Zap className="w-4 h-4 text-yellow-500" />
                                <span className="text-xs font-bold uppercase">Waveform Analysis</span>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <h4 className="text-sm font-bold text-white mb-1">{segmentInfo.title}</h4>
                                    <p className="text-[10px] text-emerald-400 font-mono uppercase tracking-wide mb-2">{segmentInfo.short}</p>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        {segmentInfo.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                     )}

                     <div className="p-2 border border-dashed border-gray-800 rounded text-center">
                        <p className="text-[10px] text-gray-600">
                            Move the red cursor line on the graph to update this analysis in real-time.
                        </p>
                     </div>
                </div>
            </div>

            {/* Playback Controls (Common to all tabs) */}
            <div className="flex-none h-16 bg-black border-t border-cardio-border px-4 flex items-center space-x-4 z-30 shrink-0">
                <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="flex-none w-10 h-10 rounded-full bg-cardio-cyan hover:bg-cyan-400 text-black flex items-center justify-center transition-colors shadow-lg shadow-cyan-900/20"
                >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>

                <div className="flex-1 flex flex-col justify-center space-y-1">
                    <input 
                        type="range" 
                        min="0" 
                        max={stats.duration} 
                        step="0.01" 
                        value={cursorTimestamp}
                        onChange={handleSliderChange}
                        className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cardio-cyan hover:accent-cyan-300"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-gray-500">
                        <span>{cursorTimestamp.toFixed(2)}s</span>
                        <span>{stats.duration.toFixed(2)}s</span>
                    </div>
                </div>
            </div>
        </div>

        {/* === SECTION 2: 3D VISUALIZATION === */}
        {/* Mobile: 40% Height (Top) | Desktop: 50% Width (Right) */}
        <div className="h-[40%] lg:h-full lg:w-1/2 order-1 lg:order-2 bg-black flex flex-col relative overflow-hidden shrink-0">

             {/* 3D Heart Container */}
             <div className="flex-1 relative z-10 overflow-hidden">
                 <Heart3D
                   beatTimes={beatTimestamps.map(t => Date.now() + (t - cursorTimestamp) * 1000)}
                   isPlaying={isPlaying}
                   onShowAllLabels={handleShowAllLabels}
                   currentSegment={tutorialMode ? tutorialSteps[tutorialStep].segment : (pointDetails?.segment as WaveSegment)}
                   tutorialMode={tutorialMode}
                 />
             </div>


             {/* 3D Status Overlay */}
             <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20 pointer-events-none">
                <div className="bg-black/80 backdrop-blur border border-white/10 px-4 py-2 rounded-full flex items-center space-x-3 shadow-2xl">
                    <div className={`w-2 h-2 rounded-full ${activeBeat ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-gray-700'}`}></div>
                    <span className={`text-xs font-mono tracking-widest ${activeBeat ? 'text-red-400' : 'text-gray-500'}`}>
                        {activeBeat ? 'SYSTOLE' : 'DIASTOLE'}
                    </span>
                    <div className="w-px h-3 bg-white/10"></div>
                    <span className="text-xs font-mono text-gray-500">
                        {pointDetails ? `T:${pointDetails.time.toFixed(2)}s` : 'SIMULATION'}
                    </span>
                </div>
             </div>

             {/* Heart Labeling Diagram - Improved and cleaner */}
             {heartLabels.length > 0 && (
               <div className="absolute inset-0 z-30 pointer-events-none">
                 {/* SVG for drawing clean leader lines */}
                 <svg className="absolute inset-0 w-full h-full pointer-events-none">
                   {heartLabels.map((label, idx) => {
                     // Calculate screen center for the 3D view (right half of screen)
                     const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
                     const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 600;

                     // Center is in the right half of the screen (3D view)
                     const centerX = viewportWidth * 0.75; // 75% across (middle of right half)
                     const centerY = viewportHeight / 2;

                     // Vector from center to label point
                     const dx = label.position2D.x - centerX;
                     const dy = label.position2D.y - centerY;
                     const distance = Math.sqrt(dx * dx + dy * dy);

                     // Extend outward by 80px for better spacing
                     const extension = 80;
                     const labelX = label.position2D.x + (dx / distance) * extension;
                     const labelY = label.position2D.y + (dy / distance) * extension;

                     return (
                       <g key={`line-group-${idx}`}>
                         {/* Clean leader line */}
                         <line
                           x1={label.position2D.x}
                           y1={label.position2D.y}
                           x2={labelX}
                           y2={labelY}
                           stroke="rgba(255, 255, 255, 0.6)"
                           strokeWidth="1.5"
                           strokeLinecap="round"
                         />
                         {/* Dot at 3D point */}
                         <circle
                           cx={label.position2D.x}
                           cy={label.position2D.y}
                           r="4"
                           fill="rgba(6, 182, 212, 0.9)"
                           stroke="rgba(255, 255, 255, 0.8)"
                           strokeWidth="2"
                         />
                       </g>
                     );
                   })}
                 </svg>

                 {/* Labels - positioned radially from heart */}
                 {heartLabels.map((label, idx) => {
                   const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
                   const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 600;

                   const centerX = viewportWidth * 0.75;
                   const centerY = viewportHeight / 2;

                   const dx = label.position2D.x - centerX;
                   const dy = label.position2D.y - centerY;
                   const distance = Math.sqrt(dx * dx + dy * dy);

                   const extension = 80;
                   const labelX = label.position2D.x + (dx / distance) * extension;
                   const labelY = label.position2D.y + (dy / distance) * extension;

                   // Determine alignment based on which side of center
                   const isLeftSide = labelX < centerX;

                   return (
                     <div
                       key={`label-${idx}`}
                       className="absolute pointer-events-none"
                       style={{
                         left: `${labelX}px`,
                         top: `${labelY}px`,
                         transform: isLeftSide ? 'translate(-100%, -50%)' : 'translate(0, -50%)',
                       }}
                     >
                       {/* Clean label with enhanced styling */}
                       <div className="bg-black/90 backdrop-blur-md px-3 py-1.5 rounded-lg border-2 border-cardio-cyan/50 shadow-lg shadow-cardio-cyan/20">
                         <div className="text-white text-sm font-bold tracking-wide whitespace-nowrap">
                           {label.partInfo.name}
                         </div>
                       </div>
                     </div>
                   );
                 })}

                 {/* Close button */}
                 <div className="absolute top-6 right-6 pointer-events-auto">
                   <button
                     onClick={() => setHeartLabels([])}
                     className="w-10 h-10 rounded-full bg-black/90 backdrop-blur-md border-2 border-white/40 hover:bg-gray-900 hover:border-cardio-cyan flex items-center justify-center transition-all shadow-lg"
                   >
                     <X className="w-5 h-5 text-white" />
                   </button>
                 </div>
               </div>
             )}
        </div>

      </main>
    </div>
  );
};

export default App;