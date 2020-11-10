classdef LevelEstimator < handle
    properties
        b0Att
        b0Rel
        fs
        s
    end
    methods
        function obj = LevelEstimator(attackTime, releaseTime, sampleRate)
            obj.fs = sampleRate;
            obj.setAttack(attackTime);
            obj.setRelease(releaseTime);
            obj.s = 0;
        end
        
        function setAttack(obj, attackTime)
            obj.b0Att = 1 - exp(-1 / (attackTime * obj.fs));
        end
        
        function setRelease(obj, releaseTime)
            obj.b0Rel = 1 - exp(-1 / (releaseTime * obj.fs));
        end
        
        function reset(obj)
            obj.s = 0;
        end
        
        function l = process(obj, x)
            if (abs(x) > obj.s)
                obj.s = obj.s + obj.b0Att * (abs(x) - obj.s);
            else
                obj.s = obj.s + obj.b0Rel * (abs(x) - obj.s);
            end
            l = obj.s;
        end
    end
end