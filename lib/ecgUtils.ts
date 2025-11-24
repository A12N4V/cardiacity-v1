import Papa from 'papaparse';

export type WaveSegment = 'p' | 'qrs' | 't' | 'baseline';

export interface ECGData {
  time: number[];
  voltage: number[];
  segments?: WaveSegment[]; // Parallel array to time/voltage
}

export interface ECGStatistics {
    bpm: number;
    rrIntervals: number[]; // in seconds
    sdnn: number; // ms
    rmssd: number; // ms
    qrsDuration: number; // ms (estimated)
    duration: number; // Total duration in seconds
    minRR: number;
    maxRR: number;
}

/**
 * Returns a descriptive object for a given ECG segment.
 */
export const getSegmentDescription = (segment: string) => {
    switch (segment) {
        case 'p':
            return {
                title: 'P-Wave',
                short: 'Atrial Depolarization',
                description: 'The P-wave represents the electrical depolarization of the atria (upper chambers), which leads to atrial contraction. A normal P-wave precedes every QRS complex.'
            };
        case 'qrs':
            return {
                title: 'QRS Complex',
                short: 'Ventricular Depolarization',
                description: 'The QRS complex corresponds to the depolarization of the ventricles (lower chambers). Because the ventricles are larger than the atria, this signal is much stronger.'
            };
        case 't':
            return {
                title: 'T-Wave',
                short: 'Ventricular Repolarization',
                description: 'The T-wave represents the repolarization (recovery) of the ventricles. This is a critical period where the heart muscle resets for the next beat.'
            };
        case 'baseline':
        default:
            return {
                title: 'Isoelectric Line',
                short: 'Resting Phase',
                description: 'The baseline (isoelectric line) represents periods where there is no significant electrical activity detected, typically between cardiac cycles or segments.'
            };
    }
};

/**
 * Returns a health status string based on SDNN (HRV metric).
 */
export const getHRVStatus = (sdnn: number) => {
    if (sdnn < 50) return { status: 'Low / Unhealthy', color: 'text-red-500' };
    if (sdnn < 100) return { status: 'Moderate / Compromised', color: 'text-yellow-500' };
    return { status: 'High / Healthy', color: 'text-green-500' };
};

/**
 * Parses a CSV string into Time and Voltage arrays.
 * Now also attempts to perform heuristic segmentation if not provided.
 */
export const parseECGCSV = (csvText: string): Promise<ECGData> => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as Record<string, any>[];
        
        if (!data || data.length === 0) {
          reject(new Error("No data found in CSV"));
          return;
        }

        // Attempt to identify columns
        const keys = Object.keys(data[0]);
        const timeKey = keys.find(k => k.toLowerCase().includes('time')) || keys[0];
        const voltageKey = keys.find(k => k.toLowerCase().includes('volt') || k.toLowerCase().includes('lead') || k.toLowerCase().includes('val')) || keys[1];

        const time: number[] = [];
        const voltage: number[] = [];

        data.forEach((row) => {
            const t = row[timeKey];
            const v = row[voltageKey];
            if (typeof t === 'number' && typeof v === 'number') {
                time.push(t);
                voltage.push(v);
            }
        });

        // Initial naive segmentation (all baseline) - will be updated by processor
        const segments = new Array(time.length).fill('baseline');

        resolve({ time, voltage, segments });
      },
      error: (error: any) => {
        reject(error);
      }
    });
  });
};

/**
 * Detects R-peaks in ECG signal using a simplified algorithm.
 */
export const detectRPeaks = (time: number[], voltage: number[]): number[] => {
    if (time.length === 0 || voltage.length === 0) return [];

    const mean = voltage.reduce((a, b) => a + b, 0) / voltage.length;
    const centered = voltage.map(v => v - mean);
    const maxVal = Math.max(...centered.map(Math.abs));
    
    // Dynamic threshold (60% of max)
    const threshold = maxVal * 0.6;
    const refractoryPeriod = 0.25; 

    const peaksIndices: number[] = [];
    let lastPeakTime = -refractoryPeriod;

    for (let i = 1; i < time.length - 1; i++) {
        const current = centered[i];
        const prev = centered[i - 1];
        const next = centered[i + 1];

        if (current > prev && current > next) {
            if (current > threshold) {
                const currentTime = time[i];
                if (currentTime - lastPeakTime > refractoryPeriod) {
                    peaksIndices.push(i);
                    lastPeakTime = currentTime;
                }
            }
        }
    }
    return peaksIndices; // Return indices now for segmentation logic
};

/**
 * Heuristic Segmentation for uploaded files based on R-peaks.
 */
export const segmentECGData = (data: ECGData, rPeakIndices: number[]): ECGData => {
    const segments = [...(data.segments || new Array(data.time.length).fill('baseline'))];
    
    // Simple heuristic windows relative to R-peak (in seconds)
    // P: -0.2 to -0.1
    // QRS: -0.06 to +0.06
    // T: +0.1 to +0.4
    
    rPeakIndices.forEach(idx => {
        const tR = data.time[idx];
        
        // We need to find indices corresponding to these time windows
        // Since binary search or exact lookups are expensive in loops, we scan locally
        // Optimization: assume constant sample rate approx
        
        // Scan backwards for P
        for (let i = idx; i >= 0; i--) {
            const dt = tR - data.time[i];
            if (dt > 0.25) break; // limit lookback
            
            if (dt > 0.1 && dt < 0.22) segments[i] = 'p';
            else if (dt <= 0.06) segments[i] = 'qrs';
        }

        // Scan forwards for T
        for (let i = idx + 1; i < data.time.length; i++) {
            const dt = data.time[i] - tR;
            if (dt > 0.45) break;

            if (dt < 0.06) segments[i] = 'qrs';
            else if (dt > 0.12 && dt < 0.42) segments[i] = 't';
        }
    });

    return { ...data, segments };
};

