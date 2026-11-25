import * as THREE from 'three';
import {GLTFLoader} from './GLTFLoader.js';
import {OrbitControls} from './OrbitControls.js';
import {MeshoptDecoder} from './meshopt_decoder.module.js';

const view=document.getElementById('view');
const DEPS=[
 {id:'neumaticos', name:'Neumaticos', role:'Degradacion y gomas', nodata:true},
 {id:'telemetria', name:'Telemetria', role:'Frenadas y pilotaje', nodata:false},
 {id:'estrategia', name:'Estrategia', role:'Paradas y combustible', nodata:true},
 {id:'rivales', name:'Rivales', role:'El de delante y el de detras', nodata:false},
 {id:'meteo', name:'Meteo', role:'Tiempo de pista', nodata:true}
];
const panelByDept={};
let renderer;
try{
  renderer=new THREE.WebGLRenderer({antialias:true});
}catch(e){
  document.getElementById('fallback').style.display='flex';
}
if(renderer){
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x05070c);
scene.fog=new THREE.Fog(0x05070c,18,42);
const camera=new THREE.PerspectiveCamera(50,1,0.1,100);
camera.position.set(0,3.2,9);
const controls=new OrbitControls(camera,renderer.domElement);
controls.target.set(0,1.4,0);
controls.enableDamping=true;
controls.maxDistance=16;controls.minDistance=4;
controls.maxPolarAngle=Math.PI*0.52;

scene.add(new THREE.HemisphereLight(0x8fb4ff,0x1a2432,0.95));
const key=new THREE.DirectionalLight(0xffffff,1.1);key.position.set(4,8,6);scene.add(key);
const rim=new THREE.DirectionalLight(0x3f6cff,0.7);rim.position.set(-6,5,-6);scene.add(rim);
const top=new THREE.PointLight(0xffffff,60,30);top.position.set(0,7,1);scene.add(top);

// suelo
const grid=new THREE.GridHelper(30,30,0x1c3a5e,0x101c2c);
scene.add(grid);
const floor=new THREE.Mesh(new THREE.CircleGeometry(15,48),new THREE.MeshStandardMaterial({color:0x0a0f16,roughness:0.85,metalness:0.2}));
floor.rotation.x=-Math.PI/2;floor.position.y=-0.01;scene.add(floor);

// marco holografico del box
const frame=new THREE.Mesh(new THREE.BoxGeometry(12,5.4,8),new THREE.MeshBasicMaterial({color:0x2a9dff,wireframe:true,transparent:true,opacity:0.08}));
frame.position.y=2.7;scene.add(frame);

// estado de carga verificable desde fuera
window.__boxLoads={car:false,holo:false};
function markReady(k,how){window.__boxLoads[k]=how;}

// coche AMR23
const loader=new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
const carMat=new THREE.MeshStandardMaterial({color:0x1a7a5a,metalness:0.05,roughness:0.6,emissive:0x0a3524,emissiveIntensity:0.55,side:THREE.DoubleSide});
let car=null;
loader.load('amr23.glb?v=2',g=>{
  const inner=g.scene;
  inner.traverse(o=>{if(o.isMesh){if(!o.geometry.attributes.normal)o.geometry.computeVertexNormals();o.material=carMat;}});
  inner.rotation.x=-Math.PI/2; // el STL viene en Z-arriba
  car=new THREE.Group();car.add(inner);
  const box=new THREE.Box3().setFromObject(car);
  const size=box.getSize(new THREE.Vector3());
  const s=5.2/Math.max(size.x,size.y,size.z);
  car.scale.setScalar(s);
  box.setFromObject(car);
  const c=box.getCenter(new THREE.Vector3());
  car.position.sub(c);car.position.y+=0.35;
  scene.add(car);
  markReady('car','model');
},undefined,(err)=>{
  window.__boxCarErr=String(err&&err.message||err).slice(0,200);
  const ph=new THREE.Mesh(new THREE.BoxGeometry(4.6,0.7,1.9),carMat);
  ph.position.y=0.45;scene.add(ph);car=ph; // marcador honesto si el modelo no carga
  markReady('car','placeholder');
});

