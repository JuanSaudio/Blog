#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Mon Mar 30 03:35:45 2020

@author: juans
"""

import numpy as np
import scipy.signal as sg
import moviepy.editor as mpy
from moviepy.video.io.bindings import mplfig_to_npimage as plt2np
import matplotlib.pyplot as plt

fig = plt.figure(1, figsize=(12, 9))
fs = 4e4
N = 200
fax = np.logspace(-6, 5)
ci  = np.logspace(np.log10(1), np.log10(2 * fs), N)
duration = 5

def make_frame(i):
    idx = len(ci) - int(len(ci) * i / duration) - 1
    c = ci[idx]
    fad = 2 * fs * np.arctan(fax / c)
    gdB = np.array([-12, 12])
    
    fa, ga = np.meshgrid(fax, gdB)
    fd, gd = np.meshgrid(fad, gdB) 

    plt.cla()    
    plt.semilogx(fa, ga, ':k', lw=0.5)
    plt.semilogx(fd, gd, ':', lw=0.5)
    plt.xlim([2e1, 2e4])
    plt.ylim([-12, 12])
    plt.grid(True)
    plt.autoscale(tight=True)
    
    return plt2np(fig)

animation = mpy.VideoClip(make_frame, duration=duration)
animation.write_videofile("WarpingTest.mp4", fps=30)
mpy.VideoClip()