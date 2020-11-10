import("stdfaust.lib");



process = no.noise <: _, fi.lowpass(2, 500) ;
