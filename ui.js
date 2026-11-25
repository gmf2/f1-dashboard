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
  svg.querySelectorAll('.corner').forEach(function(g){
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
function renderCards(){
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
  addMsg('bot','Muro de boxes (demo Monza). Analisis y enrutado sin IA, todo calculo local: pregunta por curvas, frenadas, rivales o vueltas, o charlemos un rato. Los datos son de demostracion; las trazas reales llegarian por la APK, que esta en desarrollo.');
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
        else if(st==='unsupported'){addMsg('bot','Este navegador no tiene reconocimiento de voz.');radioOff(true);}
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
