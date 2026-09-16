import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js";

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x070b12);
scene.fog=new THREE.Fog(0x070b12,18,65);

const camera=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,.05,100);
camera.position.set(0,1.65,7);

const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0x9bb8ff,0x10141b,1.5));
const sun=new THREE.DirectionalLight(0xffffff,2.2);
sun.position.set(8,14,5);
sun.castShadow=true;
scene.add(sun);

const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:0x111821,roughness:.92,metalness:.05}));
floor.rotation.x=-Math.PI/2;
floor.receiveShadow=true;
scene.add(floor);

const grid=new THREE.GridHelper(100,50,0x253343,0x18222e);
grid.position.y=.012;
scene.add(grid);

const blocks=[];
for(let i=0;i<22;i++){
  const h=THREE.MathUtils.randFloat(1.5,5);
  const b=new THREE.Mesh(new THREE.BoxGeometry(THREE.MathUtils.randFloat(1.4,4),h,THREE.MathUtils.randFloat(1.4,4)),new THREE.MeshStandardMaterial({color:0x18222e,roughness:.8}));
  b.position.set(THREE.MathUtils.randFloatSpread(38),h/2,THREE.MathUtils.randFloatSpread(38)-8);
  b.castShadow=true;b.receiveShadow=true;scene.add(b);blocks.push(b);
}

const gun=new THREE.Group();
const body=new THREE.Mesh(new THREE.BoxGeometry(.28,.25,.9),new THREE.MeshStandardMaterial({color:0x252e3b,metalness:.7,roughness:.28}));
body.position.set(.38,-.28,-.65);
const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.055,.065,.5,12),new THREE.MeshStandardMaterial({color:0x11151b,metalness:.9,roughness:.2}));
barrel.rotation.x=Math.PI/2;barrel.position.set(.38,-.24,-1.08);
gun.add(body,barrel);camera.add(gun);scene.add(camera);

const player={pos:new THREE.Vector3(0,1.65,7),yaw:0,pitch:0,health:100,score:0,speed:6,cool:0,dash:0};
const enemies=[];
const keys={};
let running=false,spawnTimer=0,wave=1,fireHeld=false;
const enemyEl=document.getElementById("enemies"),scoreEl=document.getElementById("score"),healthEl=document.querySelector("#health i"),message=document.getElementById("message");

function spawnEnemy(){
  const a=Math.random()*Math.PI*2;
  const r=THREE.MathUtils.randFloat(18,28);
  const group=new THREE.Group();
  const core=new THREE.Mesh(new THREE.SphereGeometry(.65,18,12),new THREE.MeshStandardMaterial({color:0xff4058,emissive:0x5a0714,emissiveIntensity:1.8,metalness:.3,roughness:.35}));
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.82,.06,8,24),new THREE.MeshBasicMaterial({color:0xff9aa6}));
  ring.rotation.x=Math.PI/2;
  group.add(core,ring);
  group.position.set(Math.cos(a)*r,.8,Math.sin(a)*r-7);
  group.userData={hp:2+Math.floor(wave/2),speed:THREE.MathUtils.randFloat(1.4,2.4)+wave*.08,shot:THREE.MathUtils.randFloat(1,2)};
  group.traverse(o=>{if(o.isMesh)o.castShadow=true});
  scene.add(group);enemies.push(group);
}

function shoot(){
  if(!running||player.cool>0)return;
  player.cool=.18;
  gun.position.z=-.08;
  setTimeout(()=>gun.position.z=0,45);
  const ray=new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2(0,0),camera);
  const hits=ray.intersectObjects(enemies,true);
  if(hits.length){
    let e=hits[0].object;
    while(e.parent&&!e.userData.hp)e=e.parent;
    if(e.userData.hp){
      e.userData.hp--;
      e.scale.multiplyScalar(.86);
      if(e.userData.hp<=0){
        scene.remove(e);
        const idx=enemies.indexOf(e);
        if(idx>=0)enemies.splice(idx,1);
        player.score+=100;
      }
    }
  }
}

