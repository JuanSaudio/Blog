import("stdfaust.lib");

inGroup(x) = vgroup("[0]Input", x);
inGain = inGroup(hslider("[0]InGain[style:knob]",0,-20,0,1) : ba.db2linear : si.smoo);
outGain = inGroup(hslider("[1]OutGain[style:knob]",-20,-20,0,1) : ba.db2linear : _ * outGate: si.smoo);
outGate = checkbox("[2]Out Gate");
freq = inGroup(hslider("[3]Freq[scale:log][style:knob]",100,1,1000,1));
sigType = inGroup(nentry("[4]Signal[style:menu{'DC':0;'fs':1;'Osc':2;'Noise':3}]", 0, 0, 3, 1));
trigger = (envo - envo') > 0 : _ -0.5 : de.delay(ba.sec2samp(0.9), ma.SR);
envo = os.lf_pulsetrain(1/1, 1/5) + 1 : _ /2;
xo = dc, fs, sinusoid, noise : ba.selectn(4, sigType) with {
    dc = 1;
    fs = pow(-1, ba.time);
    sinusoid = os.hs_oscsin(freq, trigger);
    noise = no.noise;
};

env = (inGain - outGain) * envo + outGain;
x = xo * env;

outputFormatter(a) = 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, trigger, a, 1;

process = x : outputFormatter;