// holograma: ingeniero de pista (la voz de radio)
let holo=null;
loader.load('hologlyph-bust.glb?v=3',g=>{
  holo=g.scene;
  const holoMat=new THREE.MeshBasicMaterial({color:0x59d6ff,transparent:true,opacity:0.55});
  const holoWire=new THREE.MeshBasicMaterial({color:0x9fe8ff,wireframe:true,transparent:true,opacity:0.18});
  const hmeshes=[];
  holo.traverse(o=>{if(o.isMesh)hmeshes.push(o);});
  hmeshes.forEach(o=>{o.material=holoMat;o.add(new THREE.Mesh(o.geometry,holoWire));});
  const box=new THREE.Box3().setFromObject(holo);
  const size=box.getSize(new THREE.Vector3());
  const s=2.0/Math.max(size.x,size.y,size.z);
  holo.scale.setScalar(s);
  box.setFromObject(holo);
  const c=box.getCenter(new THREE.Vector3());
  holo.position.set(-c.x,2.6-c.y,-1.2-c.z);
  scene.add(holo);
  markReady('holo','model');
},undefined,(err)=>{
  window.__boxHoloErr=String(err&&err.message||err).slice(0,200);
  holo=new THREE.Mesh(new THREE.SphereGeometry(0.5,24,18),new THREE.MeshBasicMaterial({color:0x59d6ff,wireframe:true,transparent:true,opacity:0.4}));
  holo.position.set(0,3.1,-1.2);scene.add(holo);
  markReady('holo','placeholder');
});

// paneles de especialistas en arco (siluetas: retratos pendientes del OK de Gabriel)
function makePanel(d,angle){
  const cv=document.createElement('canvas');cv.width=512;cv.height=760;
  const g=cv.getContext('2d');
  const tex=new THREE.CanvasTexture(cv);
  const mat=new THREE.MeshBasicMaterial({map:tex,transparent:true});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1.45,2.15),mat);
  const r=5.4;
  mesh.position.set(Math.sin(angle)*r,2.15,-Math.cos(angle)*r-0.6);
  mesh.lookAt(0,2.0,6);
  scene.add(mesh);
  const p={d,cv,g,tex,mesh,activeUntil:0};
  panelByDept[d.id]=p;
  drawPanel(p);
}
function drawSilhouette(g,x,y,w,h){
  // silueta cabeza-hombros, sin rasgos: los retratos IA esperan el OK de Gabriel
  g.fillStyle='#2b3b52';
  const cx=x+w/2;
  g.beginPath();g.arc(cx,y+h*0.32,w*0.20,0,Math.PI*2);g.fill(); // cabeza
  g.beginPath();
  g.moveTo(cx-w*0.34,y+h);
  g.bezierCurveTo(cx-w*0.34,y+h*0.52,cx-w*0.20,y+h*0.50,cx,y+h*0.50);
  g.bezierCurveTo(cx+w*0.20,y+h*0.50,cx+w*0.34,y+h*0.52,cx+w*0.34,y+h);
  g.closePath();g.fill();
  g.strokeStyle='#59d6ff';g.lineWidth=3;
  g.beginPath();g.arc(cx,y+h*0.32,w*0.20,0,Math.PI*2);g.stroke();
}
function drawPanel(p){
  const g=p.g,W=512,H=760;
  const on=performance.now()<p.activeUntil;
  g.clearRect(0,0,W,H);
  g.fillStyle=on?'rgba(16,52,86,0.92)':'rgba(10,18,30,0.88)';
  g.fillRect(0,0,W,H);
  g.strokeStyle=on?'#59d6ff':'#22304a';g.lineWidth=on?8:3;
  g.strokeRect(4,4,W-8,H-8);
  drawSilhouette(g,56,40,400,400);
  g.fillStyle='#dfe6ee';g.font='bold 44px system-ui';g.textAlign='center';
  g.fillText(p.d.name,W/2,530);
  g.fillStyle='#8fa3bd';g.font='30px system-ui';
  g.fillText(p.d.role,W/2,576);
  g.font='28px system-ui';
  if(p.d.nodata){g.fillStyle='#c9a227';g.fillText('Sin datos en la demo',W/2,656);}
  else if(on){g.fillStyle='#59d6ff';g.fillText('Analizando...',W/2,656);}
  else{g.fillStyle='#5f7b9c';g.fillText('En espera',W/2,656);}
  p.tex.needsUpdate=true;
}
makePanel(DEPS[0],-1.1);makePanel(DEPS[1],-0.58);makePanel(DEPS[2],0.58);makePanel(DEPS[3],1.1);makePanel(DEPS[4],-0.29);

