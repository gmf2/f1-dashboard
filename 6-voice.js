// Salida de voz: sintesis del navegador (speechSynthesis), sin cuentas ni claves. Normalmente local en Android; no se garantiza para toda voz.
// Entrada por micro: SpeechRecognition del navegador. En Chrome el audio lo procesa el
// servicio de reconocimiento de Google (NO es local). Etiquetado asi en la interfaz.
// Diagnostico: los errores reales del navegador se exponen por onState ('speak-error', error)
// para que la interfaz los muestre en vez de fallar en silencio.
// Barge-in: en modo radio la escucha sigue activa mientras hablo; una frase del usuario
// me interrumpe (guarda antieco: si el texto coincide con lo que estoy diciendo, es mi
// propia voz por el altavoz y se ignora).
(function(){
/* Backend nativo de la APK (v1.3): si el puente Android ofrece reconocimiento
   ON-DEVICE (SpeechRecognizer local, sin descargas) y TTS del sistema, se usa
   ese camino y el audio no sale del dispositivo. Si no, se mantiene el motor
   del navegador (web) y, si tampoco, la interfaz cae a texto con explicacion. */
var NAT=(function(){
  try{return typeof window!=='undefined'&&window.Android
    &&typeof window.Android.speechAvailable==='function'
    &&window.Android.speechAvailable()==='1';}catch(e){return false;}})();
var out={enabled:false,lastError:null,voiceName:null,speaking:false};
var cbs=[];
function emit(st,err){for(var i=0;i<cbs.length;i++){try{cbs[i](st,err);}catch(e){}}}
function onState(f){if(typeof f==='function')cbs.push(f);}

function pickVoice(){
  if(!('speechSynthesis' in window))return null;
  var vs=window.speechSynthesis.getVoices();
  if(!vs||!vs.length)return null;
  function low(v){return (v.lang||'').toLowerCase().replace('_','-');}
  var es=[],i;
  for(i=0;i<vs.length;i++)if(low(vs[i]).indexOf('es')===0)es.push(vs[i]);
  var g=es.filter(function(v){return /google/i.test(v.name);});
  var local=es.filter(function(v){return v.localService&&low(v)==='es-es';});
  var exact=es.filter(function(v){return low(v)==='es-es';});
  var v=g[0]||local[0]||exact[0]||es[0]||vs[0];
  out.voiceName=v?v.name:null;
  return v;}
if('speechSynthesis' in window){
  try{window.speechSynthesis.onvoiceschanged=function(){pickVoice();};}catch(e){}}

// Troceo defensivo en frases cortas: algunos motores cortan utterances largas.
function chunk(t){
  var parts=String(t).match(/[^.!?;:]+[.!?;:]?/g)||[String(t)];
  var res=[],cur='';
  for(var i=0;i<parts.length;i++){
    if((cur+parts[i]).length>180){if(cur)res.push(cur);cur=parts[i];}
    else cur+=parts[i];}
  if(cur)res.push(cur);
  return res.map(function(s){return s.trim();}).filter(function(s){return s.length>0;});}

var spokenNow=''; // texto que estoy diciendo ahora mismo (para la guarda antieco)
function norm(s){
  return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/[^a-z0-9ñ ]+/g,' ').replace(/\s+/g,' ').trim();}

// Orden de repeticion inequivoca (complementa a isStopCmd): nunca se filtra como eco.
function isRepeatCmd(txt){
  var t=norm(txt);
  return /^(repite|repitelo|repite eso|repetir|otra vez)( por favor)?$/.test(t);}

// Guarda antieco: decide si una transcripcion es probablemente MI propia voz
// (el altavoz reentrando por el micro) y no el usuario interrumpiendo.
// Sesgo hacia el usuario: ante la duda se acepta la frase (un falso corte se
// recupera; descartar una orden real deja al usuario sin respuesta).
function looksEcho(txt){
  var s=norm(spokenNow),t=norm(txt);
  if(!s||!t)return false;
  if(isStopCmd(txt)||isRepeatCmd(txt))return false; // ordenes legitimas: nunca eco
  var sw=s.split(' '),tw=t.split(' ').filter(function(w){return w.length>=3;});
  // subcadena exacta larga de lo que estoy diciendo (>=3 palabras): casi seguro eco
  if(t.length>=10&&tw.length>=3&&s.indexOf(t)>=0)return true;
  // solape ordenado: >=80% de las palabras de contenido y en el mismo orden.
  // Exige >=4 palabras: consultas cortas del usuario ("curva tres") siempre pasan.
  if(tw.length<4)return false;
  var hit=0,pos=0;
  for(var i=0;i<tw.length;i++){
    var found=-1;
    for(var j=pos;j<sw.length;j++){
      if(sw[j].indexOf(tw[i])===0||tw[i].indexOf(sw[j])===0){found=j;break;}}
    if(found<0)continue;hit++;pos=found+1;}
  return hit/tw.length>=0.8;
}

var speakToken=0; // invalida la cola anterior al cancelar
function interrupt(){
  if(!out.speaking)return false;
  speakToken++;
  spokenNow='';
  if(NAT){try{window.Android.ttsStop();}catch(e){}}
  else if('speechSynthesis' in window)window.speechSynthesis.cancel();
  out.speaking=false;
  emit('interrupted');
  return true;}

function speakQueue(chunks,i,v,tok){
  if(tok!==speakToken){return;}
  if(i>=chunks.length||!out.enabled){out.speaking=false;spokenNow='';emit('speak-end');return;}
  spokenNow=chunks.slice(i).join(' ');
  var u=new SpeechSynthesisUtterance(chunks[i]);
  u.lang='es-ES';u.rate=1.02;u.pitch=1.0;
  if(v)u.voice=v;
  out.speaking=true;emit('speak-start');
  u.onend=function(){speakQueue(chunks,i+1,v,tok);};
  u.onerror=function(e){
    var err=(e&&e.error)||'desconocido';
    // 'canceled'/'interrupted': cancelacion intencionada (nuevo speak o barge-in), no es fallo
    if(err==='canceled'||err==='interrupted'){spokenNow='';return;}
    out.speaking=false;spokenNow='';
    out.lastError=err;
    emit('speak-error',err);};
  window.speechSynthesis.speak(u);}

var natQueue=[];
function natSpeakNext(tok){
  if(tok!==speakToken)return;
  if(!natQueue.length||!out.enabled){out.speaking=false;spokenNow='';emit('speak-end');return;}
  var c=natQueue.shift();
  spokenNow=c;
  out.speaking=true;emit('speak-start');
  window.__f1ttsdone=function(){natSpeakNext(tok);};
  try{window.Android.ttsSpeak(c);}catch(e){natSpeakNext(tok);}}
function speak(text){
  if(!out.enabled)return;
  if(NAT){
    var chunksN=chunk(text);
    speakToken++;
    try{window.Android.ttsStop();}catch(e){}
    natQueue=chunksN.slice();
    natSpeakNext(speakToken);
    return;}
  if(!('speechSynthesis' in window))return;
  var v=pickVoice();
  var chunks=chunk(text);
  speakToken++;
  window.speechSynthesis.cancel();
  // pequena pausa tras cancel(): en algunos Chromium un speak inmediato se pierde (medida defensiva)
  setTimeout(function(){speakQueue(chunks,0,v,speakToken);},60);}

function toggle(){
  out.enabled=!out.enabled;
  out.lastError=null;
  if(!out.enabled){interrupt();}
  return out.enabled;}

// Sesion nativa: SpeechRecognizer en dispositivo via puente Android.
// El reconocedor nativo entrega una frase por escucha: se rearma tras cada
// resultado o error recuperable (misma idea que la sesion web).
function natSession(h){
  h=h||{};
  var active=true;
  function restart(){
    if(!active)return;
    setTimeout(function(){
      if(!active)return;
      try{window.Android.speechStart('es-ES');}
      catch(e){active=false;h.onState&&h.onState('error:start');}},250);}
  window.__f1speechready=function(){};
  window.__f1speechpartial=function(){};
  window.__f1speech=function(txt,conf){
    if(!active)return;
    txt=String(txt||'');
    if(!txt){restart();return;}
    if(h.bargeIn&&out.speaking){
      if(looksEcho(txt)){restart();return;} // mi propia voz por el altavoz
      interrupt();}
    if(h.onFinal)h.onFinal(txt);
    restart();};
  window.__f1speecherr=function(err){
    if(!active)return;
    err=String(err);
    if(err==='permiso_denegado'){active=false;h.onState&&h.onState('error:not-allowed');return;}
    h.onState&&h.onState('warn:nativo-'+err);
    restart();};
  try{window.Android.speechStart('es-ES');}
  catch(e){h.onState&&h.onState('error:start');return null;}
  h.onState&&h.onState('listening');
  return {
    pause:function(){try{window.Android.speechStop();}catch(e){}},
    resume:function(){restart();},
    close:function(){active=false;try{window.Android.speechStop();}catch(e){}h.onState&&h.onState('idle');},
    isActive:function(){return active;}};}

// Una sola escucha (compatibilidad): una pregunta por pulsacion.
function listen(onText,onSt){
  if(NAT){
    var ses=natSession({onFinal:function(txt){onText(txt);},onState:onSt});
    return ses;}
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){onSt&&onSt('unsupported');return null;}
  var r=new SR();r.lang='es-ES';r.interimResults=false;
  r.onresult=function(e){onText(e.results[0][0].transcript);};
  r.onend=function(){onSt&&onSt('idle');};
  r.onerror=function(e){onSt&&onSt('error:'+e.error);};
  r.start();onSt&&onSt('listening');
  return r;}

