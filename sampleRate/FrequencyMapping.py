#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Mon Mar 30 03:57:45 2020

@author: juans
"""

import numpy as np
import matplotlib.pyplot as plt

N = 200
fs = 48000
c = 2 
fax = np.logspace(-6, 5, N)
fad = 2 * fs * np.arctan(fax / c)

plt.loglog(fax, fad)
plt.grid(True, axis='both')