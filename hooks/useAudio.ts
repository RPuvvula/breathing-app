
import { useRef, useCallback } from 'react';
import { BackgroundMusicType } from '../types';

const isBrowser = typeof window !== 'undefined';

interface MusicNodes {
  type: BackgroundMusicType;
  nodes: (AudioNode | OscillatorNode | BiquadFilterNode | GainNode)[];
  intervalId?: ReturnType<typeof setInterval>;
}

export const useAudio = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const backgroundMusicNodesRef = useRef<MusicNodes | null>(null);

  const getAudioContext = useCallback((): AudioContext | null => {
    if (!isBrowser) return null;
    if (!audioContextRef.current) {
      try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = context;
      } catch (e) {
        console.error("Web Audio API is not supported in this browser.", e);
        return null;
      }
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const playSound = useCallback((type: 'inhale' | 'exhale' | 'chime' | 'hold') => {
    const context = getAudioContext();
    if (!context) return;

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    gainNode.connect(context.destination);
    oscillator.connect(gainNode);

    let freq = 440;
    let duration = 0.1;
    let gain = 0.3;

    switch (type) {
      case 'inhale': freq = 660; gain = 0.2; duration = 0.15; oscillator.type = 'sine'; break;
      case 'exhale': freq = 440; gain = 0.15; duration = 0.2; oscillator.type = 'sine'; break;
      case 'chime': freq = 880; gain = 0.4; duration = 0.2; oscillator.type = 'triangle'; break;
      case 'hold': freq = 523.25; gain = 0.3; duration = 0.5; oscillator.type = 'sine'; break;
    }
    
    gainNode.gain.setValueAtTime(gain, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);

    oscillator.frequency.setValueAtTime(freq, context.currentTime);
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + duration);
  }, [getAudioContext]);
  
  const speak = useCallback((text: string) => {
    if (!isBrowser || !('speechSynthesis' in window)) {
      console.warn("Web Speech API is not supported in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }, []);

  const startBackgroundMusic = useCallback((musicType: BackgroundMusicType) => {
    const context = getAudioContext();
    if (!context || backgroundMusicNodesRef.current || musicType === BackgroundMusicType.Off) return;

    const allNodes: (AudioNode | OscillatorNode | BiquadFilterNode | GainNode)[] = [];
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const masterGain = context.createGain();
    masterGain.gain.setValueAtTime(0, context.currentTime);
    masterGain.connect(context.destination);
    allNodes.push(masterGain);

    switch(musicType) {
        case BackgroundMusicType.AmbientHum:
            masterGain.gain.linearRampToValueAtTime(0.1, context.currentTime + 3);
            const osc1 = context.createOscillator();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(80, context.currentTime);
            osc1.connect(masterGain);
            osc1.start();
            
            const osc2 = context.createOscillator();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(80.5, context.currentTime);
            osc2.connect(masterGain);
            osc2.start();
            allNodes.push(osc1, osc2);
            break;

        case BackgroundMusicType.ZenGarden:
            masterGain.gain.linearRampToValueAtTime(0.3, context.currentTime + 1); // Chimes are quiet
            const playChime = () => {
                const now = context.currentTime;
                const osc = context.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(987.77, now); // B5
                const gain = context.createGain();
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(1, now + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 8);
                osc.connect(gain).connect(masterGain);
                osc.start(now);
                osc.stop(now + 8);
            };
            playChime(); // Play one immediately
            intervalId = setInterval(playChime, 12000 + Math.random() * 5000);
            break;

        case BackgroundMusicType.OceanWaves:
            masterGain.gain.linearRampToValueAtTime(0.4, context.currentTime + 3);
            const bufferSize = 4096;
            const noiseBuffer = context.createBuffer(1, bufferSize, context.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1; // White noise
            }

            const whiteNoise = context.createBufferSource();
            whiteNoise.buffer = noiseBuffer;
            whiteNoise.loop = true;

            const filter = context.createBiquadFilter();
            filter.type = 'lowpass';
            filter.Q.value = 1;
            filter.frequency.value = 800;
            
            const lfo = context.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 0.2; // Slow waves

            const lfoGain = context.createGain();
            lfoGain.gain.value = 400; // How much the LFO affects the filter frequency

            lfo.connect(lfoGain);
            lfoGain.connect(filter.frequency);
            whiteNoise.connect(filter).connect(masterGain);
            
            lfo.start();
            whiteNoise.start();
            allNodes.push(whiteNoise, filter, lfo, lfoGain);
            break;
    }

    backgroundMusicNodesRef.current = { type: musicType, nodes: allNodes, intervalId };
  }, [getAudioContext]);

  const stopBackgroundMusic = useCallback(() => {
    const context = getAudioContext();
    const music = backgroundMusicNodesRef.current;
    if (!context || !music) return;
    
    if (music.intervalId) {
        clearInterval(music.intervalId);
    }
    
    const masterGain = music.nodes[0] as GainNode;
    const fadeOutTime = context.currentTime + 2;
    masterGain.gain.linearRampToValueAtTime(0, fadeOutTime);

    music.nodes.forEach(node => {
      if ('stop' in node && typeof node.stop === 'function') {
        try { (node as OscillatorNode).stop(fadeOutTime); } catch (e) { /* already stopped */ }
      }
    });

    setTimeout(() => {
        music.nodes.forEach(node => {
            if ('disconnect' in node && typeof node.disconnect === 'function') {
                node.disconnect();
            }
        });
    }, 2000);


    backgroundMusicNodesRef.current = null;
  }, [getAudioContext]);


  return { playSound, speak, startBackgroundMusic, stopBackgroundMusic };
};
