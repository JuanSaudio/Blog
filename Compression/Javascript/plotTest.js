const fs = 48000;
const dur = 2;
const threshold = -10;
const ratio = 2;
const attack = 100/1000;
const release = 100/1000;

const nVals = dur * fs - 1;
const nData = [...Array(nVals).keys()];
const tData = nData.map(x => x / fs);
var eData = tData.map(x => x < 0.5 || x > 1 ? 0 : 1);
var xData = Array(nVals);
for (var i = 0; i < nVals; i++) {
    xData[i] = eData[i] * Math.cos(1000 * tData[i])
}
var lData = Array(nVals);
var gData = Array(nVals);
var yData = Array(nVals);

class LevelEstimator {
    constructor(attack, release, sampleRate) {
        this.fs = sampleRate;
        this.s = 0.0;
        this.b0Att = 1.0 - Math.exp(-1.0 / (attack * this.fs));
        this.b0Rel = 1.0 - Math.exp(-1.0 / (release * this.fs));
    }
    process(x) {
        let xAbs = Math.abs(x);
        this.s += (xAbs > this.s ? this.b0Att : this.b0Rel) * (xAbs - this.s);
        return this.s;
    }
};

let l = new LevelEstimator(attack, release, fs);

function mag2db(x) {
    return 20.0 * Math.log10(Math.abs(x));
}

function db2mag(x) {
    return 10**( x / 20.0);
}

function gainComputer(leveldB, threshold, ratio) {
    return Math.max(leveldB - threshold, 0) * ( 1.0 / ratio - 1.0);
}

for (var i = 0; i < nVals; i++) {
    lData[i] = l.process(xData[i]);
    ldB = mag2db(lData[i])
    gdB = gainComputer(ldB, threshold, ratio)
    gData[i] = db2mag(gdB)
    yData[i] = xData[i] * gData[i]
}


var xTrace = {x: tData, y: xData};
var lTrace = {x: tData, y: gData};
var gTrace = {x: tData, y: lData};
var yTrace = {x: tData, y: yData};
var eTrace = {x: tData, y: eData};

var data = [xTrace, yTrace, lTrace, gTrace];
// var data = [lTrace];

TESTER = document.getElementById('tester');
Plotly.newPlot(TESTER, data);
