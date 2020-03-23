#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Mon Mar 23 01:59:42 2020

@author: juans
"""

import numpy as np
import matplotlib.pyplot as plt
import ipywidgets as widgets

def mrQuantizeUniform(aNum, nBits):
    #Uniformly mid rise quantize signed fraction aNum with nBits
    #Notes:The overload level of the quantizer should be 1.0
        
    if (np.abs(aNum) >= 1):
        code = 2**(nBits-1)-1
    else:
        code = int(2**(nBits-1) * np.abs(aNum))
        
    if(aNum >= 0):
       return int(code)
    else:
       return int(code + 2**(nBits-1))
            
def mrDequantizeUniform(aQuantizedNum, nBits):
    #Uniformly mid rise dequantizes nBits-long number aQuantizedNum 
    #into a signed fraction
    if (aQuantizedNum>>(nBits-1)):
        sign = -1
    else:
        sign = 1
            
    if (sign == -1):
        aNum = sign * float(np.abs(aQuantizedNum - 2**(nBits-1) + 0.5))/(2**(nBits-1))
    else:
        aNum = sign * float(np.abs(aQuantizedNum) + 0.5)/(2**(nBits-1))
        
    return aNum

def mtQuantizeUniform(aNum,nBits):
    #Uniformly quantize signed fraction aNum with nBits
    #Notes:The overload level of the quantizer should be 1.0    
    if(aNum >= 0):
        s = 0
    else:
        s = 1
        
    if(np.abs(aNum) >= 1):
        code = 2**(nBits-1)-1
    else:
        code = int(((2**(nBits)-1)*np.abs(aNum)+1)/2)
        
        
    if(s == 0):
       return int(code)
    else:
       return int(code + 2**(nBits-1))
   
def mtDequantizeUniform(aQuantizedNum,nBits):
    #Uniformly dequantizes nBits-long number aQuantizedNum 
    #into a signed fraction
    if (aQuantizedNum>>(nBits-1)):
        sign = -1
    else:
        sign = 1
    
    if (sign == -1):
        aNum =  sign*float(2*np.abs(aQuantizedNum - 2**(nBits-1)))/(2**nBits -1)    
    else:
        aNum =  sign*float(2*np.abs(aQuantizedNum))/(2**nBits -1) 

    return aNum

isMidTread = False

nBits = int(2)
x = np.linspace(-1, 1, 2**nBits * 4)
y = np.zeros_like(x, dtype=int)
z = np.zeros_like(x)

if (isMidTread):
    for i in np.arange(len(y)):
        y[i] = mtQuantizeUniform(x[i], nBits)
        z[i] = mtDequantizeUniform(y[i], nBits)
else:
    for i in np.arange(len(y)):
        y[i] = mrQuantizeUniform(x[i], nBits)
        z[i] = mrDequantizeUniform(y[i], nBits)
        
fig = plt.figure(1)
ax = plt.axes()
plt.axis('equal')
plt.axis('square')
plt.xlim([-1, 1])
plt.ylim([-1, 1])
plt.xticks(plt.yticks()[0], rotation=90)
plt.grid(True)
plt.xlabel('Continuous Amplitude')
plt.ylabel('Quantized Amplitude')
plt.title('Uniform Quantizer')
plt.tight_layout()

def plot(nBits, qType):
    
    x = np.linspace(-1, 1, 2**nBits * 4)
    y = np.zeros_like(x, dtype=int)
    z = np.zeros_like(x)
    
    if qType == 'MidTread':
        for i in np.arange(len(y)):
            y[i] = mtQuantizeUniform(x[i], nBits)
            z[i] = mtDequantizeUniform(y[i], nBits)
    else:
        for i in np.arange(len(y)):
            y[i] = mrQuantizeUniform(x[i], nBits)
            z[i] = mrDequantizeUniform(y[i], nBits)

    ax.plot(x, z)
    return fig
from ipywidgets import StaticInteract, RangeWidget, RadioWidget

StaticInteract(plot,
               nBits=RangeWidget(1, 4, 1),
               qType=RadioWidget(['MidTread', 'MidRise']))


