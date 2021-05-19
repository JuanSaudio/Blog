const verticalLinePlugin = {
    getLinePosition: function (chart, pointIndex) {
        const meta = chart.getDatasetMeta(0); // first dataset is used to discover X coordinate of a point
        const data = meta.data;
        return data[pointIndex]._model.x;
    },
    renderVerticalLine: function (chartInstance, pointIndex) {
        const lineLeftOffset = this.getLinePosition(chartInstance, pointIndex);
        const scale = chartInstance.scales['y-axis-0'];
        const context = chartInstance.chart.ctx;

        // render vertical line
        context.beginPath();
        context.strokeStyle = '#000000';
        context.moveTo(lineLeftOffset, scale.top);
        context.lineTo(lineLeftOffset, scale.bottom);
        context.stroke();
    },

    afterDatasetsDraw: function (chart, easing) {
        if (chart.config.lineAtIndex) {
            chart.config.lineAtIndex.forEach(pointIndex => this.renderVerticalLine(chart, pointIndex));
        }
    }
};
Chart.plugins.register(verticalLinePlugin);

const ctx1 = document.getElementById("timeChart").getContext('2d');
const ctx2 = document.getElementById("charFunc").getContext('2d');
const fs = 400;
const dur = 2;
const nVals = dur * fs - 1;
const nGVals = 21;

var lBefore = 0.01
var lDuring = 1
var lAfter = 0.01

const nData = [...Array(nVals).keys()];
const tData = nData.map(x => x / fs);
const xi = Array(nVals).fill(1);
const xData = tData.map(x => x < 0.5 || x > 1 ? lBefore : lDuring);
const lData = Array(nVals);
const gData = Array(nVals);
const yData = Array(nVals);
const thData = Array(nVals);
const tempPos = [200, 400];

const xVals = [...Array(nGVals).keys()].map(x => -x).reverse();
const yVals = [...Array(nGVals).keys()];

function mag2db(x) {
    return 20.0 * Math.log10(Math.abs(x));
}

function db2mag(x) {
    return 10**( x / 20.0);
}

class LevelEstimator {
    constructor(sampleRate) {
        if (this.constructor == LevelEstimator) {
            throw new Error("Abstract LevelEstimator class can't be instantiated.");
        }
        this.fs = sampleRate;
        this.s = 0.0;
        this.s2 = 0.0;
        this.b0Att = 1.0;
        this.b0Rel = 1.0;
    }

    setAttack(newAttack) {
        this.b0Att = 1.0 - Math.exp(-1.0 / (newAttack * this.fs / 1000));
    }

    setRelease(newRelease) {
        this.b0Rel = 1.0 - Math.exp(-1.0 / (newRelease * this.fs / 1000));
    }

    setLevel(newLevel) {
        this.s = newLevel;
    }

    getLevel() {
        return this.s;
    }

    clear() {
        this.s = 0.0;
    }

    process(x) {
        throw new Error("Pure Virtual Function Called.");
    }
};

class CoupledLevelEstimator extends LevelEstimator {
    process(x) {
        this.s = (1 - this.b0Rel) * this.s + this.b0Att * Math.max(x - this.s, 0)
        return this.s;
    }
}

class DecoupledLevelEstimator extends LevelEstimator {
    process(x) {
        this.s2 = Math.max(x, (1 - this.b0Rel) * this.s2)
        this.s += this.b0Att * (this.s2 - this.s)
        return x
    }
}

class DecoupledSmoothLevelEstimator extends LevelEstimator {
    process(x) {
        this.s2 = Math.max(x, (1 - this.b0Rel) * this.s2 + this.b0Rel * x)
        this.s += this.b0Att * (this.s2 - this.s)
        return x
    }
}

class BranchedLevelEstimator extends LevelEstimator {
    process(x) {
        if (x > this.s) {
            this.s += this.b0Att * (x - this.s)
        } else {
            this.s += -this.b0Rel * this.s
        }
        return this.s;
    }
}

