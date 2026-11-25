import * as THREE from 'three';
import {GLTFLoader} from './GLTFLoader.js';
import {OrbitControls} from './OrbitControls.js';

const view=document.getElementById('view');
const DEPS=[
 {id:'neumaticos', name:'Neumaticos', role:'Degradacion y gomas', face:'face-neumaticos.jpg', nodata:true},
 {id:'telemetria', name:'Telemetria', role:'Frenadas y pilotaje', face:'face-telemetria.jpg', nodata:false},
 {id:'estrategia', name:'Estrategia', role:'Paradas y combustible', face:'face-estrategia.jpg', nodata:true},
 {id:'rivales', name:'Rivales', role:'El de delante y el de detras', face:'face-rivales.jpg', nodata:false},
 {id:'meteo', name:'Meteo', role:'Tiempo de pista', face:'face-meteo.jpg', nodata:true}
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

scene.add(new THREE.HemisphereLight(0x8fb4ff,0x0a0f16,0.55));
const key=new THREE.DirectionalLight(0xffffff,1.1);key.position.set(4,8,6);scene.add(key);
const rim=new THREE.DirectionalLight(0x3f6cff,0.7);rim.position.set(-6,5,-6);scene.add(rim);

// suelo
const grid=new THREE.GridHelper(30,30,0x1c3a5e,0x101c2c);
scene.add(grid);
const floor=new THREE.Mesh(new THREE.CircleGeometry(15,48),new THREE.MeshStandardMaterial({color:0x0a0f16,roughness:0.85,metalness:0.2}));
floor.rotation.x=-Math.PI/2;floor.position.y=-0.01;scene.add(floor);

// marco holografico del box
const frame=new THREE.Mesh(new THREE.BoxGeometry(12,5.4,8),new THREE.MeshBasicMaterial({color:0x2a9dff,wireframe:true,transparent:true,opacity:0.08}));
frame.position.y=2.7;scene.add(frame);

// coche AMR23
const loader=new GLTFLoader();
const carMat=new THREE.MeshStandardMaterial({color:0x0d5c43,metalness:0.75,roughness:0.35});
let car=null;
loader.load('amr23.glb',g=>{
  car=g.scene;
  car.traverse(o=>{if(o.isMesh)o.material=carMat;});
  const box=new THREE.Box3().setFromObject(car);
  const size=box.getSize(new THREE.Vector3());
  const s=5.2/Math.max(size.x,size.y,size.z);
  car.scale.setScalar(s);
  box.setFromObject(car);
  const c=box.getCenter(new THREE.Vector3());
  car.position.sub(c);car.position.y+=0.32;
  scene.add(car);
},undefined,()=>{
  const ph=new THREE.Mesh(new THREE.BoxGeometry(4.6,0.7,1.9),carMat);
  ph.position.y=0.45;scene.add(ph);car=ph; // marcador honesto si el modelo no carga
});

// holograma: ingeniero de pista (la voz de radio)
let holo=null;
loader.load('hologlyph-bust.glb',g=>{
  holo=g.scene;
  const holoMat=new THREE.MeshBasicMaterial({color:0x59d6ff,transparent:true,opacity:0.55});
  holo.traverse(o=>{
    if(o.isMesh){
      o.material=holoMat;
      const wf=new THREE.Mesh(o.geometry,new THREE.MeshBasicMaterial({color:0x9fe8ff,wireframe:true,transparent:true,opacity:0.18}));
      o.add(wf);
    }
  });
  const box=new THREE.Box3().setFromObject(holo);
  const size=box.getSize(new THREE.Vector3());
  const s=2.0/Math.max(size.x,size.y,size.z);
  holo.scale.setScalar(s);
  box.setFromObject(holo);
  const c=box.getCenter(new THREE.Vector3());
  holo.position.set(-c.x,2.6-c.y,-1.2-c.z);
  scene.add(holo);
},undefined,()=>{
  holo=new THREE.Mesh(new THREE.SphereGeometry(0.5,24,18),new THREE.MeshBasicMaterial({color:0x59d6ff,wireframe:true,transparent:true,opacity:0.4}));
  holo.position.set(0,3.1,-1.2);scene.add(holo);
});

// paneles de especialistas en arco
function makePanel(d,angle){
  const cv=document.createElement('canvas');cv.width=512;cv.height=760;
  const g=cv.getContext('2d');
  const tex=new THREE.CanvasTexture(cv);
  const mat=new THREE.MeshBasicMaterial({map:tex,transparent:true});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1.7,2.5),mat);
  const r=5.4;
  mesh.position.set(Math.sin(angle)*r,2.15,-Math.cos(angle)*r-0.6);
  mesh.lookAt(0,2.0,6);
  scene.add(mesh);
  const p={d,cv,g,tex,mesh,activeUntil:0,img:null};
  const img=new Image();
  img.onload=()=>{p.img=img;drawPanel(p);};
  img.src=d.face;
  panelByDept[d.id]=p;
  drawPanel(p);
}
function drawPanel(p){
  const g=p.g,W=512,H=760;
  const on=performance.now()<p.activeUntil;
  g.clearRect(0,0,W,H);
  g.fillStyle=on?'rgba(16,52,86,0.92)':'rgba(10,18,30,0.88)';
  g.fillRect(0,0,W,H);
  g.strokeStyle=on?'#59d6ff':'#22304a';g.lineWidth=on?8:3;
  g.strokeRect(4,4,W-8,H-8);
  if(p.img)g.drawImage(p.img,56,40,400,400);
  g.fillStyle='#dfe6ee';g.font='bold 44px system-ui';g.textAlign='center';
  g.fillText(p.d.name,W/2,510);
  g.fillStyle='#8fa3bd';g.font='30px system-ui';
  g.fillText(p.d.role,W/2,556);
  g.font='28px system-ui';
  if(p.d.nodata){g.fillStyle='#c9a227';g.fillText('Sin datos en la demo',W/2,640);}
  else if(on){g.fillStyle='#59d6ff';g.fillText('Analizando...',W/2,640);}
  else{g.fillStyle='#5f7b9c';g.fillText('En espera',W/2,640);}
  p.tex.needsUpdate=true;
}
makePanel(DEPS[0],-0.95);makePanel(DEPS[1],-0.48);makePanel(DEPS[2],0.48);makePanel(DEPS[3],0.95);makePanel(DEPS[4],0);

