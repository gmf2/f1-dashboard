// Router de conversacion por reglas (regex + logica de codigo). Sin IA.
// Memoria de contexto: ultima curva, ultimo sujeto (tu/referencia/rival), ultima vuelta.
(function(){
var mem={corner:null,subject:null,lap:null,sector:null};
function norm(s){return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').trim();}
function pickCorner(t){var m=t.match(/curva\s*(\d{1,2})/)||t.match(/\bla\s*(\d{1,2})\b/);if(m)return parseInt(m[1]);return null;}
function pickLap(t){var m=t.match(/vuelta\s*(\d{1,2})/);if(m)return parseInt(m[1]);return null;}
function cornerByN(n){var cs=window.TRACK_MONZA.corners;for(var i=0;i<cs.length;i++)if(cs[i].n===n)return cs[i];return null;}
function laps(){return window.LAPS_DEMO;}
function traceOf(subject,lap){
  var L=laps();
  if(subject==='rival')return L.rivalAhead;
  if(subject==='rivalB')return L.rivalBehind;
  if(subject==='ref')return L.reference;
  return lap===2?L.player2:L.player1;}
function subjName(s){return s==='rival'?'el de delante':s==='rivalB'?'el de detras':s==='ref'?'la referencia':'tu';}
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
  var meA=Math.round(me.apexKmh),otA=Math.round(ot.apexKmh);
  var dv=otA-meA; // diferencia calculada sobre los valores MOSTRADOS para que cuadren
  if(Math.abs(dv)>=2)parts.push(dv>0?who+' pasa por el vertice '+dv+' km/h mas rapido ('+otA+' frente a '+meA+')':'tu pasas por el vertice '+(-dv)+' km/h mas rapido ('+meA+' frente a '+otA+')');
  else parts.push('velocidad de vertice igualada ('+meA+' km/h)');
  var meX=Math.round(me.exitKmh),otX=Math.round(ot.exitKmh);
  var dexit=otX-meX;
  if(Math.abs(dexit)>=2)parts.push(dexit>0?who+' sale '+dexit+' km/h mas rapido hacia la siguiente':'tu sales '+(-dexit)+' km/h mas rapido hacia la siguiente');
  var dt=-AN.cornerDelta(traceOf('you',lap),traceOf(subject,lap),c,DS)*1000;
  parts.push('en esta curva '+(dt>20?'pierdes unos '+Math.round(dt)+' ms':dt<-20?'ganas unos '+Math.round(-dt)+' ms':'ni ganas ni pierdes (+-20 ms)'));
  parts.push('La diferencia en metros y km/h es lo que miden los datos; por que lo consigue no se puede demostrar con esto.');
  mem.corner=n;mem.subject=subject;mem.lap=lap||1;mem.sector=null;mem.lastIntent='corner';
  return parts.map(function(p){p=p.replace(/[.]+$/,'');return p.charAt(0).toUpperCase()+p.slice(1);}).join('. ')+'.';}
function worstCorner(subject,lap){
  var cs=window.TRACK_MONZA.corners,worst=null;
  var best=null;
  cs.forEach(function(c){var d=-AN.cornerDelta(traceOf('you',lap),traceOf(subject,lap),c,DS)*1000;
    if(worst===null||d>worst.d)worst={c:c,d:d};
    if(best===null||d<best.d)best={c:c,d:d};});
  mem.subject=subject;mem.lap=lap||1;
  if(worst.d<20){var dd=Math.round(worst.d);
    mem.lastIntent='worst';
    if(dd<0){mem.corner=best.c.n;return 'Contra '+subjName(subject)+' no pierdes en ninguna curva; donde mas ganas es la '+best.c.n+' ('+best.c.name+'): unos '+Math.round(-best.d)+' ms a tu favor.';}
    mem.corner=worst.c.n;return 'Contra '+subjName(subject)+' no pierdes mas de 20 ms en ninguna curva; la que mas te cuesta es la '+worst.c.n+' ('+worst.c.name+'), pero solo son unos '+dd+' ms.';}
  mem.corner=worst.c.n;mem.lastIntent='worst';
  var stMe=AN.cornerStats(traceOf('you',lap),worst.c,DS,prevExitOf(worst.c.n));
  var stOt=AN.cornerStats(traceOf(subject,lap),worst.c,DS,prevExitOf(worst.c.n));
  var why='';
  if(stMe.brake!=null&&stOt.brake!=null&&Math.abs(stOt.brake-stMe.brake)>=5)why=stOt.brake>stMe.brake?subjName(subject)+' frena unos '+(stOt.brake-stMe.brake)+' m mas tarde (metro '+stOt.brake+' frente a tu '+stMe.brake+'), mas cerca de la curva':'tu frenas unos '+(stMe.brake-stOt.brake)+' m mas tarde (metro '+stMe.brake+' frente a '+stOt.brake+'), mas cerca de la curva';
  else if(Math.abs(Math.round(stOt.apexKmh)-Math.round(stMe.apexKmh))>=2)why='la diferencia esta en la velocidad de vertice ('+Math.round(stMe.apexKmh)+' frente a '+Math.round(stOt.apexKmh)+' km/h)';
  return 'Tu mayor perdida contra '+subjName(subject)+' esta en la curva '+worst.c.n+' ('+worst.c.name+'): unos '+Math.round(worst.d)+' ms. '+(why?why.charAt(0).toUpperCase()+why.slice(1)+'. ':'')+'Es lo que miden los datos; la causa exacta no se puede demostrar con esto.';}
function lapTimeOf(subject,lap){var tr=traceOf(subject,lap);return tr[tr.length-1][1];}
function paceLine(subject,lap){
  var d=lapTimeOf(subject,lap)-lapTimeOf('you',lap),who=subjName(subject);
  if(Math.abs(d)<0.05)return 'con '+who+' vas igualados de ritmo (+-0.05 s por vuelta)';
  var s=(Math.round(Math.abs(d)*100)/100).toFixed(2);
  var aw=who.replace(/^el de/,'al de');
  return d>0?('le ganas '+aw+' unos '+s+' s por vuelta'):(who+' te gana unos '+s+' s por vuelta');}
function gapReport(subject,lap){
  lap=lap||1;mem.lastIntent='gap';mem.lap=lap;mem.sector=null;mem.lastDeps=['jefe','telemetria','rivales'];
  var honest='El intervalo real de pista no lo tengo en esta demo: las trazas no traen posiciones, solo tiempos de vuelta. El ritmo es un dato distinto del gap, asi que no te puedo dar la ventaja real en segundos.';
  if(subject==='both')return honest+' Como dato aparte, de ritmo en la vuelta '+lap+': '+paceLine('rival',lap)+'; '+paceLine('rivalB',lap)+'.';
  mem.subject=subject;
  return honest+' Como dato aparte, de ritmo: '+paceLine(subject,lap)+' (vuelta '+lap+').';}
function adviceReport(subject,lap){
  lap=lap||1;
  var cs=window.TRACK_MONZA.corners,worst=null,best=null;
  cs.forEach(function(c){var d=-AN.cornerDelta(traceOf('you',lap),traceOf(subject,lap),c,DS)*1000;
    if(worst===null||d>worst.d)worst={c:c,d:d};
    if(best===null||d<best.d)best={c:c,d:d};});
  mem.subject=subject;mem.lap=lap;mem.sector=null;mem.lastIntent='advice';
  var who=subjName(subject);
  if(worst.d<20){
    if(best.d<=-20){mem.corner=best.c.n;return 'Contra '+who+' no pierdes tiempo claro en ninguna curva de esta vuelta (todo dentro de +-20 ms); donde ya sacas mas es la '+best.c.n+' ('+best.c.name+'). De ritmo, '+paceLine(subject,lap)+'. Con estos datos no veo un punto concreto que atacar.';}
    mem.corner=worst.c.n;
    return 'Contra '+who+' no pierdes mas de 20 ms en ninguna curva de esta vuelta. De ritmo, '+paceLine(subject,lap)+'. Con estos datos no veo un punto concreto que atacar.';}
  mem.corner=worst.c.n;
  var stMe=AN.cornerStats(traceOf('you',lap),worst.c,DS,prevExitOf(worst.c.n));
  var stOt=AN.cornerStats(traceOf(subject,lap),worst.c,DS,prevExitOf(worst.c.n));
  var det=[];
  if(stMe.brake!=null&&stOt.brake!=null&&Math.abs(stOt.brake-stMe.brake)>=5)det.push(stOt.brake>stMe.brake?who+' frena unos '+(stOt.brake-stMe.brake)+' m mas tarde que tu (metro '+stOt.brake+' frente a tu '+stMe.brake+')':'tu frenas unos '+(stMe.brake-stOt.brake)+' m mas tarde que '+who);
  var dv=Math.round(stOt.apexKmh)-Math.round(stMe.apexKmh);
  if(Math.abs(dv)>=2)det.push(dv>0?who+' pasa por el vertice '+dv+' km/h mas rapido ('+Math.round(stOt.apexKmh)+' frente a '+Math.round(stMe.apexKmh)+')':'tu pasas por el vertice '+(-dv)+' km/h mas rapido');
  var dx=Math.round(stOt.exitKmh)-Math.round(stMe.exitKmh);
  if(Math.abs(dx)>=2)det.push(dx>0?who+' sale '+dx+' km/h mas rapido':'tu sales '+(-dx)+' km/h mas rapido');
  return 'Contra '+who+', el punto a revisar es la curva '+worst.c.n+' ('+worst.c.name+'): ahi dejas unos '+Math.round(worst.d)+' ms en esta vuelta. '+(det.length?'Lo medido: '+det.join('; ')+'. ':'')+'Es donde los numeros marcan la mayor diferencia; que hacer exactamente ahi (frenada, linea, reglaje) no se puede demostrar con estos datos.';}
function defenseReport(lap){
  lap=lap||1;mem.lastIntent='defense';mem.lap=lap;mem.sector=null;mem.subject='rivalB';mem.lastDeps=['jefe','telemetria','rivales'];
  return 'La defensa depende de la situacion de carrera (distancia real, DRS, neumaticos, trafico) y esta demo no tiene esos datos: no te puedo dar una maniobra concreta sin inventarla. Como dato aparte, de ritmo: '+paceLine('rivalB',lap)+' (vuelta '+lap+').';}
function deltaGrowth(subject,lap){
  var seg=AN.deltaSegments(traceOf('you',lap),traceOf(subject,lap),DS,100),grows=[],i;
  for(i=1;i<seg.length;i++){var g=(seg[i-1].delta-seg[i].delta)*1000;if(g>20)grows.push({m:seg[i].m,g:Math.round(g)});}
  if(!grows.length)return 'La diferencia con '+subjName(subject)+' no crece en ningun tramo de 100 m de forma clara.';
  mem.subject=subject;mem.lap=lap||1;mem.lastIntent='growth';
  var txt=grows.map(function(x){return 'sobre el metro '+x.m+' (+'+x.g+' ms)';}).join(', ');
  var c0=null;window.TRACK_MONZA.corners.forEach(function(c){if(grows[0].m>=c.entry-100&&grows[0].m<=c.exit+100)c0=c;});
  return 'La diferencia con '+subjName(subject)+' crece en: '+txt+'.'+(c0?' Lo gordo esta en la zona de la curva '+c0.n+' ('+c0.name+').':'');}
function lapCompare(){
  var L=laps(),t1=L.player1[L.player1.length-1][1],t2=L.player2[L.player2.length-1][1];
  var cs=window.TRACK_MONZA.corners,best=null,worst=null;
  cs.forEach(function(c){var d=AN.cornerDelta(L.player1,L.player2,c,DS)*1000;
    if(best===null||d<best.d)best={c:c,d:d};
    if(worst===null||d>worst.d)worst={c:c,d:d};});
  mem.lap=2;mem.lastIntent='lap';
  return 'Vuelta 1: '+t1.toFixed(2)+' s. Vuelta 2: '+t2.toFixed(2)+' s ('+(t2>t1?'+':'')+(t2-t1).toFixed(2)+' s). En la 2 mejoras en la curva '+best.c.n+' ('+Math.round(-best.d)+' ms) y pierdes en la '+worst.c.n+' ('+Math.round(worst.d)+' ms, levantaste en '+worst.c.name+').';}
function sectorReport(s,subject,lap){
  var secs=window.TRACK_MONZA.sectors,sec=secs[s-1];
  if(!sec)return 'Monza tiene 3 sectores; el '+s+' no existe. Pregunta por el 1, el 2 o el 3.';
  var me=traceOf('you',lap),ot=traceOf(subject,lap);
  var startM=s===1?0:secs[s-2].end;
  var d=-(AN.deltaAt(me,ot,sec.end,DS)-AN.deltaAt(me,ot,startM,DS))*1000;
  var cs=window.TRACK_MONZA.corners.filter(function(c){return c.exit>startM&&c.entry<sec.end;});
  var worst=null;
  cs.forEach(function(c){var cd=-AN.cornerDelta(me,ot,c,DS)*1000;
    if(worst===null||cd>worst.d)worst={c:c,d:cd};});
  mem.subject=subject;mem.lap=lap||1;mem.lastIntent='sector';
  if(worst&&worst.d>20)mem.corner=worst.c.n;
  var parts=['Sector '+s+', vuelta '+(lap||1)+' contra '+subjName(subject)+': '+(d>20?'pierdes unos '+Math.round(d)+' ms':d<-20?'ganas unos '+Math.round(-d)+' ms':'empatados (+-20 ms)')];
  if(cs.length)parts.push('en este sector estan las curvas '+cs.map(function(c){return c.n;}).join(', '));
  if(worst&&Math.abs(worst.d)>20)parts.push('la que mas pesa es la '+worst.c.n+' ('+worst.c.name+'): unos '+Math.round(worst.d)+' ms');
  parts.push('Las lineas de sector son las del mapa oficial FIA (S1 a 233 m antes de la 4, S2 a 215 m antes de la 8); la diferencia en ms es lo que miden los datos, la causa no se puede demostrar con esto');
  return parts.map(function(p){p=p.replace(/[.]+$/,'');return p.charAt(0).toUpperCase()+p.slice(1);}).join('. ')+'.';}
function socialRoute(t){
  if(/como (estas|vas|te va)|que tal (estas|vas|te va)/.test(t))return 'Soy un programa, ni bien ni mal: listo para calcular cuando quieras. Mas me interesa tu: como llegas tu a la sesion?';
  if(/estoy (nervioso|nerviosa|cansado|cansada|contento|contenta|motivado|motivada|rayado|rayada|quemado|quemada)/.test(t))return 'No siento, pero te escucho. Si te ayuda a centrarte, miramos donde ganas y donde pierdes; y si prefieres desconectar un rato, tambien vale. Tu diriges.';
  if(/(que|como) (has hecho|ha ido|te ha ido)( hoy| tu dia| el dia)?/.test(t))return 'Yo no tengo dia: espero a que me preguntes y calculo. Sin vida propia, de verdad. Cuentame tu como va la tuya si te apetece.';
  if(/te (quiero|aprecio|echo de menos)|eres (grande|crack|el mejor|la mejor)|me caes bien/.test(t))return 'Se agradece, aunque soy codigo y no me llega como a una persona. Para lo que sirvo de verdad es para tus vueltas: usame ahi.';
  if(/cuentame un chiste|un chiste|hazme reir/.test(t))return 'De chistes se poco, soy mejor con frenadas. Mira la curva 1 de Monza: todos llegan pensando que frenan tarde y casi nadie acierta el metro. Eso es lo mas parecido a humor que tengo.';
  if(/tienes (sentimientos|emociones|conciencia)|eres (un |una )?(humano|humana|persona|consciente|real)/.test(t))return 'No: soy un programa de calculo con reglas de conversacion. Sin sentimientos ni conciencia. Lo que si hago es medir bien y decirte cuando no se algo.';
  if(/te gusta|tu (comida|color|equipo|piloto) favorito/.test(t))return 'No tengo gustos: soy codigo. Si me preguntas por pilotos o equipos solo puedo hablarte de lo que miden las trazas demo de Monza.';
  return null;}
function circuitFact(t){
  if(/cuantas curvas|curvas tiene/.test(t))return 'Monza tiene 11 curvas segun la numeracion oficial FIA. Tienes el mapa a la derecha; toca una para analizarla.';
  if(/velocidad maxima|punta|tope de velocidad|mas rapido.*recta|recta.*mas rapido/.test(t)){
    var L=laps(),mx=0;L.player1.forEach(function(b){if(b[2]>mx)mx=b[2];});
    return 'En la traza demo tu maxima son '+Math.round(mx)+' km/h. Es el dato de esta demo; la velocidad real dependera de tu coche y reglaje.';}
  if(/que es (el )?drs/.test(t))return 'El DRS es el aleron trasero movil: se abre en zonas habilitadas cuando estas a menos de 1 s del de delante y quita resistencia para adelantar. En Monza 2025 hay 2 zonas (mapa oficial FIA): deteccion 95 m antes de la curva 7, activacion 170 m despues; y deteccion 20 m despues de la 11, activacion 12 m despues de meta.';
  if(/\bdrs\b|zona de drs|alas/.test(t))return 'En Monza 2025 hay 2 zonas DRS segun el mapa oficial FIA: deteccion 95 m antes de la curva 7 y activacion 170 m despues de la 7; la segunda detecta 20 m despues de la 11 y se activa 12 m despues de meta.';
  if(/cuanto mide|longitud|kilometros|km tiene/.test(t))return 'Monza mide 5.793 km segun la FIA; la geometria OpenStreetMap que uso para el mapa mide 5.774 m (16 m menos, dentro del trazado de la linea). 11 curvas, 3 sectores.';
  if(/que tiempo|llueve|lluvia|clima|meteo|mojado|seco/.test(t))return 'Eso no lo mido: la demo no tiene meteo y no invento datos. Cuando la APK este conectada podre hablar de lo que mande el juego.';
  if(/quien va (primero|ganando|delante en el)|mundial|clasificacion general|campeonato/.test(t))return 'No tengo datos del mundial ni de la clasificacion: solo analizo las trazas demo de Monza. No invento clasificaciones.';
  if(/proxima carrera|cuando (es|se corre|corren)|que gp|gran premio/.test(t))return 'No tengo el calendario en esta demo; solo mido vueltas de Monza. Eso te lo puedo mirar fuera si me lo pides por el chat normal.';
  return null;}
function route(raw){
  var t=norm(raw);
  if(!t)return null;
  mem.lastDeps=['jefe'];
  if(/^(hola|buenas|ey|buenos dias|buenas tardes)/.test(t)||(/^que tal/.test(t)&&!/curva|vuelta|pierd|frena|tramo|diferencia|mapa/.test(t)))return 'Hola. Puedo analizar tus vueltas de Monza (demo): frenadas, velocidades y donde ganas o pierdes contra la referencia o el de delante. Preguntame, por ejemplo: "donde pierdo mas?" o "frena antes el de delante en la 3?".';
  if(/gracias/.test(t))return 'De nada. Seguimos cuando quieras.';
  if(/^(estas ahi|me oyes|sigues ahi|estas)[?]?$/.test(t))return 'Si, aqui estoy, en el muro. Que miramos: curvas, sectores o rivales?';
  if(/(adios|hasta luego|nos vemos)/.test(t))return 'Hasta luego. La proxima sesion la analizamos igual.';
  if(/(que puedes hacer|ayuda|como funcionas|para que sirves)/.test(t))return 'Analisis y enrutado sin IA, solo calculo: comparo tus trazas cada 10 m con la referencia, con el de delante o con el de detras. Se decirte en que curva o sector pierdes mas, quien frena antes en cada curva (a unos 10 m), quien sale mas rapido, en que tramo crece la diferencia, el ritmo por vuelta contra cada rival (el gap real de pista no lo mido) y comparar tus vueltas entre si. Tambien datos del circuito (curvas, sectores, DRS) del mapa oficial FIA. Lo que no mido (meteo, mundial, calendario) te lo digo claro en vez de inventarlo.';
  var soc=socialRoute(t);
  if(soc)return soc;
  var fact=circuitFact(t);
  if(fact){if(/que tiempo|llueve|lluvia|clima|meteo|mojado|seco/.test(t))mem.lastDeps=['jefe','meteo'];return fact;}
  var lap=pickLap(t)||mem.lap;
  var n=pickCorner(t);
  if(n===null){var nm=[['parabolica',11],['alboreto',11],['ascari',8],['lesmo',6],['roggia',4],['retifilo',1],['rettifilo',1],['biassono',2],['curva grande',3]];for(var k=0;k<nm.length;k++){if(t.indexOf(nm[k][0])>=0){n=nm[k][1];break;}}}
  var wantsBehind=/detras/.test(t);
  var wantsRival=/(delante|rival|el otro)/.test(t);
  var wantsRef=/referencia/.test(t);
  var subject=wantsBehind?'rivalB':wantsRival?'rival':wantsRef?'ref':(mem.subject||'ref');
  mem.lastDeps=['jefe','telemetria'];
  if(subject==='rival'||subject==='rivalB')mem.lastDeps.push('rivales');
  var secM=t.match(/sector\s*([0-9]+)/);var sn=secM?parseInt(secM[1]):null;
  if(!sn){var w=t.match(/\b(primer|segundo|tercer)\s+sector/);if(w)sn=({primer:1,segundo:2,tercer:3})[w[1]];}
  if(sn){mem.sector=sn;return sectorReport(sn,subject,lap);}
  if(/como van los sectores|analisis por sectores|sectores/.test(t))return [1,2,3].map(function(s){return sectorReport(s,subject,lap);}).join(' ');
  if(n===null&&mem.sector&&/^y (el )?\d{1,2}[?]?$/.test(t)){var msn=parseInt(t.match(/\d{1,2}/)[0]);mem.sector=msn;return sectorReport(msn,subject,lap);}
  if(n===null&&mem.sector&&/^(y )?(con |contra )?(el de (delante|detras)|la referencia|el rival)[?]?$/.test(t))return sectorReport(mem.sector,subject,lap);
  if(/compara.*vuelta|vuelta 2.*vuelta 1|vuelta 1.*vuelta 2|vuelta 2.*(respecto|contra)/.test(t))return lapCompare();
  if(n===null&&lap!==null&&mem.corner&&/^(y )?(tu )?((en|con) )?(la )?vuelta \d+( ahi)?[?]?$/.test(t))return cornerReport(mem.corner,mem.subject||'ref',lap);
  if(n===null){
    if(/defiendo|defender|defenderse|mantener la posicion|me adelanta/.test(t))return defenseReport(lap);
    var advQ=/^(que|k) (puedo|podria) (hacer|cambiar|mejorar)|^(que|k) hago|consej|recomiend|sugerenc|como (le )?(recorto|recorte|gano|cojo|cazo|adelanto)|como (puedo )?(ir|ser) mas rapido|aumentar|sacar?le? mas tiempo|saco mas tiempo|mejorar mi ritmo/.test(t);
    if(advQ){var asub;
      if(/detras/.test(t))asub='rivalB';
      else if(/delante|rival/.test(t))asub='rival';
      else if(/recort|caz|cojo|adelanto/.test(t))asub='rival';
      else if(/aument|saco mas tiempo|sacar mas tiempo/.test(t))asub='rivalB';
      else if(mem.subject==='rival'||mem.subject==='rivalB')asub=mem.subject;
      else asub='ref';
      return adviceReport(asub,lap);}
    var gapQ=/\bgap\b|\bventaja\b|\bmargen\b|\bintervalo\b|\bsg\b|cuantos? segundos|cuanto (me|le|nos) saca|a cuantos? (voy|vas|estoy|llevo)|llevo de ventaja/.test(t)&&!/cuanto (dura|mide|tarda)/.test(t);
    if(gapQ){var gsub;
      if(/del de delante|con el de delante|el de delante|delante\?*$/.test(t)&&!/por delante/.test(t))gsub='rival';
      else if(/por delante|voy primero|llevo ventaja/.test(t))gsub='rivalB';
      else if(/detras/.test(t))gsub='rivalB';
      else if(/me saca|por detras/.test(t))gsub='rival';
      else if(mem.subject==='rival'||mem.subject==='rivalB')gsub=mem.subject;
      else gsub='both';
      return gapReport(gsub,lap);}
    if(/^(y )?(con |contra )?(el de (delante|detras)|la referencia|el rival)[?]?$/.test(t)&&(mem.lastIntent||mem.corner||mem.sector)){
      var ns=/detras/.test(t)?'rivalB':/delante|rival/.test(t)?'rival':'ref';
      if(mem.lastIntent==='gap')return gapReport(ns,lap);
      if(mem.lastIntent==='advice')return adviceReport(ns,lap);
      if(mem.lastIntent==='worst')return worstCorner(ns,lap);
      if(mem.lastIntent==='defense')return defenseReport(lap);
      if(mem.lastIntent==='sector'&&mem.sector)return sectorReport(mem.sector,ns,lap);
      if(mem.corner)return cornerReport(mem.corner,ns,lap);
      if(mem.sector)return sectorReport(mem.sector,ns,lap);}
  }
  if(/donde (empieza|crece)|que tramo|cuando (empieza|crece)|me saca|empiezo a perder/.test(t))return deltaGrowth(subject,lap);
  if(/compar/.test(t)&&!/vuelta/.test(t))return worstCorner(subject,lap);
  if(/(donde|dnde)\b.*\b(pierd\w*|perd\w*)/.test(t))return worstCorner(subject,lap);
  if(/\b(pierd\w*|perd\w*)\b.*\btiempo\b|\btiempo\b.*\b(pierd\w*|perd\w*)\b/.test(t))return worstCorner(subject,lap);
  if(/\b(estoy|estas|sigo|vengo)\s+perdiendo\b/.test(t))return worstCorner(subject,lap);
  if(/\bmas lento\b|se me (va|escapa)( el)? tiempo/.test(t))return worstCorner(subject,lap);
  if(/(donde pierdo|mayor perdida|peor curva|mas tiempo|me cuesta|mi peor|freno peor|frenando peor|peor frenada)/.test(t))return worstCorner(subject,lap);
  if(n!==null)return cornerReport(n,subject,lap);
  if(/^(y )?(ahi|en esa|en esa curva|y el de delante|y el de detras|y el rival|y la referencia)/.test(t)&&mem.corner)return cornerReport(mem.corner,subject,lap);
  if(/frena(n)? (antes|despues|mas tarde|mas pronto)/.test(t)){
    if(mem.corner)return cornerReport(mem.corner,subject,lap);
    return worstCorner(subject,lap);}
  if(/mapa|circuito|trazado/.test(t))return {map:true,text:'Monza: 5.793 km, 11 curvas. Mapa con la geometria real (OpenStreetMap) y numeracion oficial FIA; los metros por curva contrastados con hotlapdelta. Toca una curva para analizarla.'};
  return null;}
// Memoria compartida entre vistas (muro y box en iframe, mismo origen):
// cada respuesta guarda el contexto y el evento storage lo adopta en la otra vista.
var MEM_KEY='f1-chat-mem-v1';
function saveMem(){try{localStorage.setItem(MEM_KEY,JSON.stringify(mem));}catch(e){}}
function adoptMem(v){try{var m=JSON.parse(v);if(m&&typeof m==='object'){for(var k in m)mem[k]=m[k];}}catch(e){}}
var HAS_LS=(typeof localStorage!=='undefined'),HAS_LS_EV=(typeof addEventListener!=='undefined');
if(HAS_LS){try{var prev=localStorage.getItem(MEM_KEY);if(prev)adoptMem(prev);}catch(e){}}
if(HAS_LS_EV)addEventListener('storage',function(e){if(e.key===MEM_KEY&&e.newValue)adoptMem(e.newValue);});
window.CHAT={route:function(t){var r=route(t);saveMem();return r;},mem:mem};
})();