// Sesion de radio: escucha continua con un toque. Cada frase final pasa por onFinal.
// Se rearma sola tras cortes del navegador; errores de permiso/dispositivo cierran la sesion.
// h.bargeIn=true: no pausa la escucha mientras hablo; una frase real del usuario corta
// la voz (interrupt) y se procesa. La guarda antieco descarta mi propia voz reentrada.
function listenSession(h){
  h=h||{};
  if(NAT)return natSession(h);
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){h.onState&&h.onState('unsupported');return null;}
  var rec=null,active=true,netFails=0,restarts=[];
  function bail(err){active=false;h.onState&&h.onState('error:'+err);}
  function start(){
    if(!active||rec)return;
    var now=Date.now();
    restarts=restarts.filter(function(t){return now-t<60000;});
    if(restarts.length>=10){bail('demasiados-reintentos');return;}
    restarts.push(now);
    rec=new SR();rec.lang='es-ES';rec.interimResults=false;rec.continuous=true;
    rec.onresult=function(e){
      for(var i=e.resultIndex;i<e.results.length;i++){
        if(!e.results[i].isFinal)continue;
        var txt=e.results[i][0].transcript;
        if(h.bargeIn&&out.speaking){
          if(looksEcho(txt))continue; // mi propia voz por el altavoz: ignorar
          interrupt(); // el usuario habla: me callo y le escucho
        }
        if(h.onFinal)h.onFinal(txt);}};
    rec.onend=function(){
      rec=null;
      if(active)setTimeout(function(){start();},250);
      else h.onState&&h.onState('idle');};
    rec.onerror=function(e){
      var err=(e&&e.error)||'desconocido';
      if(err==='not-allowed'||err==='service-not-allowed'||err==='audio-capture'){bail(err);return;}
      if(err==='network'){netFails++;if(netFails>=3){bail('network');return;}}
      else netFails=0;
      h.onState&&h.onState('warn:'+err);};
    try{rec.start();}catch(e){rec=null;active=false;h.onState&&h.onState('error:start');return;}
    h.onState&&h.onState('listening');}
  start();
  return {
    pause:function(){var r=rec;rec=null;if(r){try{r.onend=null;r.onerror=null;r.onresult=null;r.stop();}catch(e){}}},
    resume:function(){if(active&&!rec)start();},
    close:function(){active=false;var r=rec;rec=null;if(r){try{r.onend=null;r.onerror=null;r.onresult=null;r.stop();}catch(e){}}h.onState&&h.onState('idle');},
    isActive:function(){return active;}};}

// Filtro de frases de la sesion: ignora ruido corto; orden de cierre por voz.
function filterPhrase(txt){
  var t=String(txt||'').trim();
  if(t.length<3)return null;
  return t;}
function isStopCmd(txt){
  var t=String(txt||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').trim();
  // ordenes inequivocas: nunca palabras comunes sueltas como "para" (falso cierre en plena conversacion)
  return /^(corta|termina|cierra)( (el |la )?(micro|radio|sesion|escucha))?[!.]?$/.test(t)
      || /^(para|callate) (el |la )?(micro|radio|sesion|escucha)[!.]?$/.test(t);}

window.VOICE={speak:speak,toggle:toggle,listen:listen,listenSession:listenSession,native:function(){return NAT;},
  filterPhrase:filterPhrase,isStopCmd:isStopCmd,chunk:chunk,onState:onState,
  interrupt:interrupt,looksEcho:looksEcho,isRepeatCmd:isRepeatCmd,
  isSpeaking:function(){return out.speaking;},
  currentSpeech:function(){return spokenNow;},
  isOn:function(){return out.enabled;},
  lastError:function(){return out.lastError;},
  voiceName:function(){return out.voiceName;}};
})();
