// ============ HUD: bars, minimap, kill feed, announcements, screens ============
const hud={
  _chGap:7,_chKick:0,_lastHurt:0,
  init(){ this.mm=$('minimap').getContext('2d'); this.updateSlots(); },
  set(el,v){ if(el._v!==v){el._v=v;el.textContent=v;} },

  update(dt){
    const p=player;
    $('hpFill').style.transform=`scaleX(${clamp(p.hp/100,0,1)})`;
    $('shFill').style.transform=`scaleX(${clamp(p.shield/100,0,1)})`;
    this.set($('hpNum'),Math.ceil(p.hp)); this.set($('shNum'),Math.ceil(p.shield));
    this.set($('matsNum'),p.mats);
    this.set($('aliveNum'),aliveCount()); this.set($('killNum'),p.kills);
    // storm timer
    const st=$('stormTimer');
    if(storm.mode==='wait'){ const s=Math.max(0,Math.ceil(storm.t));
      this.set(st,`STORM ${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`); st.style.color='#dfe7ff'; }
    else if(storm.mode==='shrink'){ this.set(st,'STORM CLOSING'); st.style.color='#ff7b6b'; }
    else { this.set(st,'FINAL STORM'); st.style.color='#c95bff'; }
    // crosshair kick decay
    this._chKick=Math.max(0,this._chKick-dt*40);
    $('ch').style.setProperty('--gap',(this._chGap+this._chKick)+'px');
    // storm vignette
    $('vStorm').style.opacity=player.alive&&inStorm(player.pos.x,player.pos.z)?0.9:0;
    this.drawMap();
  },

  updateAmmo(){
    const inst=currentInst();
    const nm=$('ammoName'),mg=$('ammoMag'),rs=$('ammoRes');
    if(!inst||inst==='pickaxe'){ nm.textContent='PICK'; mg.textContent='—'; rs.textContent=''; return; }
    const def=WEAPONS[inst.id];
    nm.textContent=def.short; nm.style.color=RARITIES[inst.rarity].color;
    mg.textContent=inst.mag; rs.textContent='/ '+inst.reserve;
  },

  updateSlots(){
    const el=$('slots'); el.innerHTML='';
    for(let i=0;i<4;i++){
      const d=document.createElement('div');
      d.className='slot'+(player.sel===i?' sel':'');
      if(i===0){ d.textContent='PICK'; d.classList.add('pick'); }
      else{
        const w=player.inv[i-1];
        if(w){ d.textContent=WEAPONS[w.id].short; d.style.setProperty('--rc',RARITIES[w.rarity].color); }
        else { d.textContent='—'; d.classList.add('empty'); }
      }
      el.appendChild(d);
    }
    this.set($('potsCount'),player.shieldPots); this.set($('medCount'),player.medkits);
    this.updateAmmo();
  },

  kickCrosshair(){ this._chKick=6; },
  showReload(on){ $('reloadWrap').classList.toggle('hidden',!on); },
  reloadProgress(k){ $('reloadFill').style.width=(clamp(k,0,1)*100)+'%'; },
  useProgress(k,label){
    $('useWrap').classList.toggle('hidden',!label);
    if(label)$('useLabel').textContent=label;
    $('useFill').style.width=(clamp(k,0,1)*100)+'%';
  },

  showInteract(txt,color){
    const el=$('interact');
    if(!txt){ el.classList.add('hidden'); return; }
    el.innerHTML=`<b>E</b>${txt}`;
    el.style.borderColor=color||'var(--line)';
    el.classList.remove('hidden');
  },
  setBuildHint(txt){
    const el=$('buildHint');
    if(!txt){ el.classList.add('hidden'); return; }
    el.textContent=txt; el.classList.remove('hidden');
  },

  announce(main,sub,ms=2200){
    const el=$('announce');
    $('annMain').textContent=main; $('annSub').textContent=sub||'';
    el.classList.remove('hidden');
    el.style.animation='none'; void el.offsetWidth; el.style.animation='';
    clearTimeout(this._annT); this._annT=setTimeout(()=>el.classList.add('hidden'),ms);
  },
  killfeedAdd(killer,victim,me=false,stormK=false){
    const d=document.createElement('div'); if(me)d.classList.add('me'); if(stormK)d.classList.add('storm');
    d.innerHTML=killer?`<b style="color:${me?'#ffd23a':'#fff'}">${killer}</b> eliminated ${victim}`
                      :`<b style="color:#c95bff">The Storm</b> claimed ${victim}`;
    const kf=$('killfeed'); kf.prepend(d);
    while(kf.children.length>6)kf.lastChild.remove();
    setTimeout(()=>d.remove(),5200);
  },

  damageNumber(worldPos,txt,crit){
    const v=worldPos.clone(); v.y+=1.3; v.project(camera);
    if(v.z>1)return;
    const el=document.createElement('div');
    el.className='dmg'+(crit?' crit':''); el.textContent=txt;
    el.style.left=((v.x*0.5+0.5)*innerWidth)+'px';
    el.style.top=((-v.y*0.5+0.5)*innerHeight)+'px';
    $('dmgLayer').appendChild(el); setTimeout(()=>el.remove(),850);
  },
  floatText(worldPos,txt,cls){
    const v=worldPos.clone(); v.project(camera);
    if(v.z>1)return;
    const el=document.createElement('div');
    el.className='dmg mat'; el.textContent=txt;
    el.style.left=((v.x*0.5+0.5)*innerWidth)+'px';
    el.style.top=((-v.y*0.5+0.5)*innerHeight)+'px';
    $('dmgLayer').appendChild(el); setTimeout(()=>el.remove(),850);
  },

  flashDamage(s=1){
    $('vRed').style.opacity=Math.min(1,0.7*s);
    clearTimeout(this._redT); this._redT=setTimeout(()=>$('vRed').style.opacity=0,180);
    const now=performance.now();
    if(now-this._lastHurt>200){ SFX.hurt(); this._lastHurt=now; }
  },

  drawMap(){
    const c=this.mm,S=220;
    c.clearRect(0,0,S,S); c.drawImage(mapBase,0,0);
    const mapXY=(x,z)=>[(x/480+0.5)*S,(z/480+0.5)*S];
    const [cx,cy]=mapXY(storm.cx,storm.cz), r=storm.r/480*S;
    c.save();
    c.beginPath(); c.rect(0,0,S,S); c.arc(cx,cy,r,0,Math.PI*2,true);
    c.fillStyle='rgba(126,40,196,0.42)'; c.fill();
    c.restore();
    c.strokeStyle='#c95bff'; c.lineWidth=1.5;
    c.beginPath(); c.arc(cx,cy,r,0,Math.PI*2); c.stroke();
    if(storm.mode!=='done'){
      const [tx,ty]=mapXY(storm.tcx,storm.tcz);
      c.strokeStyle='#ffffff'; c.beginPath(); c.arc(tx,ty,storm.tr/480*S,0,Math.PI*2); c.stroke();
    }
    const [px,py]=mapXY(player.pos.x,player.pos.z);
    c.save(); c.translate(px,py);
    c.rotate(Math.atan2(Math.cos(player.yaw),Math.sin(player.yaw)));
    c.fillStyle='#ffffff'; c.strokeStyle='rgba(10,14,26,.8)';
    c.beginPath(); c.moveTo(8,0); c.lineTo(-5,5); c.lineTo(-5,-5); c.closePath();
    c.fill(); c.stroke(); c.restore();
  },

  showScreen(name){
    for(const id of ['menu','pause','over','win'])$(id).classList.add('hidden');
    if(name)$(name).classList.remove('hidden');
  },
  setIngame(on){ document.body.classList.toggle('ingame',on); },
};
