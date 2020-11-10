fs = 48000;
dur = 10;
n = 0:dur * fs - 1;
x1 = (-1).^n;
x2 = ones(size(n));
x3 = randi(2, size(n)) - 1; 

%%
audiowrite("SinFs2.wav", x1, fs);
audiowrite("SinDC.wav", x2, fs);
audiowrite("WhiteNz.wav", x3, fs)

%%




