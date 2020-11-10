import("stdfaust.lib");


threshold = hslider("threshold",-10,-20,0,1);
ratio = hslider("ratio", 10/4, 1, 10, 0.1);
attTime = hslider("Attack",10,1,200,1) / 1000;
relTime = hslider("Release",100,10,1000,10) / 1000;

envelopeFollower = _ : an.amp_follower_ud(attTime, relTime) : _ ;
gainComputer = _ : ba.linear2db : max( _ - threshold, 0) * (1 / ratio - 1) : ba.db2linear;
sideChain = _ : envelopeFollower : gainComputer : _;
compressor = _ <: sideChain , _ : * : _;

process = compressor, envelopeFollower, gainComputer;
