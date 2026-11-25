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
function renderCtx(){var t=window.CHAT.memText(),b=el('ctxbar');if(!b)return;
  if(t){el('ctxtext').textContent='Contexto: '+t;b.hidden=false;}else b.hidden=true;}
function boot(){
  drawMap(null);
  addMsg('bot','Muro de boxes (demo Monza). Analisis y enrutado sin IA, todo calculo local: pregunta por curvas, frenadas, rivales o vueltas, o charlemos un rato. Los datos son de demostracion; las trazas reales llegarian por la APK, que esta en desarrollo.');
  renderCtx();
  addEventListener('storage',function(e){if(e.key==='f1-chat-mem-v1')renderCtx();});
  var rb=el('ctxreset');if(rb)rb.addEventListener('click',function(){window.CHAT.resetMem();renderCtx();addMsg('bot','Contexto reiniciado: empezamos de cero. Pregunta por curvas, frenadas, rivales o vueltas.');});
  el('send').addEventListener('click',function(){var v=el('in').value;el('in').value='';if(v.trim())ask(v);});
  el('in').addEventListener('keydown',function(e){if(e.key==='Enter'){var v=el('in').value;el('in').value='';if(v.trim())ask(v);}});
  el('voice-out').addEventListener('click',function(){el('voice-out').textContent=window.VOICE.toggle()?'Voz: ON':'Voz: OFF';});
  var micOK=false;
  function startListen(){window.VOICE.listen(function(txt){ask(txt);},function(st){el('voice-in').textContent=st==='listening'?'Escuchando...':'Micro';});}
  el('voice-in').addEventListener('click',function(){
    if(micOK){startListen();return;}
    el('mic-consent').style.display='block';});
  el('mic-yes').addEventListener('click',function(){micOK=true;el('mic-consent').style.display='none';startListen();});
  el('mic-no').addEventListener('click',function(){el('mic-consent').style.display='none';});}
window.UI={boot:boot,ask:ask,drawMap:drawMap};
})();
