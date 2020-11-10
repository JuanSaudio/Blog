import("stdfaust.lib");

rel = hslider("Release",100,10,1000,1) / 1000;
att = hslider("Attack",10,1,100,1) / 1000;
// process = no.noise : an.amp_follower(rel) : _ * 0.00000001;
// process = no.noise : an.amp_follower_ud(att, rel) : _ * 0.0001;
// process = no.noise : an.amp_follower_ar(att, rel): _ * 0.0001;
process = no.noise : an.zcr(att) : _ 0.00001;
