import numpy as np, wave, sys
OUT = sys.argv[1]; SR = 44100
def save(name, x):
    x = x / max(1e-9, np.max(np.abs(x))) * 0.9
    # short fades at both ends so the loop never clicks
    f = int(0.006 * SR); x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f)
    with wave.open(f'{OUT}/{name}.wav', 'w') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype('<i2').tobytes())
def note(freq, dur, start, total, decay=4.0, harmonics=((1, 1), (2, .35), (3, .12)), attack=.008):
    t = np.arange(int(dur * SR)) / SR
    env = np.minimum(1, t / attack) * np.exp(-decay * t)
    sig = sum(a * np.sin(2 * np.pi * freq * h * t) for h, a in harmonics) * env
    buf = np.zeros(int(total * SR)); s = int(start * SR); buf[s:s + len(sig)] += sig[: len(buf) - s]; return buf
# 1. Sunrise chime: C5 E5 G5 C6 arpeggio, twice, bright and insistent. 2.4 s loop.
T = 2.4; chime = np.zeros(int(T * SR))
for rep in range(2):
    for i, f in enumerate([523.25, 659.25, 783.99, 1046.5]):
        chime += note(f, 0.9, rep * 1.2 + i * 0.13, T, decay=5)
save('alarm-chime', chime)
# 2. Soft bells for Gentle mode: slow, warm, lots of space. 4.8 s loop.
T = 4.8; bells = np.zeros(int(T * SR))
for start, f in [(0, 440), (0.02, 660), (1.6, 392), (3.2, 523.25), (3.22, 784)]:
    bells += note(f, 2.6, start, T, decay=1.6, harmonics=((1, 1), (2.76, .18), (5.4, .06)), attack=.03)
save('gentle-bells', bells)
# 3. Snooze's yawn: a gliding hum that drops and fades.
T = 1.8; t = np.arange(int(T * SR)) / SR
f = 330 * (165 / 330) ** (np.minimum(t, 1.5) / 1.5)
ph = 2 * np.pi * np.cumsum(f) / SR
env = np.minimum(1, t / 0.25) * np.exp(-1.6 * np.maximum(0, t - 0.4))
vib = 1 + 0.02 * np.sin(2 * np.pi * 5.5 * t)
yawn = (np.sin(ph * vib) + 0.4 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)) * env
save('yawn', yawn)
import os; print({n: os.path.getsize(f'{OUT}/{n}') for n in os.listdir(OUT)})
