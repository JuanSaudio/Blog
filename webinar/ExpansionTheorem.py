#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Wed Apr  1 14:04:06 2020

@author: juans
"""

import numpy as np
import moviepy.editor as mpy
import matplotlib.pyplot as plt
#import matplotlib.ticker as ticker

from moviepy.video.io.bindings import mplfig_to_npimage as plt2np


curFig = plt.figure(1, figsize=(10, 4))

N = 1024
n = np.arange(N)
win = np.hanning(N)

duration = 10;

def db(x):
    return 20 * np.log10(np.abs(x))

def make_frame(i):
    global curFig
    
    freqFact = 100 * i / duration
    numFreqs = 6
    f = np.arange(1, numFreqs) * freqFact
    x = np.sum(np.cos(2 * np.pi * np.outer(f, n)/N), axis=0)
    x /= np.max(np.abs(x))
    X = np.fft.fftshift(np.fft.fft(x * win)) / N
    
    plt.clf()
    plt.subplot(121)
    plt.plot(n, x)
    plt.grid(True)
    plt.xlabel('Samples')
    plt.ylabel('Amplitude')
    plt.title('Waveform')
    plt.xlim([0, N])
    
    plt.subplot(122)
    plt.plot(n - N/2, db(X))
    plt.grid(True)
    plt.ylim([-60, 0])
    plt.xlabel('Frequency')
    plt.title('Spectrum')
    plt.xlim([-N/2, N/2])
    plt.tight_layout()

    return plt2np(curFig)

animation = mpy.VideoClip(make_frame, duration=duration)
animation.write_videofile("ExpansionTheorem.mp4", fps=30)
mpy.VideoClip()
