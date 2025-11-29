import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Plot from 'react-plotly.js';
import { parseECGCSV, detectRPeaks, segmentECGData, calculateStats, ECGData, ECGStatistics, generateSyntheticECG } from '../lib/ecgUtils';
import { Loader2, Upload, Activity, Layers, Maximize, Eye } from 'lucide-react';

export interface PointDetails {
  time: number;
  voltage: number;
  segment: string;
}

interface ECGPlotProps {
  onBeatsDetected: (timestamps: number[]) => void;
  onStatsUpdate: (stats: ECGStatistics) => void;
  onError?: (error: string) => void;
  cursorTimestamp: number;
  onCursorChange: (time: number) => void;
  onPointDetailsChange: (details: PointDetails) => void;
  tutorialMode?: boolean;
  tutorialSegment?: string;
}

const ECGPlot: React.FC<ECGPlotProps> = ({
    onBeatsDetected,
    onStatsUpdate,
    onError,
    cursorTimestamp,
    onCursorChange,
    onPointDetailsChange,
    tutorialMode,
    tutorialSegment
}) => {
  const [data, setData] = useState<ECGData | null>(null);
  const [beatsIndices, setBeatsIndices] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [activePreset, setActivePreset] = useState<string>('normal');
  const [viewMode, setViewMode] = useState<'standard' | 'segmented' | 'morphology'>('segmented');

  useEffect(() => {
    loadPreset('normal');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Point Details when cursor changes
  useEffect(() => {
    if (!data || data.time.length === 0) return;

    // Optimized: assume sorted, find nearest
    let targetIdx = -1;
    
    // Quick heuristic scan
    const totalDuration = data.time[data.time.length - 1];
    const estimatedIndex = Math.floor((cursorTimestamp / totalDuration) * data.time.length);
    const safeEstimate = Math.min(Math.max(0, estimatedIndex), data.time.length - 1);

    // Local search around estimate
    let bestDist = Infinity;
    // Scan range +/- 100 points
    const startScan = Math.max(0, safeEstimate - 100);
    const endScan = Math.min(data.time.length, safeEstimate + 100);

    for(let i=startScan; i<endScan; i++) {
        const dist = Math.abs(data.time[i] - cursorTimestamp);
        if (dist < bestDist) {
            bestDist = dist;
            targetIdx = i;
        }
    }

    // Fallback global search if local failed (cursor jump)
    if (targetIdx === -1 || bestDist > 1.0) {
        const idx = data.time.findIndex(t => t >= cursorTimestamp);
        targetIdx = idx === -1 ? data.time.length - 1 : idx;
    }

    if (targetIdx >= 0 && targetIdx < data.time.length) {
        onPointDetailsChange({
            time: data.time[targetIdx],
            voltage: data.voltage[targetIdx],
            segment: data.segments?.[targetIdx] || 'baseline'
        });
    }
  }, [cursorTimestamp, data, onPointDetailsChange]);

  const analyzeData = (rawTime: number[], rawVoltage: number[], rawSegments?: string[]) => {
      // 1. Detect R-Peaks
      const indices = detectRPeaks(rawTime, rawVoltage);
      setBeatsIndices(indices);
      
      // 2. Report Timestamps to parent
      const timestamps = indices.map(i => rawTime[i]);
      onBeatsDetected(timestamps);

      // 3. Segment Data (if not already segmented)
      let ecgData: ECGData = { time: rawTime, voltage: rawVoltage, segments: rawSegments as any };
      if (!rawSegments || rawSegments.length === 0) {
          ecgData = segmentECGData(ecgData, indices);
      }
      setData(ecgData);

      // 4. Calculate Stats
      const stats = calculateStats(indices, rawTime);
      onStatsUpdate(stats);
  };

  const processCSV = useCallback((csvText: string) => {
    setLoading(true);
    parseECGCSV(csvText)
      .then((parsedData) => {
        analyzeData(parsedData.time, parsedData.voltage);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        onError?.("Error parsing CSV file. Ensure format is Time,Voltage.");
        setLoading(false);
      });
  }, [onBeatsDetected, onError]);

  const loadPreset = (type: any) => {
      setActivePreset(type);
      setLoading(true);
      setTimeout(() => {
        const synthetic = generateSyntheticECG(type, 10);
        analyzeData(synthetic.time, synthetic.voltage, synthetic.segments);
        setLoading(false);
      }, 500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setActivePreset('custom');
      const reader = new FileReader();
      reader.onload = (event) => processCSV(event.target?.result as string);
      reader.readAsText(file);
    }
  };

  // Drag & Drop Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      setActivePreset('custom');
      const reader = new FileReader();
      reader.onload = (ev) => processCSV(ev.target?.result as string);
      reader.readAsText(e.dataTransfer.files[0]);
    }
  };

  const handlePlotClick = (event: Readonly<Plotly.PlotMouseEvent>) => {
      if (event.points && event.points[0]) {
          // If viewing morphology (stacked), x is time from beat start, not absolute
          if (viewMode === 'morphology') return;
          
          const x = event.points[0].x;
          if (typeof x === 'number') {
              onCursorChange(x);
          }
      }
  };

  // PLOTLY DATA GENERATION
  const plotData = useMemo((): Plotly.Data[] => {
    if (!data) return [];

    // --- MORPHOLOGY VIEW (Stacked Beats) ---
    if (viewMode === 'morphology') {
        const traces: Plotly.Data[] = [];
        beatsIndices.forEach((idx, i) => {
            const start = Math.max(0, idx - 50); 
            const end = Math.min(data.time.length, idx + 100); 
            
            const tSlice = data.time.slice(start, end).map(t => t - data.time[idx]);
            const vSlice = data.voltage.slice(start, end);
            
            traces.push({
                x: tSlice,
                y: vSlice,
                type: 'scatter',
                mode: 'lines',
                line: { color: 'rgba(6, 182, 212, 0.15)', width: 1 },
                hoverinfo: 'none',
                showlegend: false,
            } as Plotly.Data);
        });
        return traces;
    }

    // --- SEGMENTED VIEW (Color Coded) ---
    if (viewMode === 'segmented' && data.segments) {
        const types = ['baseline', 'p', 'qrs', 't'];
        const colors = { baseline: '#52525b', p: '#facc15', qrs: '#06b6d4', t: '#c084fc' };
        const names = { baseline: 'Isoelectric', p: 'P-Wave', qrs: 'QRS Complex', t: 'T-Wave' };

        return types.map(type => {
            const x: number[] = [];
            const y: (number | null)[] = [];
            
            for(let i=0; i<data.time.length; i++) {
                if(data.segments![i] === type) {
                    x.push(data.time[i]);
                    y.push(data.voltage[i]);
                } else {
                    x.push(data.time[i]);
                    y.push(null); 
                }
            }
            
            return {
                x, y,
                type: 'scatter',
                mode: 'lines',
                name: names[type as keyof typeof names],
                line: { color: colors[type as keyof typeof colors], width: type === 'baseline' ? 1 : 2.5 },
                hoverinfo: 'y+name',
                connectgaps: false
            } as Plotly.Data;
        });
    }

    // --- STANDARD VIEW ---
    return [{
      x: data.time,
      y: data.voltage,
      type: 'scatter',
      mode: 'lines',
      name: 'Lead II',
      line: { color: '#06b6d4', width: 2 },
    } as Plotly.Data];
  }, [data, beatsIndices, viewMode]);

  const layout: Partial<Plotly.Layout> = useMemo(() => {
    // Calculate dynamic Y-Range based on data global min/max
    let yRange = undefined;

    if (data && data.voltage.length > 0) {
        let min = Infinity;
        let max = -Infinity;
        for (let i = 0; i < data.voltage.length; i++) {
            if (data.voltage[i] < min) min = data.voltage[i];
            if (data.voltage[i] > max) max = data.voltage[i];
        }

        // Add ~15% padding
        const amplitude = max - min;
        const padding = amplitude * 0.15 || 0.5;
        yRange = [min - padding, max + padding];
    }

    // Build shapes array
    const shapes: any[] = [];

    // Add vertical scrubber line
    if (viewMode !== 'morphology') {
        shapes.push({
            type: 'line',
            x0: cursorTimestamp,
            y0: 0,
            x1: cursorTimestamp,
            y1: 1,
            yref: 'paper',
            xref: 'x',
            line: {
                color: '#ef4444', // Red Scrubber
                width: 2,
            },
            opacity: 0.8
        });
    }

    // Add highlighted region for tutorial mode
    if (tutorialMode && tutorialSegment && data && data.segments) {
        // Find all regions matching the tutorial segment
        let startIdx = -1;
        for (let i = 0; i < data.segments.length; i++) {
            if (data.segments[i] === tutorialSegment && startIdx === -1) {
                startIdx = i;
            } else if (data.segments[i] !== tutorialSegment && startIdx !== -1) {
                // End of segment found
                shapes.push({
                    type: 'rect',
                    x0: data.time[startIdx],
                    x1: data.time[i - 1],
                    y0: 0,
                    y1: 1,
                    yref: 'paper',
                    xref: 'x',
                    fillcolor: tutorialSegment === 'p' ? '#facc15' :
                               tutorialSegment === 'qrs' ? '#06b6d4' :
                               tutorialSegment === 't' ? '#c084fc' : '#52525b',
                    opacity: 0.15,
                    line: { width: 0 }
                });
                startIdx = -1;
            }
        }
        // Handle case where segment continues to end
        if (startIdx !== -1) {
            shapes.push({
                type: 'rect',
                x0: data.time[startIdx],
                x1: data.time[data.time.length - 1],
                y0: 0,
                y1: 1,
                yref: 'paper',
                xref: 'x',
                fillcolor: tutorialSegment === 'p' ? '#facc15' :
                           tutorialSegment === 'qrs' ? '#06b6d4' :
                           tutorialSegment === 't' ? '#c084fc' : '#52525b',
                opacity: 0.15,
                line: { width: 0 }
            });
        }
    }

    // Build annotations array for wave labels
    const annotations: any[] = [];

    if (data && data.segments && beatsIndices.length > 0) {
        // Add labels for the first few beats only to avoid clutter
        const beatsToLabel = Math.min(3, beatsIndices.length);

        for (let beatIdx = 0; beatIdx < beatsToLabel; beatIdx++) {
            const rPeakIdx = beatsIndices[beatIdx];
            const rPeakTime = data.time[rPeakIdx];

            // Find P-wave peak (before R-peak)
            for (let i = Math.max(0, rPeakIdx - 50); i < rPeakIdx; i++) {
                if (data.segments[i] === 'p') {
                    // Find local max in P region
                    let pPeakIdx = i;
                    let pPeakVal = data.voltage[i];
                    for (let j = i; j < rPeakIdx && data.segments[j] === 'p'; j++) {
                        if (data.voltage[j] > pPeakVal) {
                            pPeakVal = data.voltage[j];
                            pPeakIdx = j;
                        }
                    }
                    annotations.push({
                        x: data.time[pPeakIdx],
                        y: data.voltage[pPeakIdx],
                        text: 'P',
                        showarrow: false,
                        font: { color: '#facc15', size: 14, family: 'JetBrains Mono', weight: 'bold' },
                        yshift: 15
                    });
                    break;
                }
            }

            // Label Q, R, S peaks
            // Q: Local min just before R
            let qIdx = rPeakIdx - 1;
            while (qIdx > 0 && data.voltage[qIdx] > data.voltage[qIdx - 1]) qIdx--;
            if (data.segments[qIdx] === 'qrs') {
                annotations.push({
                    x: data.time[qIdx],
                    y: data.voltage[qIdx],
                    text: 'Q',
                    showarrow: false,
                    font: { color: '#06b6d4', size: 14, family: 'JetBrains Mono', weight: 'bold' },
                    yshift: -15
                });
            }

            // R: Peak
            annotations.push({
                x: rPeakTime,
                y: data.voltage[rPeakIdx],
                text: 'R',
                showarrow: false,
                font: { color: '#06b6d4', size: 14, family: 'JetBrains Mono', weight: 'bold' },
                yshift: 15
            });

            // S: Local min just after R
            let sIdx = rPeakIdx + 1;
            while (sIdx < data.voltage.length - 1 && data.voltage[sIdx] > data.voltage[sIdx + 1]) sIdx++;
            if (data.segments[sIdx] === 'qrs') {
                annotations.push({
                    x: data.time[sIdx],
                    y: data.voltage[sIdx],
                    text: 'S',
                    showarrow: false,
                    font: { color: '#06b6d4', size: 14, family: 'JetBrains Mono', weight: 'bold' },
                    yshift: -15
                });
            }

            // Find T-wave peak (after R-peak)
            for (let i = rPeakIdx + 1; i < Math.min(data.time.length, rPeakIdx + 100); i++) {
                if (data.segments[i] === 't') {
                    // Find local max in T region
                    let tPeakIdx = i;
                    let tPeakVal = data.voltage[i];
                    for (let j = i; j < Math.min(data.time.length, rPeakIdx + 100) && data.segments[j] === 't'; j++) {
                        if (data.voltage[j] > tPeakVal) {
                            tPeakVal = data.voltage[j];
                            tPeakIdx = j;
                        }
                    }
                    annotations.push({
                        x: data.time[tPeakIdx],
                        y: data.voltage[tPeakIdx],
                        text: 'T',
                        showarrow: false,
                        font: { color: '#c084fc', size: 14, family: 'JetBrains Mono', weight: 'bold' },
                        yshift: 15
                    });
                    break;
                }
            }
        }
    }

    return {
        autosize: true,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        margin: { l: 40, r: 10, t: 30, b: 30 },
        xaxis: {
            showgrid: true,
            gridcolor: '#222',
            gridwidth: 1,
            dtick: 0.2, // Major grid every 0.2s (standard large box)
            zerolinecolor: '#333',
            tickfont: { color: '#666', family: 'JetBrains Mono', size: 10 },
            fixedrange: false
        },
        // Second Access (Axis) at the top for time sense
        xaxis2: {
            overlaying: 'x',
            side: 'top',
            showgrid: false,
            tickfont: { color: '#666', family: 'JetBrains Mono', size: 10 },
            dtick: 1.0, // Seconds count on top
        },
        yaxis: {
            showgrid: true,
            gridcolor: '#222',
            dtick: 0.5, // 0.5mV grid
            zerolinecolor: '#333',
            tickfont: { color: '#666', family: 'JetBrains Mono', size: 10 },
            fixedrange: true, // Fixed scale as requested
            range: yRange // Set calculated range
        },
        showlegend: true,
        legend: { orientation: 'h', x: 0, y: 1.0, yanchor: 'bottom', font: { color: '#ccc', size: 10 }, bgcolor: 'rgba(0,0,0,0)' },
        dragmode: 'pan',
        shapes: shapes.length > 0 ? shapes : undefined,
        annotations: annotations.length > 0 ? annotations : undefined
    };
  }, [viewMode, cursorTimestamp, data, tutorialMode, tutorialSegment, beatsIndices]);

  return (
    <div className="w-full h-full flex flex-col space-y-2 pb-2">
      
      {/* Control Toolbar */}
      <div className="flex-none flex items-center justify-between gap-2 bg-cardio-panel p-1.5 rounded-lg border border-cardio-border overflow-hidden mx-2 mt-2">
        
        {/* Source Selection - Horizontal Scroll */}
        <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide mask-fade pr-2">
            {['normal', 'tachycardia', 'afib', 'qt_prolongation'].map((type) => (
                <button 
                    key={type}
                    onClick={() => loadPreset(type)}
                    className={`px-2 py-1 text-[10px] font-medium rounded whitespace-nowrap transition-all border ${
                        activePreset === type 
                        ? 'bg-cardio-cyan/10 border-cardio-cyan text-cardio-cyan' 
                        : 'border-transparent text-gray-500 hover:text-white hover:bg-white/5'
                    }`}
                >
                    {type.substring(0,4).toUpperCase()}
                </button>
            ))}
            <label className="cursor-pointer px-2 py-1 text-[10px] font-medium rounded border border-cardio-border hover:bg-white/5 text-gray-400 flex items-center shrink-0">
                <Upload className="w-3 h-3 mr-1" />
            </label>
        </div>

        {/* View Modes */}
        <div className="flex bg-black rounded p-0.5 border border-cardio-border shrink-0">
            <button onClick={() => setViewMode('standard')} className={`p-1 rounded ${viewMode === 'standard' ? 'bg-cardio-border text-white' : 'text-gray-600'}`}>
                <Activity className="w-3 h-3" />
            </button>
            <button onClick={() => setViewMode('segmented')} className={`p-1 rounded ${viewMode === 'segmented' ? 'bg-cardio-border text-white' : 'text-gray-600'}`}>
                <Eye className="w-3 h-3" />
            </button>
            <button onClick={() => setViewMode('morphology')} className={`p-1 rounded ${viewMode === 'morphology' ? 'bg-cardio-border text-white' : 'text-gray-600'}`}>
                <Layers className="w-3 h-3" />
            </button>
        </div>
      </div>

      {/* Graph Area */}
      <div 
        className={`flex-1 relative w-full border-t border-b border-cardio-border transition-all duration-300 overflow-hidden ${dragActive ? 'border-cardio-cyan' : ''}`}
        onDragEnter={handleDrag} 
        onDragLeave={handleDrag} 
        onDragOver={handleDrag} 
        onDrop={handleDrop}
      >
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 backdrop-blur-sm">
            <Loader2 className="w-6 h-6 text-cardio-cyan animate-spin mb-2" />
          </div>
        )}

        {data && (
             <Plot
                data={plotData}
                layout={layout}
                useResizeHandler={true}
                style={{ width: '100%', height: '100%' }}
                config={{ displayModeBar: false, responsive: true }}
                onClick={handlePlotClick}
             />
        )}
      </div>
    </div>
  );
};

export default ECGPlot;