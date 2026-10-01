# 120 BPM, A minor synth-pop bed + in-key SFX, mixed as one piece.
import numpy as np, wave
SR = 44100; DUR = 26.3; N = int(SR * DUR)
t = np.arange(N) / SR
BEAT = 0.5; BAR = 2.0
rng = np.random.default_rng(7)

def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def env(n, a, d, sr=SR):
    x = np.arange(n) / sr
    return np.minimum(1, x / max(a, 1e-4)) * np.exp(-x / d)
def lp(x, a):  # one-pole lowpass, a in (0,1)
    y = np.empty_like(x); s = 0.0
    for i in range(len(x)): s += a * (x[i] - s); y[i] = s
    return y
def place(buf, sig, at):
    i = int(at * SR); j = min(N, i + len(sig))
    if i < N: buf[i:j] += sig[: j - i]

music = np.zeros(N); sfx = np.zeros(N)

# chords (Am F C G), one per bar
CH = [[57, 60, 64], [53, 57, 60], [48, 55, 60], [55, 59, 62]]
ROOT = [45, 41, 48, 43]
pad = np.zeros(N)
for b in range(int(DUR / BAR) + 1):
    c = CH[b % 4]; s0 = b * BAR; n = int(BAR * SR * 1.05)
    x = np.arange(n) / SR
    sig = sum(np.sin(2*np.pi*hz(m)*x*(1+d)) for m in c for d in (-.003, .003))
    sig *= np.minimum(1, x / .25) * np.minimum(1, (BAR*1.05 - x) / .2)
    place(pad, sig, s0)
music += 0.05 * lp(pad, 0.25)

# bass: eighth notes on root, from 3.0s
for k in range(int((DUR - 3) / (BEAT/2))):
    at = 3.0 + k * BEAT/2; b = int(at // BAR) % 4
    n = int(.22 * SR); x = np.arange(n) / SR; f = hz(ROOT[b] - 12)
    sig = (np.sin(2*np.pi*f*x) + .3*np.sin(2*np.pi*2*f*x)) * env(n, .005, .09)
    place(music, 0.16 * sig, at)

# kick on beats from 3.0, soft hat on offbeats from 6.0
def kick():
    n = int(.35*SR); x = np.arange(n)/SR
    f = 50 + 90*np.exp(-x/.03); ph = 2*np.pi*np.cumsum(f)/SR
    return np.sin(ph) * env(n, .002, .12)
def hat():
    n = int(.06*SR); nz = rng.standard_normal(n)
    hp = nz - lp(nz, .5); return hp * env(n, .001, .015)
K, H = kick(), hat()
for k in range(int((DUR - 3) / BEAT)):
    at = 3.0 + k*BEAT
    if at > 25.3: break
    place(music, .32*K, at)
    if at >= 6.0: place(music, .035*H, at + BEAT/2)

# arp sparkle (A minor pentatonic) from 6.0 to 19.8
ARP = [69, 72, 76, 79, 81, 79, 76, 72]
for k in range(int(13.8 / (BEAT/2))):
    at = 6.0 + k*BEAT/2; n = int(.25*SR); x = np.arange(n)/SR
    sig = np.sin(2*np.pi*hz(ARP[k % 8])*x) * env(n, .003, .07)
    place(music, .022*sig, at)

# final ring-out chord at 18.0 (Am add9) under outro
n = int(3.5*SR); x = np.arange(n)/SR
ring = sum(np.sin(2*np.pi*hz(m)*x) for m in (57, 64, 69, 71, 72)) * env(n, .02, 1.6)
place(music, .045*ring, 19.8)

# --- SFX (in key, soft) ---
def pluck(m, d=.18, g=1.0):
    n = int(.6*SR); x = np.arange(n)/SR
    return g*(np.sin(2*np.pi*hz(m)*x) + .25*np.sin(2*np.pi*hz(m+12)*x)) * env(n, .002, d)
def sub_hit():
    n = int(1.4*SR); x = np.arange(n)/SR
    f = 45 + 70*np.exp(-x/.05); ph = 2*np.pi*np.cumsum(f)/SR
    return np.sin(ph) * env(n, .003, .45)
def whoosh(len_s=.45):
    n = int(len_s*SR); nz = rng.standard_normal(n); x = np.arange(n)/SR
    sh = np.sin(np.pi * x/len_s)**2
    return lp(nz, .08) * sh
place(sfx, .55*sub_hit(), 0.05)
place(sfx, .10*pluck(81, .5), 0.08)
for at in (2.75, 5.7, 10.5, 16.5, 19.5): place(sfx, .10*whoosh(), at)
for i, at in enumerate((7.1, 8.25, 9.4)): place(sfx, .08*pluck([76, 79, 81][i]), at)
place(sfx, .06*pluck(88, .3), 9.45)          # confirm chime on top
place(sfx, .07*pluck(76, .25), 11.75); place(sfx, .07*pluck(81, .35), 11.87)  # toast
place(sfx, .08*pluck(72), 12.85)             # tap Iniciar preparo
place(sfx, .08*pluck(76), 13.95)             # click Mesas
place(sfx, .05*pluck(84, .25), 14.05)        # screen swap
for i in range(4): place(sfx, .045*pluck([69, 72, 76, 79][i], .15), 17.25 + i*.22)
place(sfx, .08*pluck(81, .6), 21.1)
place(sfx, .10*whoosh(), 22.8)
n2 = int(3.3*SR); x2 = np.arange(n2)/SR
ring2 = sum(np.sin(2*np.pi*hz(m)*x2) for m in (57, 64, 69, 72, 76)) * env(n2, .02, 1.8)
place(music, .04*ring2, 23.1)
place(sfx, .08*pluck(76, .3), 23.6); place(sfx, .08*pluck(81, .45), 23.8)

mix = music + sfx
fade = np.minimum(1, (DUR - t) / 1.2); mix *= fade
mix = np.tanh(mix * 1.4) / np.tanh(1.4)
mix *= 0.89 / np.max(np.abs(mix))
st = np.stack([mix, mix], 1)
with wave.open('audio.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype('<i2').tobytes())
print('ok', np.max(np.abs(mix)))
