const ctx1 = document.getElementById("timeChart").getContext('2d');
const ctx2 = document.getElementById("charFunc").getContext('2d');
const fs = 400;
const dur = 2;
const nVals = dur * fs - 1;
const nGVals = 20;

const nData = [...Array(nVals).keys()];
const tData = nData.map(x => x / fs);
const xData = tData.map(x => x < 0.5 || x > 1 ? 0 : 1);
const lData = Array(nVals);
const gData = Array(nVals);
const yData = Array(nVals);
const thData = Array(nVals);

const inVals = [...Array(nGVals).keys()].map(x => -x).reverse();
const outVals = [...Array(nGVals).keys()];

var threshold = -10;
var ratio = 2;
var attack = 10;
var release = 100;

function mag2db(x) {
    return 20.0 * Math.log10(Math.abs(x));
}

function db2mag(x) {
    return 10**( x / 20.0);
}

class LevelEstimator {
    constructor(sampleRate) {
        this.fs = sampleRate;
        this.s = 0.0;
        this.b0Att = 1.0;
        this.b0Rel = 1.0;
    }

    setAttack(newAttack) {
        this.b0Att = 1.0 - Math.exp(-1.0 / (newAttack * this.fs / 1000));
    }

    setRelease(newRelease) {
        this.b0Rel = 1.0 - Math.exp(-1.0 / (newRelease * this.fs / 1000));
    }

    getLevel() {
        return this.s;
    }

    clear() {
        this.s = 0.0;
    }

    process(x) {
        this.s += (x > this.s ? this.b0Att : this.b0Rel) * (x - this.s);
        return this.s;
    }
};

class Compressor {
    constructor(levelEstimator) {
        this.estimator = levelEstimator
        this.threshold = 0;
        this.ratio = 1;
        this.attack = 10;
        this.release = 100;
        this.gain = 1;
        this.bias = 0;
        levelEstimator.setAttack(this.attack);
        levelEstimator.setRelease(this.release);
    }

    setParams(newThreshold, newRatio, newAttack, newRelease) {
        this.setThreshold(newThreshold);
        this.setRatio(newRatio);
        this.setAttack(newAttack);
        this.setRelease(newRelease);
    }

    setThreshold(newThreshold) {
        this.threshold = newThreshold;
    }

    setRatio(newRatio) {
        this.ratio = newRatio;
    }

    setAttack(newAttack) {
        this.attack = newAttack;
        this.estimator.setAttack(this.attack);
    }

    setRelease(newRelease) {
        this.release = newRelease;
        this.estimator.setRelease(this.release);
    }

    clear() {
        this.estimator.clear()
    }

    computeGain(leveldB) {
        return Math.max(leveldB - this.threshold, 0) * ( 1.0 / this.ratio - 1.0);
    }

    getLevel() {
        return this.estimator.getLevel()
    }

    getGain() {
        return this.gain;
    }

    process(x) {
        // let l = Math.max(Math.abs(x), db2mag(this.threshold))
        let l = Math.abs(x);
        l = this.estimator.process(l);
        let gdB = this.computeGain(mag2db(Math.abs(l)))
        this.gain = db2mag(gdB);
        return x * this.gain;
    }
}

var gChart = new Chart(ctx2, {
    type: 'line',
    data: {
        labels: inVals,
        datasets: [{
            label: "Characteristic Function",
            data: outVals,
            lineTension: 0,
            borderColor: 'rgba(100, 100, 100, 0)'
        }]
    },
    options: {
        responsive:true,
        maintainAspectRatio: false,
        scales: {
            yAxes: [{
                ticks: {
                    max: 0,
                    min: -19,
                    stepSize: 1
                }
            }]
        }
    },
});

var tChart = new Chart(ctx1, {
    type: 'line',
    data: {
        labels: tData,
        datasets: [{
            label: "Input",
            data: xData,
            fill: false,
            lineTension: 0,
            borderColor: 'rgba(0, 255, 0, 1)',
        },{
            label: "Level",
            data: lData,
            fill: false,
            lineTension: 0,
            borderColor: 'rgba(255, 0, 0, 1)',
        },{
            label: "Gain",
            data: gData,
            fill: false,
            lineTension: 0,
            borderColor: 'rgba(0, 0, 255, 1)',
        },{
            label: "Output",
            data: yData,
            fill: false,
            lineTension: 0,
            borderColor: 'rgba(255, 0, 255, 1)',
        },{
            label: "Threshold",
            data: thData,
            lineTension: 0,
            borderColor: 'rgba(0, 0, 0, 0.1)',
        }],
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        elements: {
            point:{
                radius: 0
            }
        },
        scales: {
            xAxes: [{
                ticks: {
                    max: 5,
                    min: 0,
                    stepSize: 0.5,
                    maxTicksLimit: 20
                }
            }]
        }
    },
});

function computeData() {
    c.clear();
    let thMag = db2mag(c.threshold);
    for (var i = 0; i < nVals; i++) {
        thData[i] = thMag;
        yData[i] = c.process(xData[i]);
        lData[i] = c.getLevel();
        gData[i] = c.getGain();
    }
    tChart.update()
}

function computeGains() {
    let curG;
    for (var i = 0; i < nGVals; i++) {
        curG = c.computeGain(inVals[i])
        outVals[i] = inVals[i] + curG;
    }
    gChart.update()
}

function setThreshold() {
    newThreshold = parseFloat(document.querySelector('#threshold').value);
    c.setThreshold(newThreshold)
    computeData();
    computeGains();
    tChart.update()
}

function setRatio() {
    newRatio = parseFloat(document.querySelector('#ratio').value);
    c.setRatio(newRatio);
    computeData();
    computeGains();
    tChart.update()
}

function setAttack() {
    newAttack = parseFloat(document.querySelector('#attack').value);
    c.setAttack(newAttack)
    computeData();
    computeGains();
    tChart.update()
}

function setRelease() {
    newRelease = parseFloat(document.querySelector('#release').value);
    c.setRelease(newRelease)
    computeData();
    computeGains();
    tChart.update()
}




let c = new Compressor(new LevelEstimator(fs));
computeData();
computeGains();








// data: lData,
// labels: xData,
