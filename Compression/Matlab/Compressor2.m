classdef Compressor2 < handle
    properties (Access = public)
        threshold {mustBeNumeric}
        ratio {mustBeNumeric}
        attack {mustBeNumeric}
        release {mustBeNumeric}
        fs {mustBeNumeric}
    end
    
    properties (Access = private)
        thresholdMag
        gain
        level
        b0Att
        b0Rel
    end
    
    methods
        function obj = Compressor2(sampleRate)
            obj.fs = sampleRate;
            obj.level = 0;
            obj.gain = 1;
        end
        function setParameters(obj, threshold, ratio, attack, release)
            obj.setThreshold(threshold);
            obj.setRatio(ratio)
            obj.setAttack(attack);
            obj.setRelease(release);
        end
        
        function setThreshold(obj, threshold)
            obj.threshold = threshold;
            obj.thresholdMag = db2mag(threshold);
            obj.level = obj.thresholdMag;
        end
        
        function setRatio(obj, ratio)
            obj.ratio = ratio;
        end
        
        function setAttack(obj, attack)
            obj.attack = attack;
            obj.b0Att = 1 - exp(-1 / (attack * obj.fs));
        end
        
        function setRelease(obj, release)
            obj.release = release;
            obj.b0Rel = 1 - exp(-1 / (release * obj.fs));
        end
        
        function y = process(obj, xi)
            obj.computeSideChain(xi);
            y = xi * obj.gain;
        end
        
        function computeSideChain(obj, xi)
            obj.estimateLevel(xi);
            obj.computeGain();
        end
        
        function estimateLevel(obj, xi)
            if (abs(xi) > obj.thresholdMag)
                obj.level = obj.level + obj.b0Att * (abs(xi) - obj.level);
            else
                obj.level = obj.level + obj.b0Rel * (obj.thresholdMag - obj.level);
            end
        end
        
        function computeGain(obj)
            ldB = mag2db(obj.level);
            gdB = max(ldB - obj.threshold, 0) * (1 / obj.ratio - 1);
            obj.gain = db2mag(gdB);
        end
        
        function reset(obj)
            obj.level = 0;
        end
        
        function s = getLevel(obj)
            s = obj.level;
        end
    end
end


    