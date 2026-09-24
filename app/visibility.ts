import * as THREE from "three";

export const SIGN_SITES = {
 left:{id:"1",label:"左排風口側向",short:"① 左排風口",orientation:"沿車道方向，面向車道內側",position:[-3.66,1.72,-.12] as const,yaw:Math.PI/2},
 wall:{id:"2",label:"右排風口上方",short:"② 右排風口",orientation:"與入口立面平行，面向街道",position:[1.8,1.72,.45] as const,yaw:0},
 tree:{id:"3",label:"左側第一行道樹",short:"③ 第一行道樹",orientation:"樹穴旁獨立支架，面向街道",position:[-5.2,1.72,2.9] as const,yaw:0},
} as const;
export const SIGN_KEYS=["left","wall","tree"] as const;
export type SignLocation=typeof SIGN_KEYS[number];
export const SIGN_POSITIONS={left:SIGN_SITES.left.position,wall:SIGN_SITES.wall.position,tree:SIGN_SITES.tree.position};
export type DriverConfig = { progress:number; approach:"left"|"right"; eyeHeight:number; gaze:"forward"|"entrance"; trees:boolean; camera:"driver"|"plan"; site:SignLocation };
export type VisibilityResult = { id:"1"|"2"|"3"; site:SignLocation; distance:number; faceAngle:number; angularWidth:number; inFramePercent:number; clearPercent:number; visiblePercent:number; blockers:string[] };
export function signBasis(site:SignLocation){const s=SIGN_SITES[site];const normal=new THREE.Vector3(Math.sin(s.yaw),0,Math.cos(s.yaw));const tangent=new THREE.Vector3(Math.cos(s.yaw),0,-Math.sin(s.yaw));const center=new THREE.Vector3(...s.position).addScaledVector(normal,.1);return {center,normal,tangent};}

// Two hypothetical approaches on the same street-side path; not a surveyed traffic plan.
export function driverPose(d:DriverConfig){
 const p=Math.max(0,Math.min(100,d.progress));const fromLeft=d.approach==="left";
 const start=fromLeft?-14:9,bend=fromLeft?-5.5:2.5;
 let x:number,z:number,dx:number,dz:number;
 if(p<55){const t=p/55;x=start+(bend-start)*t;z=4.8;dx=fromLeft?1:-1;dz=0;}
 else if(p<90){const t=(p-55)/35,u=1-t;const x0=bend,x1=fromLeft?-3.7:.7,x2=-1.35,x3=-1.35;
  x=u*u*u*x0+3*u*u*t*x1+3*u*t*t*x2+t*t*t*x3;z=u*u*u*4.8+3*u*u*t*4.8+3*u*t*t*4.2+t*t*t*1.8;
  dx=3*u*u*(x1-x0)+6*u*t*(x2-x1)+3*t*t*(x3-x2);dz=6*u*t*(4.2-4.8)+3*t*t*(1.8-4.2);
 }else{x=-1.35;z=1.8-(p-90)/10*1.4;dx=0;dz=-1;}
 const grade=.19*Math.max(0,Math.min(1,(3.1-z)/.5));
 const eye=new THREE.Vector3(x,d.eyeHeight+grade,z);
 const travel=new THREE.Vector3(dx,0,dz).normalize();
 const forward=d.gaze==="entrance"?new THREE.Vector3(-1.35,eye.y,-1.3).sub(eye).normalize():travel.clone();
 return {eye,forward,travel};
}

// Uniform screen samples: rays go from the driver's eye to the panel face.
// This estimates geometric visibility only, not letter recognition or product viewing-angle performance.
export function measurePanel(site:SignLocation,camera:THREE.PerspectiveCamera,width:number,height:number,obstacles:THREE.Object3D[]):VisibilityResult{
 const {center,normal,tangent}=signBasis(site);const id=SIGN_SITES[site].id;
 const towardEye=camera.position.clone().sub(center),distance=towardEye.length();
 const faceAngle=THREE.MathUtils.radToDeg(normal.angleTo(towardEye));
 const sw=width*1.58/1.7,sh=height*.39/.5;
 const left=center.clone().addScaledVector(tangent,-sw/2).sub(camera.position),right=center.clone().addScaledVector(tangent,sw/2).sub(camera.position);
 const angularWidth=THREE.MathUtils.radToDeg(left.angleTo(right));
 const ray=new THREE.Raycaster();const blockers=new Set<string>();let clear=0,inFrame=0,visible=0;
 const eligible=obstacles.filter(o=>{for(let a:THREE.Object3D|null=o;a;a=a.parent)if(!a.visible)return false;return true;});
 for(let row=0;row<5;row++)for(let col=0;col<9;col++){
  const target=center.clone().addScaledVector(tangent,((col+.5)/9-.5)*sw).add(new THREE.Vector3(0,((row+.5)/5-.5)*sh,0));
  const projected=target.clone().project(camera);
  const framed=faceAngle<90&&Math.abs(projected.x)<=1&&Math.abs(projected.y)<=1&&projected.z>=-1&&projected.z<=1;
  if(framed)inFrame++;
  const direction=target.clone().sub(camera.position);ray.set(camera.position,direction.clone().normalize());ray.near=.01;ray.far=direction.length()-.025;
  const hit=ray.intersectObjects(eligible,false)[0];
  if(!hit&&faceAngle<90){clear++;if(framed)visible++;}else if(hit){let kind="牆體／設施";for(let o:THREE.Object3D|null=hit.object;o;o=o.parent){if(o.userData.occluderKind){kind=o.userData.occluderKind;break;}}blockers.add(kind);}
 }
 const percent=(n:number)=>Math.round(n/45*100);
 return {id,site,distance,faceAngle,angularWidth,inFramePercent:percent(inFrame),clearPercent:percent(clear),visiblePercent:percent(visible),blockers:[...blockers]};
}
