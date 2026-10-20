/* ============================================================
   AUDIO ASMR — Todo sintetizado con Web Audio API (sin archivos)
   ➤ Clicks suaves, whoosh de apertura, ticks de contador,
     campanas de legendaria, monedas y drone ambiental hipnótico.
   ============================================================ */

const AudioASM = (() => {
  let ctx = null, master = null, bus = null;
  let ready = false, ambientNodes = null;
  let sfxOn = true, ambOn = true, vol = 0.7;

  /* Crea el contexto en el primer gesto del usuario (política de autoplay) */
  function init(){
    if (ready) { if (ctx.state === "suspended") ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = vol;
    master.connect(ctx.destination);
    /* Bus espacioso: delay con feedback → reverb simple y cálido */
    bus = ctx.createDelay(1.2);
    bus.delayTime.value = 0.26;
    const fb = ctx.createGain(); fb.gain.value = 0.30;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1500;
    bus.connect(fb); fb.connect(lp); lp.connect(bus);
    const wet = ctx.createGain(); wet.gain.value = 0.35;
    bus.connect(wet); wet.connect(master);
    ready = true;
  }

  /* Nota suave con envolvente larga (sine por defecto) */
  function tone(freq, dur, o = {}){
    if (!ready || !sfxOn) return;
    const t = ctx.currentTime + (o.at || 0);
    const osc = ctx.createOscillator();
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(freq, t);
    if (o.glide) osc.frequency.exponentialRampToValueAtTime(o.glide, t + dur * 0.9);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(o.gain || 0.10, t + (o.attack || 0.025));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + (o.release || 0.35));
    osc.connect(g); g.connect(o.dry ? master : bus);
    osc.start(t); osc.stop(t + dur + 0.6);
  }

  /* Ruido filtrado con barrido (whoosh, humo, papel) */
  function noise(dur, o = {}){
    if (!ready || !sfxOn) return;
    const t = ctx.currentTime + (o.at || 0);
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = o.ftype || "bandpass";
    f.frequency.setValueAtTime(o.from || 300, t);
    f.frequency.exponentialRampToValueAtTime(o.to || 1800, t + dur);
    f.Q.value = o.q || 1.1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(o.gain || 0.12, t + (o.attack || dur * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(o.dry ? master : bus);
    src.start(t); src.stop(t + dur + 0.1);
  }

  /* ---------- Drone ambiental hipnótico (A2 + beat lento + E3) ---------- */
  function startAmbient(){
    if (!ready || ambientNodes) return;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.045, ctx.currentTime + 4); // fade-in sedoso de 4s
    const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 380;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;   // respiración lenta
    const lg = ctx.createGain(); lg.gain.value = 160;
    lfo.connect(lg); lg.connect(f.frequency);
    const oscs = [110, 110.55, 164.81].map(fr => {
      const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = fr;
      o.connect(f); o.start(); return o;
    });
    f.connect(g); g.connect(master); lfo.start();
    ambientNodes = { g, lfo, oscs };
  }
  function stopAmbient(){
    if (!ambientNodes) return;
    const { g, lfo, oscs } = ambientNodes;
    g.gain.cancelScheduledValues(ctx.currentTime);
    g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.5); // fade-out suave
    setTimeout(() => { try{ oscs.forEach(o => o.stop()); lfo.stop(); }catch(e){} }, 2600);
    ambientNodes = null;
  }

  /* ---------- SFX del juego ---------- */
  const click  = () => tone(640, 0.08, { type:"triangle", gain:0.09, glide:500 });
  const hover  = () => tone(880, 0.05, { gain:0.022 });
  const coin   = () => { tone(1244.5, 0.14, { type:"triangle", gain:0.08 });
                         tone(1568,   0.22, { type:"triangle", gain:0.07, at:0.07 }); };
  const error  = () => tone(196, 0.3, { gain:0.08, glide:140 });
  const success= () => [523.25, 659.25, 783.99].forEach((f,i)=>tone(f,0.5,{gain:0.06,at:i*0.09}));
  const save   = () => { noise(0.28, { ftype:"highpass", from:2500, to:5000, gain:0.05 });
                         tone(1046.5, 0.4, { gain:0.05, at:0.06 }); };
  const whoosh = () => noise(1.1, { from:180, to:2400, gain:0.16, attack:0.5 });
  const tension= () => { tone(55, 0.5, { gain:0.14, glide:40 }); tone(82.4, 0.5, { gain:0.08, at:0.14 }); };
  const tick   = v  => tone(500 + v * 9, 0.05, { type:"triangle", gain:0.045 });

  /* Revelado por rareza — arpegios cada vez más ricos + campanas */
  function reveal(r){
    if (!ready || !sfxOn) return;
    const seq = {
      comun:     [[392,0],[523.25,0.1]],
      especial:  [[440,0],[554.37,0.1],[659.25,0.2]],
      rara:      [[523.25,0],[659.25,0.09],[783.99,0.18],[1046.5,0.3]],
      epica:     [[523.25,0],[659.25,0.08],[783.99,0.16],[1046.5,0.26],[1318.5,0.4]],
      legendaria:[[523.25,0],[659.25,0.07],[783.99,0.14],[1046.5,0.22],[1318.5,0.32],[1568,0.44]]
    }[r] || [[392,0]];
    seq.forEach(([f, at]) => tone(f, 0.8, { gain:0.07, at }));
    if (r === "epica" || r === "legendaria") {
      tone(880, 2.2, { gain:0.05, at:0.15 });                    // campana
      noise(1.6, { from:400, to:5200, gain:0.05, at:0.2 });      // aire brillante
    }
    if (r === "legendaria") {
      [0.55, 0.75, 0.95, 1.2].forEach((at, i) =>
        tone(1318.5 + i * 261, 1.8, { gain:0.035, at }));        // lluvia de cristales
      noise(1.4, { from:150, to:90, gain:0.12, at:0 });          // riser grave
    }
  }

  /* Toggle de ajustes */
  function toggleSFX(v){ sfxOn = v; }
  function toggleAmb(v){
    ambOn = v;
    if (v) startAmbient(); else stopAmbient();
  }
  function setVolume(v){ vol = v; if (master) master.gain.value = v; }

  return { init, click, hover, coin, error, success, save, whoosh,
           tension, tick, reveal, toggleSFX, toggleAmb, setVolume,
           get ambientOn(){ return ambOn; } };
})();
