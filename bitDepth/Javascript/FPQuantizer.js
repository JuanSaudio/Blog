function QuantizeUniform(aNum,nBits){ 
//Uniformly quantize signed fraction aNum with nBits
//Notes:The overload level of the quantizer should be 1.0
    var s = 1;
    if (aNum >= 0) {
        s = 0;
    }

    var code
    if (Math.abs(aNum) >= 1) {
        code = 2**(nBits-1) - 1
    } else {
        code = Math.floor(((2**(nBits)-1) * Math.abs(aNum) + 1) / 2)
    }

    if (s == 0) {
       return Math.floor(code)
    } else {
       return Math.floor(code + 2**(nBits-1))
    }
}
   
function DequantizeUniform(aQuantizedNum,nBits) {
    //Uniformly dequantizes nBits-long number aQuantizedNum 
    //into a signed fraction
    var sign = 1
    if (aQuantizedNum >> (nBits - 1)) {
        sign = -1
    }

    if (sign == -1) {
        aNum = sign * 2 * Math.abs(aQuantizedNum - 2**(nBits-1)) / (2**nBits - 1);
    } else {
        aNum = sign * 2 * Math.abs(aQuantizedNum) / (2**nBits - 1) 
    }
    return aNum
}

function ScaleFactor(aNum, nScaleBits, nMantBits) {
    // Return the floating-point scale factor for a  signed 
    // fraction aNum given nScaleBits scale bits and nMantBits mantissa bits  
    //Notes:
    //The scale factor should be the number of leading zeros
    
    if (nScaleBits < 0) { 
        nScaleBits = 0; 
    }
    if (nMantBits <= 0) { 
        // 0 mantissa bits returns 0
        return 0;  
    }       
    
    var maxScale= 2**nScaleBits - 1    // max leading 0s scale can id
    var maxBits = maxScale + nMantBits    // max bits equiv to this FP rep
    var signBit = 2**(maxBits - 1)    // the location of the sign bit in the Uni Q num
    
    
    // Uniformly quantize magnitude using maxBits and left shift away sign bit
    var code = QuantizeUniform(Math.abs(aNum), maxBits)
    code = code << 1
    
    // get Scale by shifting left till you hit a 1
    var scale = 0
    while (scale < maxScale && (signBit & code) == 0) {
        code <<= 1
        scale += 1
    }
    
    return scale
}

function MantissaFP(aNum, scale, nScaleBits, nMantBits) {
    // Return the floating-point mantissa for a  signed fraction 
    // aNum given nScaleBits scale bits and nMantBits mantissa bits
    if (nMantBits <= 0) { 
        return 0; 
    }
    if (nScaleBits < 0) { 
        nScaleBits = 0; 
    }
        
    var maxScale = 2**nScaleBits - 1;
    var maxBits = maxScale + nMantBits;
    var signBit = 2**(maxBits - 1);
    
    // Extract sign
    var sign = 0;
    if (aNum < 0) {
        sign = 1;
        aNum = -aNum;
    }

    // Compute unsigned code using maxBits uniform quantization
    var code = QuantizeUniform(aNum, maxBits)
    // extract the mantissa: shift left by scale factor and sign (remove leading 0)
    code <<= (scale + 1)
    // remove leading 1 (if we know it is there) and shfit Left on emore time
    if (scale < maxScale) {
        code -= (1 << (maxBits - 1));
        code <<= 1;
    }

    // move bits starting at maxBits down to loest nMantBits - 1
    code >>= (maxBits - nMantBits + 1)
    // add sign to the front of the code
    if (sign) { 
        code += signBit; 
    }
        
    return code
}

function DequantizeFP(scale, mantissa, nScaleBits, nMantBits) {
    // Returns a signed fraction for floating point scale and mantissa given
    // Specified scale and mantissa bits
    // zero mantissa bits means zero
    if (nMantBits <= 0) { 
        return 0; 
    }
    if (nScaleBits < 0) { 
        nScaleBits = 0; 
    }
        
    var maxScale = (1 << nScaleBits ) - 1;
    var maxBits = maxScale + nMantBits;
    var signBit = (1 << (nMantBits - 1));
    
    var sign = 0;
    if (mantissa & signBit) {
        sign = 1;
        mantissa -= signBit;
    }
    
    if (scale < maxScale) {
        mantissa = mantissa + (1 << (nMantBits - 1));
    }
        
    if (scale < (maxScale - 1)) {
        mantissa = (mantissa << 1) + 1;
        mantissa <<= (maxScale - scale - 2);
    }
    
    if (sign) {
        signBit = (1 << (maxBits - 1));
        mantissa += signBit;
    }
        
    return DequantizeUniform(mantissa, maxBits)
}

    
const ctx = document.getElementById("Quantization").getContext('2d');

var nScaleBits = 2;
var nMantBits = 4;
const nVals = 2**12; 
const nData = [...Array(nVals).keys()];
const xData = nData.map(x => 2 * (x - nVals/2) / (nVals/2));
const yData = Array(nVals).fill(0);
const sData = Array(nVals).fill(0);
const mData = Array(nVals).fill(0);

// console.log("Scale Factor") 
// console.log(s0)
// console.log("Mantissa") 
// console.log(m0)

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
                // min: -1,
                // max: 1,
                // ticks: {
                //     display: true,
                //     min: -1,
                //     max: 1,
                //     stepSize: 0.25,
                //     callback: function(value, index, values) { return value; }                    
                // }
            },
            x: {
                // min: -1,
                // max: 1024,
                // ticks: {
                //     display: true,
                //     min: -1,
                //     max: 1,
                //     stepSize: 0.25,
                //     callback: function(value, index, values) {
                //         if (index == 1023) return 1
                //         return index % 2**7 === 0 ? this.getLabelForValue(value) : undefined;
                //     }                    
                // }
            }
        }
    },
});

function computeData() {
    for (var i = 0; i < nVals; i++) {
        sData[i] = ScaleFactor(xData[i], nScaleBits, nMantBits);
        mData[i] = MantissaFP(xData[i], nScaleBits, nMantBits);
        yData[i] = DequantizeFP(sData[i], mData[i], nScaleBits, nMantBits);
    }
    chart.update()
}
computeData()


////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////

function setScaleBitDepth() {
    nScaleBits = parseInt(document.querySelector('#scaleBitDepth').value);
    computeData();
}

function setMantBitDepth() {
    nMantBits = parseInt(document.querySelector('#mantBitDepth').value);
    computeData();
}