// jefe de pista: etiqueta sobre el holograma
(function(){
  const cv=document.createElement('canvas');cv.width=512;cv.height=128;
  const g=cv.getContext('2d');
  g.fillStyle='rgba(10,18,30,0.85)';g.fillRect(0,0,512,128);
  g.strokeStyle='#59d6ff';g.strokeRect(3,3,506,122);
  g.fillStyle='#9fe8ff';g.font='bold 40px system-ui';g.textAlign='center';
  g.fillText('Jefe de pista · tu voz de radio',256,58);
  g.fillStyle='#7f8ea3';g.font='26px system-ui';
  g.fillText('retrato generado por IA',256,98);
  const tex=new THREE.CanvasTexture(cv);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(2.4,0.6),new THREE.MeshBasicMaterial({map:tex,transparent:true}));
  m.position.set(0,4.35,-1.2);scene.add(m);
})();

function resize(){
  const w=view.clientWidth,h=view.clientHeight;
  renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();
}
addEventListener('resize',resize);
view.appendChild(renderer.domElement);
resize();

const clock=new THREE.Clock();
(function anim(){
  requestAnimationFrame(anim);
  const t=clock.getElapsedTime();
  if(car)car.rotation.y=t*0.25;
  if(holo){holo.position.y=2.6+Math.sin(t*1.4)*0.06;holo.rotation.y=Math.sin(t*0.5)*0.25;}
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
function add(cls,txt){const d=document.createElement('div');d.className='msg '+cls;d.textContent=txt;log.appendChild(d);log.scrollTop=log.scrollHeight;}
function addDeps(deps){
  const names=(deps||[]).map(id=>id==='jefe'?'Jefe de pista':id.charAt(0).toUpperCase()+id.slice(1));
  const d=document.createElement('div');d.className='deps';
  d.textContent='Han trabajado: '+names.join(', ');
  log.appendChild(d);log.scrollTop=log.scrollHeight;
}
add('bot','Soy el jefe de pista, tu voz de radio. Detras de mi, el equipo: telemetria mide tus frenadas y rivales compara con el de delante y el de detras. Neumaticos, estrategia y meteo aun no tienen datos en esta demo y lo veras en sus paneles. Pregunta lo que quieras.');
function ask(){
  const txt=q.value.trim();if(!txt)return;q.value='';
  add('me',txt);
  const r=window.CHAT.route(txt);
  const ans=r===null?null:(typeof r==='object'?(r.text||''):r);
  if(ans===null){add('bot','No tengo una respuesta programada para eso. Prueba con curvas, frenadas, sectores, rivales o datos del circuito; y si solo quieres charlar, tambien vale.');return;}
  add('bot',ans);
  const deps=window.CHAT.mem.lastDeps||['jefe'];
  addDeps(deps);
  const now=performance.now();
  deps.forEach(id=>{const p=panelByDept[id];if(p){p.activeUntil=now+2600;drawPanel(p);}});
}
document.getElementById('send').onclick=ask;
q.addEventListener('keydown',e=>{if(e.key==='Enter')ask();});
