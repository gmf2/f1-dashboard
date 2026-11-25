// UI: chat + mapa SVG de Monza (geometria real) coloreado por delta.
(function(){
var DS=10;
function el(id){return document.getElementById(id);}
function addMsg(who,text){
  var d=document.createElement('div');d.className='msg '+who;d.textContent=text;
  el('chat').appendChild(d);el('chat').scrollTop=el('chat').scrollHeight;}
function drawMap(deltaSeg){
  var T=window.TRACK_MONZA,svg=el('map'),n=T.bx.length,i;
  var xs=T.bx,ys=T.by,minx=Math.min.apply(null,xs),maxx=Math.max.apply(null,xs),miny=Math.min.apply(null,ys),maxy=Math.max.apply(null,ys);
  var W=360,H=460,sc=Math.min((W-20)/(maxx-minx),(H-20)/(maxy-miny));
  function px(x){return 10+(x-minx)*sc;} function py(y){return 10+(maxy-y)*sc;}
  var s='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%">';
  // trazado base por tramos de 100 m coloreados por delta
  for(i=0;i<n-1;i++){
    var col='#555';
    if(deltaSeg){var seg=deltaSeg[Math.min(deltaSeg.length-1,Math.floor(i*DS/100))];
      if(seg){var prev=seg.i>0?deltaSeg[seg.i-1].delta:0;var g=(prev-seg.delta)*1000;
        col=g>40?'#e5484d':g<-40?'#46a758':'#888';}}
    s+='<line x1="'+px(xs[i]).toFixed(1)+'" y1="'+py(ys[i]).toFixed(1)+'" x2="'+px(xs[i+1]).toFixed(1)+'" y2="'+py(ys[i+1]).toFixed(1)+'" stroke="'+col+'" stroke-width="3" stroke-linecap="round"/>';}
  // numeros de curva
  T.corners.forEach(function(c){
    var idx=Math.min(n-1,Math.round(c.apex/DS));
    s+='<g class="corner" data-n="'+c.n+'"><circle cx="'+px(xs[idx]).toFixed(1)+'" cy="'+py(ys[idx]).toFixed(1)+'" r="9" fill="#1c1c1e" stroke="#f5f5f5" stroke-width="1.5"/>'+
       '<text x="'+px(xs[idx]).toFixed(1)+'" y="'+(py(ys[idx])+3.5).toFixed(1)+'" text-anchor="middle" font-size="9" fill="#f5f5f5">'+c.n+'</text></g>';});
  // salida
  s+='<rect x="'+(px(xs[0])-6)+'" y="'+(py(ys[0])-3)+'" width="12" height="6" fill="#f5f5f5"/>';
  s+='</svg>';
  svg.innerHTML=s;
  if(!window.__F1MAPLIVE)svg.querySelectorAll('.corner').forEach(function(g){
    g.style.cursor='pointer';
    g.addEventListener('click',function(){ask('curva '+g.getAttribute('data-n'));});});}
function currentDeltaSeg(){
  var m=window.CHAT.mem,L=window.LAPS_DEMO;
  var you=m.lap===2?L.player2:L.player1;
  var other=m.subject==='rival'?L.rivalAhead:L.reference;
  var seg=window.AN.deltaSegments(you,other,DS,100);
  return seg.map(function(s,i){return {m:s.m,delta:s.delta,i:i};});}
function ask(text){
  addMsg('you',text);
  var r=window.CHAT.route(text);
  var ans;
  if(r===null){ans='Eso no se calcularlo todavia. Se analizar frenadas, velocidades y diferencias por curva y por tramo; prueba "donde pierdo mas?" o "curva 4".';}
  else if(typeof r==='object'&&r.map){ans=r.text;drawMap(currentDeltaSeg());}
  else ans=r;
  addMsg('bot',ans);window.VOICE.speak(ans);
  drawMap(currentDeltaSeg());renderCtx();}

function fmtS(t){var m=Math.floor(t/60),ss=(t-m*60).toFixed(3);return m+':'+(ss<10?'0':'')+ss;}
/* v1.3: con telemetria viva las tarjetas pasan a directo (misma fuente unica RXAPP
   del marco superior); sin paquetes frescos queda la demo EXPLICITA de siempre. */
/* Titulo/mapa/avisos segun modo: en vivo el circuito solo se nombra si llega
   en los paquetes; el mapa solo se muestra con geometria disponible (Monza)
   y entonces en neutro (sin colores ni clics de la demo). */
function setChrome(mode,trackId){
  var t=el('app-title');
  var nm=(mode==='live'&&trackId!==null&&trackId!==undefined&&window.EA_TRACKS)?window.EA_TRACKS[String(trackId)]:null;
  if(t){
    if(mode==='demo')t.textContent='Muro de boxes · Monza';
    else if(mode==='live'&&nm)t.textContent='Muro de boxes · '+nm;
    else t.textContent='Muro de boxes';}
  var side=el('side'),leg=el('legend');
  var showMap=(mode==='demo')||(mode==='live'&&nm==='Monza');
  window.__F1MAPLIVE=(mode==='live');
  if(side)side.style.display=showMap?'':'none';
  if(leg)leg.style.display=(mode==='demo')?'':'none';
  if(showMap&&el('map')&&window.TRACK_MONZA){
    drawMap(mode==='demo'?safeSeg():null);}}
function safeSeg(){try{return currentDeltaSeg();}catch(e){return null;}}
function liveSt(){
  try{
    if(!window.RXAPP)return null;
    var st=window.RXAPP.route('/state');
    if(st&&st.packets>0&&st.age!==null&&st.age<3)return st;
  }catch(e){}
  return null;}
function renderLiveCards(st){
  var L=window.LAPS_DEMO;if(!el('cards'))return;
  function lab(id,txt){var e=el(id);if(e&&e.previousElementSibling)e.previousElementSibling.textContent=txt;}
  function gap(msv){if(msv===null||msv===undefined)return '-';return (msv>=0?'+':'-')+(Math.abs(msv)/1000).toFixed(3).replace('.',',')+' s';}
  var lp=st.live&&st.live.lap,tel=st.live&&st.live.tel,stt=st.live&&st.live.status;
  setChrome('live',st.live.track&&st.live.track.id);
  var bl1=document.querySelector('#cards .band .col:nth-child(1) .lab');
  if(bl1)bl1.textContent='Hueco al de delante';
  var bl3=document.querySelector('#cards .band .col:nth-child(3) .lab');
  if(bl3)bl3.textContent='Hueco al lider';
  document.querySelector('#cards .card:nth-child(1) .lab').textContent='Posicion (en directo)';
  if(window.__f1bootmsg&&!window.__f1bootupd){window.__f1bootupd=1;window.__f1bootmsg.textContent='Muro de boxes. Datos en directo: todo lo que ves es tu telemetria real del juego.';}
  el('c-delta').textContent=lp?'P'+lp.pos:'-';
  el('c-delta').className='big';
  el('c-delta-sub').textContent=lp?('vuelta '+lp.lap+(st.live.track&&st.live.track.total_laps?' de '+st.live.track.total_laps:'')):'sin lapdata aun';
  document.querySelector('#cards .card:nth-child(2) .lab').textContent='Ultima vuelta';
  el('c-lap').textContent=lp&&lp.last_ms?fmtS(lp.last_ms/1000):'-';
  el('c-lap-sub').textContent=lp&&lp.last_ms?'en directo':'sin vuelta cerrada aun';
  var esLider=lp&&lp.pos===1;
  el('c-front').textContent=(lp&&!esLider)?gap(lp.front):'-';
  el('c-behind').textContent=(lp&&!esLider)?gap(lp.leader):'-';
  if(lp&&esLider){var sbB=el('c-behind');if(sbB)sbB.title='Eres el lider';}
  var midc2=document.querySelector('#cards .band .col:nth-child(2)');
  if(midc2){midc2.querySelector('.mid').textContent=lp?String(lp.lap):'-';var sb3=midc2.querySelector('.sub');if(sb3)sb3.textContent=(st.live.track&&st.live.track.total_laps)?'de '+st.live.track.total_laps:'';}
  var worstLab=document.querySelector('#cards .card:nth-child(4) .lab');
  if(worstLab)worstLab.textContent='Velocidad / marcha';
  el('c-worst').textContent=tel?(tel.speed+' km/h · M'+tel.gear):'-';
  el('c-worst').className='mid';
  el('c-worst-sub').textContent=tel?('acelerador '+Math.round(tel.throttle*100)+'% · freno '+Math.round(tel.brake*100)+'%'):'';
  var c5=document.querySelector('#cards .card:nth-child(5)');
  if(!stt){if(c5)c5.style.display='none';}
  else{
  if(c5)c5.style.display='';
  var l5b=document.querySelector('#cards .card:nth-child(5) .lab');
  if(l5b)l5b.textContent='ERS / combustible / gomas';
  var l5c=document.querySelector('#cards .card:nth-child(5) .sub');
  if(l5c)l5c.textContent='';
  var sect=el('c-sect');
  if(stt){
    sect.innerHTML='<div class="s"><div class="v">'+stt.ers_mode+'</div><div class="l">MODO ERS</div></div>'+
      '<div class="s"><div class="v">'+(stt.fuel_laps!=null?stt.fuel_laps.toFixed(1):'-')+'</div><div class="l">VUELTAS GAS</div></div>'+
      '<div class="s"><div class="v">'+(stt.tyre_age!=null?stt.tyre_age:'-')+'</div><div class="l">EDAD GOMAS</div></div>';}
  }
  var nd=document.querySelector('#cards .nodata');
  if(nd)nd.textContent='En directo por telemetria UDP del juego. Desgaste detallado, meteo y huecos durante SC no se muestran aqui.';
  var dt=document.querySelector('#cards .demotag');
  if(dt)dt.textContent='EN DIRECTO · telemetria del juego';
}
function apkMode(){return typeof window.Android!=='undefined';}
function demoMode(){return !apkMode()||(window.F1MODE&&window.F1MODE()==='demo');}
function renderNoDataCards(){
  if(!el('cards'))return;
  setChrome('nodata',null);
  var c5n=document.querySelector('#cards .card:nth-child(5)');
  if(c5n)c5n.style.display='';
  var bl1n=document.querySelector('#cards .band .col:nth-child(1) .lab');
  if(bl1n)bl1n.textContent='Ritmo vs delante';
  var bl3n=document.querySelector('#cards .band .col:nth-child(3) .lab');
  if(bl3n)bl3n.textContent='Ritmo vs detras';
  var l1=document.querySelector('#cards .card:nth-child(1) .lab');
  if(l1)l1.textContent='Posicion';
  var l2=document.querySelector('#cards .card:nth-child(2) .lab');
  if(l2)l2.textContent='Ultima vuelta';
  var l4=document.querySelector('#cards .card:nth-child(4) .lab');
  if(l4)l4.textContent='Velocidad / marcha';
  el('c-delta').textContent='-';el('c-delta').className='big';
  el('c-delta-sub').textContent='';
  el('c-lap').textContent='-';el('c-lap-sub').textContent='';
  el('c-front').textContent='-';el('c-behind').textContent='-';
  var midc=document.querySelector('#cards .band .col:nth-child(2)');
  if(midc){midc.querySelector('.mid').textContent='-';var sb2=midc.querySelector('.sub');if(sb2)sb2.textContent='';}
  el('c-worst').textContent='-';el('c-worst').className='mid';el('c-worst-sub').textContent='';
  el('c-sect').innerHTML='';
  var l5=document.querySelector('#cards .card:nth-child(5) .lab');
  if(l5)l5.textContent='Tercios de la ultima vuelta';
  var l5s=document.querySelector('#cards .card:nth-child(5) .sub');
  if(l5s)l5s.textContent='';
  var nd=document.querySelector('#cards .nodata');
  if(nd)nd.textContent='Sin datos en directo: la app espera telemetria del juego (UDP puerto 20777, activada en Ajustes de telemetria del F1 25). Puedes ver la demostracion con el boton de arriba; nunca se sustituye sola.';
  var dt=document.querySelector('#cards .demotag');
  if(dt)dt.textContent='SIN DATOS · esperando telemetria';
}
function renderCards(){
  var st=liveSt();
  if(st){renderLiveCards(st);return;}
  if(!demoMode()){renderNoDataCards();return;}
  setChrome('demo',null);
  var c5d=document.querySelector('#cards .card:nth-child(5)');
  if(c5d)c5d.style.display='';
  var d1=document.querySelector('#cards .card:nth-child(1) .lab');
  if(d1)d1.textContent='Vs el de delante (vuelta 2)';
  var d2=document.querySelector('#cards .card:nth-child(2) .lab');
  if(d2)d2.textContent='Última vuelta (2)';
  var d4=document.querySelector('#cards .card:nth-child(4) .lab');
  if(d4)d4.textContent='Dónde pierdes (vuelta 2)';
  var d5=document.querySelector('#cards .card:nth-child(5) .lab');
  if(d5)d5.textContent='Tercios de la última vuelta';
  var d5s=document.querySelector('#cards .card:nth-child(5) .sub');
  if(d5s)d5s.textContent='tercios de vuelta por distancia (la demo no tiene líneas de sector oficiales)';
  var ndd=document.querySelector('#cards .nodata');
  if(ndd)ndd.textContent='Intervalo real en carrera, posiciones, desgaste de neumático y meteo: sin datos en esta demo. La comparativa por curva sí está calculada de las trazas demo.';
  var dtd=document.querySelector('#cards .demotag');
  if(dtd)dtd.textContent='datos de demostración · trazas sintéticas';
  var bl1d=document.querySelector('#cards .band .col:nth-child(1) .lab');
  if(bl1d)bl1d.textContent='Ritmo vs delante';
  var bl3d=document.querySelector('#cards .band .col:nth-child(3) .lab');
  if(bl3d)bl3d.textContent='Ritmo vs detras';
  var L=window.LAPS_DEMO,AN=window.AN,T=window.TRACK_MONZA;
  if(!el('cards')||!L||!AN||!T)return;
  var DS2=10;
  function tend(tr){return tr[tr.length-1][1];}
  var t1=tend(L.player1),t2=tend(L.player2);
  var bestT=Math.min(t1,t2),bestN=t1<=t2?1:2;
  // delta total vs el de delante en la vuelta 2 (>0 = pierdes)
  var dFront=(t2-tend(L.rivalAhead))*1000;
  var dBehind=(t2-tend(L.rivalBehind))*1000;
  function signed(ms){return (ms>=0?'+':'-')+(Math.abs(ms)/1000).toFixed(3).replace('.',',')+' s';}
  var hd=el('c-delta');
  if(dFront<0){hd.textContent='GANAS '+(-dFront/1000).toFixed(3).replace('.',',')+' s';hd.className='big good';}
  else{hd.textContent='PIERDES '+(dFront/1000).toFixed(3).replace('.',',')+' s';hd.className='big bad';}
  el('c-delta-sub').textContent='vuelta 2 completa · signo: tu tiempo − el suyo, negativo = ganas';
  el('c-lap').textContent=fmtS(t2);
  el('c-lap-sub').textContent='mejor: '+fmtS(bestT)+' (v'+bestN+') · v1 '+fmtS(t1);
  el('c-front').textContent=signed(dFront);
  el('c-behind').textContent=signed(dBehind);
  // peor/mejor curva vs el de delante (mismo calculo que el chat)
  var worst=null,best=null;
  T.corners.forEach(function(c){
    var loss=-AN.cornerDelta(L.player2,L.rivalAhead,c,DS2)*1000; // >0 = pierdes tu (mismo calculo que chat.js)
    if(!worst||loss>worst.v)worst={c:c,v:loss};
    if(!best||loss<best.v)best={c:c,v:loss};});
  if(worst&&worst.v>0){el('c-worst').textContent='PIERDES '+Math.round(worst.v)+' ms';
    el('c-worst-sub').textContent='Curva '+worst.c.n+' · '+worst.c.name+(best&&best.v<0?' · donde mas ganas: curva '+best.c.n+' ('+best.c.name+') '+Math.round(-best.v)+' ms':'');}
  else if(best){el('c-worst').textContent='NO PIERDES en ninguna';el('c-worst').className='mid good';
    el('c-worst-sub').textContent='donde mas ganas: curva '+best.c.n+' ('+best.c.name+') '+Math.round(-best.v)+' ms';}
  // tercios de la ultima vuelta por distancia
  var M=L.player2[L.player2.length-1][0],thirds=[M/3,2*M/3,M],prev=0,out='';
  thirds.forEach(function(mk,i){var tm=AN.binAt(L.player2,mk,DS2)[1];out+='<div class="s"><div class="v">'+(tm-prev).toFixed(3).replace('.',',')+'</div><div class="l">TERCIO '+(i+1)+'</div></div>';prev=tm;});
  el('c-sect').innerHTML=out;}
function renderCtx(){var t=window.CHAT.memText(),b=el('ctxbar');if(!b)return;
  if(t){el('ctxtext').textContent='Contexto: '+t;b.hidden=false;}else b.hidden=true;}
function boot(){
  drawMap(null);
  renderCards();
  setInterval(renderCards,2000);
  var nat=window.VOICE&&window.VOICE.native&&window.VOICE.native();
  var inApk=typeof window.Android!=='undefined';
  /* barra de modo (solo APK): sin datos -> ofrecer demo explicita; demo -> volver a vivo */
  var mbar=el('modebar'),dbox=el('demo');
  function paintMode(){
    if(!inApk||!mbar)return;
    mbar.style.display='block';
    var live=!!liveSt(),mode=window.F1MODE();
    if(mode==='demo'){
      mbar.style.background='#3a2c00';mbar.style.color='#f5f5f5';
      mbar.innerHTML='Viendo la DEMOSTRACION (datos sinteticos). '+(live?'<b>Hay datos en directo disponibles.</b> ':'')+'<button id="mb-live" style="background:#123f2a;color:#a7f3c7;border:1px solid #1f6b45;border-radius:6px;padding:3px 8px;margin-left:6px">Ver en directo</button>';
      if(dbox)dbox.style.display='block';
    }else if(live){
      mbar.style.background='#123f2a';mbar.style.color='#a7f3c7';
      mbar.innerHTML='EN DIRECTO · telemetria del juego <button id="mb-demo" style="background:#3a2c00;color:#ffb340;border:1px solid #6b5a1f;border-radius:6px;padding:3px 8px;margin-left:6px">Ver demostracion</button>';
      if(dbox)dbox.style.display='none';
    }else{
      mbar.style.background='#3a1010';mbar.style.color='#ffb0a7';
      mbar.innerHTML='SIN DATOS en directo (esperando telemetria del juego, UDP 20777). <button id="mb-demo" style="background:#3a2c00;color:#ffb340;border:1px solid #6b5a1f;border-radius:6px;padding:3px 8px;margin-left:6px">Ver demostracion</button>';
      if(dbox)dbox.style.display='none';
    }
    var bl=el('mb-live');if(bl)bl.addEventListener('click',function(){window.F1SETMODE('live');});
    var bd=el('mb-demo');if(bd)bd.addEventListener('click',function(){window.F1SETMODE('demo');});
  }
  if(mbar){mbar.addEventListener('f1mode',function(){paintMode();renderCards();});}
  paintMode();
  setInterval(paintMode,2000);
  if(nat){
    var mc=el('mic-consent');
    if(mc)mc.innerHTML='El micro usa el reconocimiento de voz EN EL DISPOSITIVO: el audio no sale de la tablet. En modo radio la escucha sigue abierta entre preguntas hasta que la cierres con otro toque o diciendo "corta". <button id="mic-yes" style="background:#0a84ff;color:#fff;border:none;border-radius:6px;padding:4px 8px">Entendido, activar micro</button> <button id="mic-no" style="background:#2c2c2e;color:#f5f5f5;border:1px solid #444;border-radius:6px;padding:4px 8px">Ahora no</button>';
    var vi=el('voice-in');
    if(vi)vi.title='Reconocimiento en el dispositivo (on-device); el audio no sale de la tablet';
  }
  if(inApk&&!liveSt()&&window.F1MODE&&window.F1MODE()!=='demo'){
    addMsg('bot','Muro de boxes. Estoy esperando la telemetria del juego (UDP 20777): activala en Ajustes > Telemetria del F1 25 con esta IP. Cuando llegue, todo lo que veas sera en directo. Si quieres practicar, toca "Ver demostracion".');
    window.__f1bootmsg=el('chat').lastChild;}
  else addMsg('bot','Muro de boxes en demostracion: datos de ejemplo de Monza, no una sesion real. Pregunta por curvas, frenadas, rivales o vueltas, o charlemos. Con la APK y el juego en marcha, "Ver en directo" muestra tu telemetria real.');
  renderCtx();
  addEventListener('storage',function(e){if(e.key==='f1-chat-mem-v1')renderCtx();});
  var rb=el('ctxreset');if(rb)rb.addEventListener('click',function(){window.CHAT.resetMem();renderCtx();addMsg('bot','Contexto reiniciado: empezamos de cero. Pregunta por curvas, frenadas, rivales o vueltas.');});
  el('send').addEventListener('click',function(){var v=el('in').value;el('in').value='';if(v.trim())ask(v);});
  el('in').addEventListener('keydown',function(e){if(e.key==='Enter'){var v=el('in').value;el('in').value='';if(v.trim())ask(v);}});
  el('voice-out').addEventListener('click',function(){el('voice-out').textContent=window.VOICE.toggle()?'Voz: ON':'Voz: OFF';});
  var session=null,micOK=false,lapN=1;
  window.VOICE.onState(function(st,err){
    if(st==='speak-error'){
      el('voice-out').textContent='Voz: error';
      addMsg('bot','La voz ha fallado en este dispositivo (error del navegador: '+err+'). Revisa el volumen multimedia y la salida de voz del sistema; con ese error concreto puedo afinar la solucion.');}
    // barge-in: ya NO se pausa la escucha al hablar; la propia sesion (bargeIn:true)
    // interrumpe la voz si el usuario habla (guarda antieco incluida en voice.js).
    if(st==='interrupted')el('voice-in').textContent='Radio: ON';});
  function radioOff(silent){
    if(session){session.close();session=null;}
    el('voice-in').textContent='Micro';
    if(!silent)addMsg('bot','Sesion de radio cerrada. Toca Micro para abrirla de nuevo.');}
  function radioOn(){
    session=window.VOICE.listenSession({
      bargeIn:true,
      onFinal:function(txt){
        txt=window.VOICE.filterPhrase(txt);
        if(!txt)return;
        if(window.VOICE.isStopCmd(txt)){radioOff();return;}
        ask(txt);},
      onState:function(st){
        var b=el('btn-radio');
        if(st==='listening'){el('voice-in').textContent='Radio: ON';if(b)b.textContent='🎙 Cerrar radio';}
        else if(st==='idle'){el('voice-in').textContent='Micro';if(b)b.textContent='🎙 Abrir radio';}
        else if(st==='unsupported'){addMsg('bot',inApk?'Este dispositivo no ofrece reconocimiento de voz en el dispositivo, asi que el micro no esta disponible; puedes seguir escribiendo abajo.':'Este navegador no tiene reconocimiento de voz.');radioOff(true);}
        else if(st.indexOf('error:')===0){addMsg('bot','El micro ha fallado ('+st.slice(6)+'). Sesion cerrada; revisa el permiso de micro del navegador.');radioOff(true);}}});
    if(!session){addMsg('bot','Este navegador no tiene reconocimiento de voz.');return;}
    addMsg('bot','Modo radio abierto: habla cuando quieras, no hace falta tocar nada. Si hablas mientras te contesto, me callo y te escucho. Di "corta" o toca Micro para cerrar.');}
  el('voice-in').addEventListener('click',function(){
    if(session){radioOff();return;}
    if(micOK){radioOn();return;}
    el('mic-consent').style.display='block';});
  el('mic-yes').addEventListener('click',function(){micOK=true;el('mic-consent').style.display='none';radioOn();});
  el('mic-no').addEventListener('click',function(){el('mic-consent').style.display='none';});
  var brp=el('btn-repeat');if(brp)brp.addEventListener('click',function(){ask('repite');});
  var brd=el('btn-radio');if(brd)brd.addEventListener('click',function(){
    if(session){radioOff();return;}
    if(micOK){radioOn();return;}
    el('mic-consent').style.display='block';});
  el('lapdemo').addEventListener('click',function(){
    var r=window.CHAT.lapReport(lapN+1);
    if(r===null){addMsg('bot','Solo hay 2 vueltas de demostracion cargadas; el aviso automatico por vuelta en directo llegaria con los datos reales.');return;}
    lapN++;
    addMsg('bot',r);window.VOICE.speak(r);
    drawMap(currentDeltaSeg());renderCtx();renderCards();});}
window.UI={boot:boot,ask:ask,drawMap:drawMap};
})();
