set(0, 'DefaultLineLineWidth', 2);
fs = 1000;
tau = 0.2;

a1 = exp(-1 / (tau * fs));
b = 1 - a1;
a = [1, -a1];

N = 2^12;
x = eps * rand(N, 1);
t = (0:N-1) / fs;
x(500:2000) = 1;

y = filter(b, a, x);

subplot 311
plot(t, x);
hold on
plot(t, y);
hold off
grid on
xlim(t([1, end]))
ylim([-1, 1])
xlabel("Time")
ylabel("Amplitude");
title("Linear Amplitude of Signal");

subplot 312
plot(t, db(x));
hold on
plot(t, db(y));
hold off
grid on
xlabel("Time")
ylabel("Amplitude (dB)");
ylim([-40, 0])
xlim(t([1, end]))
title("Log Amplitude of Signal");

subplot 313
plot(t, db(1-x));
hold on
plot(t, db(1-y));
hold off
grid on
xlabel("Time")
ylabel("Amplitude (dB)");
ylim([-65, 0])
xlim(t([1, end]))
title("Log Distance Amplitude of Signal");