function update(dt){
  player.cool=Math.max(0,player.cool-dt);
  const move=new THREE.Vector3();
  if(keys.KeyW)move.z-=1;if(keys.KeyS)move.z+=1;if(keys.KeyA)move.x-=1;if(keys.KeyD)move.x+=1;
  if(stick.active){move.x+=stick.x;move.z+=stick.y}
  if(move.lengthSq()){
    move.normalize().multiplyScalar(player.speed*dt);
    const dir=new THREE.Vector3(-Math.sin(player.yaw),0,-Math.cos(player.yaw));
    const right=new THREE.Vector3(Math.cos(player.yaw),0,-Math.sin(player.yaw));
    player.pos.addScaledVector(right,move.x).addScaledVector(dir,-move.z);
  }
  player.pos.x=THREE.MathUtils.clamp(player.pos.x,-47,47);
  player.pos.z=THREE.MathUtils.clamp(player.pos.z,-47,47);
  camera.position.copy(player.pos);
  camera.rotation.order="YXZ";camera.rotation.y=player.yaw;camera.rotation.x=player.pitch;
  for(const e of enemies){
    const d=new THREE.Vector3().subVectors(player.pos,e.position);d.y=0;
    const dist=d.length();
    if(dist>1.7){d.normalize();e.position.addScaledVector(d,e.userData.speed*dt)}
    else player.health-=12*dt;
    e.lookAt(player.pos.x,e.position.y,player.pos.z);
  }
  if(player.health<=0)endGame();
  spawnTimer-=dt;
  if(spawnTimer<=0){
    spawnTimer=Math.max(.45,2.2-wave*.12);
    if(enemies.length<Math.min(4+wave,12))spawnEnemy();
    if(player.score>=wave*1000){wave++;message.textContent="OLEADA "+wave;message.classList.add("show");setTimeout(()=>message.classList.remove("show"),900)}
  }
  enemyEl.textContent=enemies.length;
  scoreEl.textContent=player.score;
  healthEl.style.width=Math.max(0,player.health)+"%";
  healthEl.classList.toggle("health-low",player.health<30);
}

function endGame(){
  if(!running)return;
  running=false;
  message.innerHTML="FIN DE LA PARTIDA<br><small>Puntos: "+player.score+"</small>";
  message.classList.add("show");
  setTimeout(()=>document.getElementById("start").style.display="grid",900);
}

document.getElementById("play").onclick=()=>{
  document.getElementById("start").style.display="none";
  message.classList.remove("show");
  running=true;player.health=100;player.score=0;wave=1;spawnTimer=.2;
  enemies.forEach(e=>scene.remove(e));enemies.length=0;
};

addEventListener("keydown",e=>{keys[e.code]=true;if(e.code==="Space")shoot()});
addEventListener("keyup",e=>keys[e.code]=false);
renderer.domElement.addEventListener("click",()=>{if(running)renderer.domElement.requestPointerLock?.()});
addEventListener("mousemove",e=>{
  if(document.pointerLockElement===renderer.domElement&&running){player.yaw-=e.movementX*.0024;player.pitch-=e.movementY*.0024;player.pitch=THREE.MathUtils.clamp(player.pitch,-1.35,1.35)}
});
document.getElementById("fire").addEventListener("touchstart",e=>{e.preventDefault();fireHeld=true;shoot()},{passive:false});
document.getElementById("fire").addEventListener("touchend",e=>{e.preventDefault();fireHeld=false},{passive:false});

const stick={active:false,x:0,y:0};
const stickEl=document.getElementById("stick"),knob=document.getElementById("knob");
function stickMove(t){
  const r=stickEl.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  let x=t.clientX-cx,y=t.clientY-cy;const max=48;const len=Math.hypot(x,y);
  if(len>max){x=x/len*max;y=y/len*max}
  knob.style.transform="translate("+x+"px,"+y+"px)";
  stick.x=x/max;stick.y=y/max;
}
stickEl.addEventListener("touchstart",e=>{stick.active=true;stickMove(e.touches[0])},{passive:false});
stickEl.addEventListener("touchmove",e=>{e.preventDefault();stickMove(e.touches[0])},{passive:false});
stickEl.addEventListener("touchend",()=>{stick.active=false;stick.x=stick.y=0;knob.style.transform="translate(0,0)"});
document.getElementById("dash").addEventListener("touchstart",e=>{e.preventDefault();player.pos.x-=Math.sin(player.yaw)*4;player.pos.z-=Math.cos(player.yaw)*4},{passive:false});

let last=performance.now();
function loop(now){
  const dt=Math.min(.033,(now-last)/1000);last=now;
  if(running)update(dt);
  if(fireHeld)shoot();
  renderer.render(scene,camera);
  requestAnimationFrame(loop);
}
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7))});
requestAnimationFrame(loop);