const notesVoice1 = [65.41, 82.41, 98, 123.47, 130.81];
const notesVoice2 = [130.81, 164.81, 196, 246.94, 261.63];

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

class StrangerSynth {
    constructor() {
        this.playing = false;
        this.actx = null;
        this.filter = null;
        this.LFOinterval = null;
        this.currentIndex = 0;
        this.increasing = true;
        
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        this.playBtn = document.querySelector('#play');
        this.stopBtn = document.querySelector('#stop');
        this.filterFreqEl = document.querySelector('#filterFreq');
        this.filterResEl = document.querySelector('#filterQ');
        this.lfo = document.querySelector('#lfo');
    }

    setupEventListeners() {
        this.playBtn.addEventListener('click', () => this.start());
        this.stopBtn.addEventListener('click', () => this.stop());
        this.filterFreqEl.addEventListener('input', e => this.updateFilterFrequency(e.target.value));
        this.filterResEl.addEventListener('input', e => this.updateFilterResonance(e.target.value));
        this.lfo.addEventListener('input', e => this.toggleLFO(e.target.checked));
    }

    async start() {
        if (this.playing) return;

        try {
            this.actx = new (window.AudioContext || window.webkitAudioContext)();
            this.setupFilter();
            this.playing = true;
            this.lfo.disabled = false;
            await this.playNotes();
        } catch (error) {
            console.error('Error starting audio:', error);
            alert('Unable to start audio. Please check your browser settings.');
        }
    }

    setupFilter() {
        this.filter = this.actx.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.value = this.filterFreqEl.value;
        this.filter.Q.value = this.filterResEl.value;
        this.filter.connect(this.actx.destination);
    }

    updateFilterFrequency(value) {
        if (this.filter) {
            this.filter.frequency.value = value;
        }
    }

    updateFilterResonance(value) {
        if (this.filter) {
            this.filter.Q.value = value;
        }
    }

    toggleLFO(isOn) {
        if (isOn) {
            this.startLFO();
        } else {
            this.stopLFO();
        }
    }

    startLFO() {
        this.filterFreqEl.disabled = true;
        this.filterResEl.disabled = true;
        let val = parseInt(this.filterFreqEl.value);
        let increasing = true;

        this.LFOinterval = setInterval(() => {
            if (increasing) {
                val += 5;
                if (val > 1400) increasing = false;
            } else {
                val -= 5;
                if (val < 100) increasing = true;
            }
            
            this.filterFreqEl.value = val;
            this.filter.frequency.value = val;
        }, 20);
    }

    stopLFO() {
        if (this.LFOinterval) {
            clearInterval(this.LFOinterval);
            this.LFOinterval = null;
        }
        this.filterFreqEl.disabled = false;
        this.filterResEl.disabled = false;
    }

    async playNotes() {
        while (this.playing) {
            const osc1 = this.createOscillator(notesVoice1[this.currentIndex]);
            const osc2 = this.createOscillator(notesVoice2[this.currentIndex]);

            await delay(160);

            osc1.stop();
            osc2.stop();

            this.updateNoteIndex();
        }
    }

    createOscillator(frequency) {
        const osc = this.actx.createOscillator();
        osc.type = 'sawtooth';
        osc.connect(this.filter);
        osc.frequency.value = frequency;
        osc.start();
        return osc;
    }

    updateNoteIndex() {
        if (this.increasing) {
            this.currentIndex++;
            if (this.currentIndex === 4) this.increasing = false;
        } else {
            this.currentIndex--;
            if (this.currentIndex === 0) this.increasing = true;
        }
    }

    stop() {
        this.playing = false;
        this.stopLFO();
        if (this.lfo.checked) {
            this.lfo.checked = false;
        }
        this.lfo.disabled = true;
        this.filterFreqEl.disabled = false;
        this.filterResEl.disabled = false;
        
        if (this.actx) {
            this.actx.close();
            this.actx = null;
        }
    }
}

// Initialize the synth when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new StrangerSynth();
}); 