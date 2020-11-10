#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Mon Nov  2 13:32:05 2020

@author: juans
"""


import numpy as np
import matplotlib.pyplot as plt


def mag2db(x):
    y = 20 * np.log10( np.abs( x ) + np.finfo(float).eps )
    return y
    
def db2mag(x):
    y = 10.0**(x / 20)
    return y 

class LevelEstimator:
    def __init__(self, sampleRate):
        self.b0Att = 1
        self.b0Rel = 1
        self.state = 0
        self.fs = sampleRate
        
    def setParams(self, attack, release):
        self.setAttack(attack)
        self.setRelease(release)
        
    def setAttack(self, attack):
        self.b0Att = 1 - np.exp(-1 / (attack * self.fs))
    
    def setRelease(self, release):
        self.b0Rel = 1 - np.exp(-1 / (release * self.fs))
    
    def process(self, x):
        pass
    
    def getState(self):
        return self.state
    
    def setState(self, newState):
        self.state = newState
        
class DecoupledLevelEstimator(LevelEstimator):
    def process(self, x):
        if x > self.state:
            self.state += self.b0Att * (x - self.state)
        else:
            self.state += self.b0Rel * (x - self.state)
        return self.state

class CoupledLevelEstimator(LevelEstimator):
    def process(self, x):
        self.state = (1 - self.b0Rel) * self.state + self.b0Att * np.max((x - self.state, 0))
        return self.state

class BranchedLevelEstimator(LevelEstimator):
    def process(self, x):
        if x > self.state:
            self.state += self.b0Att * (x - self.state)
        else:
            self.state += -self.b0Rel * self.state
        return self.state
            
        
class Compressor:
    def __init__(self, levelEstimator):
        self.levelEstimator = levelEstimator
        self.gain = 1
        self.setParams()
        
    def setParams(self, threshold=0, ratio=1, attack=10/1000, release=100/1000, knee=0, bias=0):
        self.setThreshold(threshold)
        self.setRatio(ratio)
        self.setAttack(attack)
        self.setRelease(release)
        self.setKnee(knee)
        self.setBias(bias)
        
    def setThreshold(self, threshold):
        self.threshold = threshold
        
    def setRatio(self, ratio):
        self.ratio = ratio
    
    def setAttack(self, attack):
        self.attack = attack
        self.levelEstimator.setAttack(attack)
        
    def setRelease(self, release):
        self.release = release
        self.levelEstimator.setRelease(release)
        
    def setKnee(self, knee):
        self.knee = knee
        
    def setBias(self, bias):
        self.bias = bias
        self.levelEstimator.setState(self.bias)
        
    def getLevel(self):
        return self.levelEstimator.getState()
    
    def getGain(self):
        return self.gain        
        
    def computeGain(self, leveldB):
        if leveldB < (self.threshold - self.knee/2):
            return 0
        elif leveldB > (self.threshold - self.knee/2) and leveldB < (self.threshold + self.knee/2):
            return ((leveldB - self.threshold + self.knee/2)**2) / (2 * self.knee) * (1 / self.ratio - 1)
        else:
            return np.max([leveldB - self.threshold, 0]) * ( 1 / self.ratio - 1 )
        
    def process(self, x):
        pass
    
class FFSigEnvCompressor(Compressor):
    def process(self, x):
        level = np.max([np.abs(x), self.bias])
        level = self.levelEstimator.process(level)
        gdB = self.computeGain(mag2db(level))
        self.gain = db2mag(gdB)
        return x * self.gain

class FBSigEnvCompressor(Compressor):
    def process(self, x):
        y = x * self.gain
        level = np.max([np.abs(y), self.bias])
        level = self.levelEstimator.process(level)
        gdB = self.computeGain(mag2db(level))
        self.gain = db2mag(gdB)
        return y

class FFdBGainEnvCompressor(Compressor):
    def process(self, x):
        level = np.abs(x)
        leveldB = mag2db(level)
        gdB = self.computeGain(leveldB)
        gdB = -self.levelEstimator.process(-gdB)
        self.gain = db2mag(gdB)
        return x * self.gain    

class FFGainEnvCompressor(Compressor):
    def process(self, x):
        level = np.abs(x)
        leveldB = mag2db(level)
        gdB = self.computeGain(leveldB)
        self.gain = db2mag(gdB)
        self.gain = self.levelEstimator.process(self.gain)
        return x * self.gain

def plotCharacteristicFunc(compressor):
    inLevel = np.linspace(-20, 0)
    gain = [compressor.computeGain(x) for x in inLevel]
    outLevel = inLevel + gain;
    
    plt.figure()
    plt.plot(inLevel, outLevel)
    plt.grid(True)
    plt.xticks(np.arange(-20, 0.1, 2))
    plt.yticks(np.arange(-20, 0.1, 2))
    plt.gca().set_aspect('equal', 'box')
    plt.xlim([-20, 0])
    plt.ylim([-20, 0])
    

if __name__ == "__main__":
    fs = 400
    c = FFSigEnvCompressor(DecoupledLevelEstimator(fs))
    c.setRatio(10)
    c.setThreshold(-10)
    c.setKnee(10)
    c.setAttack(10/1000)
    c.setRelease(100/1000)
    c.setBias(db2mag(c.threshold))
    c.setBias(0)
    
    # plotCharacteristicFunc(c)
    dur = 2
    t = np.linspace(0, dur, dur * fs, endpoint=False)
    x = np.ones_like(t)
    x[t < 0.5] = db2mag(-20)
    x[t > 1] = db2mag(-20)
    
    y = np.zeros_like(x)
    l = np.zeros_like(x)
    g = np.zeros_like(x)
    for i in np.arange(np.size(t)):
        y[i] = c.process(x[i])
        l[i] = c.getLevel()
        g[i] = c.getGain()
    
    plt.clf()
    plt.subplot(411)
    plt.plot(t, x)
    plt.hlines(db2mag(c.threshold), t[0], t[-1], linestyles=":")
    plt.grid(True)
    plt.ylim([-1, 1])
    plt.xlim(t[[0,-1]])
    plt.yticks(np.linspace(-1, 1, 5))
    
    plt.subplot(412)
    plt.plot(t, l)
    plt.grid(True)
    plt.xlim(t[[0,-1]])
    
    plt.subplot(413)
    plt.plot(t, g)
    plt.grid(True)
    plt.ylim([0, 1])
    plt.xlim(t[[0,-1]])
    plt.yticks(np.linspace(0, 1, 5))
    
    plt.subplot(414)
    plt.plot(t, y)
    plt.grid(True)
    plt.ylim([-1, 1])
    plt.xlim(t[[0,-1]])
    plt.yticks(np.linspace(-1, 1, 5))
    
    plt.tight_layout()
    
        
        
        
    
    