function gaussianRand() {
    var rand = 0;
    let nVals = 8;
    for (var i = 0; i < nVals; i += 1) {
        rand += Math.random();
    }
    rand = (2 * rand - nVals) / (4 * Math.sqrt(2))
    return rand;
}

function db2mag(db) {
    return Math.pow(10.0, db / 20.0)
}

const ctx = document.getElementById("SignalPlusNoise").getContext('2d');

const N = 2 ** 10;
const n = [...Array(N).keys()];
const x = n.map(n => Math.sin(2.0 * Math.PI * n / N));
const y = n.map(x => gaussianRand())
const z = Array(N).fill(0);
var snr = 0
var signalLevel = 0;
var noiseLevel = -20;

var chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: n,
        datasets: [{
            label: "SNR",
            data: z,
            lineTension: 1,
            pointRadius: 0,
            borderColor: 'rgba(100, 100, 100, 100)'
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                min: -1,
                max: 1,
            }
        }
    }
});

function computeData() {
    for (var i = 0; i < N; i++) {
        z[i] = db2mag(signalLevel) * x[i] + db2mag(noiseLevel) * y[i]
    }
    chart.update();
}
computeData()

/////////////////////////////////////////////////////////////////

function setSignalLevel() {
    signalLevel = parseInt(document.querySelector('#signal').value);
    snr = signalLevel - noiseLevel;
    computeData();
}
function setNoiseLevel() {
    noiseLevel = parseInt(document.querySelector('#noise').value);
    snr = signalLevel - noiseLevel;
    computeData();
}
