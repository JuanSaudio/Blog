function mrQuantizeUniform(aNum, nBits) {
// Uniformly mid rise quantize signed fraction aNum with nBits
// Notes:The overload level of the quantizer should be 1.0
    var code
    if (Math.abs(aNum) >= 1) {
        code = 2**(nBits - 1) - 1;
    } else {
        code = Math.floor(2**(nBits - 1) * Math.abs(aNum));
    }
        
    if(aNum >= 0){
        return Math.floor(code);
    } else {
        return Math.floor(code + 2**(nBits-1));
    }
}
          
function mrDequantizeUniform(aQuantizedNum, nBits) {
//Uniformly mid rise dequantizes nBits-long number aQuantizedNum 
//into a signed fraction
    var sign = 1
    if (aQuantizedNum >> (nBits - 1)){
        sign = -1;
    }
            
    if (sign == -1) {
        aNum = sign * Math.abs(aQuantizedNum - 2**(nBits-1) + 0.5) / (2**(nBits-1));
    } else {
        aNum = sign * Math.abs(aQuantizedNum + 0.5) / (2**(nBits-1));
    }
        
    return aNum
}

function mtQuantizeUniform(aNum,nBits) {
//Uniformly quantize signed fraction aNum with nBits
//Notes:The overload level of the quantizer should be 1.0    
    var s = 1;
    if(aNum >= 0){
        s = 0;
    }
        
    var code
    if(Math.abs(aNum) >= 1){
        code = 2**(nBits-1)-1;
    } else {
        code = Math.floor(((2**(nBits)-1) * Math.abs(aNum) + 1 ) / 2);
    }
        
    if(s == 0) {
        return Math.floor(code);
    } else {
        return Math.floor(code + 2**(nBits-1));
    }
}

function mtDequantizeUniform(aQuantizedNum,nBits) {
    //Uniformly dequantizes nBits-long number aQuantizedNum 
    //into a signed fraction
    var sign = 1
    if (aQuantizedNum>>(nBits-1)){
        sign = -1;
    }
    
    if (sign == -1){
        aNum = sign * 2 * Math.abs(aQuantizedNum - 2**(nBits - 1)) / (2**nBits - 1); 
    } else {
        aNum = sign * 2 * Math.abs(aQuantizedNum) / (2**nBits - 1);
    }
    return aNum;
}

const ctx = document.getElementById("Uncertainty").getContext('2d');

var nBits = 1;
const nVals = 2**10;
const nData = [...Array(nVals).keys()];
const xData = nData.map(x => (x - nVals/2) / (nVals/2));
const qData = Array(nVals).fill(0);
const yData = Array(nVals).fill(0);
var quantizerType = 0;
var zoom = 1;
var x0 = 0.876;
var q0;
var y0;

var chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: xData,
        datasets: [{
            label: "Uniform Quantizer",
            data: yData,
            lineTension: 0,
            showLine: false,
            borderColor: 'rgba(100, 100, 100, 100)'
        }, 
        {
            label: "Uniform Quantizer",
            data: yData,
            lineTension: 0,
            showLine: false,
            borderColor: 'rgba(100, 100, 100, 100)'
        }]
        
    },
    options: {
        elements: {
            point:{
                radius: 1
            }
        },
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                min: -1,
                max: 1,
                ticks: {
                    display: true,
                    min: -1,
                    max: 1,
                    stepSize: 0.25,
                    callback: function(value, index, values) { return value; }                    
                }
            },
            x: {
                min: -1,
                max: 1024,
                ticks: {
                    display: true,
                    min: -1,
                    max: 1,
                    stepSize: 0.25,
                    callback: function(value, index, values) {
                        if (index == 1023) return 1
                        return index % 2**7 === 0 ? this.getLabelForValue(value) : undefined;
                    }                    
                }
            }
        }
    },
});

function computeData() {
    if (quantizerType == 0) {
        for (var i = 0; i < nVals; i++) {
            qData[i] = mrQuantizeUniform(xData[i], nBits);
            yData[i] = mrDequantizeUniform(qData[i], nBits);
        }
    } else {
        for (var i = 0; i < nVals; i++) {
            qData[i] = mtQuantizeUniform(xData[i], nBits);
            yData[i] = mtDequantizeUniform(qData[i], nBits);
        }
    }
    chart.update()
}
computeData()


////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////

function setBitDepth() {
    nBits = parseInt(document.querySelector('#bitDepth').value);
    computeData();
}

function setQuantizerType() {
    quantizerType = parseInt(document.querySelector('#quantizerType').value);
    computeData();
}

function setZoom() {
    zoom = parseInt(document.querySelector('#zoom').value);
    computeData();
}