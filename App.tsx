import React, { useState, useCallback, useRef, useEffect } from 'react';
import ECGPlot, { PointDetails } from './components/ECGPlot';
import Heart3D, { HeartPartInfo } from './components/Heart3D';
import { Heart, Activity, BrainCircuit, Waves, Info, MonitorPlay, Crosshair, Play, Pause, ChartBar, Stethoscope, Zap, X } from 'lucide-react';
import { ECGStatistics, getSegmentDescription, getHRVStatus } from './lib/ecgUtils';

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
  const [selectedPart, setSelectedPart] = useState<HeartPartInfo | null>(null);

  // Animation Refs
  const lastFrameTimeRef = useRef<number>(0);

  const handleBeatsDetected = useCallback((timestamps: number[]) => {
    setBeatTimestamps(timestamps);
    setIsPlaying(true); 
  }, []);

  const handleStatsUpdate = useCallback((newStats: ECGStatistics) => {
    setStats(newStats);
  }, []);

  const handlePartClick = useCallback((partInfo: HeartPartInfo | null) => {
    setSelectedPart(partInfo);
  }, []);

  // Loop Animation Frame
  useEffect(() => {
    let animationFrameId: number;
    
    const animate = (time: number) => {
      if (!isPlaying) {
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
  }, [isPlaying, beatTimestamps, stats.duration, cursorTimestamp]);

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
             <div className={`hidden md:flex px-3 py-1 rounded-full border ${isPlaying ? 'border-green-900 bg-green-900/20' : 'border-gray-800 bg-gray-900'} items-center space-x-2`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                <span className="text-[10px] font-mono text-gray-300 uppercase tracking-wide">{isPlaying ? 'LIVE FEED' : 'STANDBY'}</span>
             </div>
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
                    onClick={() => setActiveTab('graph')}
                    className={`flex-1 py-3 text-xs font-medium uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
                        activeTab === 'graph' 
                        ? 'bg-cardio-bg text-cardio-cyan border-b-2 border-cardio-cyan' 
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border-b-2 border-transparent'
                    }`}
                >
                    <MonitorPlay className="w-3 h-3" />
                    <span>Graph</span>
                </button>
                <div className="w-px h-4 bg-cardio-border"></div>
                <button 
                    onClick={() => setActiveTab('stats')}
                    className={`flex-1 py-3 text-xs font-medium uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
                        activeTab === 'stats' 
                        ? 'bg-cardio-bg text-purple-500 border-b-2 border-purple-500' 
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border-b-2 border-transparent'
                    }`}
                >
                    <ChartBar className="w-3 h-3" />
                    <span>Stats</span>
                </button>
                <div className="w-px h-4 bg-cardio-border"></div>
                <button 
                    onClick={() => setActiveTab('about')}
                    className={`flex-1 py-3 text-xs font-medium uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
                        activeTab === 'about' 
                        ? 'bg-cardio-bg text-emerald-500 border-b-2 border-emerald-500' 
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
                            />
                        </div>
                    </div>
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
                   onPartClick={handlePartClick}
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

             {/* Heart Part Label Panel */}
             {selectedPart && (
               <div className="absolute top-6 left-6 right-6 z-30 pointer-events-auto">
                 <div className="bg-black/90 backdrop-blur-xl border border-cardio-cyan/30 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.15)] overflow-hidden max-w-md">
                   {/* Header */}
                   <div className="bg-gradient-to-r from-cardio-cyan/20 to-transparent px-4 py-3 border-b border-cardio-cyan/20 flex items-center justify-between">
                     <div className="flex items-center space-x-2">
                       <Heart className="w-4 h-4 text-cardio-cyan" />
                       <span className="text-xs font-bold uppercase tracking-wider text-cardio-cyan">Anatomical Label</span>
                     </div>
                     <button
                       onClick={() => setSelectedPart(null)}
                       className="w-6 h-6 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
                     >
                       <X className="w-3 h-3 text-gray-400" />
                     </button>
                   </div>

                   {/* Content */}
                   <div className="p-4 space-y-3">
                     {/* Part Name */}
                     <div>
                       <h3 className="text-xl font-bold text-white mb-1">{selectedPart.name}</h3>
                       <div className="inline-block px-2 py-0.5 rounded bg-cardio-cyan/10 border border-cardio-cyan/20 text-[10px] text-cardio-cyan uppercase font-bold tracking-wide">
                         {selectedPart.category}
                       </div>
                     </div>

                     {/* Blood Type Badge (if available) */}
                     {selectedPart.bloodType && (
                       <div className="flex items-center space-x-2 text-xs">
                         <Activity className="w-3 h-3 text-red-400" />
                         <span className="text-gray-400">Blood Type:</span>
                         <span className={`font-bold ${selectedPart.bloodType.includes('Oxygenated') ? 'text-red-400' : 'text-blue-400'}`}>
                           {selectedPart.bloodType}
                         </span>
                       </div>
                     )}

                     {/* Description */}
                     <div className="bg-black/40 rounded-lg p-3 border border-white/5">
                       <p className="text-xs text-gray-300 leading-relaxed mb-2">
                         {selectedPart.description}
                       </p>
                       <div className="pt-2 border-t border-white/5">
                         <div className="flex items-start space-x-2">
                           <Zap className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                           <div>
                             <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Function</span>
                             <span className="text-xs text-white">{selectedPart.function}</span>
                           </div>
                         </div>
                       </div>
                     </div>

                     {/* Hint */}
                     <div className="text-[10px] text-gray-600 text-center pt-2 border-t border-white/5">
                       Click another part to view its details, or press × to close
                     </div>
                   </div>
                 </div>
               </div>
             )}
        </div>

      </main>
    </div>
  );
};

export default App;