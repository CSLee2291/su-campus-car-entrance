"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { SVGRenderer, SVGObject } from "three/addons/renderers/SVGRenderer.js";
import { driverPose, measurePanel, SIGN_POSITIONS, SIGN_SITES, SIGN_KEYS, type SignLocation, type DriverConfig, type VisibilityResult } from "./visibility";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
export type Scenario = "rain" | "trip" | "wind" | "glare" | "settle" | "heat";
export type SceneConfig = { scenario:Scenario; safe:boolean; wind:number; rain:number; brightness:number; width:number; height:number; location:"wall"|"tree"|"left"; driver?:DriverConfig; playing:boolean; reset:number; view:number };
export default function Scene({config,onVisibilityChange}:{config:SceneConfig;onVisibilityChange?:(results:VisibilityResult[])=>void}) {
 const host=useRef<HTMLDivElement>(null), live=useRef(config);live.current=config;const report=useRef(onVisibilityChange);report.current=onVisibilityChange;
 const [error,setError]=useState(false),[fallback,setFallback]=useState(false);
 useEffect(()=>{
  const el=host.current;if(!el)return;
  let renderer:THREE.WebGLRenderer|SVGRenderer;let svgMode=false;
  try{const canvas=document.createElement("canvas");const context=canvas.getContext("webgl2");if(!context)throw new Error("WebGL not available");const webgl=new THREE.WebGLRenderer({canvas,context,antialias:true,alpha:false});webgl.setPixelRatio(Math.min(window.devicePixelRatio,1.6));webgl.shadowMap.enabled=true;webgl.shadowMap.type=THREE.PCFSoftShadowMap;webgl.outputColorSpace=THREE.SRGBColorSpace;renderer=webgl;}catch{try{renderer=new SVGRenderer();renderer.setQuality("low");svgMode=true;setFallback(true);}catch{setError(true);return;}}
  renderer.setClearColor(new THREE.Color(0xdce7eb),1);
  el.appendChild(renderer.domElement);renderer.domElement.setAttribute("aria-label","字幕機、人行道、樹穴與停車場入口的三維示意模型，可拖曳旋轉及縮放");renderer.domElement.setAttribute("role","img");
  const scene=new THREE.Scene();scene.fog=new THREE.Fog(0xdce7eb,42,95);
  const camera=new THREE.PerspectiveCamera(39,1,.1,100);camera.position.set(2.3,4.6,14);
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(-1.6,2.8,-1.5);controls.enableDamping=true;controls.minDistance=5;controls.maxDistance=65;controls.maxPolarAngle=Math.PI*.48;controls.enablePan=true;
  const ambient=new THREE.HemisphereLight(0xf6fcff,0x698690,2.5);scene.add(ambient);
  const sun=new THREE.DirectionalLight(0xfff6dc,3.8);sun.position.set(-6,16,10);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-14;sun.shadow.camera.right=14;sun.shadow.camera.top=14;sun.shadow.camera.bottom=-14;sun.shadow.normalBias=.05;scene.add(sun);
  const material=(color:THREE.ColorRepresentation,roughness=.75)=>svgMode?new THREE.MeshBasicMaterial({color}):new THREE.MeshStandardMaterial({color,roughness});
  const brick=material(0x97664f),stone=material(0xc3c4bd),sidewalk=material(0xd0d1c9),asphalt=material(0x647078),metal=material(0x354344,.4),teal=material(0x248781),green=material(0x688950),glass=material(0x688a7d,.38);
  // Procedural brickwork keeps individual courses visible without using a photo as geometry.
  if(!svgMode){const tile=document.createElement("canvas");tile.width=256;tile.height=128;const tc=tile.getContext("2d")!;tc.fillStyle="#b5a79a";tc.fillRect(0,0,256,128);for(let row=0;row<4;row++)for(let col=-1;col<5;col++){const shade=105+((row*19+col*13+70)%30);tc.fillStyle=`rgb(${shade+37},${shade-7},${shade-22})`;tc.fillRect(col*64+(row%2)*32+1,row*32+1,62,30);}const bt=new THREE.CanvasTexture(tile);bt.wrapS=bt.wrapT=THREE.RepeatWrapping;bt.colorSpace=THREE.SRGBColorSpace;(brick as THREE.MeshStandardMaterial).map=bt;(brick as THREE.MeshStandardMaterial).color.set(0xffffff);}

  function box(w:number,h:number,d:number,x:number,y:number,z:number,mat:THREE.Material,parent:THREE.Object3D=scene){
   const geo=new THREE.BoxGeometry(w,h,d);
   if(mat===brick&&!svgMode){const uv=geo.attributes.uv;const normal=geo.attributes.normal;for(let i=0;i<uv.count;i++){const nx=Math.abs(normal.getX(i)),ny=Math.abs(normal.getY(i));uv.setXY(i,uv.getX(i)*(nx>.5?d:w)/.96,uv.getY(i)*(ny>.5?d:h)/.48);}uv.needsUpdate=true;}
   const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;if(svgMode){if(y<0)m.renderOrder=-50;else if(h<=.2&&y<.25)m.renderOrder=-40;if(d>=3&&h>=5)m.renderOrder=-30;else if(z<-1.25&&y>2)m.renderOrder=-29;else if(z<-1.25&&w>3)m.renderOrder=-28;if(parent===scene&&w>5&&h<.02&&y<.3)m.renderOrder=-39;}parent.add(m);return m;
  }
  function ball(r:number,x:number,y:number,z:number,mat:THREE.Material,parent:THREE.Object3D=scene){const m=new THREE.Mesh(new THREE.IcosahedronGeometry(r,1),mat);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}
  function pipe(points:number[][],color:THREE.ColorRepresentation,r=.035,parent:THREE.Object3D=scene){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p as [number,number,number])),false,"catmullrom",.05);const m=new THREE.Mesh(new THREE.TubeGeometry(curve,40,r,6,false),material(color));parent.add(m);return m;}
  function label(text:string,x:number,y:number,z:number,color="#193c45",bg="#ffffff"){const c=document.createElement("canvas");c.width=512;c.height=112;const ctx=c.getContext("2d")!;ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(2,2,508,108,18);ctx.fill();ctx.font='600 36px Arial,"Noto Sans TC",sans-serif';ctx.fillStyle=color;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(text,256,56);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false,opacity:svgMode?0:1}));s.scale.set(2.5,.55,1);s.position.set(x,y,z);if(svgMode){const g=document.createElementNS("http://www.w3.org/2000/svg","g");const rect=document.createElementNS("http://www.w3.org/2000/svg","rect");rect.setAttribute("x","-72");rect.setAttribute("y","-14");rect.setAttribute("width","144");rect.setAttribute("height","28");rect.setAttribute("rx","5");rect.setAttribute("fill",bg);const txt=document.createElementNS("http://www.w3.org/2000/svg","text");txt.setAttribute("text-anchor","middle");txt.setAttribute("y","4");txt.setAttribute("fill",color);txt.setAttribute("font-size","12");txt.setAttribute("font-family","Arial,sans-serif");txt.textContent=text;g.appendChild(rect);g.appendChild(txt);s.add(new SVGObject(g));s.userData.svgText=txt;}scene.add(s);return s;}
  // Photo-informed massing. Dimensions are illustrative; the driveway is the right-hand bay.
  const dark=material(0x293332),windowFrame=material(0x829487),cream=material(0xd0cfc5);
  function facade(w:number,h:number,d:number,x:number,y:number,z:number,mat:THREE.Material,order=-25){const m=box(w,h,d,x,y,z,mat);if(svgMode)m.renderOrder=order;return m;}
  // Cut the ground behind the entrance so the basement ramp really descends into an opening.
  box(26,.4,4,-4,-.10,1,stone);box(26,.09,6,-4,-.03,6,asphalt);box(26,.16,4,-4,.11,1,sidewalk);
  box(13.4,.35,7,-10.2,-.08,-4.5,stone);box(8,.35,7,4.8,-.08,-4.5,stone);
  for(let x=-17;x<9;x+=.6)box(.014,.008,3.9,x,.198,1,stone);
  for(let z=-.8;z<3;z+=.6)box(26,.008,.014,-4,.198,z,stone);
  const paverBand=material(0x8e948c);for(const x of [-14,-10,-6,-3.55,.55,4.5])box(.14,.012,3.95,x,.202,1,paverBand);
  box(13,.012,.16,-10.5,.202,1.35,paverBand);box(8,.012,.16,4.5,.202,1.35,paverBand);
  const yellow=material(0xd5b85d),red=material(0xb55c51);
  box(13.6,.16,.18,-10.2,.06,3.08,yellow);box(5.6,.16,.18,-.7,.06,3.08,red);box(6.7,.16,.18,5.65,.06,3.08,yellow);
  for(let x=-16;x<9;x+=4)box(2,.012,.09,x,.025,6.2,cream);
  // Red brick elevation, with the tall central brick bay over the vehicle entrance.
  facade(13.5,20.4,4.8,-10.25,10.2,-3.8,brick,-30);
  facade(4.3,17.15,4.8,-1.35,11.825,-3.8,brick,-30);
  facade(3.4,20.4,4.8,2.5,10.2,-3.8,brick,-30);
  facade(21.4,.25,5,-6.4,20.5,-3.8,stone,-25);facade(21.4,.14,5.08,-6.4,20.69,-3.8,cream,-24);
  // Recessed, green-framed window columns and proud stone spandrel panels.
  const bays=[-15.55,-13.25,-10.95,-8.65,-6.35,-4.2,2.75];
  for(let floor=0;floor<6;floor++){
   const base=3.8+floor*2.7;
   facade(4.3,.16,.19,-1.35,base+.04,-1.30,stone,-24);
   for(const x of bays){
    facade(1.68,1.53,.08,x,base+1.3,-1.34,glass,-24);
    facade(1.83,1.57,.05,x,base+1.3,-1.41,dark,-25);
    for(const dx of [-.84,0,.84])facade(.045,1.56,.07,x+dx,base+1.3,-1.28,windowFrame,-23);
    for(const dy of [-.76,.1,.76])facade(1.72,.045,.07,x,base+1.3+dy,-1.27,windowFrame,-23);
    facade(1.9,.94,.38,x,base+.045,-1.19,stone,-22);
    facade(.014,.92,.015,x,base+.045,-.992,paverBand,-21);
    facade(1.9,.025,.015,x,base+.08,-.992,cream,-21);
   }
  }
  // Coarse mortar lines are the vector-mode counterpart of the WebGL brick texture.
  if(svgMode){const joints:number[]=[];for(let y=.45;y<20.4;y+=.25){if(y>3.26)joints.push(-17,y,-1.386,4.2,y,-1.386);else joints.push(-17,y,-1.386,-3.5,y,-1.386,.8,y,-1.386,4.2,y,-1.386);}const jointGeo=new THREE.BufferGeometry();jointGeo.setAttribute("position",new THREE.Float32BufferAttribute(joints,3));const lines=new THREE.LineSegments(jointGeo,new THREE.LineBasicMaterial({color:0xae8973,transparent:true,opacity:.55}));lines.renderOrder=-27;scene.add(lines);}
  for(const y of [.6,1.25,2.05,2.9]){facade(13.5,.13,.23,-10.25,y,-1.28,stone,-23);facade(3.4,.13,.23,2.5,y,-1.28,stone,-23);}
  for(const x of [-15.45,-11,-8.7,-6.25]){facade(1.8,1.6,.09,x,1.74,-1.23,dark,-22);for(const dx of [-.88,0,.88])facade(.045,1.65,.1,x+dx,1.74,-1.15,windowFrame,-21);facade(1.8,.05,.1,x,1.7,-1.15,windowFrame,-21);}
  // Landmark on the left: brick surround and layered pale stone semicircular portal.
  const portalX=-13.2;
  facade(3.4,9.3,.75,portalX,4.7,-1.14,brick,-21);
  const portalShape=new THREE.Shape();portalShape.moveTo(-1.46,0);portalShape.lineTo(1.46,0);portalShape.lineTo(1.46,5.5);portalShape.absarc(0,5.5,1.46,0,Math.PI,false);portalShape.lineTo(-1.46,0);
  const portal=new THREE.Mesh(new THREE.ExtrudeGeometry(portalShape,{depth:.15,bevelEnabled:false,curveSegments:18}),stone);portal.position.set(portalX,.3,-.64);portal.renderOrder=-20;scene.add(portal);
  for(const radius of [1.1,1.28]){const arc=new THREE.Mesh(new THREE.TorusGeometry(radius,.026,5,28,Math.PI),paverBand);arc.position.set(portalX,5.8,-.45);arc.renderOrder=-19;scene.add(arc);for(const dx of [-radius,radius])facade(.025,1.5,.035,portalX+dx,5.04,-.44,paverBand,-19);}
  facade(.48,1,.04,portalX,5.55,-.445,dark,-18);facade(.65,.08,.16,portalX,5.02,-.39,cream,-17);
  for(const y of [2.65,3.1,3.35,4.1])facade(3.1,.09,.23,portalX,y,-.39,cream,-17);
  facade(1.85,.78,.1,portalX,3.69,-.39,material(0xb5b4a8),-17);
  const plaqueCanvas=document.createElement("canvas");plaqueCanvas.width=512;plaqueCanvas.height=160;const pc=plaqueCanvas.getContext("2d")!;pc.fillStyle="#b5b4a8";pc.fillRect(0,0,512,160);pc.fillStyle="#8a764b";pc.font='600 82px serif';pc.textAlign="center";pc.textBaseline="middle";pc.fillText("東吳大學",256,84);const plaqueTexture=new THREE.CanvasTexture(plaqueCanvas);plaqueTexture.colorSpace=THREE.SRGBColorSpace;
  if(!svgMode){const plaque=new THREE.Mesh(new THREE.PlaneGeometry(1.74,.61),new THREE.MeshBasicMaterial({map:plaqueTexture}));plaque.position.set(portalX,3.69,-.329);scene.add(plaque);}else{plaqueTexture.dispose();const text=document.createElementNS("http://www.w3.org/2000/svg","text");text.setAttribute("fill","#8a764b");text.setAttribute("font-size","8");text.setAttribute("text-anchor","middle");text.textContent="東吳大學";const name=new SVGObject(text);name.position.set(portalX,3.63,-.32);name.renderOrder=-16;scene.add(name);}
  // Low iron fence and brick piers, stopping before the driveway.
  for(const x of [-15.8,-11.8,-8.45,-5.1]){facade(.36,1.48,.46,x,.91,-.35,brick,-9);facade(.48,.12,.54,x,1.72,-.35,stone,-8);const cap=ball(.16,x,1.94,-.35,stone);cap.renderOrder=-7;}
  for(const [x,w] of [[-14.85,1.5],[-10.1,2.95],[-6.77,2.95]]){facade(w,.34,.34,x,.39,-.35,brick,-9);facade(w,.12,.44,x,.6,-.35,stone,-8);for(const y of [.8,1.42])facade(w,.035,.045,x,y,-.35,metal,-7);for(let dx=-w/2;dx<w/2;dx+=.16)facade(.024,.84,.028,x+dx,1.08,-.35,metal,-7);facade(w*.83,.54,.028,x,1.05,-.28,cream,-6);}
  // Basement entrance: ceiling, walls, a deep shadow and a sloped concrete ramp.
  facade(4.26,3.65,.14,-1.35,1.03,-6.08,dark,-33);
  facade(4.3,.12,4.55,-1.35,3.17,-3.7,dark,-32);
  facade(.13,3.38,4.55,-3.45,1.53,-3.68,cream,-31);facade(.13,3.38,4.55,.75,1.53,-3.68,cream,-31);
  facade(.14,1.35,4.55,-3.44,.18,-3.68,brick,-31);facade(.14,1.35,4.55,.74,.18,-3.68,brick,-31);
  const rampGeo=new THREE.BufferGeometry();rampGeo.setAttribute("position",new THREE.Float32BufferAttribute([-3.38,.19,-1.04,.68,.19,-1.04,.68,-1.45,-6,-3.38,-1.45,-6],3));rampGeo.setIndex([0,1,2,0,2,3]);rampGeo.computeVertexNormals();const rampMat=material(0x727a74);rampMat.side=THREE.DoubleSide;const ramp=new THREE.Mesh(rampGeo,rampMat);ramp.receiveShadow=true;ramp.renderOrder=-31.5;scene.add(ramp);
  for(let z=-1.25;z>-6;z-=.44){const y=.19+(z+1.04)*1.64/4.96;facade(4.03,.014,.03,-1.35,y+.006,z,stone,-31);}
  facade(4.35,.19,.32,-1.35,3.2,-1.28,stone,-20);facade(3.7,.48,.1,-1.35,2.88,-1.16,dark,-19);
  // Small entry signs (symbols only; the photo does not establish readable height limits).
  for(const [x,col] of [[-3.07,0xb34743],[-2.44,0x416d8e],[.25,0xb34743]] as [number,number][]){const disk=new THREE.Mesh(new THREE.CircleGeometry(.22,24),material(col));disk.position.set(x,3.12,-1.07);disk.renderOrder=-16;scene.add(disk);const inset=new THREE.Mesh(new THREE.CircleGeometry(.175,24),cream);inset.position.set(x,3.12,-1.058);inset.renderOrder=-15;scene.add(inset);if(x< -3){inset.material=material(0xb34743);facade(.29,.065,.01,x,3.12,-1.04,cream,-14);}}
  facade(.09,2.7,.09,.49,1.54,-.99,yellow,-10);for(let y=.45;y<2.8;y+=.32)facade(.096,.15,.098,.49,y,-.99,metal,-9);
  // Speed hump at the driveway crossing and a storm drain beside the red curb.
  for(let i=0;i<10;i++)facade(.415,.075,.3,-3.2+i*.415,.2,2.86,i%2?yellow:metal,-35);
  facade(1.05,.014,.29,-3.1,.207,2.57,metal,-34);for(let i=0;i<10;i++)facade(.025,.012,.26,-3.56+i*.10,.22,2.57,stone,-33);
  // Two separate basement exhaust housings: brick street faces, flat tiled caps,
  // and recessed cream louvers facing inward toward the driveway (not toward the street).
  function exhaustHousing(x:number,w:number,innerSide:1|-1){
   const z=-.15,d=1.9,top=1.30,innerX=x+innerSide*w/2;
   const body=facade(w,1.05,d,x,.725,z,brick,-8);body.userData.occluderKind="排風口箱體";
   facade(w+.1,.10,d+.10,x,top-.02,z,material(0x90614b),-7);
   // Seams on the tiled top and the street-facing brick courses.
   for(let dz=-.75;dz<=.8;dz+=.3)facade(w+.06,.006,.012,x,top+.033,z+dz,material(0xb38a72),-6);
   for(let yy=.30;yy<1.2;yy+=.13)facade(w,.011,.012,x,yy,z+d/2+.008,material(0xb08a72),-6);
   const grilleX=innerX+innerSide*.026;
   facade(.045,.86,1.63,grilleX,.75,z,metal,-5);
   for(const yy of [.31,1.18])facade(.11,.07,1.7,grilleX+innerSide*.025,yy,z,cream,-4);
   for(const zz of [z-.82,z+.82])facade(.11,.87,.075,grilleX+innerSide*.025,.75,zz,cream,-4);
   for(let yy=.4;yy<1.12;yy+=.11){const slat=facade(.1,.078,1.55,grilleX+innerSide*.048,yy,z,material(0xc0c2ab),-3);slat.rotation.z=innerSide*.18;}
   for(const zz of [z-.48,z+.48])facade(.14,.78,.024,grilleX+innerSide*.09,.76,zz,cream,-2);
   for(const yy of [.43,.89])facade(.16,.05,.09,grilleX+innerSide*.11,yy,z-.69,metal,-1);
   // Black/yellow protection at the corner beside the ramp.
   facade(.12,1.02,.11,innerX-innerSide*.03,.73,z+d/2+.04,metal,-3);
   for(let yy=.3;yy<1.18;yy+=.23)facade(.125,.095,.115,innerX-innerSide*.03,yy,z+d/2+.045,yellow,-2);
   const poster=facade(w*.66,.59,.024,x,.78,z+d/2+.021,material(innerSide===1?0xc8d5a8:0xe3e3cc),-5);
   for(let i=0;i<4;i++)facade(w*.45,.012,.012,x,.95-i*.10,z+d/2+.038,material(0x7c8573),-4);
   if(innerSide===1){const circle=new THREE.Mesh(new THREE.RingGeometry(.105,.15,24),material(0x9d4541));circle.position.set(x-w*.20,.83,z+d/2+.04);circle.renderOrder=-3;scene.add(circle);const slash=facade(.25,.032,.015,x-w*.20,.83,z+d/2+.049,red,-2);slash.rotation.z=-.75;}
   return poster;
  }
  exhaustHousing(-4.65,2.3,1);exhaustHousing(1.8,2,-1);
  // Photo details: entry control pedestals, parking counter, pipework and clearance bar.
  facade(.10,.44,.12,-3.8,1.48,-.55,metal,-3);facade(.27,.34,.2,-3.8,1.86,-.55,metal,-2);facade(.21,.095,.035,-3.8,2.00,-.438,red,-1);
  facade(.10,.6,.12,1.38,1.55,-.96,metal,-3);facade(.46,.63,.18,1.38,2.06,-.96,metal,-2);facade(.34,.27,.025,1.38,1.98,-.852,material(0x241f21),-1);
  const counterCanvas=document.createElement("canvas");counterCanvas.width=128;counterCanvas.height=192;const counterCtx=counterCanvas.getContext("2d")!;counterCtx.fillStyle="#241f21";counterCtx.fillRect(0,0,128,192);counterCtx.font="bold 160px monospace";counterCtx.fillStyle="#ee3d66";counterCtx.textAlign="center";counterCtx.fillText("2",64,152);const counterMap=new THREE.CanvasTexture(counterCanvas);counterMap.colorSpace=THREE.SRGBColorSpace;if(!svgMode){const plate=new THREE.Mesh(new THREE.PlaneGeometry(.3,.23),new THREE.MeshBasicMaterial({map:counterMap}));plate.position.set(1.38,1.98,-.835);scene.add(plate);}else counterMap.dispose();
  pipe([[-3.6,2.6,-1],[-3.6,3.45,-1],[.9,3.45,-1],[.9,2.65,-1]],0x888d79,.055);
  facade(4.37,.045,.045,-1.35,2.57,-.96,yellow,-10);
  // The 1.9 m marking is readable in the new photo, but is not used as a surveyed model dimension.
  if(!svgMode){const tc=document.createElement("canvas");tc.width=256;tc.height=256;const t=tc.getContext("2d")!;t.fillStyle="#f0eedd";t.fillRect(0,0,256,256);t.fillStyle="#9e4b4a";t.font='bold 56px Arial';t.textAlign="center";t.fillText("限高",128,102);t.fillText("1.9M",128,172);const tx=new THREE.CanvasTexture(tc);tx.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.CircleGeometry(.175,24),new THREE.MeshBasicMaterial({map:tx}));m.position.set(.25,3.12,-1.045);scene.add(m);}
  // Green boundary stripe, transverse pavers, two bollards and the curbside drain.
  facade(4.55,.016,.1,-1.35,.212,2.63,material(0x4f8d79),-34);
  for(const zz of [.6,1.9])facade(4.28,.013,.15,-1.35,.205,zz,paverBand,-37);
  for(const xx of [.82,1.18]){const bollard=facade(.075,.88,.075,xx,.65,2.76,yellow,-1);bollard.userData.occluderKind="車道設施";facade(.1,.08,.1,xx,.72,2.76,cream,0);}
  pipe([[.82,.98,2.76],[1,.85,2.76],[1.18,.98,2.76]],0x777961,.012);
  facade(1.2,.012,.38,1.15,.017,3.49,metal,-38);for(let xx=.6;xx<1.7;xx+=.10)facade(.025,.013,.36,xx,.025,3.49,stone,-37);
  // Right-hand campus gate and the lower building seen beyond the main facade.
  facade(4.8,1.9,.35,6.6,1.05,-1.6,brick,-24);facade(4.8,.1,.45,6.6,2.06,-1.6,stone,-23);
  for(let x=4.65;x<8.9;x+=.22)facade(.035,1,.035,x,2.46,-1.6,metal,-22);
  facade(5.1,4.1,3.1,7.1,2.3,-5.45,material(0xc7cbc2),-32);facade(5.3,.24,3.3,7.1,4.47,-5.45,material(0x899c80),-31);for(const x of [5.1,6.2,7.3,8.4])facade(.78,.62,.05,x,3.66,-3.88,glass,-26);
  // Airy, multi-trunk street tree, left of the ramp, as seen in the second photograph.
  function streetTree(x:number,z:number,scale=1,sparse=false){const g=new THREE.Group();g.userData.occluderKind="樹木";g.position.set(x,.43,z);g.scale.setScalar(scale);scene.add(g);facade(1.95,.28,1.4,x,.29,z,stone,-2);facade(1.73,.07,1.18,x,.47,z,material(0x625f4d),-1);
   pipe([[0,0,0],[-.04,1.3,.02],[-.26,2.65,.1],[-.65,3.6,.12]],0x7b7563,.065,g);pipe([[.14,0,.13],[.3,1.4,0],[.85,2.8,-.14],[1.25,3.8,-.17]],0x7b7563,.05,g);pipe([[0,.75,0],[-.7,2.15,.12],[-1.45,3.05,.25]],0x7b7563,.046,g);
   const clusters=[[-1.5,3.1,.15,.72],[-.8,3.7,.25,.82],[.12,4.1,.2,.75],[.9,3.8,-.18,.88],[1.57,3.3,-.18,.72],[-.25,3.35,-.6,.68],[.45,3.65,.7,.65]];
   clusters.forEach((p,i)=>{const m=ball(p[3]*(sparse?.45:1),p[0],p[1],p[2],i%2?green:material(0x7b984f),g);m.scale.set(1,.43,.82);if(svgMode)m.renderOrder=1;});if(svgMode)g.traverse(o=>o.renderOrder=1);return g;
  }
  const tree=streetTree(-5.2,2.05);const trees=[tree,streetTree(3.65,2.05,1.05,true),streetTree(-9.7,2.05,.9),streetTree(-15.35,2.05,.88)];
  scene.updateMatrixWorld(true);const occluders:THREE.Object3D[]=[];scene.traverse(o=>{if(o instanceof THREE.Mesh){const b=new THREE.Box3().setFromObject(o);if(b.min.y<2.8&&b.max.y>.6)occluders.push(o);}});
  // Existing fixed wiring is context only: availability must be measured on site.
  pipe([[4.9,.4,-1.2],[4.9,1.65,-1.2],[3.3,1.65,-1.2]],0x7d8988,.055);
  box(.32,.46,.13,4.9,.7,-1.1,metal);
  const screenCanvas=document.createElement("canvas");screenCanvas.width=1024;screenCanvas.height=256;const ctx=screenCanvas.getContext("2d")!;const texture=new THREE.CanvasTexture(screenCanvas);texture.colorSpace=THREE.SRGBColorSpace;
  const staticCanvas=document.createElement("canvas");staticCanvas.width=1024;staticCanvas.height=256;const sc=staticCanvas.getContext("2d")!;sc.fillStyle="#101e23";sc.fillRect(0,0,1024,256);sc.fillStyle="#b6eb88";sc.font='bold 120px "Noto Sans TC",Arial,sans-serif';sc.textAlign="center";sc.textBaseline="middle";sc.fillText("校內停車・外車勿停",512,137);const staticTexture=new THREE.CanvasTexture(staticCanvas);staticTexture.colorSpace=THREE.SRGBColorSpace;
  function makePanel(dynamic:boolean){const root=new THREE.Group();scene.add(root);const panel=new THREE.Group();root.add(panel);box(1.7,.5,.15,0,0,0,metal,panel);const face=box(1.58,.39,.012,0,0,.084,new THREE.MeshBasicMaterial({map:svgMode?null:dynamic?texture:staticTexture,color:svgMode?0x14352f:0xffffff}),panel);
   for(const x of [-.69,.69])for(const y of [-.19,.19])ball(.025,x,y,.09,material(0x98abae),panel);
   let text:SVGTextElement|undefined;let node:SVGObject|undefined;
   if(svgMode){const g=document.createElementNS("http://www.w3.org/2000/svg","g");text=document.createElementNS("http://www.w3.org/2000/svg","text");text.setAttribute("fill","#b6eb88");text.setAttribute("font-size",".15");text.setAttribute("font-weight","bold");text.setAttribute("text-anchor","middle");text.setAttribute("y",".05");text.textContent="校內停車・外車勿停";g.appendChild(text);node=new SVGObject(g);node.position.z=.1;panel.add(node);panel.traverse(o=>o.renderOrder=0);face.renderOrder=.1;node.renderOrder=.3;}
   return {root,panel,text,node,face};
  }
  const activePanel=makePanel(true);const signRoot=activePanel.root,sign=activePanel.panel,fallbackText=activePanel.text;
  const fixedPanels={left:makePanel(false),wall:makePanel(false),tree:makePanel(false)};
  const supportGroups={} as Record<SignLocation,THREE.Group>;const siteLabels={} as Record<SignLocation,THREE.Sprite>;
  for(const key of SIGN_KEYS){const site=SIGN_SITES[key],p=fixedPanels[key];p.root.position.set(site.position[0],site.position[1],site.position[2]);p.root.rotation.y=site.yaw;
   const g=new THREE.Group();scene.add(g);g.position.set(site.position[0],site.position[1],site.position[2]);g.rotation.y=site.yaw;supportGroups[key]=g;
   for(const side of [-1,1]){const h=key==="tree"?1.5:.43;box(.065,h,.065,side*.55,-h/2,0,metal,g);if(key==="tree")box(.26,.055,.25,side*.55,-1.47,0,metal,g);}
   const [x,y,z]=site.position;siteLabels[key]=label(site.short,x,y+.77,z,key==="wall"?"#245b7f":key==="tree"?"#92621e":"#286b5d");
   if(svgMode)g.traverse(o=>o.renderOrder=0);
  }
  const driverMarker=new THREE.Group();scene.add(driverMarker);box(.75,.28,1.45,0,.2,0,teal,driverMarker);const nose=new THREE.Mesh(new THREE.ConeGeometry(.3,.7,3),material(0xf2b356));nose.rotation.x=-Math.PI/2;nose.position.set(0,.25,-1);driverMarker.add(nose);
  const pathLine=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0x3277a0}));pathLine.position.y=.25;scene.add(pathLine);let pathApproach="";
  const eyeCamera=new THREE.PerspectiveCamera(50,1,.1,100);let lastReport=0;
  const ring=new THREE.Mesh(new THREE.RingGeometry(.8,1.12,48),new THREE.MeshBasicMaterial({color:0xf07554,transparent:true,opacity:.3,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.22;scene.add(ring);
  const rainCount=svgMode?65:450,rainArray=new Float32Array(rainCount*6);for(let i=0;i<rainCount;i++){const j=i*6;rainArray[j]=Math.random()*18-9;rainArray[j+1]=Math.random()*11;rainArray[j+2]=Math.random()*10-4;rainArray[j+3]=rainArray[j]-.04;rainArray[j+4]=rainArray[j+1]+.24;rainArray[j+5]=rainArray[j+2];}
  const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute("position",new THREE.BufferAttribute(rainArray,3));const rainMat=new THREE.LineBasicMaterial({color:0x6296b2,transparent:true,opacity:.45});const rainfall=new THREE.LineSegments(rainGeo,rainMat);scene.add(rainfall);
  const hazardGroup=new THREE.Group();scene.add(hazardGroup);let pathObj:THREE.Mesh|undefined;
  const connector=box(.3,.12,.17,-1,.3,1.45,material(0xdd704e));const puddle=new THREE.Mesh(new THREE.CircleGeometry(.65,40),new THREE.MeshBasicMaterial({color:0x63b4d1,transparent:true,opacity:.45,depthWrite:false}));puddle.rotation.x=-Math.PI/2;puddle.position.set(-1,.215,1.45);puddle.scale.set(1.6,.7,1);scene.add(puddle);
  const spark=new THREE.Group();scene.add(spark);for(let i=0;i<7;i++){const a=i*Math.PI*2/7;pipe([[0,0,0],[Math.cos(a)*.2,.15,Math.sin(a)*.2],[Math.cos(a)*.32,.3,Math.sin(a)*.32]],0xf3b250,.012,spark);}
  const glow=new THREE.Mesh(new THREE.ConeGeometry(2.2,7,32,1,true),new THREE.MeshBasicMaterial({color:0xffd581,transparent:true,opacity:.12,side:THREE.DoubleSide,depthWrite:false}));glow.rotation.x=-Math.PI/2;scene.add(glow);
  const person=new THREE.Group();scene.add(person);box(.34,.52,.23,0,1,0,teal,person);ball(.15,0,1.42,0,material(0xd4b495),person);const legA=box(.11,.58,.13,-.12,.49,0,metal,person),legB=box(.11,.58,.13,.12,.49,0,metal,person);box(.10,.47,.12,-.25,1,0,teal,person);box(.10,.47,.12,.25,1,0,teal,person);
  const car=new THREE.Group();scene.add(car);box(2.1,.48,.98,0,.5,0,material(0xc3ddd9,.4),car);box(1.04,.37,.86,-.05,.91,0,glass,car);for(const x of [-.67,.7])for(const z of [-.46,.46]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,.16,16),metal);w.rotation.x=Math.PI/2;w.position.set(x,.34,z);car.add(w);}car.position.set(1,.08,4.65);
  const trench=new THREE.Group();scene.add(trench);const cut=box(.6,.045,2.8,-.1,.22,1.35,material(0x645d51),trench);const tiles:THREE.Mesh[]=[];for(let i=0;i<5;i++)tiles.push(box(.56,.08,.51,-.1,.27,.25+i*.55,stone,trench));
  const coneMat=material(0xe8a152);const cones=new THREE.Group();scene.add(cones);for(const p of [[-.7,2.9],[.6,2.9],[-.7,-.05],[.6,-.05]]){const c=new THREE.Mesh(new THREE.ConeGeometry(.16,.45,10),coneMat);c.position.set(p[0],.42,p[1]);cones.add(c);}
  const smoke=new THREE.Group();scene.add(smoke);const smokeMats:THREE.MeshStandardMaterial[]=[];for(let i=0;i<8;i++){const m=new THREE.MeshStandardMaterial({color:0x667075,transparent:true,opacity:.28,depthWrite:false});smokeMats.push(m);ball(.09,0,0,0,m,smoke);}
  const sourceLabel=label("校內電源 · 待確認",4.65,2.55,-.6);const roadLabel=label("人行通道",3.8,.5,2.9,"#315b64","#e9f2f4");roadLabel.scale.set(1.7,.38,1);const faultLabel=label("",0,1,1);faultLabel.visible=false;
  if(svgMode){car.traverse(o=>o.renderOrder=3);person.traverse(o=>o.renderOrder=5);for(const l of [sourceLabel,roadLabel,...Object.values(siteLabels)])l.traverse(o=>o.renderOrder=20);}
  const resize=()=>{if(!el.clientWidth||!el.clientHeight)return;renderer.setSize(el.clientWidth,el.clientHeight);camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();};const ro=new ResizeObserver(resize);ro.observe(el);resize();
  let time=0,last=performance.now(),lastDraw=0,raf=0,lastKey="",lastReset=-1,lastView=-1,frame=0;
  function animate(now:number){raf=requestAnimationFrame(animate);if(svgMode&&now-lastDraw<65)return;lastDraw=now;const c=live.current;const dt=Math.min((now-last)/1000,.1);last=now;if(c.playing)time+=dt;
   if(c.reset!==lastReset){time=0;lastReset=c.reset;}
   if(!c.driver&&c.view!==lastView){lastView=c.view;const aspect=Math.max(.55,camera.aspect);if(c.view%4===0){camera.position.set(2.3,4.6,14);controls.target.set(-1.6,2.8,-1.5);}else if(c.view%4===1){const distance=Math.max(39,33/aspect);camera.position.set(5,12,distance);controls.target.set(-6.2,9,-1.5);}else if(c.view%4===2){camera.position.set(-1.1,19,7.5);controls.target.set(-1.1,.3,.8);}else{camera.position.set(-8,3.3,7.5);controls.target.set(-1.35,1.15,-.15);}controls.update();}
   const key=[c.scenario,c.safe,c.location].join();if(key!==lastKey){time=0;lastKey=key;if(pathObj){scene.remove(pathObj);pathObj.geometry.dispose();(pathObj.material as THREE.Material).dispose();}const dest=[...SIGN_POSITIONS[c.location]];let pts:number[][];
    if(c.safe&&c.location==="wall")pts=[[4.9,.7,-1.05],[4.7,.7,-1.05],[3.2,.7,-1.05],[3.2,1.5,-.12],dest];else if(c.safe)pts=[[4.9,.7,-1.05],[4.9,-.12,-1.05],[dest[0],-.12,-1.05],[dest[0],-.12,dest[2]],dest];else pts=[[4.9,.7,-1.05],[4.6,.26,-.3],[2.6,.26,.8],[-1,.28,1.45],[-2.5,.25,1.65],dest];pathObj=pipe(pts,c.safe?0x258c87:0xe76844,c.safe?.045:.038);if(svgMode)pathObj.renderOrder=6;
   }
   const t=time%10;const [sx,sy,sz]=SIGN_POSITIONS[c.location];
   const site=SIGN_SITES[c.location];signRoot.position.set(sx,sy,sz);signRoot.rotation.y=site.yaw;signRoot.visible=!c.driver;sign.scale.set(c.width/1.7,c.height/.5,1);sign.rotation.set(0,0,0);sign.position.set(0,0,0);
   for(const key of SIGN_KEYS){const p=fixedPanels[key];p.root.visible=key!==c.location;p.panel.scale.set(c.width/1.7,c.height/.5,1);siteLabels[key].visible=c.scenario!=="glare";supportGroups[key].visible=true;}
   sourceLabel.visible=c.view%4!==1;roadLabel.visible=c.view%4!==1;
   const night=c.scenario==="glare";scene.fog!.color.set(night?0x23394b:0xdce7eb);renderer.setClearColor(new THREE.Color(night?0x23394b:0xdce7eb),1);ambient.intensity=night?.55:2.5;sun.intensity=night?.35:3.8;
   rainfall.visible=c.rain>0;if(c.playing&&c.rain>0){for(let i=0;i<rainCount;i++){const j=i*6;rainArray[j+1]-=dt*(4+c.rain*.09);rainArray[j]-=dt*c.wind*.025;if(rainArray[j+1]<.2){rainArray[j+1]=10;rainArray[j]=Math.random()*18-9;}rainArray[j+3]=rainArray[j]-.02-c.wind*.003;rainArray[j+4]=rainArray[j+1]+.25;}rainGeo.attributes.position.needsUpdate=true;rainGeo.setDrawRange(0,Math.floor(rainCount*c.rain/100)*2);}
   tree.rotation.z=Math.sin(time*2)*c.wind*.0008;
   const elect=c.scenario==="rain"&&c.rain>0&&t>3,trip=c.scenario==="trip",wind=c.scenario==="wind",settle=c.scenario==="settle",heat=c.scenario==="heat";
   connector.visible=!c.safe;puddle.visible=c.rain>0;ring.visible=!c.safe&&((elect)||(wind&&c.wind>5&&t>3)||(trip&&t>3)||(settle&&t>3));ring.position.set(trip||elect?-1:sx,.225,trip||elect?1.45:sz+.4);ring.scale.setScalar(1+.06*Math.sin(time*3));spark.visible=elect&&!c.safe;spark.position.set(-1,.35,1.45);spark.rotation.y=time*.3;
   if(wind){const amp=c.wind/60;if(!c.safe){sign.rotation.z=Math.sin(time*9)*amp*.11;if(t>4&&c.wind>5){sign.position.y=-Math.min((t-4)*(t-4)*.35,sy-.48);sign.rotation.x=Math.min((t-4)*.8,1.45)*amp;}}else sign.rotation.z=Math.sin(time*4)*amp*.008;}
   glow.visible=night;const normal=new THREE.Vector3(Math.sin(site.yaw),0,Math.cos(site.yaw));glow.position.set(sx+normal.x*3.5,sy,sz+normal.z*3.5);glow.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),normal.clone().negate());(glow.material as THREE.MeshBasicMaterial).opacity=(c.safe?.025:.17)*(c.brightness/100);glow.scale.setScalar(c.safe?.75:1);
   const walking=trip||settle;person.visible=walking||elect;person.position.set(walking?3.8-t*.83:-.75,.2,1.5);person.rotation.z=0;person.rotation.x=0;legA.rotation.x=Math.sin(time*6)*.35;legB.rotation.x=-Math.sin(time*6)*.35;
   if(walking&&!c.safe){const fallStart=trip?5.4:4.5;if(t>fallStart){person.position.x=trip?-.7:-.1;person.rotation.z=Math.min((t-fallStart)*1.3,1.12);person.position.y=.2;}}
   car.position.x=4.5-(time*.65)%13;
   trench.visible=settle;cones.visible=settle&&c.safe;for(let i=0;i<tiles.length;i++){tiles[i].position.y=.27-(settle&&!c.safe?Math.max(0,Math.min((t-2)*.025,.16))*(i%2?.6:1):0);tiles[i].rotation.x=settle&&!c.safe?Math.sin(i)*Math.max(0,Math.min((t-2)*.07,.23)):0;}
   smoke.visible=heat&&!c.safe&&t>3;smoke.position.set(sx,sy,sz);smoke.children.forEach((m,i)=>{const v=(time*.5+i*.19)%1.5;m.position.set(Math.sin(i+time)*.09,v,0);m.scale.setScalar(.5+v*2);smokeMats[i].opacity=.25*(1-v/1.5);});
   if(frame++%5===0){ctx.fillStyle="#101e23";ctx.fillRect(0,0,1024,256);ctx.fillStyle="#1a2b30";for(let x=4;x<1024;x+=12)for(let y=4;y<256;y+=12)ctx.fillRect(x,y,2,2);
    const powerOff=c.safe&&((elect&&t>3.5)||(heat&&t>4));if(fallbackText)fallbackText.textContent=powerOff?"保護斷電":"校內停車・外車勿停";ctx.fillStyle=powerOff?"#66807c":night&&!c.safe?"#ffe6ad":"#b6eb88";ctx.globalAlpha=c.safe&&night?.65:Math.max(.3,c.brightness/100);ctx.font='bold 120px "Noto Sans TC","PingFang TC",Arial,sans-serif';ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(powerOff?"保護斷電":"校內停車・外車勿停",512,137);ctx.globalAlpha=1;texture.needsUpdate=true;
   }
   const d=c.driver;controls.enabled=!d;driverMarker.visible=!!d&&d.camera==="plan";pathLine.visible=!!d&&d.camera==="plan";
   for(const t of trees)t.visible=!d||d.trees;
   if(d){const pose=driverPose(d);eyeCamera.position.copy(pose.eye);eyeCamera.aspect=camera.aspect;eyeCamera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(Math.PI/4)/camera.aspect));eyeCamera.lookAt(pose.eye.clone().add(pose.forward));eyeCamera.updateProjectionMatrix();eyeCamera.updateMatrixWorld(true);
    if(d.camera==="driver"){camera.copy(eyeCamera);}else{camera.fov=47;camera.position.set(-2,22,7);camera.lookAt(-2,0,1);camera.updateProjectionMatrix();}
    driverMarker.position.set(pose.eye.x,.25,pose.eye.z);driverMarker.rotation.y=Math.atan2(-pose.travel.x,-pose.travel.z);
    if(pathApproach!==d.approach){pathApproach=d.approach;pathLine.geometry.dispose();pathLine.geometry=new THREE.BufferGeometry().setFromPoints(Array.from({length:101},(_,progress)=>{const v=driverPose({...d,progress}).eye;return new THREE.Vector3(v.x,0,v.z);}));}
    sourceLabel.visible=false;roadLabel.visible=false;for(const key of SIGN_KEYS){const show=d.camera==="plan"||d.site===key;fixedPanels[key].root.visible=show;supportGroups[key].visible=show;siteLabels[key].visible=d.camera==="plan";}
    car.visible=false;person.visible=false;connector.visible=false;ring.visible=false;spark.visible=false;puddle.visible=false;rainfall.visible=false;trench.visible=false;cones.visible=false;smoke.visible=false;glow.visible=false;if(pathObj)pathObj.visible=false;
    scene.updateMatrixWorld(true);if(now-lastReport>160){lastReport=now;report.current?.(SIGN_KEYS.map(key=>measurePanel(key,eyeCamera,c.width,c.height,occluders)));}
   }else{camera.fov=39;camera.updateProjectionMatrix();controls.update();}
   // Size and foreshorten SVG text from the actual panel plane; no fixed-size label boosts legibility.
   if(svgMode){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);for(const p of [activePanel,...Object.values(fixedPanels)]){if(!p.text||!p.node)continue;const normal=new THREE.Vector3(0,0,1).applyQuaternion(p.panel.getWorldQuaternion(new THREE.Quaternion()));const front=normal.dot(camera.position.clone().sub(p.panel.getWorldPosition(new THREE.Vector3())))>0;p.face.visible=front;p.node.visible=front;if(!front)continue;const o=p.node.getWorldPosition(new THREE.Vector3()).project(camera);const px=p.panel.localToWorld(new THREE.Vector3(1,0,.1)).project(camera);const py=p.panel.localToWorld(new THREE.Vector3(0,-1,.1)).project(camera);const w=el!.clientWidth/2,h=el!.clientHeight/2;p.text.setAttribute("transform",`matrix(${(px.x-o.x)*w},${-(px.y-o.y)*h},${(py.x-o.x)*w},${-(py.y-o.y)*h},0,0)`);}}
   renderer.render(scene,camera);
  }
  raf=requestAnimationFrame(animate);
  const lost=(e:Event)=>{e.preventDefault();setError(true)};renderer.domElement.addEventListener("webglcontextlost",lost);
  return()=>{cancelAnimationFrame(raf);ro.disconnect();controls.dispose();renderer.domElement.removeEventListener("webglcontextlost",lost);scene.traverse(o=>{const m=o as THREE.Mesh;if(m.geometry)m.geometry.dispose();const mats=Array.isArray(m.material)?m.material:[m.material];for(const mat of mats)if(mat){const tex=(mat as THREE.MeshBasicMaterial).map;if(tex)tex.dispose();mat.dispose();}});if(renderer instanceof THREE.WebGLRenderer)renderer.dispose();renderer.domElement.remove();};
 },[]);
 return <div className="three-host" ref={host}>{fallback&&<span className="fallback-note">簡化 3D 模式 · Three.js SVG</span>}{error&&<div className="webgl-error"><strong>無法啟動 3D 畫面</strong><p>請以支援 WebGL 的瀏覽器重新開啟。下方危害說明、法規與費用仍可閱讀。</p></div>}</div>;
}
