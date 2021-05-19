import("stdfaust.lib");


//=================================== GUI ====================================//

cGroup(x) = hgroup("Compressor", x);

inGroup(x) = cGroup(vgroup("[0]Input", x));
inGain = inGroup(hslider("[0]InGain[style:knob]",0,-20,0,1) : ba.db2linear : si.smoo);
outGain = inGroup(hslider("[1]OutGain[style:knob]",-20,-20,0,1) : ba.db2linear : _ * outGate: si.smoo);
outGate = checkbox("[2]Out Gate");
freq = inGroup(hslider("[3]Freq[scale:log][style:knob]",100,1,1000,1));
sigType = inGroup(nentry("[4]Signal[style:menu{'DC':0;'Osc':1;'Noise':2}]", 0, 0, 2, 1));

scGroup(x) = cGroup(hgroup("[1]SideChain", x));
tGroup(x) = scGroup(vgroup("[0]Types", x));
rectType = tGroup(nentry("[0]Rectifier[style:menu{'half':0;'full':1}]", 0, 0, 1, 1));
scType = tGroup(nentry("[1]SideChain[style:menu{'EnvGain':0;'GainEnv':1}]", 0, 0, 1, 1));
shouldBias = tGroup(nentry("[2]Bias[style:menu{'Off':0;'On':1}]", 0, 0, 1, 1));

efGroup(x) = scGroup(vgroup("[1]Envelope Follower", x));
att = efGroup(hslider("[0]Attack",10,1,200,1) / 1000);
rel = efGroup(hslider("[1]Release",100,1,1000,10) / 1000);
efOrder = efGroup(nentry("[2]Order[style:menu{'Single':0;'Squared':1;'HighOrder':2}]", 0, 0, 2, 1));
p = 1, 2, 10 : select3(efOrder);
envType = efGroup(nentry("[2]EnvelopeFollower[style:menu{'Coupled':0;'Decoupled1':1;'Decoupled2':2;'Branched1':3;'Branched2':4;'PassThru':5}]", 3, 0, 5, 1));

gcGroup(x) = scGroup(vgroup("[2]Gain Computer", x));
threshold = gcGroup(vslider("[0]threshold[style:knob]",-10,-20,0,1) : si.smoo);
ratio = gcGroup(vslider("[1]Ratio[style:knob]",2,1,10,0.1) : si.smoo);
knee = gcGroup(vslider("[2]Knee[style:knob]",0,0,10,1));
shouldFilter = gcGroup(checkbox("[3]Filter"));

thMag = ba.db2linear(threshold);

//=================================== DSP ====================================//

envo = os.lf_pulsetrain(1/1, 1/5) + 1 : _ /2;
xo = dc, sinusoid, noise : ba.selectn(3, sigType) with {
    dc = 1;
    sinusoid = os.hs_oscsin(freq, trigger);
    noise = no.noise;
};

env = (inGain - outGain) * envo + outGain;
x = xo * env;

compressor = _ <: _, sideChain : * , _ , _ ;
rectifier = _ <: halfWave, fullWave : select2(rectType) : ba.bypass1(1 - shouldBias, max(ba.db2linear(threshold))) with {
    halfWave = max(0);
    fullWave = abs : max(0);
};

sideChain = _ <: envelopeGain, gainEnvelope : sideChainSelector with {
    gainEnvelope = _ : rectifier : (gainComputer <: _, _) : (envelopeFollower <: _, _ ), _;
    envelopeGain = _ : rectifier : (envelopeFollower <: _, _) : (gainComputer <: _ , _), _;
    sideChainSelector = ro.interleave(3, 2) : par(i, 3, select2(scType));
};

envelopeFollower = _ : pow(p) <: coupled, decoupled1, decoupled2, branched1, branched2, passThru : ba.selectn(6, envType) : pow(1/p) with {

    coupled = y with {
        aR = ba.tau2pole(rel);
        aA = ba.tau2pole(att);
        y(x) = (_ <: (1 - aA) * max(x - _, 0), aR * _ : +) ~ _;
    };

    decoupled1 = y with {
        aR = ba.tau2pole(rel);
        aA = ba.tau2pole(att);
        y(x) = (max(x, _ * aR) ~ _) : _ : si.smooth(aA);
    };

    decoupled2 = an.amp_follower_ud(att, rel);

    branched1 = an.amp_follower_ar(att, rel);

    branched2 = y with {
        aR = ba.tau2pole(rel);
        aA = ba.tau2pole(att);

        y = _ <: (((> <: _, _),aA,aR:_, select2), _ : smoother) ~ _;
        smoother(isA, s) = *(1.0 - s)*(1-isA) : + ~ *(s);
    };

    passThru = _;
};

gainComputer = ba.linear2db : levelDistance : _ * compFraction : ba.db2linear : LPF with {
    LPF = ba.bypass1(1 - shouldFilter, fi.lowpass(4, 100));
    compFraction = (1 / ratio - 1);
    levelDistance(l) = select3(cases, below, at, over) with {
        cases = (l > threshold - knee/2) + (l > threshold + knee/2);
        below = 0;
        at = (l - threshold + (knee/2)) : pow(2)/(2*knee);
        over = l - threshold;
    };
};

trigger = (envo - envo') > 0 : _ -0.5 : de.delay(ba.sec2samp(0.9), ma.SR);
marker = attMarker + relMarker with {
    attMarker = (envo - envo') > 0 : de.delay(ba.sec2samp(att), ma.SR);
    relMarker = (envo - envo') < 0 : de.delay(ba.sec2samp(rel), ma.SR);
};


magdB = _ : ba.linear2db + 10 : _ / 10 : max(-1);
outputFormatter(y, g, e) =  x,        //1
                            magdB(x), //2
                            y,        //3
                            magdB(y), //4
                            g,        //5
                            magdB(g), //6
                            e,        //7
                            magdB(e), //8
                            thMag,    //9
                            marker,   //10
                            trigger;  //11

process = x : compressor : outputFormatter;
