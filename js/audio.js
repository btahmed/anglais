// ==================== WEB AUDIO API ====================
let audioContext = null;

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

function playNotificationSound() {
    if (!db?.settings?.sound) return;
    
    try {
        const ctx = initAudio();
        if (ctx.state === 'suspended') ctx.resume();
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = 800;
        osc.type = 'sine';
        
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
    } catch(e) {
        console.log('Audio error:', e);
    }
}

function playSuccessSound() {
    if (!db?.settings?.sound) return;
    
    try {
        const ctx = initAudio();
        if (ctx.state === 'suspended') ctx.resume();
        
        const notes = [523, 659, 784];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.3);
            
            osc.start(ctx.currentTime + i * 0.15);
            osc.stop(ctx.currentTime + i * 0.15 + 0.3);
        });
    } catch(e) {
        console.log('Audio error:', e);
    }
}

function playAlertSound() {
    if (!db?.settings?.sound) return;
    
    try {
        const ctx = initAudio();
        if (ctx.state === 'suspended') ctx.resume();
        
        for (let i = 0; i < 3; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.frequency.value = 880;
            gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.2);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.2 + 0.1);
            
            osc.start(ctx.currentTime + i * 0.2);
            osc.stop(ctx.currentTime + i * 0.2 + 0.1);
        }
    } catch(e) {
        console.log('Audio error:', e);
    }
}

// ==================== AMBIENT SOUNDS ====================
let ambientSound = 'rain';
let ambientPlaying = false;
let ambientNodes = [];
let ambientGainNode = null;

function playAmbientSound() {
    try {
        const ctx = initAudio();
        if (ctx.state === 'suspended') ctx.resume();
        
        stopAmbientSound();
        ambientNodes = [];
        
        ambientGainNode = ctx.createGain();
        ambientGainNode.gain.value = 0.15;
        ambientGainNode.connect(ctx.destination);
        
        switch(ambientSound) {
            case 'rain':
                createRainSound(ctx);
                break;
            case 'cafe':
                createCafeSound(ctx);
                break;
            case 'forest':
                createForestSound(ctx);
                break;
            case 'white':
                createWhiteNoise(ctx);
                break;
        }
        
        ambientPlaying = true;
        updateAmbientUI(true);
        
    } catch(e) {
        console.error('Ambient sound error:', e);
    }
}

function stopAmbientSound() {
    ambientNodes.forEach(node => {
        try {
            if (node.stop) node.stop();
            if (node.disconnect) node.disconnect();
        } catch(e) {}
    });
    ambientNodes = [];
    ambientPlaying = false;
    updateAmbientUI(false);
}

function updateAmbientUI(playing) {
    const btn = document.getElementById('ambient-toggle');
    if (btn) {
        btn.textContent = playing ? 'ON' : 'OFF';
        btn.classList.toggle('bg-indigo-500/30', playing);
    }
}

function createRainSound(ctx) {
    const bufferSize = 2 * ctx.sampleRate;
    const brownBuffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
        const output = brownBuffer.getChannelData(channel);
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5;
        }
    }
    
    const brownSource = ctx.createBufferSource();
    brownSource.buffer = brownBuffer;
    brownSource.loop = true;
    
    const brownFilter = ctx.createBiquadFilter();
    brownFilter.type = 'lowpass';
    brownFilter.frequency.value = 400;
    
    const brownGain = ctx.createGain();
    brownGain.gain.value = 0.6;
    
    brownSource.connect(brownFilter);
    brownFilter.connect(brownGain);
    brownGain.connect(ambientGainNode);
    brownSource.start();
    ambientNodes.push(brownSource);
    
    createRainDrops(ctx);
}

function createRainDrops(ctx) {
    function scheduleDrop() {
        if (!ambientPlaying) return;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.type = 'sine';
        osc.frequency.value = 2000 + Math.random() * 4000;
        
        filter.type = 'bandpass';
        filter.frequency.value = osc.frequency.value;
        filter.Q.value = 20;
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.03 + Math.random() * 0.02, ctx.currentTime + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05 + Math.random() * 0.03);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ambientGainNode);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
        
        setTimeout(scheduleDrop, 20 + Math.random() * 60);
    }
    
    for (let i = 0; i < 5; i++) {
        setTimeout(scheduleDrop, i * 50);
    }
}

function createCafeSound(ctx) {
    const bufferSize = 2 * ctx.sampleRate;
    const murmurBuffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
        const output = murmurBuffer.getChannelData(channel);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * 0.3;
            if (Math.random() < 0.001) {
                const burstLen = Math.floor(Math.random() * 1000) + 500;
                for (let j = 0; j < burstLen && i + j < bufferSize; j++) {
                    output[i + j] += (Math.random() * 2 - 1) * 0.2 * (1 - j / burstLen);
                }
            }
        }
    }
    
    const source = ctx.createBufferSource();
    source.buffer = murmurBuffer;
    source.loop = true;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.5;
    
    source.connect(filter);
    filter.connect(ambientGainNode);
    source.start();
    ambientNodes.push(source);
    
    createCafeClinks(ctx);
}

function createCafeClinks(ctx) {
    function scheduleClink() {
        if (!ambientPlaying) return;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = 3000 + Math.random() * 2000;
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 0.001);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        
        osc.connect(gain);
        gain.connect(ambientGainNode);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
        
        setTimeout(scheduleClink, 2000 + Math.random() * 5000);
    }
    
    setTimeout(scheduleClink, 1000);
}

function createForestSound(ctx) {
    const bufferSize = 2 * ctx.sampleRate;
    const windBuffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
        const output = windBuffer.getChannelData(channel);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;
        }
    }
    
    const source = ctx.createBufferSource();
    source.buffer = windBuffer;
    source.loop = true;
    
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.1;
    lfoGain.gain.value = 0.3;
    
    const windGain = ctx.createGain();
    windGain.gain.value = 0.5;
    
    lfo.connect(lfoGain);
    lfoGain.connect(windGain.gain);
    
    source.connect(windGain);
    windGain.connect(ambientGainNode);
    
    lfo.start();
    source.start();
    ambientNodes.push(source, lfo);
    
    createBirdChirps(ctx);
}

function createBirdChirps(ctx) {
    function scheduleChirp() {
        if (!ambientPlaying) return;
        
        const baseFreq = 2000 + Math.random() * 2000;
        const numNotes = 2 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < numNotes; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            const noteTime = ctx.currentTime + i * 0.08;
            osc.frequency.setValueAtTime(baseFreq * (1 + Math.random() * 0.3), noteTime);
            
            gain.gain.setValueAtTime(0, noteTime);
            gain.gain.linearRampToValueAtTime(0.04, noteTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.06);
            
            osc.connect(gain);
            gain.connect(ambientGainNode);
            
            osc.start(noteTime);
            osc.stop(noteTime + 0.1);
        }
        
        setTimeout(scheduleChirp, 3000 + Math.random() * 8000);
    }
    
    setTimeout(scheduleChirp, 2000);
}

function createWhiteNoise(ctx) {
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 8000;
    
    source.connect(filter);
    filter.connect(ambientGainNode);
    source.start();
    ambientNodes.push(source);
}

function toggleAmbientSound() {
    if (ambientPlaying) {
        stopAmbientSound();
    } else {
        playAmbientSound();
    }
}

function setAmbientType(type) {
    ambientSound = type;
    if (ambientPlaying) {
        stopAmbientSound();
        playAmbientSound();
    }
    
    document.querySelectorAll('[data-ambient]').forEach(btn => {
        btn.classList.toggle('ring-2', btn.dataset.ambient === type);
    });
}
