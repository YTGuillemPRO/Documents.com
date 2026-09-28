// ============ HUD: compass, minimap (with chests), hotbar, kill feed ============
const hud={
  init(){this.cx=$('compass').getContext('2d');this.mm=$('minimap').getContext('2d');this._gap=7;this._kick=0;this.refreshHotbar();},
  refreshHotbar(){
    const hb=$('hotbar');hb.innerHTML='';
    const mk=(html,cls,key)=>{const d=document.createElement('div');d.className='slot '+(cls||'');d.innerHTML=html+(key?'<span class="key">'+key+'</span>':'');hb.appendChild(d);return d;};
    const sel=player.sel;
    mk('<div class="nm">PICK</div>','pick'+(sel===0?' sel':''),'4');
    for(let i=0;i<3;i++){const w=player.inv[i];
      if(w){const rc=RARITIES[w.rarity].color;
        const d=mk('<div class="nm">'+WEAPONS[w.id].short+'</div><span class="ct">'+w.mag+'</span>','w'+(sel===i+1?' sel':''),''+(i+1));
        d.style.borderColor=sel===i+1?'#fff':rc;d.style.background='linear-gradient(160deg,'+rc+'44,rgba(10,16,32,.7))';}
      else mk('<div class="nm">—</div>','empty',''+(i+1));}
    let d=mk('<div class="nm" style="color:#8fd8ff">POT</div><span class="ct">'+player.shieldPots+'</span>','pot','X');
    d.style.borderColor='#35c8ff77';d.style.background='linear-gradient(160deg,#35c8ff33,rgba(10,16,32,.7))';
    d=mk('<div class="nm" style="color:#ff9d92">MED</div><span class="ct">'+player.medkits+'</span>','med','C');
    d.style.borderColor='#ff5b4d77';d.style.background='linear-gradient(160deg,#ff5b4d33,rgba(10,16,32,.7))';
    d=mk('<div class="micon"></div><span class="ct">'+player.mats+'</span>','matsBox','');
    d.style.borderColor='#c9985f88';
    const inst=currentInst();
    if(!inst||inst==='pickaxe'){$('weaponName').textContent='PICKAXE';$('weaponName').style.color='#cfe0ff';
      $('ammoMag').textContent='—';$('ammoRes').textContent='';}
    else{$('weaponName').textContent=WEAPONS[inst.id].name.toUpperCase();
      $('weaponName').style.color=RARITIES[inst.rarity].color;
      $('ammoMag').textContent=inst.mag;$('ammoRes').textContent='/ '+inst.reserve;}
    $('miniElims').textContent=player.kills;
  },
  update(dt){
    const p=player;
    $('hpFill').style.transform='scaleX('+clamp(p.hp/100,0,1)+')';
    $('shFill').style.transform='scaleX('+clamp(p.shield/100,0,1)+')';
    $('hpNum').textContent=Math.ceil(p.hp);$('shNum').textContent=Math.ceil(p.shield);
    $('miniAlive').textContent=aliveCount();
    if(storm.mode==='wait'){$('stormLabel').textContent='STORM SHRINKS IN';$('stormTime').textContent=fmt(storm.t);$('miniStorm').textContent=fmt(storm.t);}
    else if(storm.mode==='shrink'){$('stormLabel').textContent='STORM EYE SHRINKING';$('stormTime').textContent=fmt(storm.t);$('miniStorm').textContent=fmt(storm.t);}
    else{$('stormLabel').textContent='FINAL STORM';$('stormTime').textContent='';$('miniStorm').textContent='—';}
    this._kick=Math.max(0,this._kick-dt*40);
    $('ch').style.setProperty('--gap',(this._gap+this._kick)+'px');
    $('vStorm').style.opacity=p.alive&&inStorm(p.pos.x,p.pos.z)?0.9:0;
    this.drawCompass();this.drawMap();
  },
  drawCompass(){
    const c=this.cx,W=460;c.clearRect(0,0,W,44);
    const heading=((Math.atan2(Math.sin(player.yaw),-Math.cos(player.yaw))*180/Math.PI)+360)%360;
    const ppd=W/120;
    c.textAlign='center';
    for(let d=-75;d<=75;d+=5){
      let deg=Math.round(heading+d),norm=((deg%360)+360)%360;
      const x=W/2+d*ppd;if(x<10||x>W-10)continue;
      const a=clamp(1-Math.abs(d)/78,0,1);
      if(norm%45===0){const L=['N','NE','E','SE','S','SW','W','NW'][norm/45];
        c.fillStyle='rgba(255,255,255,'+a+')';c.font='italic 17px Anton';c.fillText(L,x,22);}
      else if(norm%15===0){c.fillStyle='rgba(255,255,255,'+(a*0.85)+')';c.font='700 13px Barlow Semi Condensed';c.fillText(norm,x,19);}
      else{c.fillStyle='rgba(255,255,255,'+(a*0.45)+')';c.fillRect(x-0.5,25,1,6);}}
    c.fillStyle='#ffd23a';c.beginPath();c.moveTo(W/2,42);c.lineTo(W/2-5,33);c.lineTo(W/2+5,33);c.fill();
  },
  drawMap(){
    const c=this.mm,S=224;c.clearRect(0,0,S,S);if(mapBase)c.drawImage(mapBase,0,0);
    const mapXY=(x,z)=>[(x/480+0.5)*S,(z/480+0.5)*S];
    const [cx,cy]=mapXY(storm.cx,storm.cz),r=storm.r/480*S;
    c.save();c.beginPath();c.rect(0,0,S,S);c.arc(cx,cy,r,0,Math.PI*2,true);
    c.fillStyle='rgba(126,40,196,0.42)';c.fill();c.restore();
    c.strokeStyle='#c95bff';c.lineWidth=1.5;c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.stroke();
    if(storm.mode!=='done'){const [tx,ty]=mapXY(storm.tcx,storm.tcz);
      c.strokeStyle='#ffffff';c.beginPath();c.arc(tx,ty,storm.tr/480*S,0,Math.PI*2);c.stroke();}
    // cofres y supply drops en el minimapa
    for(const ch of chests){
      if(ch.opened)continue;
      const [mx,my]=mapXY(ch.x,ch.z);
      c.fillStyle=ch.supply?'#66e0ff':'#ffd23a';
      const s2=ch.supply?5:3.5;c.fillRect(mx-s2/2,my-s2/2,s2,s2);
    }
    const [px,py]=mapXY(player.pos.x,player.pos.z);
    c.save();c.translate(px,py);c.rotate(Math.atan2(Math.cos(player.yaw),Math.sin(player.yaw)));
    c.fillStyle='#fff';c.strokeStyle='rgba(10,14,26,.8)';c.lineWidth=2;
    c.beginPath();c.moveTo(8,0);c.lineTo(-5,5);c.lineTo(-5,-5);c.closePath();c.fill();c.stroke();c.restore();
  },
  kickCrosshair(){this._kick=6;},
  showReload(){},
  reloadProgress(){},
  showInteract(txt,color){
    const el=$('interact');
    if(!txt){el.classList.add('hidden');return;}
    el.innerHTML='<b>E</b>'+txt;el.style.borderColor=color||'var(--line)';el.classList.remove('hidden');
  },
  announce(main,sub,ms=2200){
    const el=$('announce');$('annMain').textContent=main;$('annSub').textContent=sub||'';
    el.classList.remove('hidden');el.style.animation='none';void el.offsetWidth;el.style.animation='';
    clearTimeout(this._annT);this._annT=setTimeout(()=>el.classList.add('hidden'),ms);
  },
  killfeedAdd(killer,victim,me=false,stormK=false,extra=''){
    const d=document.createElement('div');
    const kH=killer?'<span class="'+(me?'you':'')+'">'+killer+'</span>':'<span style="color:#c95bff;font-weight:700">The Storm</span>';
    const vH='<span class="vic">'+victim+'</span>';
    d.innerHTML=kH+(stormK?' claimed ':' eliminated ')+vH+(extra||'');
    const kf=$('killfeed');kf.prepend(d);
    while(kf.children.length>5)kf.lastChild.remove();
    setTimeout(()=>d.remove(),5200);
  },
  damageNumber(worldPos,txt,crit){
    const v=worldPos.clone();v.y+=1.3;v.project(camera);if(v.z>1)return;
    const el=document.createElement('div');el.className='dmg'+(crit?' crit':'');el.textContent=txt;
    el.style.left=((v.x*0.5+0.5)*innerWidth)+'px';el.style.top=((-v.y*0.5+0.5)*innerHeight)+'px';
    $('dmgLayer').appendChild(el);setTimeout(()=>el.remove(),850);
  },
  floatText(worldPos,txt){
    const v=worldPos.clone();v.project(camera);if(v.z>1)return;
    const el=document.createElement('div');el.className='dmg mat';el.textContent=txt;
    el.style.left=((v.x*0.5+0.5)*innerWidth)+'px';el.style.top=((-v.y*0.5+0.5)*innerHeight)+'px';
    $('dmgLayer').appendChild(el);setTimeout(()=>el.remove(),850);
  },
  flashDamage(){
    $('vRed').style.opacity=0.7;clearTimeout(this._redT);
    this._redT=setTimeout(()=>$('vRed').style.opacity=0,180);
    const now=performance.now();
    if(now-(this._lastHurt||0)>200){SFX.hurt();this._lastHurt=now;}
  },
};
