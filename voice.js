// Salida de voz: sintesis del navegador (speechSynthesis), sin cuentas ni claves. Normalmente local en Android; no se garantiza para toda voz.
// Entrada por micro: SpeechRecognition del navegador. En Chrome el audio lo procesa el
// servicio de reconocimiento de Google (NO es local). Etiquetado asi en la interfaz.
(function(){
var out={enabled:false};
function speak(text){
  if(!out.enabled||!('speechSynthesis' in window))return;
  var u=new SpeechSynthesisUtterance(text);
  u.lang='es-ES';u.rate=1.05;
  window.speechSynthesis.cancel();window.speechSynthesis.speak(u);}
function toggle(){out.enabled=!out.enabled;
  if(!out.enabled&&'speechSynthesis' in window)window.speechSynthesis.cancel();
  return out.enabled;}
function listen(onText,onState){
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){onState&&onState('unsupported');return null;}
  var r=new SR();r.lang='es-ES';r.interimResults=false;
  r.onresult=function(e){onText(e.results[0][0].transcript);};
  r.onend=function(){onState&&onState('idle');};
  r.onerror=function(e){onState&&onState('error:'+e.error);};
  r.start();onState&&onState('listening');
  return r;}
window.VOICE={speak:speak,toggle:toggle,listen:listen,isOn:function(){return out.enabled;}};
})();
