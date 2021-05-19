import("stdfaust.lib");

eGroup(x) = hgroup("Envelope Follower", x);
inGroup(x) = eGroup(vgroup("[0]Input", x));
inGain = inGroup(hslider("[0]InGain[style:knob]",0,-20,0,1) : ba.db2linear : si.smoo);
outGain = inGroup(hslider("[1]OutGain[style:knob]",-20,-20,0,1) : ba.db2linear : _ * outGate: si.smoo);
outGate = checkbox("[2]Out Gate");
freq = inGroup(hslider("[3]Freq[scale:log][style:knob]",100,1,1000,1));
sigType = inGroup(nentry("[4]Signal[style:menu{'DC':0;'Osc':1;'Noise':2}]", 0, 0, 2, 1));

efGroup(x) = eGroup(vgroup("[1]Time Parameters", x));
att = efGroup(hslider("[0]Attack",10,1,200,1) / 1000);
rel = efGroup(hslider("[1]Release",100,1,1000,10) / 1000);
envType = efGroup(nentry("[2]EnvelopeFollower[style:menu{'Coupled':0;'Peak Detector':1;'Decoupled1':2;'Decoupled2':3;'Branched1':4;'Branched2':5;'PassThru':6}]", 0, 0, 6, 1));

trigger = (envo - envo') > 0 : _ -0.5 : de.delay(ba.sec2samp(0.9), ma.SR);
envo = os.lf_pulsetrain(1/1, 1/5) + 1 : _ /2;
xo = dc, sinusoid, noise : ba.selectn(3, sigType) with {
    dc = 1;
    sinusoid = os.hs_oscsin(freq, trigger);
    noise = no.noise;
};

env = (inGain - outGain) * envo + outGain;
x = xo * env;

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
peak = an.amp_follower(rel);
branched1 = an.amp_follower_ar(att, rel);

branched2 = y with {
    aR = ba.tau2pole(rel);
    aA = ba.tau2pole(att);

    y = _ <: (((> <: _, _),aA,aR:_, select2), _ : smoother) ~ _;
    smoother(isA, s) = *(1.0 - s)*(1-isA) : + ~ *(s);
};

magdB = _ : ba.linear2db + 10 : _ / 10 : max(-1);
outputFormatter(y) =    x,
                        magdB(x),
                        y,
                        magdB(y),
                        0,
                        0,
                        0,
                        0,
                        0,
                        0, 
                        trigger;

process = x : abs <:  coupled,
                peak,
                decoupled1,
                decoupled2,
                branched1,
                branched2,
                _ :
                ba.selectn(7, envType) : outputFormatter;