class BranchedSmoothLevelEstimator extends LevelEstimator {
    process(x) {
        if (x > this.s) {
            this.s += this.b0Att * (x - this.s)
        } else {
            this.s += this.b0Rel * (x - this.s)
        }
        return this.s;
    }
}

class Compressor {
    constructor(levelEstimator) {
        if (this.constructor == Compressor) {
            throw new Error("Abstract Compressor class can't be instantiated.");
        }
        this.estimator = levelEstimator
        this.threshold = 0;
        this.ratio = 1;
        this.attack = 10;
        this.release = 100;
        this.gain = 1;
        this.bias = false;
        this.knee = 0;
        levelEstimator.setAttack(this.attack);
        levelEstimator.setRelease(this.release);
    }

    setParams(newThreshold, newRatio, newAttack, newRelease, newKnee, newBias) {
        this.setThreshold(newThreshold);
        this.setRatio(newRatio);
        this.setAttack(newAttack);
        this.setRelease(newRelease);
        this.setKnee(newKnee)
        this.setBias(newBias)
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

    setKnee(newKnee) {
        this.knee = newKnee;
    }

    setBias(newBias) {
        this.bias = newBias
    }

    clear() {
        this.estimator.clear()
    }

    computeGain(leveldB) {
        throw new Error("Pure Virtual Function Called.");
    }

    setLevel(newLevel) {
        this.estimator.setLevel(newLevel);
    }

    getLevel() {
        return this.estimator.getLevel()
    }

    getGain() {
        return this.gain;
    }

    process(x) {
        throw new Error("Pure Virtual Function Called.");
    }
}

class FFCompressor extends Compressor {
    computeGain(leveldB) {
        let gdB = 0
        if (leveldB > (this.threshold - this.knee/2) && (leveldB < this.threshold + this.knee/2)) {
            gdB = (leveldB - this.threshold + this.knee/2)**2 / (2 * this.knee)
        } else if (leveldB >= this.threshold + this.knee/2) {
            gdB = leveldB - this.threshold
        }
        gdB *= ( 1 / this.ratio - 1);
        return gdB
    }
}

class FBCompressor extends Compressor {
    computeGain(leveldB) {
        let gdB = 0
        if (leveldB > (this.threshold - this.knee/2) && (leveldB < this.threshold + this.knee/2)) {
            gdB = (leveldB - this.threshold + this.knee/2)**2 / (2 * this.knee)
        } else if (leveldB >= this.threshold + this.knee/2) {
            gdB = leveldB - this.threshold
        }
        gdB *= (1 - this.ratio)
        return gdB
    }
}

class FFSigEnvCompressor extends FFCompressor {
    process(x) {
        let l = Math.abs(x)
        if (this.bias) {
            l = Math.max(l, db2mag(this.threshold))
        }
        l = this.estimator.process(l);
        let gdB = this.computeGain(mag2db(l));
        this.gain = db2mag(gdB);
        return x * this.gain;
    }
}

class FFGainEnvCompressor extends FFCompressor {
    process(x) {
        let l = Math.abs(x);
        let gdB = this.computeGain(mag2db(l));
        this.gain = db2mag(gdB);
        this.gain = this.estimator.process(1 - this.gain);
        this.gain = 1 - this.gain;
        return x * this.gain;
    }
}

class FFdBGainEnvCompressor extends FFCompressor {
    process(x) {
        let l = Math.abs(x);
        let gdB = this.computeGain(mag2db(l));
        gdB = -this.estimator.process(-gdB);
        this.gain = db2mag(gdB);
        return x * this.gain;
    }
}

class FBSigEnvCompressor extends FBCompressor {
    process(x) {
        let y = x * this.gain;
        let l = Math.abs(y)
        if (this.bias) {
            l = Math.max(l, db2mag(this.threshold))
        }
        l = this.estimator.process(l);
        let gdB = this.computeGain(mag2db(Math.abs(l)));
        this.gain = db2mag(gdB);
        return y;
    }
}

class FBGainEnvCompressor extends FBCompressor {
    process(x) {
        let y = x * this.gain;
        let l = Math.abs(y)
        let gdB = this.computeGain(mag2db(l))
        this.gain = db2mag(gdB)
        this.gain = this.estimator.process(this.gain);
        return y
    }
}

class FBdBGainEnvCompressor extends FBCompressor {
    process(x) {
        let y = this.gain * x;
        let l = Math.abs(y);
        let gdB = this.computeGain(mag2db(l));
        gdB = - this.estimator.process(-gdB);
        this.gain = db2mag(gdB);
        return y;
    }
}

var gChart = new Chart(ctx2, {
    type: 'line',
    data: {
        labels: xVals,
        datasets: [{
            label: "Characteristic Function",
            data: yVals,
            lineTension: 0,
            borderColor: 'rgba(100, 100, 100, 0)'
        }]
    },
    options: {
        elements: {
            point:{
                radius: 0
            }
        },
        responsive:true,
        maintainAspectRatio: false,
        scales: {
            xAxes: [ {
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'InLevel'
                },
                ticks: {
                    max: 0,
                    min: -20,
                    stepSize: 2,
                    maxTicksLimit: 7
                }
            } ],
            yAxes: [ {
                display: true,
                ticks: {
                    max: 0,
                    min: -20,
                    stepSize: 4
                },
                scaleLabel: {
                    display: true,
                    labelString: 'OutLevel'
                }
            } ]
        }
    },
});
var tChart = new Chart(ctx1, {
    type: 'line',
    data: {
        labels: tData,
        datasets: [{
            label: "Gain",
            data: gData,
            fill: false,
            lineTension: 0,
            borderColor: 'rgba(0, 0, 255, 1)',
        },{
            label: "Level",
            data: lData,
            fill: false,
            lineTension: 0,
            borderColor: 'rgba(255, 0, 0, 1)',
        },{
            label: "Output",
            data: yData,
            fill: false,
            lineTension: 0,
            borderColor: 'rgba(255, 0, 255, 1)',
        },{
            label: "Input",
            data: xData,
            fill: false,
            lineTension: 0,
            borderColor: 'rgba(0, 255, 0, 1)',
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
    lineAtIndex: tempPos,
});
var c = new FFSigEnvCompressor(new CoupledLevelEstimator(fs));

function computeData() {
    c.clear();
    for (var i = 0; i < fs; i++) {
        c.process(xData[0]);
    }
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
    if (FFCompressor.prototype.isPrototypeOf(c)) {
        for (var i = 0; i < nGVals; i++) {
            xVals[i] = i - 20
            yVals[i] = xVals[i] + c.computeGain(xVals[i])
        }
    } else if (FBCompressor.prototype.isPrototypeOf(c)) {
        for (var i = 0; i < nGVals; i++) {
            xVals[i] = i - 20;
            yVals[i] = xVals[i] - c.computeGain(xVals[i])
        }
    }
    gChart.update()
}

function updateLevels() {
    for (var i = 0; i < nVals; i++) {
        if (tData[i] < 0.5) {
            xData[i] = lBefore * xi[i];
        } else if (tData[i] >= 0.5 && tData[i] <= 1) {
            xData[i] = lDuring * xi[i];
        } else {
            xData[i] = lAfter * xi[i];
        }
    }
    computeData();
}

function buildCompressor() {
    let feedType = document.querySelector('#Feed').value;
    let detectorType = document.querySelector('#Detector').value;
    let envelopeType = document.querySelector('#Envelope').value;

    let curThreshold = c.threshold;
    let curRatio = c.ratio;
    let curAttack = c.attack;
    let curRelease = c.release;
    let curBias = c.bias;
    let curKnee = c.knee;

    let l;
    if (detectorType == "Coupled") {
        l = new CoupledLevelEstimator(fs)
    } else if (detectorType == "Decoupled") {
        l = new DecoupledLevelEstimator(fs)
    } else if (detectorType == "DecoupledSmooth") {
        l = new DecoupledSmoothLevelEstimator(fs)
    } else if (detectorType == "Branched") {
        l = new BranchedLevelEstimator(fs)
    } else if (detectorType == "BranchedSmooth") {
        l = new BranchedSmoothLevelEstimator(fs)
    } else {
        throw new Error("Detector Type not recognized")
    }

    if (feedType == "Feedforward") {
        if (envelopeType == "Signal") {
            c = new FFSigEnvCompressor(l)
        } else if (envelopeType == "Gain") {
            c = new FFGainEnvCompressor(l)
        } else if (envelopeType == "GaindB") {
            c = new FFdBGainEnvCompressor(l)
        } else {
            throw new Error("Envelope Type not recognized")
        }
        gChart.options.scales.xAxes[0].scaleLabel.labelString = "InLevel"
        gChart.options.scales.yAxes[0].scaleLabel.labelString = "OutLevel"
    } else if (feedType == "Feedback") {
        if (envelopeType == "Signal") {
            c = new FBSigEnvCompressor(l)
        } else if (envelopeType == "Gain") {
            c = new FBGainEnvCompressor(l)
        } else if (envelopeType == "GaindB") {
            c = new FBdBGainEnvCompressor(l)
        } else {
            throw new Error("Envelope Type not recognized")
        }
        gChart.options.scales.xAxes[0].scaleLabel.labelString = "OutLevel"
        gChart.options.scales.yAxes[0].scaleLabel.labelString = "InLevel"
    } else {
        throw new Error("Feed Type not recognized")
    }

    c.setParams(curThreshold, curRatio, curAttack, curRelease, curKnee, curBias)

    computeData()
    computeGains()
}

function setLevelBefore() {
    lBefore = db2mag(parseFloat(document.querySelector('#levelBefore').value));
    updateLevels();
}

function setLevelDuring() {
    lDuring = db2mag(parseFloat(document.querySelector('#levelDuring').value));
    updateLevels();
}

function setLevelAfter() {
    lAfter = db2mag(parseFloat(document.querySelector('#levelAfter').value));
    updateLevels();
}

function setThreshold() {
    newThreshold = parseFloat(document.querySelector('#threshold').value);
    c.setThreshold(newThreshold)
    computeData();
    computeGains();
}

function setRatio() {
    newRatio = parseFloat(document.querySelector('#ratio').value);
    c.setRatio(newRatio);
    computeData();
    computeGains();
}

function setAttack() {
    newAttack = parseFloat(document.querySelector('#attack').value);
    c.setAttack(newAttack)
    tempPos[0] = Math.floor(Math.min(fs * (0.5 + newAttack / 1000), nVals - 1))
    computeData();
    computeGains();
}

function setRelease() {
    newRelease = parseFloat(document.querySelector('#release').value);
    c.setRelease(newRelease)
    tempPos[1] = Math.floor(Math.min(fs * (1 + newRelease / 1000), nVals - 1))
    computeData();
    computeGains();
}

function setKnee() {
    newKnee = parseFloat(document.querySelector('#knee').value);
    c.setKnee(newKnee);
    computeData();
    computeGains();
}

function setFeedType() {
    buildCompressor()
}

function setDetectorType() {
    buildCompressor()
}

function setEnvelopeType() {
    buildCompressor()
}

function setBiasType() {
    let biasType = document.querySelector('#Bias').value;
    if (biasType == "ToThreshold") {
        c.setBias(true)
    } else if (biasType == "NoBias") {
        c.setBias(false)
    } else {
        throw new Error("Bias Type not recognized")
    }
    computeData();
}

function setSignalType() {
    let sigType = document.querySelector('#Signal').value;
    if (sigType == "dc") {
        for (var i = 0; i < nVals; i++) {
            xi[i] = 1
        }
    } else if (sigType == "80Hz") {
        for (var i = 0; i < nVals; i++) {
            xi[i] = Math.sin(2.0 * Math.PI * tData[i] * 80.0)
        }
    } else {
        for (var i = 0; i < nVals; i++) {
            xi[i] = Math.random() * 2 - 1;
        }
    }
    updateLevels();
}

computeData();
computeGains();
