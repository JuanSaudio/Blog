import("stdfaust.lib");

threshold = hslider("threshold",-10,-20,0,1);
thresholdMag = ba.db2linear(threshold);
ratio = hslider("ratio", 10/4, 1, 10, 0.1);
attTime = hslider("Attack",10,1,200,1) / 1000;
relTime = hslider("Release",100,10,1000,10) / 1000;
inGain = hslider("InGain",0,-20,0,1) : ba.db2linear;
outGain = hslider("OutGain",-20,-20,0,1) : ba.db2linear;
knee = hslider("Knee",0,0,10,1);
phaseOffset = nentry("samps", 1, 1, 1000, 1);
makeUpGain = hslider("makeUpGain",0,-6,6,1) : ba.db2linear;

// gainComputer = _ : max(_ - threshold, 0) * (1 / ratio - 1);

gainComputer(level) = select3(caseSelector, case0, case1, case2) : max(0) * (1 / ratio - 1) with {
    caseSelector = (level > (threshold-(knee/2))) + (level >(threshold+(knee/2)));
    case0 = 0;
    case1 = (level-threshold+(knee/2)) : pow(2)/(2*knee);
    case2 = level-threshold;
};


envo = os.lf_pulsetrain(1/1, 1/5) + 1 : _ /2;
trigger = (envo - envo') > 0 : _ -0.5 : de.delay(9 * 48000/10 - 32, ma.SR);
env = (inGain - outGain) * envo + outGain;
xo = 1;
// xo = os.hs_oscsin(48, (trigger : de.delay(300, 1000))) : _ * -1;
// xo = os.osc(22000);
// xo = os.hs_oscsin(22000, trigger);
// xo = no.noise;
x = xo * env;
// cv = x : an.amp_follower(relTime);
// cv = x : an.amp_follower_ud(attTime, relTime);
cv = max(x, ba.db2linear(threshold - knee/2)) : an.amp_follower_ud(attTime, relTime);
// cv = x : an.amp_follower_ar(attTime, relTime);
// cv = max(abs(x), ba.db2linear(threshold - knee/2)) : an.amp_follower_ar(attTime, relTime);
// cv = abs(x);
// gain = cv : ba.linear2db : gainComputer : _ * -1 : an.amp_follower_ud(attTime, relTime) * -1 : ba.db2linear : fi.lowpass(4, 100);
// gain = cv : ba.linear2db : gainComputer : ba.db2linear;
// gain = cv : ba.linear2db : gainComputer : ba.db2linear : si.smooth(ba.tau2pole(0.001));
gain = cv : ba.linear2db : gainComputer : ba.db2linear : fi.lowpass(8, 100);
compTarget = inGain : ba.linear2db : gainComputer : ba.db2linear;
y = x * gain;



process = trigger, thresholdMag, compTarget, cv, gain, y * makeUpGain, x, env;
