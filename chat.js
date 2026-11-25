// Router de conversacion por reglas (regex + logica de codigo). Sin IA.
// Memoria de contexto: ultima curva, ultimo sujeto (tu/referencia/rival), ultima vuelta.
(function(){
var mem={corner:null,subject:null,lap:null};
function norm(s){return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').trim();}
function pickCorner(t){var m=t.match(/curva\s*(\d{1,2})/)||t.match(/\bla\s*(\d{1,2})\b/);if(m)return parseInt(m[1]);return null;}
function pickLap(t){var m=t.match(/vuelta\s*(\d{1,2})/);if(m)return parseInt(m[1]);return null;}
function cornerByN(n){var cs=window.TRACK_MONZA.corners;for(var i=0;i<cs.length;i++)if(cs[i].n===n)return cs[i];return null;}
function laps(){return window.LAPS_DEMO;}
function traceOf(subject,lap){
  var L=laps();
  if(subject==='rival')return L.rivalAhead;
  if(subject==='ref')return L.reference;
  return lap===2?L.player2:L.player1;}
function subjName(s){return s==='rival'?'el de delante':s==='ref'?'la referencia':'tu';}
var AN=window.AN,DS=window.TRACK_MONZA.ds;
function prevExitOf(n){return n===1?0:cornerByN(n-1).exit;}
function cornerReport(n,subject,lap){
  var c=cornerByN(n);if(!c)return 'Monza tiene 11 curvas; la '+n+' no existe.';
  var me=AN.cornerStats(traceOf('you',lap),c,DS,prevExitOf(n));
  var ot=AN.cornerStats(traceOf(subject,lap),c,DS,prevExitOf(n));
  var who=subjName(subject);
  var parts=['Curva '+n+' ('+c.name+'), vuelta '+(lap||1)+' contra '+who];
  if(me.brake==null&&ot.brake==null)parts.push('aqui no hay frenada fuerte, se levanta y se sigue');
  else{
    if(me.brake!=null&&ot.brake!=null){
      var d=ot.brake-me.brake;
      if(Math.abs(d)<5)parts.push('los dos frenais en el metro '+me.brake+', a unos 10 m de resolucion');
      else if(d>0)parts.push('tu frenas en el metro '+me.brake+' y '+who+' en el '+ot.brake+': '+who+' frena unos '+d+' m mas tarde, mas cerca de la curva');
      else parts.push('tu frenas en el metro '+me.brake+' y '+who+' en el '+ot.brake+': tu frenas unos '+(-d)+' m mas tarde, mas cerca de la curva');
    } else parts.push('solo '+(me.brake!=null?'tu':who)+' frena aqui, a unos '+(me.brake!=null?me.brake:ot.brake)+' m');
  }
  var dv=ot.apexKmh-me.apexKmh;
  if(Math.abs(dv)>=2)parts.push(dv>0?who+' pasa por el vertice '+Math.round(dv)+' km/h mas rapido ('+Math.round(ot.apexKmh)+' frente a '+Math.round(me.apexKmh)+')':'tu pasas por el vertice '+Math.round(-dv)+' km/h mas rapido ('+Math.round(me.apexKmh)+' frente a '+Math.round(ot.apexKmh)+')');
  else parts.push('velocidad de vertice igualada ('+Math.round(me.apexKmh)+' km/h)');
  var dexit=ot.exitKmh-me.exitKmh;
  if(Math.abs(dexit)>=2)parts.push(dexit>0?who+' sale '+Math.round(dexit)+' km/h mas rapido hacia la siguiente':'tu sales '+Math.round(-dexit)+' km/h mas rapido hacia la siguiente');
  var dt=-AN.cornerDelta(traceOf('you',lap),traceOf(subject,lap),c,DS)*1000;
  parts.push('en esta curva '+(dt>20?'pierdes unos '+Math.round(dt)+' ms':dt<-20?'ganas unos '+Math.round(-dt)+' ms':'ni ganas ni pierdes (+-20 ms)'));
  parts.push('La diferencia en metros y km/h es lo que miden los datos; por que lo consigue no se puede demostrar con esto.');
  mem.corner=n;mem.subject=subject;mem.lap=lap||1;
  return parts.map(function(p){p=p.replace(/[.]+$/,'');return p.charAt(0).toUpperCase()+p.slice(1);}).join('. ')+'.';}
function worstCorner(subject,lap){
  var cs=window.TRACK_MONZA.corners,worst=null;
  cs.forEach(function(c){var d=-AN.cornerDelta(traceOf('you',lap),traceOf(subject,lap),c,DS)*1000;
    if(worst===null||d>worst.d)worst={c:c,d:d};});
  mem.corner=worst.c.n;mem.subject=subject;mem.lap=lap||1;
  if(worst.d<20)return 'Contra '+subjName(subject)+' no pierdes mas de 20 ms en ninguna curva; la que mas te cuesta es la '+worst.c.n+' ('+worst.c.name+'), pero solo son unos '+Math.round(worst.d)+' ms.';
  var stMe=AN.cornerStats(traceOf('you',lap),worst.c,DS,prevExitOf(worst.c.n));
  var stOt=AN.cornerStats(traceOf(subject,lap),worst.c,DS,prevExitOf(worst.c.n));
  var why='';
  if(stMe.brake!=null&&stOt.brake!=null&&Math.abs(stOt.brake-stMe.brake)>=5)why=stOt.brake>stMe.brake?subjName(subject)+' frena unos '+(stOt.brake-stMe.brake)+' m mas tarde (metro '+stOt.brake+' frente a tu '+stMe.brake+'), mas cerca de la curva':'tu frenas unos '+(stMe.brake-stOt.brake)+' m mas tarde (metro '+stMe.brake+' frente a '+stOt.brake+'), mas cerca de la curva';
  else if(Math.abs(stOt.apexKmh-stMe.apexKmh)>=2)why='la diferencia esta en la velocidad de vertice ('+Math.round(stMe.apexKmh)+' frente a '+Math.round(stOt.apexKmh)+' km/h)';
  return 'Tu mayor perdida contra '+subjName(subject)+' esta en la curva '+worst.c.n+' ('+worst.c.name+'): unos '+Math.round(worst.d)+' ms. '+(why?why.charAt(0).toUpperCase()+why.slice(1)+'. ':'')+'Es lo que miden los datos; la causa exacta no se puede demostrar con esto.';}
function deltaGrowth(subject,lap){
  var seg=AN.deltaSegments(traceOf('you',lap),traceOf(subject,lap),DS,100),grows=[],i;
  for(i=1;i<seg.length;i++){var g=(seg[i-1].delta-seg[i].delta)*1000;if(g>20)grows.push({m:seg[i].m,g:Math.round(g)});}
  if(!grows.length)return 'La diferencia con '+subjName(subject)+' no crece en ningun tramo de 100 m de forma clara.';
  mem.subject=subject;mem.lap=lap||1;
  var txt=grows.map(function(x){return 'sobre el metro '+x.m+' (+'+x.g+' ms)';}).join(', ');
  var c0=null;window.TRACK_MONZA.corners.forEach(function(c){if(grows[0].m>=c.entry-100&&grows[0].m<=c.exit+100)c0=c;});
  return 'La diferencia con '+subjName(subject)+' crece en: '+txt+'.'+(c0?' Lo gordo esta en la zona de la curva '+c0.n+' ('+c0.name+').':'');}
function lapCompare(){
  var L=laps(),t1=L.player1[L.player1.length-1][1],t2=L.player2[L.player2.length-1][1];
  var cs=window.TRACK_MONZA.corners,best=null,worst=null;
  cs.forEach(function(c){var d=AN.cornerDelta(L.player1,L.player2,c,DS)*1000;
    if(best===null||d<best.d)best={c:c,d:d};
    if(worst===null||d>worst.d)worst={c:c,d:d};});
  mem.lap=2;
  return 'Vuelta 1: '+t1.toFixed(2)+' s. Vuelta 2: '+t2.toFixed(2)+' s ('+(t2>t1?'+':'')+(t2-t1).toFixed(2)+' s). En la 2 mejoras en la curva '+best.c.n+' ('+Math.round(-best.d)+' ms) y pierdes en la '+worst.c.n+' ('+Math.round(worst.d)+' ms, levantaste en '+worst.c.name+').';}
function route(raw){
  var t=norm(raw);
  if(!t)return null;
  if(/^(hola|buenas|ey|buenos dias|buenas tardes)/.test(t)||(/^que tal/.test(t)&&!/curva|vuelta|pierd|frena|tramo|diferencia|mapa/.test(t)))return 'Hola. Puedo analizar tus vueltas de Monza (demo): frenadas, velocidades y donde ganas o pierdes contra la referencia o el de delante. Preguntame, por ejemplo: "donde pierdo mas?" o "frena antes el de delante en la 3?".';
  if(/gracias/.test(t))return 'De nada. Seguimos cuando quieras.';
  if(/(adios|hasta luego|nos vemos)/.test(t))return 'Hasta luego. La proxima sesion la analizamos igual.';
  if(/(que puedes hacer|ayuda|como funcionas|para que sirves)/.test(t))return 'Sin IA, solo calculo: comparo tus trazas cada 10 m con la referencia o con el rival de delante/ detras. Se decirte en que curva pierdes mas, quien frena antes en cada curva (a unos 10 m), quien sale mas rapido, en que tramo crece la diferencia y comparar tus vueltas entre si. Tengo memoria de la curva, el rival y la vuelta de la que hablamos.';
  if(/(quien gano|mundial|campeon)/.test(t))return null; // sin ruta: no es analisis de trazas
  var lap=pickLap(t)||mem.lap;
  var n=pickCorner(t);
  var wantsRival=/(delante|rival|el otro|detras)/.test(t);
  var wantsRef=/referencia/.test(t);
  var subject=wantsRival?'rival':wantsRef?'ref':(mem.subject||'ref');
  if(/compara.*vuelta|vuelta 2.*vuelta 1|vuelta 1.*vuelta 2|vuelta 2.*(respecto|contra)/.test(t))return lapCompare();
  if(n===null&&lap!==null&&mem.corner&&/^(y )?(tu )?((en|con) )?(la )?vuelta \d+[?]?$/.test(t))return cornerReport(mem.corner,mem.subject||'ref',lap);
  if(/donde (empieza|crece)|que tramo|cuando (empieza|crece)|me saca|empiezo a perder/.test(t))return deltaGrowth(subject,lap);
  if(/(donde pierdo|mayor perdida|peor curva|mas tiempo|me cuesta|mi peor)/.test(t))return worstCorner(subject,lap);
  if(n!==null)return cornerReport(n,subject,lap);
  if(/^(y )?(ahi|en esa|en esa curva|y el de delante|y el rival|y la referencia)/.test(t)&&mem.corner)return cornerReport(mem.corner,subject,lap);
  if(/frena(n)? (antes|despues|mas tarde|mas pronto)/.test(t)){
    if(mem.corner)return cornerReport(mem.corner,subject,lap);
    return worstCorner(subject,lap);}
  if(/mapa|circuito|trazado/.test(t))return {map:true,text:'Monza: 5.793 km, 11 curvas. Mapa con la geometria real (OpenStreetMap) y numeracion oficial FIA; los metros por curva contrastados con hotlapdelta. Toca una curva para analizarla.'};
  return null;}
window.CHAT={route:route,mem:mem};
})();
