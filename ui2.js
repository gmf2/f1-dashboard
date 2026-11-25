/* Paneles nuevos de la demo. TODOS los valores de este archivo son SIMULADOS (generados aquí), no vienen de ninguna partida. */
(function(){
var $=function(i){return document.getElementById(i)};
var TOTAL=10, LAP_S=100, LAPLEN=5300;
var NAMES=['Rival 1','Rival 2','Rival 3','Rival 4','Rival 5','Rival 6','Rival 7','Rival 8','Rival 9','Rival 10','Rival 11','Rival 12','Rival 13','Rival 14','Rival 15','Rival 16','Rival 17','Rival 18','Rival 19'];
var t0=Date.now(),hist=[];
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function prof(s){ // perfil de velocidad simulado (km/h) por distancia
  var u=s/LAPLEN*2*Math.PI;
  var v=205+95*Math.sin(u*3+.4)*Math.cos(u*2)+30*Math.sin(u*7);
  return clamp(v,68,320)}
function sample(t){
  var lapf=t/LAP_S,lap=Math.floor(lapf)+1,s=(lapf%1)*LAPLEN;
  var v=prof(s),v2=prof(s+30),acc=(v2-v);
  var thr=acc>-1.2?clamp(.55+acc/6,0,1):0, brk=acc<-1.2?clamp(-acc/10,0,1):0;
  if(v>300)thr=1;
  var gear=clamp(Math.round(v/42)+1,1,8);
  var rpm=clamp(4500+((v%42)/42)*7500+gear*40,4000,12500);
  var steer=Math.sin(s/LAPLEN*2*Math.PI*9)*clamp((320-v)/250,0,1);
  return{lap:lap,s:s,v:v,thr:thr,brk:brk,gear:gear,rpm:rpm,steer:steer}}
function rnd(a){var x=Math.sin(a*12.9898)*43758.5453;return x-Math.floor(x)}
function sim(){
  var t=(Date.now()-t0)/1000+160, p=sample(t), lapDone=p.lap-1, lf=p.s/LAPLEN;
  var ers=clamp(2.6+Math.sin(t/7)*1.3,.2,4), harv=clamp(lf*7.2,0,8.5), dep=clamp(lf*8.4,0,9.5);
  var fuel=Math.max(0,30-(lapDone+lf)*1.35), fuelLaps=fuel/1.35-(TOTAL-lapDone-lf);
  var wear=[1,2,3,4].map(function(k){return clamp((lapDone+lf)*(3.2+k*.35)+rnd(k)*3,0,95)});
  var tyreT=[0,1,2,3].map(function(k){return Math.round(88+p.thr*14+p.v/30+(k%2)*3+rnd(k+p.lap)*2)});
  var innerT=tyreT.map(function(x){return x+8});
  var brkT=[0,1,2,3].map(function(k){return Math.round(380+p.brk*420+(k<2?60:0)+Math.sin(t+k)*15)});
  var sec=lf<.33?0:lf<.66?1:2;
  var pos=5; var gapA=1.2+Math.sin(t/11)*.4, gapB=.9+Math.cos(t/9)*.3;
  var delta=Math.sin(t/8)*.18+Math.sin(t/3)*.04;
  return{t:t,p:p,ers:ers,harv:harv,dep:dep,fuel:fuel,fuelLaps:fuelLaps,wear:wear,tyreT:tyreT,innerT:innerT,brkT:brkT,sec:sec,lf:lf,pos:pos,gapA:gapA,gapB:gapB,delta:delta,drs:(p.v>230&&p.thr>.9)?1:0}}
var secT=[27.4,40.1,32.3],secBest=[27.2,40.3,32.3];
function fmtLap(x){var m=Math.floor(x/60),s=x-m*60;return m+':'+(s<10?'0':'')+s.toFixed(3)}
function bar(pct,col){return'<div class="bar"><i style="width:'+clamp(pct,0,100)+'%;background:'+col+'"></i></div>'}
function tyreHTML(S){
  var lab=['DI','DD','TI','TD'],h='<div class="tyres4">';
  for(var k=0;k<4;k++){var w=S.wear[k],c=w<35?'#19c250':w<65?'#ffd400':'#e10600';
    h+='<div class="tcell"><div class="lbl">'+['Del. izq','Del. der','Tras. izq','Tras. der'][k]+'</div><div class="tw" style="color:'+c+'">'+Math.round(w)+'%<span class="small"> desgaste</span></div><div class="small">sup. '+S.tyreT[k]+'° · int. '+S.innerT[k]+'°</div><div class="small">freno '+S.brkT[k]+'°</div></div>'}
  return h+'</div>'}
var inp=[];
function drawInputs(S){var c=$('cinp');if(!c)return;var w=c.clientWidth,h=150,dp=window.devicePixelRatio||1;c.width=w*dp;c.height=h*dp;var g=c.getContext('2d');g.scale(dp,dp);
  inp.push([S.p.thr,S.p.brk,S.p.steer]);if(inp.length>120)inp.shift();
  var ser=[[0,'#19c250',1],[1,'#e10600',1],[2,'#4aa3ff',.5]];
  g.strokeStyle='#26262e';g.beginPath();g.moveTo(0,h/2);g.lineTo(w,h/2);g.stroke();
  ser.forEach(function(s){g.strokeStyle=s[1];g.lineWidth=2;g.beginPath();inp.forEach(function(q,i){var x=i/119*w,y=s[0]==2?h/2-q[2]*h*.45:h-6-q[s[0]]*(h-14);i?g.lineTo(x,y):g.moveTo(x,y)});g.stroke()})}
function ledbar(rpm){var L=$('leds2');if(!L.children.length)for(var i=0;i<15;i++){var d=document.createElement('div');d.className='led';L.appendChild(d)}
  var n=Math.round(clamp((rpm-9000)/3200,0,1)*15);for(var i=0;i<15;i++)L.children[i].style.background=i<n?(i<5?'#19c250':i<10?'#e10600':'#2f6bff'):'#222'}
var COMPN={16:'Blando',17:'Medio',18:'Duro',7:'Intermedio',8:'Lluvia'},COMPL={16:'S',17:'M',18:'H',7:'I',8:'W'};
var ERSM=['ninguno','medio','vuelta rápida','boost'];
function tz(a,j){return a&&a[j]>0?a[j]+'°':'—'} // 0 °C no es físico: el paquete no lo trae (restringido o aún sin datos), se muestra «—»
function ok(x){return x!==null&&x!==undefined}
function f1(x,n){return ok(x)?x.toFixed(n):'—'}
function rxS(d){ // estado real del receptor local: todo lo que no llega se queda en null (se muestra «—»)
  var lv=d.live||{},tel=lv.tel,st=lv.status,lap=lv.lap,dm=lv.damage,T=lv.track,t2=lv.t2;
  if(!tel&&!lap&&!st)return null;
  var S={rx:true,t:Date.now()/1000},p=S.p={v:tel?tel.speed:null,gear:tel?tel.gear:null,rpm:tel?tel.rpm:null,thr:tel?tel.throttle:0,brk:tel?tel.brake:0,steer:tel?tel.steer:0,bits:tel?tel.rev_bits:0,lap:lap?lap.lap:null};
  S.tyreT=tel?tel.tyre_surf:null;S.innerT=tel?tel.tyre_inner:null;S.brkT=tel?tel.brake_temp:null;S.wear=dm?dm.wear:null;
  S.ersJ=st?st.ers_j:null;S.ersMode=st?st.ers_mode:null;S.harvK=st?st.ers_harv_k:null;S.dep=st?st.ers_dep:null;
  S.fuel=st?st.fuel_kg:null;S.fuelLaps=st?st.fuel_laps:null;S.bias=st?st.brake_bias:null;S.comp=st?st.visual:null;S.age=st?st.tyre_age:null;
  S.aero=t2?t2.aero_mode:null;S.boost=t2?t2.boost_active:null;
  S.total=T&&T.is_race?T.total_laps:0;S.isRace=T?T.is_race:false;
  var cars=d.cars||[];S.ncars=cars.length;S.pos=lap?lap.pos:null;
  S.front=lap&&lap.front?lap.front/1000:null;
  var beh=null;cars.forEach(function(c){if(lap&&c.pos==lap.pos+1)beh=c.front/1000});S.behind=beh;
  S.sec=lap?lap.sector:null;S.s1=lap&&lap.s1?lap.s1/1000:null;S.s2=lap&&lap.s2?lap.s2/1000:null;S.last=lap&&lap.last_ms?lap.last_ms/1000:null;
  var best=null;(d.laps||[]).forEach(function(l){if(l.is_best)best=l.time});S.best=best;
  S.fuelMargin=(ok(S.fuelLaps)&&S.total&&lap)?S.fuelLaps-(S.total-lap.lap+1):null;
  return S}
function getS(){if(window.__demo)return sim();if(window.__rx&&window.RX)return rxS(window.RX);return null}
function ledbar2(S){var L=$('leds2');if(!L.children.length)for(var i=0;i<15;i++){var d=document.createElement('div');d.className='led';L.appendChild(d)}
  for(var i=0;i<15;i++){var on=S.rx?((S.p.bits>>i)&1):(i<Math.round(clamp((S.p.rpm-9000)/3200,0,1)*15));L.children[i].style.background=on?(i<5?'#19c250':i<10?'#e10600':'#2f6bff'):'#222'}}
var TMAP=[2,3,0,1],TLAB=['Del. izq','Del. der','Tras. izq','Tras. der']; // el paquete ordena RL,RR,FL,FR
function tyreHTML2(S){var h='<div class="tyres4">';
  for(var k=0;k<4;k++){var j=TMAP[k],w=S.wear?S.wear[j]:null,c=!ok(w)?'#888':w<35?'#19c250':w<65?'#ffd400':'#e10600';
    h+='<div class="tcell"><div class="lbl">'+TLAB[k]+'</div><div class="tw" style="color:'+c+'">'+(ok(w)?Math.round(w)+'%':'—')+'<span class="small"> desgaste</span></div>'+(ok(w)?bar(w,c):'')+'<div class="small">sup. '+tz(S.tyreT,j)+' · int. '+tz(S.innerT,j)+'</div><div class="small">freno '+tz(S.brkT,j)+'</div></div>'}
  var c=S.comp;return h+'</div>'+(S.rx?'<div class="small" style="margin-top:6px">Neumático montado: '+(COMPN[c]||'—')+' · edad '+(ok(S.age)?S.age+' vueltas':'—')+(S.wear?'':' · desgaste: sin Car Damage')+'</div>':'')}
var WH={},lastLap=0,SB=[null,null];
function recWear(S){var L=S.p.lap;if(!ok(L)||!S.wear)return;if(L<lastLap){WH={};SB=[null,null]}lastLap=L;
  if(!S.rx){for(var l=1;l<L;l++)WH[l]=[1,2,3,4].map(function(k){return clamp(l*(3.2+k*.35)+rnd(k)*3,0,95)})}
  WH[L]=S.wear.slice()}
function drawWH(){var p=$('p4');if(!p)return;var cv=$('whc');
  if(!cv){var d=document.createElement('div');d.className='card';d.style.marginTop='12px';d.innerHTML='<div class="lbl">Desgaste de neumáticos por rueda, vuelta a vuelta</div><canvas id="whc"></canvas><div class="small" id="whn"></div>';p.appendChild(d);cv=$('whc')}
  var ks=Object.keys(WH).map(Number).sort(function(a,b){return a-b});var w=cv.clientWidth,h=170;if(!w)return;var dp=window.devicePixelRatio||1;cv.width=w*dp;cv.height=h*dp;var g=cv.getContext('2d');g.scale(dp,dp);
  $('whn').textContent=ks.length<2?'Se dibuja a medida que se completan vueltas; el programa guarda el desgaste de cada vuelta que recibe. Fuente: Car Damage.':'Medido con lo recibido en cada vuelta ('+ks.length+' puntos). Fuente: Car Damage.';
  if(!ks.length)return;var mx=Math.max(10,Math.max.apply(0,ks.map(function(l){return Math.max.apply(0,WH[l])})));mx=Math.ceil(mx/10)*10;
  g.font='11px Arial';g.fillStyle='#9a9aa8';g.fillText(mx+'%',2,12);g.fillText('0%',2,h-16);
  var cols=['#4aa3ff','#ff5c8a','#ff9d3c','#ffd400'],x0=34,x1=w-10,X=function(i){return ks.length==1?x0:x0+i*(x1-x0)/(ks.length-1)},Y=function(v){return h-20-(v/mx)*(h-34)};
  for(var k=0;k<4;k++){var j=TMAP[k];g.strokeStyle=cols[k];g.fillStyle=cols[k];g.lineWidth=2;g.beginPath();ks.forEach(function(l,i){var v=WH[l][j];i?g.lineTo(X(i),Y(v)):g.moveTo(X(i),Y(v))});g.stroke();ks.forEach(function(l,i){g.fillRect(X(i)-2,Y(WH[l][j])-2,4,4)})}
  ks.forEach(function(l,i){g.fillStyle='#9a9aa8';if(ks.length<16||i%2==0)g.fillText(l,X(i)-3,h-4)});
  TLAB.forEach(function(t,k){g.fillStyle=cols[k];g.fillRect(w-250+k*62,4,8,8);g.fillStyle='#9a9aa8';g.fillText(t.replace('Del.','D.').replace('Tras.','T.'),w-238+k*62,12)})}
function tick(){
  var S=getS();if(S)recWear(S);
  if(!S){if(window.__rx){$('d_gear').textContent='-'}return}
  var p=S.p;
  if(S.rx){
    ledbar2(S);
    $('d_gear').textContent=ok(p.gear)?(p.gear<0?'R':p.gear==0?'N':p.gear):'—';$('d_spd').textContent=ok(p.v)?p.v:'—';$('d_rpm').textContent=ok(p.rpm)?p.rpm:'—';
    $('d_lap').textContent=ok(p.lap)?('Vuelta '+p.lap+(S.total?' de '+S.total:'')):'—';$('d_pos').textContent=ok(S.pos)?('P'+S.pos+(S.ncars?' / '+S.ncars:'')):'—';
    $('d_delta').textContent='—';$('d_delta').style.color='#fff';
    var cs=(window.RX&&window.RX.cars)||[],nm=function(q){var c=cs.filter(function(x){return x.pos==q})[0];return c&&c.name?' ('+c.name+')':''};
    $('d_gaps').innerHTML='Delante <b>'+(S.front!==null?S.front.toFixed(1)+' s':'—')+'</b>'+(S.pos?nm(S.pos-1):'')+' · Detrás <b>'+(S.behind!==null?S.behind.toFixed(1)+' s':'—')+'</b>'+(S.pos?nm(S.pos+1):'');
    $('d_ers').innerHTML=(ok(S.ersJ)?(S.ersJ/1e6).toFixed(2):'—')+' <span class="small">MJ almacenados</span><div class="small">Recuperado vuelta (MGU-K): '+(ok(S.harvK)?(S.harvK/1e6).toFixed(1)+' MJ':'—')+' · Desplegado: '+(ok(S.dep)?(S.dep/1e6).toFixed(1)+' MJ':'—')+' · Modo: '+(ERSM[S.ersMode]||'—')+'</div><div class="small">El juego no da la capacidad máxima, por eso no hay barra.</div>';
    $('d_fuel').innerHTML=(ok(S.fuel)?S.fuel.toFixed(1):'—')+' <span class="small">kg en depósito</span><div class="small">Combustible para '+f1(S.fuelLaps,1)+' vueltas (valor del juego)'+(S.fuelMargin!==null?' · margen '+(S.fuelMargin>=0?'+':'')+S.fuelMargin.toFixed(1)+' vueltas (cálculo propio)':'')+'</div>';
    $('d_aero').innerHTML='<span class="pill">Aero: '+(S.aero===0?'curva':S.aero===1?'recta':'—')+'</span><span class="pill" style="background:'+(S.boost?'#19c250':'#444')+'">Boost '+(S.boost?'activo':S.boost===null?'—':'inactivo')+'</span><span class="pill">Reparto freno '+(ok(S.bias)&&S.bias>0?S.bias+'%':'—')+'</span>';
    $('d_tyres').innerHTML=tyreHTML2(S);
    if(S.s1>0)SB[0]=SB[0]===null?S.s1:Math.min(SB[0],S.s1);if(S.s2>0)SB[1]=SB[1]===null?S.s2:Math.min(SB[1],S.s2);
    var cell=function(i,v){var cur=S.sec==i,c=v?((SB[i]!==null&&v<=SB[i]+0.0005)?'#19c250':'#e8a100'):cur?'#555':'#333';return'<div class="sec" style="background:'+c+'"><div class="lbl">S'+(i+1)+'</div><b>'+(v?v.toFixed(3):'-')+'</b></div>'};
    $('d_sec').innerHTML=cell(0,S.s1)+cell(1,S.s2)+cell(2,null);
    $('d_last').textContent=S.last?fmtLap(S.last):'—';$('d_best').textContent=S.best?fmtLap(S.best):'—';
    drawInputs(S);return}
  ledbar2(S);
  $('d_gear').textContent=p.gear;$('d_spd').textContent=Math.round(p.v);$('d_rpm').textContent=Math.round(p.rpm);
  $('d_lap').textContent='Vuelta '+Math.min(p.lap,TOTAL)+' de '+TOTAL;$('d_pos').textContent='P'+S.pos+' / 20';
  var dl=S.delta;$('d_delta').textContent=(dl>0?'+':'')+dl.toFixed(2)+' s';$('d_delta').style.color=dl>0?'#ff6b6b':'#4ade80';
  $('d_gaps').innerHTML='Delante <b>'+S.gapA.toFixed(1)+' s</b> · Detrás <b>'+S.gapB.toFixed(1)+' s</b>';
  $('d_ers').innerHTML=S.ers.toFixed(2)+' <span class="small">MJ almacenados</span><div class="small">Recuperado vuelta (MGU-K): '+S.harv.toFixed(1)+' MJ · Desplegado: '+S.dep.toFixed(1)+' MJ · Modo: medio</div><div class="small">El juego no da la capacidad máxima, por eso no hay barra.</div>';
  $('d_fuel').innerHTML=S.fuel.toFixed(1)+' <span class="small">kg en depósito</span><div class="small">Combustible para '+(S.fuel/1.35).toFixed(1)+' vueltas · margen '+(S.fuelLaps>=0?'+':'')+S.fuelLaps.toFixed(1)+' vueltas (cálculo propio)</div>';
  $('d_aero').innerHTML='<span class="pill">'+(p.v>200?'Aero: recta':'Aero: curva')+'</span><span class="pill" style="background:'+(S.drs?'#19c250':'#444')+'">Boost '+(S.drs?'activo':'inactivo')+'</span><span class="pill">Reparto freno 57%</span>';
  $('d_tyres').innerHTML=tyreHTML2(S);
  var sc=['#19c250','#ffd400','#a855f7'],cell=function(i){var done=S.sec>i,cur=S.sec==i;var c=done?(i==1?'#a855f7':'#19c250'):cur?'#ffd400':'#333';return'<div class="sec" style="background:'+c+'"><div class="lbl">S'+(i+1)+'</div><b>'+(done||cur?secT[i].toFixed(3):'-')+'</b></div>'};
  $('d_sec').innerHTML=cell(0)+cell(1)+cell(2);
  $('d_last').textContent=fmtLap(100.05+Math.sin(p.lap)*.4);$('d_best').textContent=fmtLap(99.62);
  drawInputs(S)}
// ---- Carrera (torre) ----
var CARS=[];for(var i=0;i<20;i++)CARS.push({n:i==4?'TÚ':NAMES[i<4?i:i-1],base:i,tyre:['M','M','H','S'][i%4],stops:i%3==0?1:0,pen:i==7?5:0});
function renderRaceRx(){
  $('tw_n').textContent='('+((window.RX&&window.RX.cars||[]).length)+' coches en la sesión)';
  var d=window.RX,cars=(d&&d.cars)||[];
  if(!cars.length){$('d_tower').innerHTML='<div class="small">Sin datos de otros coches todavía (paquete Lap Data).</div>';$('d_weather').innerHTML='<div class="small">Previsión del tiempo: el programa aún no lee el paquete Session completo. N/A.</div>';return}
  var sorted=cars.slice().sort(function(a,b){return a.pos-b.pos});
  var mine=sorted.filter(function(c){return c.player})[0],ml=mine&&mine.last_ms>0?mine.last_ms:0;
  var rows=sorted.map(function(c){var me=c.player,ll=c.last_ms>0?fmtLap(c.last_ms/1000):'—',dl='—';
   if(!me&&ml&&c.last_ms>0){var dd=(c.last_ms-ml)/1000;dl='<span style="color:'+(dd>0?'#4ade80':'#ff6b6b')+'">'+(dd>0?'+':'')+dd.toFixed(3)+'</span>'}
   var ld=c.pos==1?'Líder':(c.leader?'+'+(c.leader/1000).toFixed(1):'—');
   var g=c.pos==1?'Líder':(c.front?'+'+(c.front/1000).toFixed(1):'—'),L=COMPL[c.comp&&c.comp[0]]||'—';
   return'<tr'+(me?' style="background:#2a1214"':'')+'><td>'+c.pos+'</td><td>'+(c.name||('Coche '+c.idx))+(c.restricted?' <span class="small">(telemetría restringida)</span>':'')+'</td><td>'+g+'</td><td>'+ld+'</td><td>'+ll+'</td>'+RV.sec(c.idx).map(function(x){return'<td>'+x+'</td>'}).join('')+'<td>'+(me?'—':dl)+'</td><td><span class="pill">'+L+'</span></td><td>'+c.pits+'</td><td>'+(c.pen?'+'+c.pen+' s':'—')+'</td></tr>'}).join('');
  $('d_tower').innerHTML='<table><tr><th>Pos</th><th>Piloto</th><th>Al de delante</th><th>Al líder</th><th>Última vuelta</th><th>S1</th><th>S2</th><th>S3</th><th>Rival vs tu última</th><th>Neumático</th><th>Paradas</th><th>Sanción</th></tr>'+rows+'</table><div class="small">Verde = el rival fue más lento que tú en su última vuelta.</div>';
  $('d_weather').innerHTML='<div class="small">Previsión del tiempo: el programa aún no lee el paquete Session completo. N/A.</div>'}
function renderRace(){
  if(window.__rx&&!window.__demo)return renderRaceRx();
  if(window.__demo)$('tw_n').textContent='(20 coches simulados)';
  if(!window.__demo)return;var t=(Date.now()-t0)/1000;
  var rows=CARS.map(function(c,i){var gap=i==0?'Líder':'+'+(i*1.1+Math.sin(t/6+i)*.3).toFixed(1);var me=c.n=='TÚ';var dd=Math.sin(i*1.7)*.35+(i-4)*.03,ldr=i==0?'Líder':'+'+(i*1.15).toFixed(1),lastR=100.05+dd;
    var tc={S:'#e10600',M:'#ffd400',H:'#ddd'}[c.tyre];
    return'<tr'+(me?' style="background:#2a1214"':'')+'><td>'+(i+1)+'</td><td>'+c.n+'</td><td>'+gap+'</td><td>'+ldr+'</td><td>'+fmtLap(lastR)+'</td>'+RV.sec(i).map(function(x){return'<td>'+x+'</td>'}).join('')+'<td>'+(me?'—':'<span style="color:'+(dd>0?'#4ade80':'#ff6b6b')+'">'+(dd>0?'+':'')+dd.toFixed(3)+'</span>')+'</td><td><span class="pill" style="background:'+tc+';color:#000">'+c.tyre+'</span></td><td>'+c.stops+'</td><td>'+(c.pen?'+'+c.pen+' s':'')+'</td></tr>'}).join('');
  $('d_tower').innerHTML='<table><tr><th>Pos</th><th>Piloto</th><th>Al de delante</th><th>Al líder</th><th>Última vuelta</th><th>S1</th><th>S2</th><th>S3</th><th>Rival vs tu última</th><th>Neumático</th><th>Paradas</th><th>Sanción</th></tr>'+rows+'</table><div class="small">Datos simulados. Rival vs tu última: verde = más lento que tú, rojo = más rápido.</div>';
  var fc=[['Ahora','Despejado',24,31],['+10 min','Nubes',23,30],['+20 min','Nubes',22,29],['+30 min','Lluvia ligera (prob. 40%)',20,26]];
  $('d_weather').innerHTML='<div class="warn">Solo demo. El receptor todavía no lee la previsión ni la ventana de parada (están en el paquete Session, documentado pero no leído).</div><table><tr><th>Momento</th><th>Tiempo</th><th>Aire °C</th><th>Pista °C</th></tr>'+fc.map(function(r){return'<tr><td>'+r[0]+'</td><td>'+r[1]+'</td><td>'+r[2]+'</td><td>'+r[3]+'</td></tr>'}).join('')+'</table><div class="small">Estado de bandera: verde · Safety car: ninguno · Ventana de parada sugerida por el juego: vueltas 4-6 (rejoin estimado P7)</div>'}
// ---- Coche ----
function renderCarRx(){setTimeout(drawWH,0);
  var d=window.RX,lv=d.live||{},dm=lv.damage,ts=lv.tyresets;
  var row=function(a){return'<div class="row"><span>'+a[0]+'</span><span>'+a[1]+'%</span></div>'+bar(a[1],a[1]<20?'#19c250':a[1]<50?'#ffd400':'#e10600')};
  if(!dm){$('d_dmg').innerHTML='<div class="small">Sin paquete Car Damage.</div>';$('d_wear').innerHTML='';}
  else{var a=[['Alerón delantero izq.',dm.wing_fl],['Alerón delantero der.',dm.wing_fr],['Alerón trasero',dm.wing_r],['Suelo',dm.floor],['Difusor',dm.diffuser],['Pontones',dm.sidepod],['Caja de cambios',dm.gearbox],['Motor',dm.engine]];
   $('d_dmg').innerHTML=a.map(row).join('')+'<div class="small">Fallo ERS: '+(dm.ers_fault?'sí':'no')+'</div>';
   var w=[['ICE',dm.w_ice],['MGU-K',dm.w_mguk],['Batería (ES)',dm.w_es],['Electrónica (CE)',dm.w_ce],['Turbo (TC)',dm.w_tc]];
   $('d_wear').innerHTML=w.map(row).join('')+'<div class="small">MGU-H: N/A en 2026 (no hay prueba de que el juego lo use).</div>'}
  if(!ts||!ts.length){$('d_sets').innerHTML='<div class="small">Sin paquete Tyre Sets.</div>';return}
  var g={},fit=null;ts.forEach(function(x){if(x.fitted)fit=x;else if(x.available){var k=[x.visual,x.wear,x.life,x.delta_ms].join();(g[k]=g[k]||{x:x,n:0}).n++}});
  var line=function(x,n,tag){return'<tr><td>'+(COMPN[x.visual]||'?')+(tag?' ('+tag+')':'')+(n>1?' ×'+n:'')+'</td><td>'+x.wear+'%</td><td>'+x.life+' vueltas</td><td>'+(x.delta_ms?(x.delta_ms/1000).toFixed(3)+' s':'—')+'</td></tr>'};
  var keys=Object.keys(g),main=keys.slice(0,6).map(function(k){return line(g[k].x,g[k].n)}).join(''),more=keys.slice(6).map(function(k){return line(g[k].x,g[k].n)}).join('');
  $('d_sets').innerHTML='<table><tr><th>Juego</th><th>Desgaste</th><th>Vida restante</th><th>Dif. de tiempo</th></tr>'+(fit?line(fit,1,'montado'):'')+main+'</table>'+(more?'<details><summary class="small">Otros juegos ('+(keys.length-6)+' grupos)</summary><table>'+more+'</table></details>':'')+'<div class="small">Juegos disponibles agrupados por compuesto y desgaste. Fuente: Tyre Sets</div>'}
function renderCar(){
  if(window.__rx&&!window.__demo)return renderCarRx();
  if(!window.__demo)return;setTimeout(drawWH,0);
  var dm=[['Alerón delantero izq.',4],['Alerón delantero der.',0],['Alerón trasero',2],['Suelo',6],['Difusor',1],['Pontones',0],['Caja de cambios',3],['Motor',2]];
  var wr=[['ICE',12],['MGU-K',9],['Batería (ES)',10],['Electrónica (CE)',7],['Turbo (TC)',11]];
  var row=function(a){return'<div class="row"><span>'+a[0]+'</span><span>'+a[1]+'%</span></div>'+bar(a[1],a[1]<20?'#19c250':a[1]<50?'#ffd400':'#e10600')};
  $('d_dmg').innerHTML=dm.map(row).join('')+'<div class="small">Fallo ERS: no</div>';
  $('d_wear').innerHTML=wr.map(row).join('');
  var sets=[['Blando','S',1,'nuevo',0],['Medio','M',2,'usado en V1-V10',22],['Duro','H',2,'sin usar',0],['Duro','H',1,'sin usar',0]];
  $('d_sets').innerHTML='<table><tr><th>Juego</th><th>Desgaste</th><th>Vida restante</th><th>Notas</th></tr>'+sets.map(function(s,i){return'<tr><td>'+s[0]+' '+(i==1?'(montado)':'')+'</td><td>'+s[4]+'%</td><td>'+(20-s[4]/2|0)+' vueltas</td><td>'+s[3]+'</td></tr>'}).join('')+'</table>'}
// ---- Datos ----
var INV=[
['Car Telemetry (6)','velocidad, acelerador, freno, volante, embrague, marcha, rpm, DRS, luces de rpm (porcentaje y bits de los 15 LEDs), temperatura del motor, de frenos y de neumáticos (superficie e interior), presión de neumáticos','Conducción: marcha, velocidad, rpm, LEDs, entradas, temperaturas','Documentado en la especificación. En multijugador con "Tu telemetría = Restringida" algunos campos de tu coche salen a cero (ver nota).'],
['Car Telemetry 2 (16)','modo de aerodinámica activa (curva/recta) y estado de boost (antes llamado overtake)','Conducción: aero y boost','Solo en la especificación del Season Pack 2026. No probado con el juego.'],
['Car Status (7)','combustible en depósito y vueltas restantes, mezcla, reparto de freno, ERS (energía, modo, recuperado/desplegado esta vuelta), compuesto, edad del neumático, bandera FIA','Conducción: ERS, combustible, aero, neumáticos','Documentado. ERS/combustible pueden salir a cero con telemetría restringida.'],
['Lap Data (2)','tiempo de vuelta actual y anterior, sectores 1 y 2, diferencia con el coche de delante y con el líder, posición, número de vuelta, paradas, sanciones, estado de pit, vuelta inválida, trampa de velocidad','Conducción y Carrera: sectores, huecos, posición, sanciones','Documentado para los 24 coches. El sector 3 no viene directo: se calcula como vuelta menos S1 menos S2.'],
['Session (1)','vueltas totales, tipo de sesión, circuito, longitud, tiempo restante, clima y previsión, safety car, ventana de parada ideal/máxima y posición estimada al salir, zonas DRS y aero','Carrera: tiempo, previsión, ventana de parada','Documentado. Es un paquete grande; mi programa de prueba hoy solo lee el principio.'],
['Car Damage (10)','desgaste de neumáticos por rueda, daños de alerones, suelo, difusor, pontones, caja de cambios y motor, desgaste de componentes del motor','Coche: daños y desgaste','Documentado. Mi programa ya lo lee (solo tu coche) y la web lo muestra; probado solo con paquetes simulados escritos a mano, no con el juego.'],
['Tyre Sets (12)','13 juegos secos + 7 de lluvia: compuesto, desgaste, vida útil, diferencia de tiempo, disponibilidad','Coche: juegos de neumáticos','Documentado. Mi programa ya lo lee (juegos de tu coche); probado solo con paquetes simulados, no con el juego.'],
['Session History (11)','tiempos de vuelta y sectores de un coche, vueltas válidas, mejores sectores, tandas de neumáticos','Ingeniero: historial vuelta a vuelta','Documentado. Mi programa ya lo lee para los 24 coches (tiempos de vuelta y sector, mejores); el historial de tus vueltas del Ingeniero sigue saliendo de Lap Data. Probado solo con paquetes simulados.'],
['Event (3)','fastest lap, sanciones, adelantamientos, colisiones, safety car, red flag, trampa de velocidad, flashback, arranque semáforos','Dirección de carrera: avisos y sanciones','Documentado. Mi programa ya lee penalizaciones, vuelta rápida, abandonos, bandera a cuadros y roja, y los avisos de DRS; no lee colisiones, adelantamientos, safety car ni trampa de velocidad. Probado solo con paquetes simulados.'],
['Participants (4)','nombres, equipo, número, nacionalidad, si es humano o IA','Carrera: nombres reales en la torre','Documentado. Mi programa ya lo lee (nombres, humano/IA, telemetría restringida); probado solo con paquetes simulados. Si un coche es restringido, su nombre puede no venir.'],
['Motion (0) / Motion Ex (13)','posición mundial X/Y/Z, velocidad, G, suspensión, patinaje de rueda, ángulos','Mapa del circuito y G-force','La tabla de paquetes dice que Motion trae solo tu coche, pero la estructura define 24 coches. Contradicción sin resolver, hay que probarlo con el juego.'],
['Final Classification (8)','posición final, puntos, mejor vuelta, paradas, neumáticos usados por tanda','Carrera: resumen final','Documentado.'],
['Car Setups (5) / Lap Positions (15)','reglajes del coche; posición por vuelta de cada coche','Gráfico de posiciones y consulta de reglaje','Documentado. No leído aún.']];
var AUDR=[
['Marcha, velocidad, rpm, gas, freno, volante, temperaturas','Car Telemetry: m_gear, m_speed, m_engineRPM, m_throttle, m_brake, m_steer, m_tyresSurfaceTemperature…','Señal del juego','Implementado','No'],
['Luces de rpm','Car Telemetry: m_revLightsPercent / m_revLightsBitValue','Señal del juego','Implementado','No'],
['Combustible, ERS (energía almacenada, modo), freno de reparto','Car Status: m_fuelInTank, m_fuelRemainingLaps, m_ersStoreEnergy, m_ersDeployMode, m_frontBrakeBias','Señal del juego. Con «Tu telemetría = Restringida» llega a cero en coches de otros jugadores','Implementado','No'],
['Aero activa / Boost','Car Telemetry 2','Señal del juego (formato 2026)','Implementado','No'],
['Daños y desgaste de neumáticos y componentes','Car Damage: m_tyresWear, m_tyresDamage, alerones, suelo, motor…','Señal del juego. Con telemetría restringida llega a cero (solo tu coche es fiable)','Implementado','No'],
['Historial de desgaste por rueda','Car Damage de cada vuelta recibida','Cálculo propio: solo desde que abres la página','Implementado','No'],
['Juegos de neumáticos','Tyre Sets (solo coche del jugador)','Señal del juego','Implementado','No'],
['Posición, huecos al de delante y al líder, última vuelta, paradas, sanción acumulada','Lap Data de los 24 coches','Señal del juego','Implementado','No'],
['Nombres de pilotos','Participants. En online puede venir vacío si el jugador oculta su nombre','Señal del juego','Implementado','No'],
['Neumático montado de cada rival','Car Status: m_visualTyresCompound, m_tyresAgeLaps','Señal del juego','Implementado','No'],
['Sectores y vuelta de cada rival, mejor vuelta y mejores sectores','Session History (un coche por paquete, historial de vueltas)','Señal del juego; la diferencia es cálculo propio','Implementado','No'],
['Avisos de carrera, sanciones, vuelta rápida, abandonos','Event: PENA, FTLP, RTMT, CHQF, RDFL…','Señal del juego (solo lo que pasa con el programa abierto)','Implementado','No'],
['Dónde frenan y aceleran los rivales','Car Telemetry + Lap Data de cada coche (la especificación los envía para los 24 coches y no los incluye entre los datos que se ponen a cero con telemetría restringida)','Cálculo propio por distancia. Solo vueltas vistas desde que abres el programa. Si la consola no manda telemetría de rivales, no habrá datos','Implementado','No'],
['Tramos / «microsectores»','Derivados de la traza anterior (20 partes iguales)','Cálculo propio. El juego no envía microsectores','Implementado','No'],
['Tus vueltas: delta, dónde ganas y pierdes','Car Telemetry + Lap Data de tu coche','Cálculo propio','Implementado','No'],
['Previsión del tiempo, safety car','Session: m_weatherForecastSamples, m_safetyCarStatus','Documentado','No leído (solo demo)','No'],
['Mejor parada / estrategia','Session: m_pitStopWindowIdealLap, m_pitStopWindowLatestLap, m_pitStopRejoinPosition (solo tu coche, estrategia del propio juego)','Documentado. Una parada óptima calculada por mí no existe: sería una estimación','No leído (solo demo)','No'],
['Mapa real del circuito','Motion (posiciones); no hay trazado con licencia','Documentado, sin geometría validada','No implementado','No'],
['Delta en vivo contra una vuelta de referencia','No hay campo del juego','Cálculo propio posible, no implementado en directo','No implementado','No'],
['Ritmo de rivales con neumáticos y combustible comparables, «por qué» pierdes','Ningún campo','No disponible: ni el juego ni este programa lo dan','No disponible','—']];
function AUD(){return'<div class="lbl">Auditoría: qué sale de la conexión de F1 26 en PS5</div><div class="small" style="margin:4px 0 8px">El documento oficial de EA que he leído es «F1 25 2026 Season Pack» (formato 2026; sus preguntas frecuentes citan F1 26). La PS5 envía por UDP por la red local a un PC con el programa receptor, no a esta web. «Probado en partida: No» en todo: solo he probado con paquetes simulados.</div><table><tr><th>Dato o función</th><th>Campo en el paquete</th><th>Tipo y límites</th><th>Estado</th><th>Probado en partida</th></tr>'+AUDR.map(function(r){return'<tr>'+r.map(function(c){return'<td>'+c+'</td>'}).join('')+'</tr>'}).join('')+'</table>'}
function renderInv(){
  $('d_inv').innerHTML=AUD()+'<div class="warn" style="margin:12px 0"><b>Lo que el programa lee hoy:</b> Car Telemetry (los 24 coches), Car Telemetry 2, Car Status, Lap Data (24 coches), Car Damage, Participants, Tyre Sets (solo tu coche), Session History (24 coches), Event y el principio de Session. <b>No lee todavía:</b> Session completo (previsión del tiempo, ventana de parada, safety car), Car Setups, Lap Positions, Motion / Motion Ex (mapa), Final Classification. La tabla de abajo es lo que el juego documenta, no lo que está implementado.</div><table><tr><th>Paquete (ID)</th><th>Datos que ofrece</th><th>Dónde se usa</th><th>Estado y límites</th></tr>'+INV.map(function(r){return'<tr><td><b>'+r[0]+'</b></td><td>'+r[1]+'</td><td>'+r[2]+'</td><td>'+r[3]+'</td></tr>'}).join('')+'</table>'}
window.UI2={tick:tick,renderRace:renderRace,renderCar:renderCar,renderInv:renderInv};
setInterval(function(){tick()},100);setInterval(function(){renderRace()},1000);
document.addEventListener('DOMContentLoaded',function(){renderInv()});
})();