/**
 * Calculates advanced Heart Rate Variability statistics
 */
export const calculateStats = (rPeakIndices: number[], time: number[]): ECGStatistics => {
    const duration = time.length > 0 ? time[time.length - 1] - time[0] : 0;

    if (rPeakIndices.length < 2) {
        return { bpm: 0, rrIntervals: [], sdnn: 0, rmssd: 0, qrsDuration: 80, duration, minRR: 0, maxRR: 0 };
    }

    const rrIntervals: number[] = [];
    for (let i = 1; i < rPeakIndices.length; i++) {
        const diff = time[rPeakIndices[i]] - time[rPeakIndices[i-1]];
        rrIntervals.push(diff);
    }

    const bpm = 60 / (rrIntervals.reduce((a,b) => a+b, 0) / rrIntervals.length);

    // SDNN (Standard Deviation of NN intervals)
    const meanRR = rrIntervals.reduce((a,b) => a+b, 0) / rrIntervals.length;
    const squaredDiffs = rrIntervals.map(rr => Math.pow(rr - meanRR, 2));
    const sdnn = Math.sqrt(squaredDiffs.reduce((a,b) => a+b, 0) / squaredDiffs.length) * 1000; // ms

    // RMSSD (Root Mean Square of Successive Differences)
    let sumSquaredDiffs = 0;
    for (let i = 1; i < rrIntervals.length; i++) {
        sumSquaredDiffs += Math.pow((rrIntervals[i] - rrIntervals[i-1]) * 1000, 2);
    }
    const rmssd = Math.sqrt(sumSquaredDiffs / (rrIntervals.length - 1));

    return {
        bpm: Math.round(bpm),
        rrIntervals,
        sdnn: Math.round(sdnn),
        rmssd: Math.round(rmssd),
        qrsDuration: 90, // Placeholder/Average for now
        duration,
        minRR: Math.min(...rrIntervals),
        maxRR: Math.max(...rrIntervals)
    };
};

type ECGType = 'normal' | 'tachycardia' | 'afib' | 'bradycardia' | 'qt_prolongation';

/**
 * Generates synthetic ECG signals mimicking different pathologies.
 * Now returns PRE-SEGMENTED data for ground truth visualization.
 */
export const generateSyntheticECG = (type: ECGType = 'normal', durationSeconds: number = 10): ECGData => {
    const fs = 250; // 250 Hz
    const time: number[] = [];
    const voltage: number[] = [];
    const segments: WaveSegment[] = [];
    
    let bpm = 60;
    let irregularity = 0; // 0 to 1
    let noiseLevel = 0.01;
    let qtFactor = 1.0;

    switch (type) {
        case 'tachycardia': bpm = 130; break;
        case 'bradycardia': bpm = 45; break;
        case 'afib': bpm = 90; irregularity = 0.6; noiseLevel = 0.04; break;
        case 'qt_prolongation': bpm = 60; qtFactor = 1.6; break;
        case 'normal': default: bpm = 60; break;
    }

    let beatDuration = 60 / bpm;
    let nextBeatTime = 0;
    
    for (let i = 0; i < durationSeconds * fs; i++) {
        const t = i / fs;
        time.push(t);
        
        // Handle beat timing logic
        if (t >= nextBeatTime) {
             const randomVar = (Math.random() - 0.5) * irregularity * beatDuration;
             nextBeatTime = t + beatDuration + randomVar;
        }

        const distToBeat = t - (nextBeatTime - beatDuration); 
        const phase = distToBeat / beatDuration;

        let v = 0;
        let seg: WaveSegment = 'baseline';

        // Baseline drift
        v += Math.sin(t * 0.2) * 0.05;

        // P wave
        if (type !== 'afib') {
             if (phase > 0.1 && phase < 0.22) {
                v += 0.1 * Math.exp(-Math.pow((phase - 0.16) * 50, 2));
                if (Math.abs(phase - 0.16) < 0.05) seg = 'p';
            }
        } else {
             // AFib Fibrillatory waves
             v += Math.sin(t * 45) * 0.03; 
        }
        
        // QRS Complex
        if (phase > 0.38 && phase < 0.44) {
             seg = 'qrs';
             // Q
            if (phase > 0.38 && phase < 0.4) v -= 0.15 * Math.exp(-Math.pow((phase - 0.39) * 200, 2));
             // R
            if (phase > 0.39 && phase < 0.41) v += 1.2 * Math.exp(-Math.pow((phase - 0.40) * 300, 2));
             // S
            if (phase > 0.41 && phase < 0.43) v -= 0.2 * Math.exp(-Math.pow((phase - 0.42) * 200, 2));
        }

        // T wave (modified by qtFactor)
        const tWaveStart = 0.5 * qtFactor;
        const tWaveEnd = 0.75 * qtFactor;
        const tWaveCenter = 0.62 * qtFactor;
        
        if (phase > tWaveStart && phase < tWaveEnd) {
            v += 0.25 * Math.exp(-Math.pow((phase - tWaveCenter) * (30/qtFactor), 2));
            if (v > 0.05) seg = 't';
        }

        // Noise
        v += (Math.random() - 0.5) * noiseLevel;

        voltage.push(v);
        segments.push(seg);
    }
    
    return { time, voltage, segments };
}