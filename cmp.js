/* v1.0 Comparador de trazadas: tu frenada y acelerador contra los de un rival, vuelta a vuelta.
   Lee r.traces del registro guardado (misma lógica en la app y en el visor web). Todo se calcula aquí con esos datos; nada se inventa. */
(function(){
var W=window;W.HX=W.HX||{};var HX=W.HX;
function E(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function T(s){if(s==null)return'-';var m=Math.floor(s/60),x=s-m*60;return(m?m+':':'')+(m&&x<10?'0':'')+x.toFixed(3)}
function dec(e){if(e._d)return e._d;var sp=e.sp.split(',').map(Number),th=e.th.split(',').map(Number),br=e.br.split(',').map(Number),dt=e.t.split(',').map(Number),t=[],c=0;
  for(var i=0;i<dt.length;i++){c+=dt[i];t.push(c/100)}e._d={sp:sp,th:th,br:br,t:t,n:Math.min(sp.length,th.length,br.length,t.length)};return e._d}
function zones(d,st){var z=[],cur=null;
  for(var i=0;i<d.n;i++){
    if(!cur&&d.br[i]>=30){cur={s:i*st,i0:i,vin:d.sp[i],vmin:d.sp[i],pk:d.br[i]}}
    else if(cur){cur.vmin=Math.min(cur.vmin,d.sp[i]);cur.pk=Math.max(cur.pk,d.br[i]);
      if(d.br[i]<10){cur.e=i*st;cur.i1=i;z.push(cur);cur=null}}}
  if(cur){cur.e=(d.n-1)*st;cur.i1=d.n-1;z.push(cur)}
  z.forEach(function(q){q.g=null;for(var i=q.i1;i<d.n;i++){if(d.th[i]>=50){q.g=i*st;break}}});
  return z.filter(function(q){return q.e-q.s>=10||q.vin-q.vmin>=15})}
function pair(za,zr){var used={},out=[];
  za.forEach(function(a){var b=null,bd=1e9;zr.forEach(function(r,j){if(used[j])return;var dd=Math.abs(r.s-a.s);if(dd<bd&&dd<=120){bd=dd;b=j}});
    if(b!==null)used[b]=1;out.push({a:a,r:b===null?null:zr[b]})});
  zr.forEach(function(r,j){if(!used[j])out.push({a:null,r:r})});
  out.sort(function(x,y){return(x.a?x.a.s:x.r.s)-(y.a?y.a.s:y.r.s)});return out}
function lapsOf(tr,car){return tr.laps.filter(function(e){return e.c===car}).sort(function(a,b){return a.l-b.l})}
function init(){var tr=HX.cmpRec&&HX.cmpRec.traces,cm=HX.cm;if(!tr||!tr.laps||!tr.laps.length)return;
  var mine=lapsOf(tr,tr.me);if(!mine.length||!tr.cars.length)return;
  if(cm.car==null||!tr.cars.some(function(c){return c.c===cm.car}))cm.car=tr.cars[0].c;
  var rl=lapsOf(tr,cm.car);
  if(cm.same==null)cm.same=!!tr.race;
  if(cm.la==null||!mine.some(function(e){return e.l===cm.la})){
    var cand=cm.same?mine.filter(function(e){return rl.some(function(r){return r.l===e.l})}):mine;if(!cand.length)cand=mine;
    cm.la=cand.reduce(function(b,e){return e.T<b.T?e:b},cand[0]).l}
  if(cm.lr==null||!rl.some(function(e){return e.l===cm.lr})){
    var m=rl.filter(function(e){return e.l===cm.la})[0];cm.lr=m?m.l:(rl.length?rl.reduce(function(b,e){return e.T<b.T?e:b},rl[0]).l:null)}}
HX.cmpSel=function(k,v){var cm=HX.cm;v=k==='same'?!!v:+v;
  if(k==='car'){cm.car=v;cm.lr=null}else cm[k]=v;
  if(k==='la'&&cm.same)cm.lr=null;
  if(k==='same'&&cm.same)cm.lr=null;
  var b=document.getElementById(HX.cmpBoxId||'cmpbox');if(b)b.innerHTML=HX.cmpBody()};
HX.cmpLive=function(){var r=null;try{r=W.RXAPP.build('vista-completa')}catch(e){}
  var b=document.getElementById('cmp_live');if(!b)return;
  if(HX.cmpName!=='__live'){HX.cm={car:null,la:null,lr:null,same:null};HX.cmpName='__live'}
  HX.cmpRec=r;HX.cmpBoxId='cmp_live';
  b.innerHTML=HX.cmpBody()+'<div style="margin-top:8px"><button class="rb" onclick="HX.cmpLive()">Actualizar con las vueltas nuevas</button></div>'};
function svgChart(x,series,o){var w=1000,h=o.h,l=44,r=8,tp=14,bt=18,pw=w-l-r,ph=h-tp-bt,n=x.length,ymin=o.min,ymax=o.max;
  var X=function(i){return l+pw*i/(n-1)},Y=function(v){return tp+ph*(1-(v-ymin)/(ymax-ymin))};
  var s='<svg viewBox="0 0 '+w+' '+h+'" style="width:100%;height:auto;background:#101015;border-radius:6px"><text x="4" y="11" fill="#9a9aa8" font-size="11">'+E(o.title)+'</text>';
  [ymin,(ymin+ymax)/2,ymax].forEach(function(v){s+='<line x1="'+l+'" x2="'+(w-r)+'" y1="'+Y(v)+'" y2="'+Y(v)+'" stroke="#26262e"/><text x="'+(l-4)+'" y="'+(Y(v)+4)+'" fill="#9a9aa8" font-size="10" text-anchor="end">'+(o.fmt?o.fmt(v):Math.round(v))+'</text>'});
  if(ymin<0&&ymax>0)s+='<line x1="'+l+'" x2="'+(w-r)+'" y1="'+Y(0)+'" y2="'+Y(0)+'" stroke="#555"/>';
  var L=x[n-1],step=L>3000?1000:500;for(var m=0;m<=L;m+=step)s+='<text x="'+(l+pw*m/L)+'" y="'+(h-4)+'" fill="#9a9aa8" font-size="10" text-anchor="middle">'+m+' m</text>';
  series.forEach(function(se){var p=se.y.map(function(v,i){return X(i).toFixed(1)+','+Y(Math.max(ymin,Math.min(ymax,v))).toFixed(1)}).join(' ');s+='<polyline fill="none" stroke="'+se.c+'" stroke-width="1.6" points="'+p+'"/>'});
  return s+'</svg>'}
function mergeFull(r){var tr=r&&r.traces;if(!tr||!tr.chunk_base||!W.Android||!W.Android.listSessions)return;
  var names=JSON.parse(W.Android.listSessions()).map(function(x){return x.name}).filter(function(n){return/^tz\d\d_/.test(n)&&n.slice(5)===tr.chunk_base+'.json'}).sort();
  if(!names.length){tr.merge_error='no se encuentran los archivos completos en el móvil';return}
  var seen={},laps=[],miss=0;names.forEach(function(n){var c=JSON.parse(W.Android.readSession(n));(c.laps||[]).forEach(function(e){var k=e.c+'_'+e.l;if(seen[k])return;seen[k]=1;laps.push(e)})});
  if(laps.length<(tr.laps||[]).length){tr.merge_error='los archivos completos tienen menos vueltas que el resumen; se usa el resumen';return}
  tr.laps=laps;tr.cars=tr.cars_all||tr.cars;tr.skipped=[];tr.merged=laps.length}
HX.cmpBody=function(){
  var r=HX.cmpRec,tr=r&&r.traces,cm=HX.cm,h='<div class="card" style="margin-top:12px"><div class="lbl">Comparador de frenada y acelerador: tú contra un rival</div>';
  if(!tr||!tr.laps||!tr.laps.length){var why;
    if(r&&r.simulated)why='Son datos simulados (modo demo): el demo no genera trazas ni se guarda. Conecta la PS5 para tener comparador.';
    else if(r&&r.schema&&!r.traces)why='Esta sesión se guardó con una versión anterior a la v1.0 y no lleva trazas.';
    else if(r&&r.traces_error)why='No se pudieron generar las trazas: '+E(r.traces_error);
    else if(!r)why='No hay sesión cargada.';
    else why='Todavía no hay ninguna vuelta válida (sin boxes, rebobinado ni salida/entrada) con telemetría. Completa una vuelta limpia y pulsa Actualizar.';
    return h+'<div class="small" style="margin-top:6px">'+why+'</div></div>'}
  init();var mine=lapsOf(tr,tr.me);
  if(!tr.cars.length)return h+'<div class="small" style="margin-top:6px">Tus vueltas están guardadas pero ningún rival tiene vueltas válidas comparables'+(tr.skipped&&tr.skipped.length?' (no caben en el archivo: '+E(tr.skipped.join(', '))+')':'')+'.</div></div>';
  var rl=lapsOf(tr,cm.car),A=mine.filter(function(e){return e.l===cm.la})[0],R=rl.filter(function(e){return e.l===cm.lr})[0],rv=tr.cars.filter(function(c){return c.c===cm.car})[0];
  var rn=(rv&&rv.name)||('coche '+cm.car);
  h+='<div class="small" style="margin:6px 0">'+(tr.race?'En carrera se compara la misma vuelta de los dos por defecto.':'En clasificación y libres cada uno hace sus vueltas por separado: elige la de cada uno.')+' Positivo = pierdes.</div><div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">';
  h+='<label class="lbl">Rival<br><select onchange="HX.cmpSel(\'car\',this.value)" style="font-size:15px;padding:6px">'+tr.cars.map(function(c){return'<option value="'+c.c+'"'+(c.c===cm.car?' selected':'')+'>'+(c.pos!=null?'P'+c.pos+' ':'')+E(c.name||('coche '+c.c))+'</option>'}).join('')+'</select></label>';
  h+='<label class="lbl">Tu vuelta<br><select onchange="HX.cmpSel(\'la\',this.value)" style="font-size:15px;padding:6px">'+mine.map(function(e){return'<option value="'+e.l+'"'+(e.l===cm.la?' selected':'')+'>V'+e.l+' · '+T(e.T)+'</option>'}).join('')+'</select></label>';
  h+='<label class="lbl">Vuelta del rival<br><select onchange="HX.cmpSel(\'lr\',this.value)" style="font-size:15px;padding:6px"'+(cm.same?' disabled':'')+'>'+rl.map(function(e){return'<option value="'+e.l+'"'+(e.l===cm.lr?' selected':'')+'>V'+e.l+' · '+T(e.T)+'</option>'}).join('')+'</select></label>';
  h+='<label class="small"><input type="checkbox" '+(cm.same?'checked ':'')+'onchange="HX.cmpSel(\'same\',this.checked)" style="width:auto;margin:0 4px 0 0">Misma vuelta para los dos</label></div>';
  if(!A||!R){return h+'<div class="warn">No hay una vuelta válida de '+E(rn)+' para esa elección'+(cm.same?' (desmarca «misma vuelta» para elegir otra)':'')+'.</div></div>'}
  var a=dec(A),b=dec(R),st=tr.step_m,n=Math.min(a.n,b.n),x=[],dl=[],i;
  for(i=0;i<n;i++){x.push(i*st);dl.push(+(a.t[i]-b.t[i]).toFixed(3))}
  var bsum=0;for(i=0;i<b.n;i++)bsum+=b.sp[i];
  var warns=[];
  if(bsum===0||b.sp.every(function(v){return v===0}))warns.push('Sin telemetría utilizable de '+E(rn)+': todas sus velocidades llegan a 0'+(tr.restricted_cars&&tr.restricted_cars.indexOf(cm.car)>=0?' (el juego marca su telemetría como restringida: lo suele hacer un humano online con la opción en «restringida»).':'. El juego no envió datos suficientes de ese coche.'));
  [['tu',A],['del rival',R]].forEach(function(q){var e=q[1];
    if(e.g>25)warns.push('La traza '+q[0]+' tiene un hueco de hasta '+e.g+' m sin muestras: lo que se ve ahí es interpolado.');
    if(e.a>25)warns.push('La traza '+q[0]+' empieza a '+e.a+' m de la meta: el inicio no se interpreta.')});
  if(A.comp!=null&&R.comp!=null&&A.comp!==R.comp)warns.push('Neumático distinto (compuesto '+A.comp+' vs '+R.comp+'): parte de la diferencia puede ser del neumático.');
  warns.push('No se mide combustible, temperatura de pista, viento ni tráfico: es orientativo.');
  var tot=+(A.T-R.T).toFixed(3);
  h+='<div style="font-size:18px;font-weight:700;margin:10px 0 2px;color:'+(tot>0?'#ff6b6b':'#19c250')+'">Tu V'+A.l+' ('+T(A.T)+') frente a la V'+R.l+' de '+E(rn)+' ('+T(R.T)+'): '+(tot>0?'+':'')+tot.toFixed(3)+' s</div>';
  warns.forEach(function(q){h+='<div class="small" style="color:#ffd27a;margin:2px 0">'+q+'</div>'});
  if(A.s&&R.s){h+='<div class="small" style="margin-top:6px">Sectores (tú − rival): '+[0,1,2].map(function(k){var d=(A.s[k]-R.s[k])/1000;return'S'+(k+1)+' <b style="color:'+(d>0?'#ff6b6b':'#19c250')+'">'+(d>0?'+':'')+d.toFixed(3)+'</b>'}).join(' · ')+'</div>'}
  // tramos de 100 m
  var k=Math.max(1,Math.round(100/st)),segs=[];
  for(i=0;i+k<n;i+=k){var sa=a.sp.slice(i,i+k+1),sr=b.sp.slice(i,i+k+1),ba=-1,br=-1,fa=0,fr=0;
    for(var j=i;j<=i+k;j++){if(ba<0&&a.br[j]>30)ba=j*st;if(br<0&&b.br[j]>30)br=j*st;if(a.th[j]>=95)fa++;if(b.th[j]>=95)fr++}
    segs.push({s:x[i],e:x[i+k],loss:+(dl[i+k]-dl[i]).toFixed(3),va:Math.min.apply(0,sa),vr:Math.min.apply(0,sr),ba:ba,br:br,fa:fa*st,fr:fr*st})}
  var ok=segs.slice(),worst=ok.slice().sort(function(p,q){return q.loss-p.loss}).slice(0,3),best=ok.slice().sort(function(p,q){return p.loss-q.loss}).slice(0,3);
  function why(q){var t=[];if(q.ba>=0&&q.br>=0&&q.ba!==q.br){var df=q.ba-q.br;t.push('frenas '+Math.abs(df)+' m '+(df<0?'antes':'después'))}else if(q.ba>=0&&q.br<0)t.push('frenas y él no');else if(q.ba<0&&q.br>=0)t.push('él frena y tú no');
    if(q.va!==q.vr)t.push('vel. mínima '+q.va+' vs '+q.vr+' km/h');if(q.fa!==q.fr)t.push('gas a fondo '+q.fa+' vs '+q.fr+' m');return t.join('; ')}
  var wl=worst.filter(function(q){return q.loss>0}),bl=best.filter(function(q){return q.loss<0});
  h+='<div style="margin-top:8px"><b>Dónde más pierdes:</b>'+(wl.length?wl.map(function(q){return'<div class="small">'+q.s+'–'+q.e+' m: +'+q.loss.toFixed(3)+' s'+(why(q)?' · '+E(why(q)):'')+'</div>'}).join(''):' <span class="small">en ningún tramo de 100 m</span>')+'</div>';
  h+='<div style="margin-top:6px"><b>Dónde más ganas:</b>'+(bl.length?bl.map(function(q){return'<div class="small">'+q.s+'–'+q.e+' m: '+q.loss.toFixed(3)+' s'+(why(q)?' · '+E(why(q)):'')+'</div>'}).join(''):' <span class="small">en ningún tramo de 100 m</span>')+'</div>';
  // gráficas
  var mx=0;dl.forEach(function(v){mx=Math.max(mx,Math.abs(v))});mx=Math.max(0.1,Math.ceil(mx*10)/10);
  var sm=Math.max.apply(0,a.sp.concat(b.sp));sm=Math.ceil(sm/50)*50;
  h+='<div style="margin-top:10px"><span style="color:#ff3b30">▬ Tú</span> &nbsp; <span style="color:#4aa3ff">▬ '+E(rn)+'</span></div>';
  h+='<div style="margin-top:6px">'+svgChart(x,[{y:dl,c:'#ff3b30'}],{h:130,min:-mx,max:mx,title:'Diferencia acumulada (s): arriba = pierdes',fmt:function(v){return v.toFixed(2)}})+'</div>';
  h+='<div style="margin-top:6px">'+svgChart(x,[{y:b.sp.slice(0,n),c:'#4aa3ff'},{y:a.sp.slice(0,n),c:'#ff3b30'}],{h:150,min:0,max:sm,title:'Velocidad (km/h)'})+'</div>';
  h+='<div style="margin-top:6px">'+svgChart(x,[{y:b.br.slice(0,n),c:'#4aa3ff'},{y:a.br.slice(0,n),c:'#ff3b30'}],{h:120,min:0,max:100,title:'Freno (%)'})+'</div>';
  h+='<div style="margin-top:6px">'+svgChart(x,[{y:b.th.slice(0,n),c:'#4aa3ff'},{y:a.th.slice(0,n),c:'#ff3b30'}],{h:120,min:0,max:100,title:'Acelerador (%)'})+'</div>';
  // zonas de frenada
  var za=zones(a,st),zr=zones(b,st),pr=pair(za,zr);
  h+='<div class="lbl" style="margin-top:12px">Zonas de frenada (freno &ge; 30 %)</div><div style="overflow-x:auto"><table class="ct"><tr><th>Zona</th><th>Tú: frenas a / vel. entrada / mínima / gas &ge;50 % a</th><th>Él: lo mismo</th><th>Diferencia</th></tr>';
  function zc(z){return z?z.s+' m · '+z.vin+' · '+z.vmin+' km/h · '+(z.g==null?'-':z.g+' m'):'no frena'}
  pr.forEach(function(q){var df=[];
    if(q.a&&q.r){var d1=q.a.s-q.r.s;if(d1!==0)df.push('frenas '+Math.abs(d1)+' m '+(d1<0?'antes':'después'));var d2=q.a.vmin-q.r.vmin;if(d2!==0)df.push('mínima '+(d2>0?'+':'')+d2+' km/h');
      if(q.a.g!=null&&q.r.g!=null&&q.a.g!==q.r.g){var d3=q.a.g-q.r.g;df.push('gas '+Math.abs(d3)+' m '+(d3<0?'antes':'después'))}}
    else df.push(q.a?'solo tú frenas aquí':'solo él frena aquí');
    h+='<tr><td>'+(q.a?q.a.s:q.r.s)+' m</td><td>'+zc(q.a)+'</td><td>'+zc(q.r)+'</td><td>'+E(df.join('; ')||'igual')+'</td></tr>'});
  h+='</table></div>';
  h+='<div class="small" style="margin-top:8px;color:#9a9aa8">Datos: velocidad, gas y freno de Car Telemetry y distancia/tiempo de Lap Data de cada coche, cada '+st+' m. '+(tr.merged?'Vueltas completas leídas del móvil: '+tr.merged+'. ':'')+(tr.chunk_base&&!tr.merged?'Aquí solo hay un resumen ('+(tr.laps||[]).length+' de '+tr.full_laps+' vueltas, por el límite de subida de 250 KB); las vueltas completas están solo en el móvil. ':'')+(tr.merge_error?'Aviso: '+E(tr.merge_error)+'. ':'')+(tr.skipped&&tr.skipped.length?'No caben en el archivo y se quedaron fuera: '+E(tr.skipped.join(', '))+'. ':'')+'</div></div>';
  return h};
// engancha el detalle (app y visor): añade el comparador debajo
var d0=HX.detail;
if(d0&&!d0.__cmp){HX.detail=function(name){var h=d0.apply(this,arguments),r=null;
  try{r=JSON.parse(W.Android.readSession(name))}catch(e){}
  try{mergeFull(r)}catch(e){if(r&&r.traces)r.traces.merge_error=String(e&&e.message||e)}
  if(HX.cmpName!==name){HX.cm={car:null,la:null,lr:null,same:null};HX.cmpName=name}
  HX.cmpRec=r;HX.cmpBoxId='cmpbox';return h+'<div id="cmpbox">'+HX.cmpBody()+'</div>'};HX.detail.__cmp=1}
})();
