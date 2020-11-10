import("stdfaust.lib");

inGain = hslider("[1]InGain",0,-20,0,1) : ba.db2linear;
threshold = hslider("[2]threshold",-10,-20,0,1);
ratio = hslider("[3]ratio",2,1,10,1);
outGain = hslider("[4]OutGain",0,-10,10,1) : ba.db2linear;

gainComputer = _ : abs : ba.linear2db : max( _ - threshold, 0) * (1 / ratio - 1) : ba.db2linear;
dynProcessor = _ <: _ , gainComputer : * : _ ;

env = os.lf_pulsetrainpos(1/2, 0.25);
xo = os.osc(5);
x = xo * env * inGain;
y = x : dynProcessor;

process = x, y, ba.db2linear(threshold);
