"use client";
import { useEffect, useState } from "react";
import { CarFront, Eye, Play, Pause, RotateCcw, Map, Trees } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Scene, { type SceneConfig } from "./scene";
import { SIGN_SITES, SIGN_KEYS, type SignLocation, type DriverConfig, type VisibilityResult } from "./visibility";
import { EntrancePhotos } from "./entrance-photos";

function status(r:VisibilityResult){
 if(r.faceAngle>=90)return "看向看板背面";
 if(r.inFramePercent===0)return "不在目前視野";
 if(r.visiblePercent===0)return "被模型物件遮住";
 if(r.clearPercent<100)return "部分面板被遮擋";
 if(r.inFramePercent<100)return "面板位於視野邊緣";
 return "面板在目前視野內";
}
function comparison(results:VisibilityResult[]){
 if(results.length!==3)return "正在計算目前視角…";
 const ranked=[...results].sort((a,b)=>b.visiblePercent-a.visiblePercent);
 if(!ranked[0].visiblePercent)return "三處此時都沒有正面內容落在視野內且未被遮住。請查看各卡片的背面、遮擋或視野狀態，也可切換「轉頭看入口」。";
 if(ranked[0].visiblePercent-ranked[1].visiblePercent>5)return `此時 ${SIGN_SITES[ranked[0].site].short} 的可見比例最高。請同時比較斜視角與角寬；這只是目前模型視角，並不表示沿途都容易閱讀。`;
 return "目前較佳方案的可見比例接近。請沿路播放並比較斜視角、角寬及遮擋；角寬越大，面板在視野中占的範圍越大。";
}
export default function DriverComparison({base}:{base:SceneConfig}){
 const [driver,setDriver]=useState<DriverConfig>({progress:80,approach:"right",eyeHeight:1.2,gaze:"forward",trees:true,camera:"driver",site:"left"});
 const [playing,setPlaying]=useState(false),[results,setResults]=useState<VisibilityResult[]>([]);
 const update=(p:Partial<DriverConfig>)=>setDriver(d=>({...d,...p}));
 useEffect(()=>{if(!playing)return;let previous=performance.now();const interval=setInterval(()=>{const now=performance.now(),delta=Math.min(now-previous,120);previous=now;setDriver(d=>({...d,progress:Math.min(100,d.progress+delta/200)}));},50);return()=>clearInterval(interval);},[playing]);
 useEffect(()=>{if(driver.progress>=100)setPlaying(false);},[driver.progress]);
 const go=(progress:number)=>{setPlaying(false);update({progress});};
 const stage=driver.progress<55?"沿街接近":driver.progress<90?"轉入車道":"入口前方";
 const config:SceneConfig={...base,location:driver.site,scenario:"rain",safe:true,rain:0,wind:0,brightness:75,playing:false,driver};
 return <section className="driver-comparison">
  <div className="driver-intro"><div><h2>同一位駕駛，三個看板位置。</h2><p>① 左排風口側向 · ② 右排風口上方 · ③ 左側第一行道樹旁</p><p className="driver-small">依最新五張入口照片更新。每次顯示一個方案，保持相同車位、視線與面板尺寸。</p></div><span className="tag">同尺寸 {base.width.toFixed(1)} × {base.height.toFixed(1)} m</span></div>
  <div className="driver-layout"><div className="driver-main"><section className="viewport-panel">
   <div className="viewport-toolbar"><span className="view-title"><CarFront size={17}/>{driver.camera==="driver"?"駕駛眼睛位置":"俯視查看路徑"}</span><span className="schematic">{driver.eyeHeight.toFixed(1)} m 眼高 · 水平視野 90°</span></div>
   <div className="viewport driver-viewport"><Scene config={config} onVisibilityChange={setResults}/><div className="driver-view-label">{driver.approach==="left"?"由畫面左側接近":"由畫面右側接近"}・{stage}</div><div className="driver-gaze-label">{driver.gaze==="forward"?"視線沿行進方向":"轉頭朝向入口"}{!driver.trees&&" · 暫隱樹木"}</div>{driver.camera==="driver"&&<div className="driver-dashboard"><span>{SIGN_SITES[driver.site].short} · 固定焦距，不自動放大看板</span></div>}</div>
   <div className="drive-timeline"><div className="drive-play"><Button variant="outline" size="icon" aria-label={playing?"暫停駕駛模擬":"播放駕駛模擬"} onClick={()=>{if(driver.progress>=100)update({progress:0});setPlaying(!playing);}}>{playing?<Pause/>:<Play/>}</Button><Button variant="outline" size="icon" aria-label="從起點重播" onClick={()=>{update({progress:0});setPlaying(true);}}><RotateCcw/></Button><span id="drive-progress">行車進度</span><output>{Math.round(driver.progress)}%</output></div><Slider aria-labelledby="drive-progress" value={[driver.progress]} min={0} max={100} step={1} onValueChange={v=>go(v[0])}/><div className="drive-stages">{[[0,"遠處接近"],[55,"轉彎前"],[80,"轉入中"],[95,"入口前"]].map(([p,label])=><Button key={p} variant="ghost" size="sm" onClick={()=>go(p as number)}>{label}</Button>)}</div></div>
  </section><div className="driver-conclusion"><Eye size={19}/><p>{comparison(results)}</p></div></div>
  <aside className="driver-settings"><h3>相同條件，直接比較</h3><fieldset className="site-selector"><legend>查看看板方案</legend><RadioGroup value={driver.site} onValueChange={v=>update({site:v as SignLocation,camera:"driver"})} aria-label="查看看板方案">{SIGN_KEYS.map(key=><label key={key}><RadioGroupItem value={key}/><span>{SIGN_SITES[key].short}<small>{SIGN_SITES[key].orientation}</small></span></label>)}</RadioGroup></fieldset><fieldset><legend>來車方向（畫面左右）</legend><RadioGroup value={driver.approach} onValueChange={v=>update({approach:v as DriverConfig["approach"]})} aria-label="來車方向"><label><RadioGroupItem value="left"/>從左側接近</label><label><RadioGroupItem value="right"/>從右側接近</label></RadioGroup></fieldset>
   <fieldset><legend>駕駛看向哪裡</legend><RadioGroup value={driver.gaze} onValueChange={v=>update({gaze:v as DriverConfig["gaze"]})} aria-label="駕駛視線"><label><RadioGroupItem value="forward"/>看行進方向</label><label><RadioGroupItem value="entrance"/>轉頭看入口</label></RadioGroup></fieldset>
   <label className="eye-height">駕駛眼高（m）<input aria-label="駕駛眼高" type="number" min="1" max="1.8" step=".1" value={driver.eyeHeight} onChange={e=>{if(e.target.value)update({eyeHeight:Math.max(1,Math.min(1.8,+e.target.value))});}}/></label>
   <label className="tree-toggle"><span><Trees size={17}/>顯示既有樹木</span><Switch aria-label="顯示既有樹木" checked={driver.trees} onCheckedChange={v=>update({trees:v})}/></label><p className="driver-small">暫隱樹木只用來比較遮擋影響，不代表移樹或修剪方案。</p>
   <div className="driver-camera-buttons"><Button variant="outline" aria-pressed={driver.camera==="driver"} onClick={()=>update({camera:"driver"})}><CarFront/>駕駛視角</Button><Button variant="outline" aria-pressed={driver.camera==="plan"} onClick={()=>update({camera:"plan"})}><Map/>俯視路徑</Button></div>
   <p className="driver-small">俯視顯示三處位置；數據仍各自按駕駛眼睛的位置計算。來車方向及轉彎路徑是比較假設，未核對實際交通管制。</p>
  </aside></div>
  <div className="visibility-results" aria-label="三處看板可見性比較">{SIGN_KEYS.map(key=>{const site=SIGN_SITES[key],r=results.find(x=>x.site===key);return <article key={key} className={`visibility-card location-${site.id}${driver.site===key?" selected":""}`}><header><div><span className="location-badge">{site.id}</span><h3>{site.label}</h3></div><span>{r?status(r):"計算中…"}</span></header><p className="site-orientation">{site.orientation}</p><div className="visibility-bar"><i style={{width:`${r?.visiblePercent??0}%`}}/></div><dl><div><dt>視野內且未遮擋</dt><dd>{r?.visiblePercent??"—"}<small>%</small></dd></div><div><dt>眼睛至面板中心</dt><dd>{r?.distance.toFixed(1)??"—"}<small>m</small></dd></div><div><dt>面板斜視角</dt><dd>{r?.faceAngle.toFixed(0)??"—"}<small>°</small></dd></div><div><dt>面板水平角寬</dt><dd>{r?.angularWidth.toFixed(1)??"—"}<small>°</small></dd></div></dl><p>{r?(r.faceAngle>=90?"目前朝向背面，單面看板沒有顯示內容。":<>模型遮擋：{r.blockers.length?r.blockers.join("、"):"未偵測到"}。{r.inFramePercent<100?`另有 ${100-r.inFramePercent}% 面板採樣點落在目前視野外。`:"面板全幅位於目前視野範圍。"}</>):"等待目前視角的採樣結果。"}</p><Button variant="outline" aria-pressed={driver.site===key&&driver.camera==="driver"} onClick={()=>update({site:key,camera:"driver"})}>查看{site.short}</Button></article>;})}</div>
  <details className="model-details driver-method"><summary>位置、朝向與比較方法</summary><p>左右以站在街道面向入口為準。① 位於左排風箱內側上方，面板沿車道方向、正面朝車道內側；② 放在右排風箱頂部，面板與入口立面平行、朝街道；③ 位於左側第一棵行道樹的樹穴街側，以獨立支架示意、預設朝街道。③ 的朝向是比較假設，未將看板固定在樹幹上。</p><p>三面中心模型高度約 1.72 m，非現場測量；採相同尺寸、文字與亮度。每個方案獨立計算，其他候選看板及支架不算遮擋物；俯視時同時呈現三處僅為配置比較。排風箱尺寸、頂蓋承載、支架基礎與通行淨寬皆待現勘，模型不表示可以直接在頂蓋鑽孔固定。</p><p>每面螢幕使用 9 × 5 個採樣點，檢查正面朝向、90° 水平視野及樹木、排風箱、建物設施的視線遮擋。結果是模型幾何比例，不是實測辨識率。斜視角 0° 為正視、90° 為側視，大於 90° 為背面；角寬為面板左右邊緣的夾角。</p><p>駕駛視角不自動瞄準看板；「轉頭看入口」會改變視線。播放按路徑進度前進，並非等速行車。模型未含擋風玻璃、A 柱、其他車輛、動態行人或 LED 實際視角，仍須現場試看字高、停留時間及日夜亮度。</p></details>
  <details className="driver-reference"><summary>對照最新五張出入口照片</summary><EntrancePhotos/></details>
 </section>;
}
