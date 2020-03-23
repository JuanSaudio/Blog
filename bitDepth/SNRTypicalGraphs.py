#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Mon Mar 23 00:43:58 2020

@author: juans
"""

import numpy as np
import scipy.signal as sg
import matplotlib.pyplot as plt


def mag2db(x):
    return 20 * np.log10(np.abs(x))

def pow2db(x):
    return 10 * np.log10(x)


N = 2**10
n = np.arange(N)
f = 6
x = np.cos(2 * np.pi * f * n / N)
y = np.random.normal(size=N) * 0.01

X = np.fft.fft(x) / len(x)
Y = np.fft.fft(y) / len(y)
X = 2 * X[0:int(len(X)/2)]
Y = 2 * Y[0:int(len(Y)/2)]
w = np.arange(N/2)

plt.figure(1, figsize=(15,4.8))
plt.clf()
plt.subplot(131)
plt.plot(n, x)
plt.plot(n, y)
plt.xlabel('Samples')
plt.ylabel('Amplitude')
plt.title('SNR Representation ?')
plt.autoscale(tight=True)
plt.grid(True)
plt.annotate('SNR?', xy=(0.45, 0.755), xytext=(0.25, 0.755), 
             xycoords='axes fraction', ha='center', va='center',
             arrowprops=dict(arrowstyle='-[, widthB=6.5, lengthB=1.5', lw=1.5))

plt.subplot(132)
plt.plot(n, mag2db(sg.hilbert(x)))
plt.plot(n, mag2db(sg.hilbert(y)))
plt.xlabel('Samples')
plt.ylabel('Envelope Amplitude')
plt.title('SNR in dB?')
plt.autoscale(tight=True)
plt.grid(True)
plt.ylim([-40, 10])
plt.annotate('SNR?', xy=(0.5, 0.5), xytext=(0.35, 0.5), 
             xycoords='axes fraction', ha='center', va='center',
             arrowprops=dict(arrowstyle='-[, widthB=8, lengthB=1.5', lw=1.5))

plt.subplot(133)
plt.semilogx(w, mag2db(X))
plt.semilogx(w, mag2db(Y))
plt.grid(True)
plt.autoscale(tight=True)
plt.ylim([-80, 10])
plt.xlabel('Frequency Bins')
plt.ylabel('Amplitude')
plt.title('SNR in Spectrum in dB?')
plt.annotate('SNR?', xy=(0.4, 0.55), xytext=(0.55, 0.55), 
             xycoords='axes fraction', ha='center', va='center',
             arrowprops=dict(arrowstyle='-[, widthB=9, lengthB=1.5', lw=1.5))

plt.tight_layout()
plt.savefig("SNR in Various forms")