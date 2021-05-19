import("stdfaust.lib");

rmsEst = _ <: * : si.smooth(ba.tau2pole(1)) : sqrt : ba.linear2db;
oscRmsMeter =  _ <: attach(_, vbargraph("Osc RMS[unit:dB]", -30, 6));
noiseRmsMeter =  _ <: attach(_, vbargraph("Noise RMS[unit:dB]", -30, 6));
snrMeter =  _ <: attach(_, vbargraph("SNR", -40, 40));

oscGain = vslider("[1]Gain", 0, -40, 0, 1) : ba.db2linear : si.smoo;
noiseGain = vslider("[1]Gain", 0, -40, 0, 1) : ba.db2linear : si.smoo;
outGain = vslider("[3]Out Gain", -20, -60, 0, 1) : ba.db2linear : si.smoo;
oscGate = checkbox("[2]On") : si.smoo;
noiseGate = checkbox("[2]On") : si.smoo;

source1 = vgroup("Osc", os.osc(1000) * oscGain * oscGate * ba.db2linear(3));
source2 = vgroup("Noise", no.pink_noise * ba.db2linear(26) * noiseGain * noiseGate);

analyzer = _, _ <: si.bus(4) : + , rmsEst, rmsEst : _, oscRmsMeter, noiseRmsMeter : _, - : _, snrMeter : attach(_, _);

process = hgroup("SNR Test", source1, source2 : analyzer : _ * outGain);