// jefe de pista: rotulo sobre el holograma
(function(){
  const cv=document.createElement('canvas');cv.width=1024;cv.height=150;
  const g=cv.getContext('2d');
  g.fillStyle='rgba(10,18,30,0.85)';g.fillRect(0,0,1024,150);
  g.strokeStyle='#59d6ff';g.lineWidth=4;g.strokeRect(4,4,1016,142);
  g.fillStyle='#9fe8ff';g.font='bold 52px system-ui';g.textAlign='center';
  g.fillText('Jefe de pista · tu voz de radio',512,66);
  g.fillStyle='#7f8ea3';g.font='32px system-ui';
  g.fillText('holograma de juguete, no es una persona',512,116);
  const tex=new THREE.CanvasTexture(cv);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(3.4,0.5),new THREE.MeshBasicMaterial({map:tex,transparent:true}));
  m.position.set(0,4.75,-1.2);scene.add(m);
})();

function resize(){
  const w=view.clientWidth,h=view.clientHeight;
  renderer.setSize(w,h);camera.aspect=w/h;
  // encuadre: que quepan los paneles extremos del arco (+-1.1 rad, x~+-4.8 + semiancho ~0.8)
  // en pantallas estrechas (movil) alejamos la camara; en escritorio/tablet no cambia nada
  const need=6.1,planeZ=-3.05;
  const hTan=Math.tan(camera.fov*Math.PI/360)*camera.aspect;
  const z=Math.max(9,planeZ+need/hTan);
  camera.position.set(0,3.2,z);
  camera.updateProjectionMatrix();
}
addEventListener('resize',resize);
// al ocultarse dentro de otra pestana (iframe hidden) el canvas puede quedar en blanco:
// ResizeObserver reencuadra al volver a tener tamaño, y registramos perdidas de contexto GL
window.__boxCtxEvents=[];
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();window.__boxCtxEvents.push('lost');});
renderer.domElement.addEventListener('webglcontextrestored',()=>{window.__boxCtxEvents.push('restored');
  for(const id in panelByDept){panelByDept[id].tex.needsUpdate=true;}
  resize();});
new ResizeObserver(()=>{const w=view.clientWidth,h=view.clientHeight;if(w>0&&h>0)resize();}).observe(view);
window.__boxDebug={camera,controls,renderer,panelByDept,view,resize};
view.appendChild(renderer.domElement);
resize();

const clock=new THREE.Clock();
(function anim(){
  requestAnimationFrame(anim);
  const t=clock.getElapsedTime();
  if(car)car.rotation.y=t*0.25;
  if(holo&&window.__boxLoads.holo==='model'){holo.position.y=2.6+Math.sin(t*1.4)*0.06;holo.rotation.y=Math.sin(t*0.5)*0.25;}
  for(const id in panelByDept){
    const p=panelByDept[id];
    const on=performance.now()<p.activeUntil;
    if(on!==p._on){p._on=on;drawPanel(p);}
  }
  controls.update();
  renderer.render(scene,camera);
})();
} // fin if(renderer)

// chat conectado al mismo motor que el muro de boxes
const log=document.getElementById('log'),q=document.getElementById('q');
function add(cls,txt){const d=document.createElement('div');d.className='msg '+cls;d.textContent=txt;log.appendChild(d);log.scrollTop=log.scrollHeight;return d;}
function addDeps(deps){
  const names=(deps||[]).map(id=>id==='jefe'?'Jefe de pista':id.charAt(0).toUpperCase()+id.slice(1));
  const d=document.createElement('div');d.className='deps';
  d.textContent='Han trabajado: '+names.join(', ');
  log.appendChild(d);log.scrollTop=log.scrollHeight;
}
function renderCtx(){const b=document.getElementById('ctxbar');if(!b)return;const t=window.CHAT.memText();
  if(t){document.getElementById('ctxtext').textContent='Contexto: '+t;b.hidden=false;}else b.hidden=true;}
