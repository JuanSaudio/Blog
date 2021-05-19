import("stdfaust.lib");

// dist(i) = _ <: *, _ : _ * isOn, _ : + : fi.dcblocker with {
//     isOn = checkbox("On %i");
// };

dist(i) = ba.bypass1(isOn, _ : _^3.0 : _) with {
    isOn = checkbox("On %i");
};

src(i) = vgroup("Src %i", os.osc(freq) * gain * gate) with {
    freq = hslider("Freq %i[scale:log]",1000,10,47000,1) : si.smoo;
    gain = hslider("Gain %i", -12, -120, 0, 0.1) : si.smoo : ba.db2linear;
    gate = checkbox("Gate %i");
};



filt(i) = vgroup("Filter", ba.bypass1(bp, fi.lowpass6e(freq))) with {
    bp = checkbox("Bypass");
    freq = hslider("Freq %i[scale:log]",1000,10,47000,1) : si.smoo;
};

outGain = hslider("Master", -12, -120, 0, 0.1) : si.smoo : ba.db2linear;

process = hgroup("Test", par(i, 3, vgroup("DST %i", src(i) : dist(i) : filt(i))) :> dist(100) : dist(101)) : _ * outGain;
