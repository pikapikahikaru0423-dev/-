import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar, toolBtnStyle, HandleLayer } from './UIComponents';
import { styles } from './constants';

export default function App() {
 const [elements, setElements] = useState([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [tool, setTool] = useState('select');
  const [activeTab, setActiveTab] = useState('main');
  const [currentInst, setCurrentInst] = useState({ l: "Pic", c: "#e35" });
  const [zoomLevel, setZoomLevel] = useState(0.9);
  const [chairSize, setChairSize] = useState(26);
  const [bgOpacity, setBgOpacity] = useState(0.5);
  const [pts, setPts] = useState<any[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isShift, setIsShift] = useState(false);
  const [dragState, setDragState] = useState<any>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [hIdx, setHIdx] = useState(-1);

  const stageRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
    s.onload = () => { (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js'; };
    document.head.appendChild(s);
    const dk = (e: KeyboardEvent) => { if (e.key === 'Shift') setIsShift(true); };
    const uk = (e: KeyboardEvent) => { if (e.key === 'Shift') setIsShift(false); };
    window.addEventListener('keydown', dk); window.addEventListener('keyup', uk);
    return () => { window.removeEventListener('keydown', dk); window.removeEventListener('keyup', uk); };
  }, []);

  const saveH = (next: any[]) => {
    const s = JSON.stringify(next);
    const newH = [...history.slice(0, hIdx + 1), s].slice(-30);
    setHistory(newH); setHIdx(newH.length - 1);
  };
  const undo = () => { if (hIdx > 0) { setElements(JSON.parse(history[hIdx - 1])); setHIdx(hIdx - 1); } };
  const redo = () => { if (hIdx < history.length - 1) { setElements(JSON.parse(history[hIdx + 1])); setHIdx(hIdx + 1); } };

  const getXY = useCallback((e: any) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (e.clientX - rect.left) / zoomLevel, y: (e.clientY - rect.top) / zoomLevel };
  }, [zoomLevel]);

  const snap = (p1: any, p2: any) => {
    if (!isShift) return p2;
    return Math.abs(p2.x - p1.x) > Math.abs(p2.y - p1.y) ? { x: p2.x, y: p1.y } : { x: p1.x, y: p2.y };
  };

  const getPosOnPath = (type: string, pathPts: any[], t: number) => {
    if (type === 'arc' && pathPts.length === 3) {
      const [p1, p2, p3] = pathPts;
      const x = Math.pow(1-t, 2)*p1.x + 2*(1-t)*t*p3.x + Math.pow(t, 2)*p2.x;
      const y = Math.pow(1-t, 2)*p1.y + 2*(1-t)*t*p3.y + Math.pow(t, 2)*p2.y;
      return { x, y };
    }
    const [p1, p2] = pathPts;
    return { x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const pt = getXY(e);
    const target = e.target as HTMLElement;
    const elemDiv = target.closest('.elem') as HTMLElement;

    if (elemDiv && tool === 'select') {
      const id = elemDiv.dataset.id!;
      const el = elements.find(x => x.id === id);
      let tIds = el?.gid ? elements.filter(x => x.gid === el.gid).map(x => x.id) : [id];
      let nextSel;
      if (isShift) {
        const already = tIds.every(tid => selectedIds.includes(tid));
        nextSel = already ? selectedIds.filter(sid => !tIds.includes(sid)) : [...new Set([...selectedIds, ...tIds])];
      } else { nextSel = tIds; }
      setSelectedIds(nextSel);
      setDragState({ mode: 'move', objs: nextSel.map(sid => {
        const obj = elements.find(x => x.id === sid)!;
        return { id: sid, ox: pt.x - obj.x, oy: pt.y - obj.y };
      })});
      return;
    }

    if (tool === 'select') { setSelectedIds([]); }
    else if (['chair', 'label', 'rect'].includes(tool)) {
      const isR = tool==='rect', isL = tool==='label';
      const next = [...elements, { id: crypto.randomUUID(), type: tool, x: pt.x-(isR?50:isL?40:chairSize/2), y: pt.y-(isR?30:isL?12:chairSize/2), w: isR?100:isL?80:chairSize, h: isR?60:isL?24:chairSize, angle:0, label: isR?'':currentInst.l, color: currentInst.c }];
      setElements(next); saveH(next);
    } else if (['arc', 'line', 'dim'].includes(tool)) {
      const last = pts[pts.length-1];
      const newPts = [...pts, last ? snap(last, pt) : pt];
      if ((tool==='arc' && newPts.length===3) || (tool!=='arc' && newPts.length===2)) {
        if (tool === 'dim') {
          const val = prompt("寸法値", "1.0m");
          if (val) { const n=[...elements, {id:crypto.randomUUID(), type:'dim', p1:newPts[0], p2:newPts[1], label:val, color:'#1d9e75'}]; setElements(n); saveH(n); }
        } else {
          const n = parseInt(prompt("個数", "4") || "0");
          if (n > 0) {
            const gid = crypto.randomUUID();
            const chairs = Array.from({length:n}).map((_, i) => {
              const pos = getPosOnPath(tool, newPts, i/(n-1||1));
              return { id: crypto.randomUUID(), type: 'chair', x: pos.x-chairSize/2, y: pos.y-chairSize/2, w: chairSize, h: chairSize, label: currentInst.l, color: currentInst.c, gid };
            });
            const next=[...elements, ...chairs]; setElements(next); saveH(next);
          }
        }
        setPts([]);
      } else { setPts(newPts); }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const pt = getXY(e); setMousePos(pt);
    if (!dragState) return;
    setElements(elements.map(el => {
      const d = dragState.objs?.find((o:any)=>o.id===el.id) || (dragState.id===el.id?dragState:null);
      if(!d) return el;
      if(dragState.mode==='move') return {...el, x: pt.x-d.ox, y: pt.y-d.oy};
      if(dragState.mode==='resize') return {...el, w: Math.max(10, pt.x-el.x), h: Math.max(10, pt.y-el.y)};
      if(dragState.mode==='rotate') { const cx=el.x+el.w/2, cy=el.y+el.h/2; return {...el, angle: Math.atan2(pt.y-cy, pt.x-cx)*180/Math.PI+90}; }
      return el;
    }));
  };

  const handleLoadPDF = async (e: any) => {
    const file = e.target.files?.[0]; const pdfjs = (window as any).pdfjsLib;
    if (!file || !pdfjs) return;
    const r = new FileReader();
    r.onload = async () => {
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(r.result as ArrayBuffer) }).promise;
      const page = await pdf.getPage(1); const vp = page.getViewport({ scale: 2.0 });
      const cv = bgCanvasRef.current!; cv.width = vp.width; cv.height = vp.height;
      await page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
    };
    r.readAsArrayBuffer(file);
  };

  return (
    <div style={styles.body} onPointerMove={handlePointerMove} onPointerUp={()=>{if(dragState)saveH(elements); setDragState(null);}}>
      {/* ツールバー 2段構成 */}
      <div style={{...styles.toolbar, flexDirection: 'column', alignItems: 'flex-start', gap: '8px'}}>
        <div style={{display: 'flex', width: '100%', alignItems: 'center'}}>
          <div style={styles.tbGroup}>
            <button style={{...toolBtnStyle(tool==='select'), fontSize: '14px'}} onClick={()=>setTool('select')}>▷ 選択</button>
            <button style={{...toolBtnStyle(tool==='chair'), fontSize: '14px'}} onClick={()=>setTool('chair')}>○ 椅子</button>
            <button style={{...toolBtnStyle(tool==='arc'), fontSize: '14px'}} onClick={()=>setTool('arc')}>⌒ 弧配置</button>
            <button style={{...toolBtnStyle(tool==='line'), fontSize: '14px'}} onClick={()=>setTool('line')}>─ 線配置</button>
            <button style={{...toolBtnStyle(tool==='label'), fontSize: '14px'}} onClick={()=>setTool('label')}>Ａ ラベル</button>
            <button style={{...toolBtnStyle(tool==='rect'), fontSize: '14px'}} onClick={()=>setTool('rect')}>□ 四角</button>
            <button style={{...toolBtnStyle(tool==='dim'), fontSize: '14px'}} onClick={()=>setTool('dim')}>↔ 寸法</button>
          </div>
          <div style={styles.sep} />
          <div style={{...styles.tbGroup, fontSize: '14px'}}>
            ズーム <input type="range" min="0.3" max="2" step="0.05" value={zoomLevel} onChange={e=>setZoomLevel(parseFloat(e.target.value))} />
            <input type="number" style={{...styles.valInput, fontSize: '14px', width: '55px'}} value={Math.round(zoomLevel*100)} onChange={e=>setZoomLevel(Number(e.target.value)/100)} />%
            サイズ <input type="range" min="15" max="50" value={chairSize} onChange={e=>setChairSize(Number(e.target.value))} />
            <input type="number" style={{...styles.valInput, fontSize: '14px', width: '55px'}} value={chairSize} onChange={e=>setChairSize(Number(e.target.value))} />px
          </div>
        </div>

        <div style={{display: 'flex', width: '100%', alignItems: 'center'}}>
          <div style={styles.tbGroup}>
            <button style={{...toolBtnStyle(false), fontSize: '14px'}} onClick={undo}>↩ 戻す</button>
            <button style={{...toolBtnStyle(false), fontSize: '14px'}} onClick={redo}>↪ 進む</button>
            <button style={{...toolBtnStyle(false), fontSize: '14px'}} onClick={()=>{ if(selectedIds.length<2)return; const gid=crypto.randomUUID(); const n=elements.map(el=>selectedIds.includes(el.id)?{...el,gid}:el); setElements(n); saveH(n); }}>グループ化</button>
            <button style={{...toolBtnStyle(false), fontSize: '14px'}} onClick={()=>{ const n=elements.map(el=>selectedIds.includes(el.id)?{...el,gid:undefined}:el); setElements(n); saveH(n); }}>解除</button>
          </div>
          <div style={styles.sep} />
          <div style={styles.tbGroup}>
            <button style={{...toolBtnStyle(false), fontSize: '14px'}} onClick={()=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify({elements})])); a.download='stage.json'; a.click(); }}>💾 テンプレ保存</button>
            <button style={{...toolBtnStyle(false), fontSize: '14px'}} onClick={()=>templateInputRef.current?.click()}>📂 テンプレ読込</button>
            <input type="file" ref={templateInputRef} style={{display:'none'}} onChange={e=>{
              const r=new FileReader(); r.onload=ev=>{const d=JSON.parse(ev.target?.result as string); setElements(d.elements); saveH(d.elements);};
              if(e.target.files?.[0]) r.readAsText(e.target.files[0]);
            }}/>
            <button style={{...toolBtnStyle(false), fontSize: '14px'}} onClick={()=>pdfInputRef.current?.click()}>📄 PDF読込</button>
            <input type="file" ref={pdfInputRef} style={{display:'none'}} accept=".pdf" onChange={handleLoadPDF} />
            <button style={{...toolBtnStyle(false), fontSize: '14px'}} onClick={()=>{alert("画像書き出し機能準備中")}}>📷 画像書き出し</button>
            <button style={{...toolBtnStyle(false), color:'red', fontSize: '14px'}} onClick={()=>confirm("全て消去？")&&(setElements([]),saveH([]))}>⚠ 消去</button>
          </div>
        </div>
      </div>

      <div style={styles.main}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} currentInst={currentInst} onSelectInst={(i:any, t:string)=>{setCurrentInst(i); setTool(t); setPts([]);}} />
        <div style={styles.canvasWrap}>
          <div style={{...styles.zoomCont, transform: `scale(${zoomLevel})`}}>
            <div ref={stageRef} style={styles.stage} onPointerDown={handlePointerDown}>
              <canvas ref={bgCanvasRef} style={{...styles.bgCanvas, opacity: bgOpacity}} />
              <div style={styles.grid} />
              <svg style={styles.svgLayer}>
                {pts.length === 1 && <line x1={pts[0].x} y1={pts[0].y} x2={mousePos.x} y2={mousePos.y} stroke="#1d9e75" strokeDasharray="4" />}
                {tool === 'arc' && pts.length === 2 && <path d={`M${pts[0].x},${pts[0].y} Q${mousePos.x},${mousePos.y} ${pts[1].x},${pts[1].y}`} fill="none" stroke="#1d9e75" strokeDasharray="4" />}
                {elements.filter(el=>el.type==='dim').map(el => (
                  <g key={el.id}><line x1={el.p1.x} y1={el.p1.y} x2={el.p2.x} y2={el.p2.y} stroke={el.color} strokeWidth="1.5" /><text x={(el.p1.x+el.p2.x)/2} y={(el.p1.y+el.p2.y)/2-5} fontSize="10" fill={el.color} textAnchor="middle" fontWeight="bold">{el.label}</text></g>
                ))}
              </svg>
              {elements.filter(el=>el.type!=='dim').map(el => {
                const sel = selectedIds.includes(el.id);
                return (
                  <div key={el.id} className="elem" data-id={el.id} style={{
                    ...styles.elemBase, left: el.x, top: el.y, width: el.w, height: el.h, transform: `rotate(${el.angle||0}deg)`,
                    border: sel ? '2px solid #1d9e75' : el.type==='rect'?'1px solid #777':`1.5px solid ${el.color}`,
                    borderRadius: el.type==='chair'?'50%':2, background: 'white', zIndex: sel?100:10
                  }}>
                    <div style={{display:'flex', alignItems:'center', justifyContent:'center', width:'100%', height:'100%', fontSize:Math.min(11, el.w/3), fontWeight:'bold', color:el.color, pointerEvents:'none'}}>{el.label}</div>
                    {sel && (el.type==='rect' || el.type==='label') && (<HandleLayer onHandleDown={(e:any, mode:string) => setDragState({ mode, id: el.id })} />)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div style={styles.propsBar}>
        <div style={styles.props}>
          {selectedIds.length > 0 ? (
            <>
              選択中：<button onClick={()=>setSelectedIds([])}>解除</button>
              <button onClick={()=>{const n=elements.filter(e=>!selectedIds.includes(e.id)); setElements(n); saveH(n); setSelectedIds([]);}} style={{color:'red'}}>削除</button>
              <button onClick={()=>{const n=elements.map(el=>selectedIds.includes(el.id)?{...el,gid:undefined}:el); setElements(n); saveH(n);}}>グループ解除</button>
              <input type="color" value={elements.find(e=>e.id===selectedIds[0])?.color || "#333333"} onChange={e=>{const v=e.target.value; const n=elements.map(el=>selectedIds.includes(el.id)?{...el,color:v}:el); setElements(n);}} />
              内容: <input type="text" style={{width:80}} value={elements.find(e=>e.id===selectedIds[0])?.label || ""} onChange={e=>{const v=e.target.value; const n=elements.map(el=>selectedIds.includes(el.id)?{...el,label:v}:el); setElements(n);}} />
            </>
          ) : <span>要素を選択して編集 ＋ 💡 ヒント: Shift+クリックで複数選択、ドラッグで移動</span>}
        </div>
        <div>PDF不透明度 <input type="range" min="0" max="1" step="0.1" value={bgOpacity} onChange={e=>setBgOpacity(parseFloat(e.target.value))} /></div>
      </div>
    </div>
  );
}
