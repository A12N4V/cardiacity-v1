"use client";

import Heart3D from "@/components/Heart3D";
import { useState, useEffect } from "react";
import { Settings, X } from "lucide-react";

export default function CardiacityPage() {
  // Example beat times - in a real scenario, these would come from ECG analysis
  const [beatTimes, setBeatTimes] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(60);
  const [showCameraSettings, setShowCameraSettings] = useState(false);
  // Much closer camera position to see the heart
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0, z: 300 });
  const [cameraTarget, setCameraTarget] = useState({ x: 0, y: 0, z: 0 });
  const [inputCameraPosition, setInputCameraPosition] = useState({ x: 0, y: 0, z: 300 });
  const [inputCameraTarget, setInputCameraTarget] = useState({ x: 0, y: 0, z: 0 });
  const [currentCameraPosition, setCurrentCameraPosition] = useState({ x: 0, y: 0, z: 300 });

  // Generate simulated beat times based on BPM
  useEffect(() => {
    if (!isPlaying) return;

    const interval = 60000 / bpm; // milliseconds between beats
    const startTime = Date.now();
    const beats: number[] = [];

    // Generate beats for next 60 seconds
    for (let i = 0; i < 60; i++) {
      beats.push(startTime + i * interval);
    }

    setBeatTimes(beats);

    // Update beat times every 30 seconds to keep them fresh
    const updateInterval = setInterval(() => {
      const newStartTime = Date.now();
      const newBeats: number[] = [];
      for (let i = 0; i < 60; i++) {
        newBeats.push(newStartTime + i * interval);
      }
      setBeatTimes(newBeats);
    }, 30000);

    return () => clearInterval(updateInterval);
  }, [isPlaying, bpm]);

  const applyCameraSettings = () => {
    setCameraPosition(inputCameraPosition);
    setCameraTarget(inputCameraTarget);
    setShowCameraSettings(false);
  };

  const resetCamera = () => {
    const defaultPosition = { x: 0, y: 0, z: 300 };
    const defaultTarget = { x: 0, y: 0, z: 0 };
    setInputCameraPosition(defaultPosition);
    setInputCameraTarget(defaultTarget);
    setCameraPosition(defaultPosition);
    setCameraTarget(defaultTarget);
  };

  return (
    <div className="w-screen h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-border px-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cardiacity</h1>
          <p className="text-xs text-muted-foreground">3D Heart Beat Visualization</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="bpm" className="text-sm text-foreground">BPM:</label>
            <input
              id="bpm"
              type="number"
              min="30"
              max="200"
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value) || 60)}
              className="w-20 px-2 py-1 border border-border rounded bg-background text-foreground"
            />
          </div>

          {/* Camera Settings Button */}
          <button
            onClick={() => setShowCameraSettings(true)}
            className="p-2 rounded border border-border hover:bg-accent transition-colors"
            title="Camera Settings"
          >
            <Settings className="w-5 h-5 text-foreground" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              isPlaying
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            }`}
          >
            {isPlaying ? "Stop" : "Start"}
          </button>
        </div>
      </header>

      {/* 3D Canvas */}
      <main className="flex-1 relative">
        <Heart3D
          beatTimes={beatTimes}
          isPlaying={isPlaying}
          cameraPosition={cameraPosition}
          cameraTarget={cameraTarget}
          onCameraUpdate={setCurrentCameraPosition}
        />
      </main>

      {/* Camera Settings Panel */}
      {showCameraSettings && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-md mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Camera Settings</h2>
              <button
                onClick={() => setShowCameraSettings(false)}
                className="p-1 hover:bg-accent rounded transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Camera Position */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Camera Position
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">X</label>
                    <input
                      type="number"
                      value={inputCameraPosition.x}
                      onChange={(e) =>
                        setInputCameraPosition({ ...inputCameraPosition, x: parseFloat(e.target.value) })
                      }
                      className="w-full px-2 py-1 border border-border rounded bg-background text-foreground text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Y</label>
                    <input
                      type="number"
                      value={inputCameraPosition.y}
                      onChange={(e) =>
                        setInputCameraPosition({ ...inputCameraPosition, y: parseFloat(e.target.value) })
                      }
                      className="w-full px-2 py-1 border border-border rounded bg-background text-foreground text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Z</label>
                    <input
                      type="number"
                      value={inputCameraPosition.z}
                      onChange={(e) =>
                        setInputCameraPosition({ ...inputCameraPosition, z: parseFloat(e.target.value) })
                      }
                      className="w-full px-2 py-1 border border-border rounded bg-background text-foreground text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Camera Target */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Camera Target (Look At)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">X</label>
                    <input
                      type="number"
                      value={inputCameraTarget.x}
                      onChange={(e) =>
                        setInputCameraTarget({ ...inputCameraTarget, x: parseFloat(e.target.value) })
                      }
                      className="w-full px-2 py-1 border border-border rounded bg-background text-foreground text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Y</label>
                    <input
                      type="number"
                      value={inputCameraTarget.y}
                      onChange={(e) =>
                        setInputCameraTarget({ ...inputCameraTarget, y: parseFloat(e.target.value) })
                      }
                      className="w-full px-2 py-1 border border-border rounded bg-background text-foreground text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Z</label>
                    <input
                      type="number"
                      value={inputCameraTarget.z}
                      onChange={(e) =>
                        setInputCameraTarget({ ...inputCameraTarget, z: parseFloat(e.target.value) })
                      }
                      className="w-full px-2 py-1 border border-border rounded bg-background text-foreground text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={resetCamera}
                  className="flex-1 px-4 py-2 border border-border rounded hover:bg-accent transition-colors text-sm font-medium text-foreground"
                >
                  Reset to Default
                </button>
                <button
                  onClick={applyCameraSettings}
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded transition-colors text-sm font-medium"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-4 max-w-xs">
        <h3 className="text-sm font-semibold text-foreground mb-2">Status</h3>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>State:</span>
            <span className={isPlaying ? "text-green-500" : "text-red-500"}>
              {isPlaying ? "Active" : "Stopped"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Heart Rate:</span>
            <span className="text-foreground">{bpm} BPM</span>
          </div>
          <div className="flex justify-between">
            <span>Beat Interval:</span>
            <span className="text-foreground">{(60000 / bpm).toFixed(0)}ms</span>
          </div>
          <div className="flex justify-between">
            <span>Next Beats:</span>
            <span className="text-foreground">{beatTimes.length}</span>
          </div>
        </div>
      </div>

      {/* Camera Position Display */}
      <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-foreground mb-2">Camera Position</h3>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <div className="text-muted-foreground">X</div>
            <div className="font-mono text-foreground">{currentCameraPosition.x}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Y</div>
            <div className="font-mono text-foreground">{currentCameraPosition.y}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Z</div>
            <div className="font-mono text-foreground">{currentCameraPosition.z}</div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-24 right-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-4 max-w-md">
        <h3 className="text-sm font-semibold text-foreground mb-2">Controls</h3>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li>• Adjust BPM to change heart rate (30-200)</li>
          <li>• Click <Settings className="w-3 h-3 inline" /> to adjust camera position</li>
          <li>• Click Start to begin heartbeat animation</li>
          <li>• Use mouse to rotate and zoom the 3D model</li>
          <li>• Right-click and drag to pan</li>
        </ul>
      </div>
    </div>
  );
}
