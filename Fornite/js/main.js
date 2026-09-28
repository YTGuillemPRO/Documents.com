// 1) input: añade con las otras teclas
if(e.code==='KeyB')startEmote();

// 2) en eliminate(), rama del bot eliminado:
}else if(killer&&killer.name){if(killer.kills!==undefined)killer.kills++;
  if(killer.emoteT!==undefined)killer.emoteT=1.6;   // ← celebra
  hud.killfeedAdd(killer.name,v.name+' ('+v.kills+')');}

// 3) prompt de interacción (sustituye el bloque actual):
const ch=nearestChest(player.pos,CFG.PICKUP_RANGE);
if(ch){hud.showInteract(ch.supply?'OPEN SUPPLY DROP':'OPEN CHEST',ch.supply?'#66e0ff':'#ffd23a');}
else{const it=nearestLoot(player.pos,CFG.PICKUP_RANGE);
  hud.showInteract(it?lootLabel(it):null,it?lootColor(it):null);}

// 4) resetMatch añade:
while(chests.length){const c=chests.pop();chestGroup.remove(c.g);}

// 5) borra TODAS las líneas sun.position.set(...) del loop
//    (ahora el ciclo día/noche controla el sol; main solo fija el target):
sun.target.position.set(player.pos.x,0,player.pos.z);

// 6) cámara cinemática — añade justo después del bloque MENU del loop:
if(game.state==='WIN'||game.state==='OVER'){
  const ts=t*0.001,a=ts*0.5,c=player.pos;
  camera.position.set(c.x+Math.sin(a)*7,c.y+3.2,c.z+Math.cos(a)*7);
  camera.lookAt(c.x,c.y+1.4,c.z);
  camera.fov=55;camera.updateProjectionMatrix();
  sun.target.position.set(c.x,0,c.z);
  renderer.render(scene,camera);game.lmbClick=false;return;
}