renderCtx();
addEventListener('storage',e=>{if(e.key==='f1-chat-mem-v1')renderCtx();});
const rb=document.getElementById('ctxreset');if(rb)rb.onclick=()=>{window.CHAT.resetMem();renderCtx();add('bot','Contexto reiniciado: empezamos de cero. Pregunta por curvas, frenadas, rivales o vueltas.');};
add('bot','Soy el jefe de pista, tu voz de radio. Detras de mi, el equipo: telemetria mide tus frenadas y rivales compara con el de delante y el de detras. Neumaticos, estrategia y meteo aun no tienen datos en esta demo y lo veras en sus paneles. Pregunta lo que quieras.');
function answer(txt){
  const r=window.CHAT.route(txt);
  const ans=r===null?null:(typeof r==='object'?(r.text||''):r);
  if(ans===null){add('bot','No tengo una respuesta programada para eso. Prueba con curvas, frenadas, sectores, rivales o datos del circuito; y si solo quieres charlar, tambien vale.');return;}
  add('bot',ans);
  if(window.VOICE)window.VOICE.speak(ans);
  const deps=window.CHAT.mem.lastDeps||['jefe'];
  addDeps(deps);
  const now=performance.now();
  deps.forEach(id=>{const p=panelByDept[id];if(p){p.activeUntil=now+2600;drawPanel(p);}});
  renderCtx();
}
function ask(){
  const txt=q.value.trim();if(!txt)return;q.value='';
  add('me',txt);
  answer(txt);
}
document.getElementById('send').onclick=ask;
q.addEventListener('keydown',e=>{if(e.key==='Enter')ask();});

// voz: sintesis del navegador (VOICE.speak; local o en red segun la voz) + micro con consentimiento (reconocimiento remoto en Chrome)
(function(){
  const vbtn=document.getElementById('voz'),mbtn=document.getElementById('micro');
  const bar=document.getElementById('mic-consent');
  if(!window.VOICE){vbtn.style.display='none';mbtn.style.display='none';return;}
  vbtn.onclick=function(){
    const on=window.VOICE.toggle();
    vbtn.textContent='Voz: '+(on?'ON':'OFF');
    if(on)window.VOICE.speak('Voz activada: sintesis del navegador.');
  };
  let session=null,micOK=false;
  window.VOICE.onState(function(st,err){
    if(st==='speak-error'){
      vbtn.textContent='Voz: error';
      add('bot','La voz ha fallado en este dispositivo (error del navegador: '+err+'). Revisa el volumen multimedia y la salida de voz del sistema; con ese error concreto puedo afinar la solucion.');}
    // barge-in: ya NO se pausa la escucha al hablar; la sesion (bargeIn:true) corta
    // la voz si el usuario habla (guarda antieco en voice.js).
    if(st==='interrupted')mbtn.textContent='Radio: ON';});
  function radioOff(silent){
    if(session){session.close();session=null;}
    mbtn.textContent='Micro';
    if(!silent)add('bot','Sesion de radio cerrada. Toca Micro para abrirla de nuevo.');}
  function startListen(){
    if(session){radioOff();return;}
    session=window.VOICE.listenSession({
      bargeIn:true,
      onFinal:function(txt){
        txt=window.VOICE.filterPhrase(txt);
        if(!txt)return;
        if(window.VOICE.isStopCmd(txt)){radioOff();return;}
        q.value=txt;ask();},
      onState:function(st){
        if(st==='listening')mbtn.textContent='Radio: ON';
        else if(st==='idle')mbtn.textContent='Micro';
        else if(st==='unsupported'){add('bot','Este navegador no tiene reconocimiento de voz.');radioOff(true);}
        else if(st.indexOf('error:')===0){add('bot','El micro ha fallado ('+st.slice(6)+'). Sesion cerrada; revisa el permiso de micro del navegador.');radioOff(true);}}});
    if(!session){add('bot','Este navegador no tiene reconocimiento de voz.');return;}
    add('bot','Modo radio abierto: habla cuando quieras. Si hablas mientras te contesto, me callo y te escucho. Di "corta" o toca Micro para cerrar.');
  }
  mbtn.onclick=function(){
    if(session){startListen();return;}
    if(micOK){startListen();return;}
    bar.style.display='block';
  };
  document.getElementById('mic-yes').onclick=function(){micOK=true;bar.style.display='none';startListen();};
  document.getElementById('mic-no').onclick=function(){bar.style.display='none';};
})();
