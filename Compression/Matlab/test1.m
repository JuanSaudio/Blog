clear; close all

fs = 48000;
c1 = Compressor1(fs);
threshold = -10;
ratio = 10/4;
attackTime = 10 / 1000;
releaseTime = 100 / 1000;
c1.setParameters(threshold, ratio, attackTime, releaseTime);

t = linspace(0, 1, fs + 1);
x = ones(size(t));
x(t < 0.25) = db2mag(-20);
x(t > 0.5) = db2mag(-10);

y = zeros(size(x));
l = zeros(size(x));
for i = 1:length(x)
    y(i) = c1.process(x(i));
    l(i) = c1.getLevel();
end


plot(t, db(x))
hold on
plot(t, db(y))
plot(t, db(l));
hline(threshold)