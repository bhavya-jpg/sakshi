# Generate narration with Chatterbox (Resemble AI, MIT). One WAV per line; prints durations.
import json, sys, time, torch, torchaudio as ta
from chatterbox.tts import ChatterboxTTS
dev = "mps" if torch.backends.mps.is_available() else "cpu"
t0 = time.time()
model = ChatterboxTTS.from_pretrained(device=dev)
print("model loaded on", dev, f"{time.time()-t0:.0f}s", flush=True)
shots = json.load(open("script.json"))
torch.manual_seed(7)
for s in shots:
    for i, line in enumerate(s["lines"]):
        out = f"vo/s{s['shot']:02d}_{i}.wav"
        t1 = time.time()
        wav = model.generate(line, exaggeration=0.45, cfg_weight=0.45, temperature=0.7)
        ta.save(out, wav, model.sr)
        print(out, f"{wav.shape[-1]/model.sr:.2f}s audio in {time.time()-t1:.0f}s", flush=True)
print("done", flush=True)
