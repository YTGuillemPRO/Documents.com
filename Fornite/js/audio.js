// Tiny procedural sound synth — zero audio files needed.
let AC=null;
function audioInit(){ try{ if(!AC) AC=new (window.AudioContext||window.webkitAudioContext)(); if(AC.state==='suspended')AC.resume(); }catch(e){} }
function tone(f,dur,type='square',vol=0.06,slide=0){
  if(!AC)return; const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();
  o.type=type; o.frequency.setValueAtTime(f,t);
  if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(24,f+slide),t+dur);
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(g).connect(AC.destination); o.start(t); o.stop(t+dur+0.02);
}
function noise(dur=0.08,vol=0.09,fc=1200){
  if(!AC)return; const n=Math.floor(AC.sampleRate*dur),b=AC.createBuffer(1,n,AC.sampleRate),d=b.getChannelData(0);
  for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
  const s=AC.createBufferSource(); s.buffer=b;
  const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=fc;
  const g=AC.createGain(); g.gain.value=vol;
  s.connect(f).connect(g).connect(AC.destination); s.start();
}
const SFX={
  shot(id){ if(id==='sniper'){noise(0.16,0.14,900);tone(90,0.14,'sawtooth',0.05,-60);}
    else if(id==='shotgun')noise(0.14,0.13,700);
    else noise(0.06,0.08,1600+Math.random()*400); },
  hit(){tone(720,0.05,'square',0.05);}, crit(){tone(1180,0.07,'square',0.06);},
  hurt(){tone(150,0.14,'sawtooth',0.07,-40);},
  pickup(){tone(520,0.07,'triangle',0.06);setTimeout(()=>tone(780,0.09,'triangle',0.06),70);},
  build(){tone(210,0.07,'triangle',0.07);noise(0.04,0.04,900);},
  chop(){noise(0.05,0.07,600);tone(140,0.05,'triangle',0.05);},
  swap(){tone(360,0.04,'square',0.04);},
  heal(){tone(600,0.3,'sine',0.05,240);},
  storm(){tone(80,0.25,'sine',0.05,-20);},
  elim(){tone(880,0.08,'square',0.06);setTimeout(()=>tone(1320,0.12,'square',0.06),80);},
  win(){[523,659,784,1046].forEach((f,i)=>setTimeout(()=>tone(f,0.22,'triangle',0.08),i*140));},
  lose(){[392,330,262,196].forEach((f,i)=>setTimeout(()=>tone(f,0.25,'sawtooth',0.05),i*160));},
  empty(){tone(240,0.04,'square',0.04);},
  thud(){noise(0.12,0.1,420);},
};
