/* Pestañas «Carrera» (evolución vuelta a vuelta) e «Histórico» (guardado local y subida a GitHub). */
(function(){
var $=function(i){return document.getElementById(i)};
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function t(ms){if(ms==null)return'-';var m=Math.floor(ms/60000),s=(ms%60000)/1000;return(m?m+':':'')+(m&&s<10?'0':'')+s.toFixed(3)}
function sg(ms){if(ms==null)return'-';return(ms>0?'+':ms<0?'−':'')+(Math.abs(ms)/1000).toFixed(2)+' s'}
function nameOf(st,i){if(i==null)return'';var c=(st.cars||[]).filter(function(x){return x.idx==i})[0];return c&&c.name?c.name:'coche '+i}
function isRace(st){var tp=st&&st.live&&st.live.track?st.live.track.type:null;return tp===15||tp===16||tp===17}
function isSes(st){return !!(st&&st.live&&st.live.track)}
function unk(x){var m=/^id (\d+)$/.exec(String(x));return m?'sin nombre conocido (id '+m[1]+')':x}
function stale(st){if(!st||!st.packets)return'<div class="warn">Sin paquetes del juego: no hay datos en directo.</div>';if(st.age!=null&&st.age>5)return'<div class="warn">Sin paquetes desde hace '+Math.round(st.age)+' s: lo que ves es lo último recibido, no está en directo.</div>';return''}
var STS={0:'?',1:'inactivo',2:'activo',3:'terminó',4:'no terminó',5:'descalificado',6:'no clasificado',7:'retirado'};
function resultCard(st){
  var r=st&&st.result;if(!r||!r.rows.length)return'';
  var fin=r.source=='final',h='<div class="card" style="margin-bottom:12px"><div class="lbl">Resultado '+(fin?'final (confirmado por el juego)':'provisional')+'</div>';
  if(!fin)h+='<div class="small" style="color:#ffd27a;margin:4px 0">Provisional: posiciones de Lap Data en directo. El resultado final llega del juego al terminar la carrera.</div>';
  h+='<table class="ct"><tr><th>Pos</th><th>Piloto</th>'+(fin?'<th>Salida</th>':'<th>Vuelta</th>')+'</tr>';
  r.rows.slice(0,24).forEach(function(x){
    var sub=fin?[STS[x.status]||x.status].concat(x.pen_s?['+'+x.pen_s+' s de sanción']:[]).concat(x.pits!=null?[x.pits+(x.pits==1?' parada':' paradas')]:[]).join(' · '):'';
    h+='<tr'+(x.me?' style="background:#241a1a"':'')+'><td>'+x.pos+'</td><td>'+esc(x.name||'?')+(sub?'<br><span class="small">'+esc(sub)+'</span>':'')+'</td>'+(fin?'<td>'+x.grid+(x.grid-x.pos?' <span style="color:'+(x.grid>x.pos?'#19c250':'#ff6b6b')+'">'+(x.grid>x.pos?'▲':'▼')+Math.abs(x.grid-x.pos)+'</span>':'')+'</td>':'<td>'+x.lap+'</td>')+'</tr>'});
  return h+'</table></div>';
}
function qualiCard(st){
  var f=st&&st.fastest;if(!f||!f.length)return'';
  var h='<div class="card" style="margin-bottom:12px"><div class="lbl">Orden por mejor vuelta válida (según el juego)</div><div style="overflow-x:auto"><table style="white-space:nowrap"><tr><th>#</th><th>Piloto</th><th>Mejor vuelta</th><th>Dif.</th></tr>';
  f.forEach(function(x,i){h+='<tr'+(x.me?' style="background:#241a1a"':'')+'><td>'+(i+1)+'</td><td>'+esc(x.name||'coche '+x.car)+'</td><td>'+t(x.best_valid_ms)+'</td><td>'+(i?'+'+((x.best_valid_ms-f[0].best_valid_ms)/1000).toFixed(3):'-')+'</td></tr>'});
  return h+'</table></div><div class="small" style="margin-top:6px;color:#9a9aa8">Solo vueltas que el juego marca como válidas. Sin vuelta válida no aparece.</div></div>';
}
var TIPOS={};['Libres 1','Libres 2','Libres 3','Libres cortas','Clasificación 1','Clasificación 2','Clasificación 3','Clasificación corta','Clasificación a una vuelta','Sprint Shootout 1','Sprint Shootout 2','Sprint Shootout 3','Sprint Shootout corto','Sprint Shootout a una vuelta','Carrera','Carrera 2','Carrera 3','Contrarreloj','Desconocida'].forEach(function(n){TIPOS[n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')]=n});
function nice(fn){var m=/^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})_(.+)_([a-z0-9\-]+)_([0-9a-f]{8})\.json$/.exec(fn);if(!m)return fn.replace('.json','');
  var tipoKey=null,circ=m[6],rest=m[7];
  // el nombre es fecha_circuito_tipo_uid: separa por el último "_" del tramo central
  var mid=fn.replace(/^\d{8}-\d{4}_/,'').replace(/_[0-9a-f]{8}\.json$/,''),k=mid.lastIndexOf('_');var c=k>=0?mid.slice(0,k):mid,t=k>=0?mid.slice(k+1):'';
  var d=new Date(Date.UTC(+m[1],+m[2]-1,+m[3],+m[4],+m[5]));
  function cap(x){return x.split('-').map(function(w){return w.charAt(0).toUpperCase()+w.slice(1)}).join(' ')}
  return d.toLocaleString('es-ES',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})+' · '+cap(c)+' · '+(TIPOS[t]||cap(t))}
function state(){try{return window.RXAPP&&window.RXAPP.route('/state')}catch(e){return null}}
var HX={
race:function(){
  var st=state(),el=$('rc_body');if(!el)return;
  var r=st&&st.race,pre=stale(st);
  if(!r){el.innerHTML=pre+'<div class="small">Esta pestaña es solo para carrera. Ahora la sesión no es una carrera: para libres y clasificación usa «Clasificación (quali)» y «Vueltas rápidas».</div>';return}
  pre+=resultCard(st);
  if(!r.laps.length){el.innerHTML=pre+'<div class="card small">Aún no hay ninguna vuelta completa de carrera. Se anota al cerrar cada vuelta.</div>';return}
  var tr=r.trend,h='';
  if(tr.slope_ms_per_lap!=null){
    var sl=tr.slope_ms_per_lap,txt=Math.abs(sl)<30?'Tus tiempos se mantienen estables':sl<0?'Tus tiempos mejoran':'Tus tiempos empeoran';
    h+='<div style="font-size:18px;font-weight:700;margin-bottom:4px">'+txt+'</div><div class="small">'+(sl>0?'+':sl<0?'−':'')+(Math.abs(sl)/1000).toFixed(2)+' s por vuelta de media · mediana '+t(tr.median_ms)+' · mejor '+t(tr.best_ms)+' · dispersión '+(tr.spread_ms/1000).toFixed(2)+' s · '+tr.n+' vueltas comparables</div><div class="small" style="margin-top:4px;color:#9a9aa8">Cálculo propio de la app, orientativo: el combustible baja y el neumático cae, así que algo de mejora o pérdida es normal.</div>';
  }else h+='<div class="small">'+esc(tr.note||'')+'</div>';
  h+='<div style="overflow-x:auto;margin-top:10px"><table><tr><th>V</th><th>Pos</th><th>Tiempo</th><th>Δ vuelta</th><th>Delante</th><th>Detrás</th></tr>';
  r.laps.forEach(function(o){
    var df=o.d_front_ms,db=o.d_behind_ms;
    function d2(v,goodNeg){if(v==null||Math.abs(v)<=30)return v==null?'':'<br><span class="small">igual</span>';var good=goodNeg?v<0:v>0;return'<br><span style="color:'+(good?'#19c250':'#ff6b6b')+'">'+(v<0?'−':'+')+(Math.abs(v)/1000).toFixed(2)+'</span>'}
    var front=o.front_ms==null?'-':(o.front_ms/1000).toFixed(1)+' s'+d2(o.d_front_ms,true);
    var beh=o.behind_ms==null?'-':(o.behind_ms/1000).toFixed(1)+' s'+d2(o.d_behind_ms,false);
    var dl=o.d_lap_ms==null?'-':'<span style="color:'+(o.d_lap_ms<0?'#19c250':o.d_lap_ms>0?'#ff6b6b':'#fff')+'">'+sg(o.d_lap_ms)+'</span>';
    h+='<tr style="white-space:nowrap'+(o.comparable?'':';opacity:.65')+'"><td>'+o.lap+'</td><td>'+o.pos+'</td><td>'+t(o.lap_ms)+'</td><td>'+dl+'</td><td>'+front+'</td><td>'+beh+'</td></tr>';
    var nn=o.notes;
    if(nn.length)h+='<tr><td></td><td colspan="5" class="small" style="color:#ffd27a">'+esc(nn.join(' · '))+'</td></tr>';
  });
  h+='</table></div><div class="small" style="margin-top:8px;line-height:1.5"><b>Cómo leerlo.</b> Δ vuelta: tu tiempo menos el de tu vuelta anterior (verde = más rápido). Delante: hueco al coche de delante; verde = lo recortas, rojo = se aleja. Detrás: hueco del de detrás; verde = se aleja, rojo = se acerca.</div><div class="small" style="margin-top:8px;color:#9a9aa8">'+esc(r.source)+' Cuando el coche de delante o detrás cambia (adelantamiento, boxes, retirada) o está doblado, no se compara su hueco. El primer dato y las vueltas con boxes, coche de seguridad o invalidez quedan atenuados y fuera de la tendencia.</div>';
  el.innerHTML=pre+'<div class="card"><div class="lbl">Evolución vuelta a vuelta</div>'+h+'</div>';
},
ctx:function(n){
  var st=state(),id='ctx'+n,p=$('p'+n);if(!p)return;var e=$(id);if(!e){e=document.createElement('div');e.id=id;p.insertBefore(e,p.firstChild)}
  var race=isRace(st),ses=isSes(st),h='';
  if(ses&&race&&(n==7))h='<div class="warn">Esto es para clasificación y libres. Estás en una carrera: mira la pestaña «Carrera» (resultado y evolución). Lo de abajo sigue siendo válido para comparar tus vueltas con las de un rival.</div>';
  e.innerHTML=stale(st)+h;
},
hist:function(){
  var el=$('hs_body');if(!el)return;
  var ae=document.activeElement;if(ae&&ae.id=='cid'&&el.contains(ae)&&!HX.force)return;HX.force=0;
  if(HX.cur){if(HX.drawn!==HX.cur){HX.drawn=HX.cur;el.innerHTML=HX.detail(HX.cur)}return}
  var A=window.Android,st=state(),h=stale(st);
  var sx=st&&st.session_extra,tk=st&&st.live&&st.live.track;
  var rec=null;try{rec=window.RXAPP.build('vista-ligera')}catch(e){}
  if(rec&&rec.session&&rec.session.uid){
    var s=rec.session,lp=rec.local_player||{};
    var old=st&&st.age!=null&&st.age>5;h+='<div class="card"><div class="lbl">'+(old?'Última sesión recibida (hace '+Math.round(st.age)+' s)':'Sesión actual')+'</div><div style="font-size:17px;font-weight:700;margin:4px 0">'+esc(s.track_name||'circuito desconocido')+' · '+esc(s.type_name||'')+'</div>'
      +'<div class="small">Modo: '+esc(unk(s.game_mode?s.game_mode.name:'desconocido'))+' · Reglas: '+esc(unk(s.ruleset?s.ruleset.name:'desconocido'))+' · '+(s.online==null?'online: desconocido':s.online?'online':'sin conexión online')+'</div>'
      +(old?'<div class="small" style="margin-top:6px;color:#ffd27a">La PS5 no está enviando datos (menús o cambio de circuito). Esto es lo último que llegó; se actualizará solo cuando empiece la nueva sesión en pista.</div>':'')
      +'<div class="small">Jugador (como lo envía el juego): '+esc(lp.name||'desconocido')+(lp.network_id!=null?' · id de red '+lp.network_id:'')+' · equipo '+esc(lp.team?lp.team.name:'?')+(lp.race_number!=null?' · n.º '+lp.race_number:'')+'</div></div>';
  }else h+='<div class="card small">Sin sesión en curso. Cuando llegue una, aquí verás sus datos.</div>';
  if(!A||!A.ghStatus){h+='<div class="card warn">Guardado y subida solo funcionan dentro de la app de Android.</div>';el.innerHTML=h;return}
  var g={};try{g=JSON.parse(A.ghStatus())}catch(e){}HX.gid=(g.state=='listo'||g.state=='activo')?g.id:(g.id||'');HX.web=g.web||'https://f1-receptor-gmf2.netlify.app';
  h+='<div class="card" style="margin-top:12px"><div class="lbl">Copia en la nube (privada)</div>';
  if(HX.nc){
    if(HX.rv&&Date.now()-HX.rvt>60000){HX.nc=null;HX.rv=0}
  }
  if(HX.nc){
    h+='<div class="warn">'+(HX.rv?'Qui\u00e9n tenga este ID y este c\u00f3digo puede ver todas tus sesiones. No lo compartas. Se oculta solo en 1 minuto.':'Guarda estos datos ahora. Luego podr\u00e1s volver a verlos con \u00abVer c\u00f3digo\u00bb.')+'</div>'
      +'<div class="small" style="margin-top:8px">Tu ID</div><div style="font:700 20px/1.3 monospace;word-break:break-all">'+esc(HX.nc.id)+'</div>'
      +'<div class="small" style="margin-top:8px">Tu c\u00f3digo</div><div style="font:700 20px/1.3 monospace;word-break:break-all">'+esc(HX.nc.code)+'</div>'
      +'<div class="small" style="margin-top:8px">Para consultar en el navegador:</div><div class="small" style="word-break:break-all">'+esc(HX.nc.url)+'</div>'
      +'<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap"><button class="rb" onclick="HX.cp(\'code\')">Copiar c\u00f3digo</button><button class="rb" onclick="HX.cp(\'url\')">Copiar enlace</button><button class="rb" onclick="HX.cp(\'both\')">Copiar ID + c\u00f3digo</button><button class="rb" onclick="HX.nc=null;HX.rv=0;HX.force=1;HX.hist()">'+(HX.rv?'Ocultar':'Ya lo he guardado')+'</button></div>';
  }else if(g.state=='sin_configurar'){
    h+='<div class="small">Elige un ID (6-32: min\u00fasculas, n\u00fameros y guiones). El m\u00f3vil crea un c\u00f3digo secreto aparte. Sin ID no se sube nada; todo sigue guard\u00e1ndose en el m\u00f3vil.</div>'
      +'<input id="cid" placeholder="mi-id-f1" value="'+esc(HX.draft||'')+'" oninput="HX.draft=this.value" autocapitalize="none" autocomplete="off" autocorrect="off" spellcheck="false" style="margin-top:8px;width:100%;box-sizing:border-box;padding:10px;font-size:16px"><div style="margin-top:8px"><button class="rb" onclick="HX.mk()">Crear ID y c\u00f3digo</button></div>'+(HX.err?'<div class="warn">'+esc(HX.err)+'</div>':'');
  }else{
    h+='<div style="font-weight:700;margin:4px 0">ID: '+esc(g.id)+'</div><div class="small">Se sube sola cada vez que se guarda una sesi\u00f3n y reintenta si no hay cobertura. Consulta: '+esc(g.web)+' (con tu ID y c\u00f3digo)</div>';
  }
  if(g.message&&!/tz\d\d_/.test(g.message))h+='<div class="warn">'+esc(g.message)+'</div>';
  if(g.disk_error)h+='<div class="warn">'+(g.disk_error=='DISCO_LLENO'?'Poco espacio en el m\u00f3vil: la app ha dejado de guardar sesiones nuevas y no borra nada. Libera espacio.':esc(g.disk_error))+'</div>';
  var tzc=0;try{tzc=JSON.parse(A.listSessions()).filter(function(x){return/^tz\d\d_/.test(x.name)}).length}catch(e){}g.pending=Math.max(0,(g.pending||0)-tzc);
  h+='<div class="small">'+g.uploaded+' sesiones subidas \u00b7 '+g.pending+' pendientes de subir</div><div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">';
  if(g.state=='listo'&&g.pending>0)h+='<button class="rb" onclick="HX.up()">Subir ahora</button>';
  if(g.state=='listo'&&!HX.nc)h+='<button class="rb" onclick="HX.rev()">Ver c\u00f3digo</button>';
  h+='<button class="rb" onclick="HX.share()">Compartir resumen</button></div>'+(HX.shmsg?'<div class="warn">'+esc(HX.shmsg)+'</div>':'')+'<div class="small" style="margin-top:6px">El resumen incluye tu ID y el enlace del visor, pero nunca el c\u00f3digo de acceso.</div></div>';
  var ls=[];try{ls=JSON.parse(A.listSessions())}catch(e){}var tzn=ls.filter(function(x){return/^tz\d\d_/.test(x.name)}).length;ls=ls.filter(function(x){return!/^tz\d\d_/.test(x.name)});
  h+='<div class="card" style="margin-top:12px"><div class="lbl">Guardadas en el móvil</div>'+(ls.length?ls.map(function(x){return'<div class="small" style="padding:8px 0;border-bottom:1px solid #26262e;cursor:pointer" onclick="HX.open(\''+esc(x.name)+'\')"><b style="font-size:14px">'+esc(nice(x.name))+'</b> · '+(x.pending?'<span style="color:#ffd27a">pendiente de subir</span>':'<span style="color:#19c250">subida</span>')+'</div>'}).join(''):'<div class="small">Todavía ninguna. Se guarda sola cada minuto durante la sesión, al llegar la clasificación final y al cambiar de sesión.</div>')+'</div>';
  el.innerHTML=h;
},
open:function(name){HX.cur=name;HX.drawn=null;HX.hist();window.scrollTo(0,0)},
back:function(){HX.cur=null;HX.drawn=null;HX.hist()},
detail:function(name){
  var A=window.Android,raw='',r=null,bk='<button class="rb" onclick="HX.back()">← Volver a la lista</button>';
  try{raw=A.readSession(name)}catch(e){}
  try{r=JSON.parse(raw)}catch(e){}
  if(!r||!r.session)return bk+'<div class="warn" style="margin-top:10px">No se pudo leer esta sesión guardada ('+esc(nice(name))+'). El archivo sigue en el móvil; no se ha borrado nada.</div>';
  var s=r.session,lp=r.local_player||{},q=r.quality||{},race=s.type===15||s.type===16||s.type===17,c=r.classification||{rows:[]},fin=String(c.source||'').indexOf('final')==0;
  var h=bk+'<div class="card" style="margin-top:10px">'+(r.simulated?'<div class="warn">DATOS SIMULADOS</div>':'')
    +'<div class="lbl">'+esc(nice(name))+'</div><div style="font-size:18px;font-weight:700;margin:4px 0">'+esc(s.track_name||'circuito desconocido')+' · '+esc(s.type_name||'sesión')+'</div>'
    +'<div class="small">Modo: '+esc(s.game_mode?s.game_mode.name:'desconocido')+' · Reglas: '+esc(s.ruleset?s.ruleset.name:'desconocido')+' · '+(s.online==null?'online: desconocido':s.online?'online':'sin conexión online')+(s.total_laps?' · '+s.total_laps+' vueltas':'')+'</div>'
    +'<div class="small">Jugador (como lo envió el juego): '+esc(lp.name||'desconocido')+' · equipo '+esc(lp.team?lp.team.name:'?')+'</div>'
    +'<div class="small">Guardada: '+esc(r.saved_at||'?')+' · motivo del guardado: '+esc(r.reason||'?')+' · paquetes: '+(q.packets==null?'?':q.packets)+' · tus vueltas registradas: '+(q.my_laps_recorded==null?'?':q.my_laps_recorded)+'</div>'
    +(race&&!q.final_received?'<div class="warn">No llegó la clasificación final del juego: el resultado de abajo es provisional.</div>':'')
    +(q.warning?'<div class="warn">'+esc(q.warning)+'</div>':'')+'</div>';
  if(c.rows&&c.rows.length){
    h+='<div class="card" style="margin-top:12px"><div class="lbl">'+(race?'Resultado ':'Clasificación en pista ')+(fin?'final (confirmado por el juego)':'provisional')+'</div>';
    if(!race)h+='<div class="small" style="color:#ffd27a;margin:4px 0">Orden en el momento de guardar. Las mejores vueltas válidas están en la tabla de abajo; no es un resumen de Q1/Q2/Q3.</div>';
    h+='<table class="ct"><tr><th>Pos</th><th>Piloto</th>'+(fin?'<th>Salida</th>':'<th>Vuelta</th>')+'</tr>';
    c.rows.slice(0,24).forEach(function(x){
      var sub=fin?[STS[x.status]||x.status].concat(x.pen_s?['+'+x.pen_s+' s de sanción']:[]).concat(x.pits!=null?[x.pits+(x.pits==1?' parada':' paradas')]:[]).join(' · '):'';
      h+='<tr'+(x.me?' style="background:#241a1a"':'')+'><td>'+esc(x.pos)+'</td><td>'+esc(x.name||'?')+(sub?'<br><span class="small">'+esc(sub)+'</span>':'')+'</td><td>'+esc(fin?(x.grid==null?'-':x.grid):(x.lap==null?'-':x.lap))+'</td></tr>'});
    h+='</table></div>';
  }
  var f=r.fastest_laps||[];
  if(f.length){
    h+='<div class="card" style="margin-top:12px"><div class="lbl">Mejor vuelta válida de cada coche</div><table class="ct"><tr><th>#</th><th>Piloto</th><th>Vuelta</th><th>S1</th><th>S2</th><th>S3</th></tr>';
    f.slice(0,24).forEach(function(x,i){h+='<tr'+(x.me?' style="background:#241a1a"':'')+'><td>'+(i+1)+'</td><td>'+esc(x.name||'?')+'</td><td>'+t(x.best_valid_ms)+'</td><td>'+t(x.s1)+'</td><td>'+t(x.s2)+'</td><td>'+t(x.s3)+'</td></tr>'});
    h+='</table></div>';
  }
  var L=r.my_losses||[];
  if(L.length){
    h+='<div class="card" style="margin-top:12px"><div class="lbl">Dónde pierdes frente a rivales más rápidos</div><div class="small">tú − rival: positivo = pierdes</div>';
    L.forEach(function(x){
      h+='<div style="margin-top:8px"><b>'+esc(x.name||'rival')+'</b>';
      if(x.error){h+='<div class="small">Sin comparación: '+esc(x.error)+'</div>'}
      else{h+=' · '+t(x.rival_time)+' vs tu '+t(x.my_time)+(x.total_s!=null?' ('+(x.total_s>0?'+':'')+Number(x.total_s).toFixed(3)+' s)':'');
        (x.worst||[]).forEach(function(w){h+='<div class="small">'+w.from_m+'-'+w.to_m+' m: '+(w.loss_s>0?'+':'')+w.loss_s+' s</div>'});
        if(x.coverage_ok===false)h+='<div class="small" style="color:#ffd27a">Cobertura de la traza insuficiente: orientativo.</div>'}
      h+='</div>'});
    h+='</div>';
  }
  var ev=r.race_evolution;
  if(race&&ev&&ev.laps&&ev.laps.length){
    function d(ms){return ms==null?'·':sg(ms)}
    h+='<div class="card" style="margin-top:12px"><div class="lbl">Carrera vuelta a vuelta</div><table class="ct"><tr><th>V</th><th>Pos</th><th>Tiempo</th><th>Δ vuelta</th><th>Delante</th><th>Detrás</th></tr>';
    ev.laps.forEach(function(o){h+='<tr'+(o.comparable?'':' style="opacity:.7"')+'><td>'+o.lap+'</td><td>'+(o.pos==null?'-':o.pos)+'</td><td>'+t(o.lap_ms)+'</td><td>'+d(o.d_lap_ms)+'</td><td>'+(o.front_ms==null?'-':(o.front_ms/1000).toFixed(1)+'s')+'</td><td>'+(o.behind_ms==null?'-':(o.behind_ms/1000).toFixed(1)+'s')+'</td></tr>'+(o.notes&&o.notes.length?'<tr><td></td><td colspan="5" class="small">'+esc(o.notes.join('; '))+'</td></tr>':'')});
    h+='</table>'+(ev.trend&&ev.trend.note?'<div class="small">'+esc(ev.trend.note)+'</div>':'')+(ev.source?'<div class="small" style="margin-top:6px">'+esc(ev.source)+'</div>':'')+'</div>';
  }
  return h+'<div class="small" style="margin:10px 0">Datos leídos del archivo guardado en el móvil; no se modifica nada.</div>';
},
mk:function(){var v=($('cid')||{}).value||HX.draft||'';HX.force=1,r={};try{r=JSON.parse(Android.cloudCreate(v))}catch(e){}if(r.ok){HX.nc=r;HX.err=''}else HX.err=r.error||'No se pudo crear el ID.';HX.hist()},
rev:function(){var r={};try{r=JSON.parse(Android.cloudReveal())}catch(e){}if(r.ok){HX.nc=r;HX.rv=1;HX.rvt=Date.now();HX.force=1;HX.hist()}},
cp:function(w){var n=HX.nc;if(!n)return;var t=w=='code'?n.code:w=='url'?n.url:'ID: '+n.id+'\nC\u00f3digo: '+n.code;try{Android.copy(t)}catch(e){}},
up:function(){if(window.Android&&Android.ghUploadNow){Android.ghUploadNow();setTimeout(HX.hist,900)}},
share:function(){
  var rec=null;HX.shmsg='';
  try{if(HX.cur){rec=JSON.parse(Android.readSession(HX.cur))}}catch(e){}
  if(!rec){try{var b=window.RXAPP.build('vista-ligera');if(b&&b.session&&b.session.uid)rec=b}catch(e){}}
  if(!rec){try{var ls=JSON.parse(Android.listSessions()).map(function(x){return x.name}).filter(function(n){return!/^tz\d\d_/.test(n)}).sort().reverse();if(ls.length)rec=JSON.parse(Android.readSession(ls[0]))}catch(e){}}
  if(!rec||!rec.session){HX.shmsg='Todav\u00eda no hay ninguna sesi\u00f3n para compartir.';HX.force=1;HX.hist();return}
  var s=rec.session,L=[],pad=function(n){return(n<10?'0':'')+n};
  var when='';if(s.started_at){var d=new Date(s.started_at);if(!isNaN(d))when=pad(d.getDate())+'/'+pad(d.getMonth()+1)+'/'+d.getFullYear()+' '+pad(d.getHours())+':'+pad(d.getMinutes())}
  L.push('F1 · '+(s.track_name||'circuito desconocido')+' · '+(s.type_name||'sesión')+(s.total_laps?' · '+s.total_laps+' vueltas':''));
  var meta=[];if(when)meta.push(when);if(s.game_mode&&s.game_mode.name)meta.push(s.game_mode.name);if(meta.length)L.push(meta.join(' · '));
  var c=rec.classification||{rows:[],source:''},fin=String(c.source||'').indexOf('final')==0,rows=(c.rows||[]).slice().sort(function(a,b){return(a.pos||99)-(b.pos||99)});
  function nm(r){return r.name||r.team||('Coche '+(r.car+1))}
  if(rows.length){L.push('');L.push(fin?'Clasificación final:':'Clasificación provisional (la sesión sigue o aún no hay resultado final):');
    rows.slice(0,10).forEach(function(r){L.push(r.pos+'. '+nm(r)+(r.me?' (yo)':''))});
    var me=rows.filter(function(r){return r.me})[0];if(me&&me.pos>10)L.push('...'+'\n'+me.pos+'. '+nm(me)+' (yo)');
  }
  var fl=(rec.fastest_laps||[]).filter(function(x){return x.best_valid_ms});
  if(fl.length){L.push('');L.push('Vuelta rápida: '+nm(fl[0])+' '+t(fl[0].best_valid_ms));var mf=fl.filter(function(x){return x.me})[0];if(mf&&mf!==fl[0])L.push('Mi mejor vuelta: '+t(mf.best_valid_ms))}
  (rec.my_losses||[]).slice(0,1).forEach(function(x){if(x.worst&&x.worst.length)L.push('Pierdo frente a '+(x.name||'rival')+' sobre todo en '+x.worst.map(function(w){return w.from_m+'-'+w.to_m+' m ('+(w.loss_s>0?'+':'')+w.loss_s+' s)'}).join(', ')+' (tú − rival)')});
  if(HX.gid){L.push('');L.push('Mi ID para verla en la nube: '+HX.gid);L.push('Visor: '+HX.web+'/#id='+encodeURIComponent(HX.gid)+' (hace falta el código de acceso, que no se comparte)')}
  var txt=L.join('\n');HX.lastShare=txt;
  if(window.Android&&Android.share)Android.share(txt);
  return txt;
}
};
window.HX=HX;
function diag(){var e=$('d_diag');if(!e)return;var S=null;try{S=window.RXAPP.state()}catch(x){}if(!S){e.innerHTML='';return}var P=S.pids||{},n=S.names_n||0,ne=S.names_nonempty||0;e.innerHTML='<div class="lbl">Diagn\u00f3stico de nombres</div><div class="small" style="margin-top:6px">Paquetes recibidos: '+(S.packets||0)+' \u00b7 paquetes de participantes (id 4): '+(P[4]||0)+' \u00b7 coches con ficha: '+n+' \u00b7 con nombre: '+ne+'</div><div class="small">'+(P[4]?(ne?'Los nombres llegan.':'Llegan los participantes pero sin nombres (el juego puede ocultarlos online).'):'No ha llegado ning\u00fan paquete de participantes: por eso salen sin nombre.')+'</div>'}
setInterval(function(){var _s=state(),_r=isRace(_s),_x=isSes(_s);if($('b7'))$('b7').style.opacity=(_x&&_r)?'.55':'';if($('b9'))$('b9').style.opacity=(_x&&!_r)?'.55':'';if($('p7')&&$('p7').style.display!='none')HX.ctx(7);if($('p8')&&$('p8').style.display!='none')HX.ctx(8);var p=$('p10');if(p&&p.style.display!='none')HX.hist();var q=$('p9');if(q&&q.style.display!='none')HX.race();diag()},2500);
})();
