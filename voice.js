// Salida de voz: sintesis del navegador (speechSynthesis), sin cuentas ni claves. Normalmente local en Android; no se garantiza para toda voz.
// Entrada por micro: SpeechRecognition del navegador. En Chrome el audio lo procesa el
// servicio de reconocimiento de Google (NO es local). Etiquetado asi en la interfaz.
// Diagnostico: los errores reales del navegador se exponen por onState ('speak-error', error)
// para que la interfaz los muestre en vez de fallar en silencio.
(function(){
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
  var exact=es.filter(function(v){return low(v)==='es-es';});
  var v=g[0]||exact[0]||es[0]||vs[0];
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

function speakQueue(chunks,i,v){
  if(i>=chunks.length||!out.enabled){out.speaking=false;emit('speak-end');return;}
  var u=new SpeechSynthesisUtterance(chunks[i]);
  u.lang='es-ES';u.rate=1.05;
  if(v)u.voice=v;
  out.speaking=true;emit('speak-start');
  u.onend=function(){speakQueue(chunks,i+1,v);};
  u.onerror=function(e){
    out.speaking=false;
    out.lastError=(e&&e.error)||'desconocido';
    emit('speak-error',out.lastError);};
  window.speechSynthesis.speak(u);}

function speak(text){
  if(!out.enabled||!('speechSynthesis' in window))return;
  var v=pickVoice();
  var chunks=chunk(text);
  window.speechSynthesis.cancel();
  // pequena pausa tras cancel(): en algunos Chromium un speak inmediato se pierde (medida defensiva)
  setTimeout(function(){speakQueue(chunks,0,v);},60);}

function toggle(){
  out.enabled=!out.enabled;
  out.lastError=null;
  if(!out.enabled&&'speechSynthesis' in window)window.speechSynthesis.cancel();
  return out.enabled;}

// Una sola escucha (compatibilidad): una pregunta por pulsacion.
function listen(onText,onSt){
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
function listenSession(h){
  h=h||{};
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
        if(h.onFinal)h.onFinal(e.results[i][0].transcript);}};
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

window.VOICE={speak:speak,toggle:toggle,listen:listen,listenSession:listenSession,
  filterPhrase:filterPhrase,isStopCmd:isStopCmd,chunk:chunk,onState:onState,
  isOn:function(){return out.enabled;},
  lastError:function(){return out.lastError;},
  voiceName:function(){return out.voiceName;}};
})();
