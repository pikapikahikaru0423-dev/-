import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar, toolBtnStyle, HandleLayer } from './UIComponents';
import { styles } from './constants';

export default function App() {
  const [elements, setElements] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [tool, setTool] = useState('select');
  const [activeTab, setActiveTab] = useState('main');
  const [currentInst, setCurrentInst] = useState({ l: "Pic", c: "#e35" });
  const [zoomLevel, setZoomLevel] = useState(0.9);
  const [chairSize, setChairSize] = useState(26);
  const [bgOpacity, setBgOpacity] = useState(0.5);
  const [pts, setPts] = useState([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isShift, setIsShift] = useState(false);
  const [dragState, setDragState] = useState(null);
  const [selectionBox, setSelectionBox] = useState(null); // 範囲選択用
  const [history, setHistory] = useState([]);
  const [hIdx, setHIdx] = useState(-1);

  const stageRef = useRef(null);
  const bgCanvasRef = useRef(null);
  const pdfInputRef = useRef(null);
  const templateInputRef = useRef(null);

  useEffect(() => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
    s.onload = () => { 
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js'; 
      }
    };
    document.head.appendChild(s);
    const dk = (e) => { if (e.key === 'Shift') setIsShift(true); };
    const uk = (e) => { if (e.key === 'Shift') setIsShift(false); };
    window.addEventListener('keydown', dk); window.addEventListener('keyup', uk);
    return () => { window.removeEventListener('keydown', dk); window.removeEventListener('keyup', uk); };
  }, []);

  const saveH = (next) => {
    const s = JSON.stringify(next);
    const newH = [...history.slice(0, hIdx + 1), s].slice(-30);
    setHistory(newH); setHIdx(newH.length - 1);
  };
  const undo = () => { if (hIdx > 0) { setElements(JSON.parse(history[hIdx - 1])); setHIdx(hIdx - 1); } };
  const redo = () => { if (hIdx < history.length - 1) { setElements(JSON.parse(history[hIdx + 1])); setHIdx(hIdx + 1); } };

  const getXY = useCallback((e) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (e.clientX - rect.left) / zoomLevel, y: (e.clientY - rect.top) / zoomLevel };
  }, [zoomLevel]);

  const snap = (p1, p2) => {
    if (!isShift) return p2;
    return Math.abs(p2.x - p1.x) > Math.abs(p2.y - p1.y) ? { x: p2.x, y: p1.y } : { x: p1.x, y: p2.y };
  };

  const getPosOnPath = (type, pathPts, t) => {
    if (type === 'arc' && pathPts.length === 3) {
      const [p1, p2, p3] = pathPts;
      const x = Math.pow(1-t, 2)*p1.x + 2*(1-t)*t*p3.x + Math.pow(t, 2)*p2.x;
      const y = Math.pow(1-t, 2)*p1.y + 2*(1-t)*t*p3.y + Math.pow(t, 2)*p2.y;
      return { x, y };
    }
    const [p1, p2] = pathPts;
    return { x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t };
  };

  const handlePointerDown = (e) => {
    const pt = getXY(e);
    const target = e.target;
    const isGuideline = target.dataset.gid && (target.tagName === 'path' || target.tagName === 'line');
    const elemDiv = target.closest('.elem');

    if (tool === 'select') {
      if (elemDiv || isGuideline) {
        const gid = isGuideline ? target.dataset.gid : elements.find(x => x.id === elemDiv.dataset.id)?.gid;
        const id = elemDiv?.dataset.id;
        const isGidMove = !!isGuideline;
        let tIds = (isGidMove && gid) ? elements.filter(x => x.gid === gid).map(x => x.id) : (id ? [id] : []);
        if (tIds.length === 0) return;
        
        // すでに選択されているものをクリックした場合は選択維持、新しいものをクリックした場合は単独選択
        if (!selectedIds.includes(tIds[0])) {
          setSelectedIds(tIds);
        }
        
        setDragState({ 
          mode: 'move', isGidMove, 
          objs: (selectedIds.includes(tIds[0]) ? selectedIds : tIds).map(sid => {
            const obj = elements.find(x => x.id === sid);
            return { id: sid, ox: pt.x - obj.x, oy: pt.y - obj.y };
          })
        });
      } else {
        // 何もない場所をクリック：範囲選択開始
        setSelectedIds([]);
        setSelectionBox({ startX: pt.x, startY: pt.y, currentX: pt.x, currentY: pt.y });
      }
      return;
    }

    if (['chair', 'label', 'rect'].includes(tool)) {
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
          let input = prompt("個数", "4") || "";
          if (input) {
            input = input.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
            const n = parseInt(input);
            if (n > 0) {
              const gid = crypto.randomUUID();
              const chairs = Array.from({length:n}).map((_, i) => {
                const pos = getPosOnPath(tool, newPts, i/(n-1||1));
                return { id: crypto.randomUUID(), type: 'chair', x: pos.x-chairSize/2, y: pos.y-chairSize/2, w: chairSize, h: chairSize, label: currentInst.l, color: currentInst.c, gid, pathType: tool, pathPts: newPts };
              });
              const next=[...elements, ...chairs]; setElements(next); saveH(next);
            }
          }
        }
        setPts([]);
      } else { setPts(newPts); }
    }
  };

  const handlePointerMove = (e) => {
    const pt = getXY(e); setMousePos(pt);
    
    // 範囲選択中の処理
    if (selectionBox) {
      setSelectionBox({ ...selectionBox, currentX: pt.x, currentY: pt.y });
      const x1 = Math.min(selectionBox.startX, pt.x);
      const y1 = Math.min(selectionBox.startY, pt.y);
      const x2 = Math.max(selectionBox.startX, pt.x);
      const y2 = Math.max(selectionBox.startY, pt.y);
      
      const inBoxIds = elements
        .filter(el => el.type !== 'dim' && el.x >= x1 && el.x + el.w <= x2 && el.y >= y1 && el.y + el.h <= y2)
        .map(el => el.id);
      setSelectedIds(inBoxIds);
      return;
    }

    if (!dragState) return;
    setElements(elements.map(el => {
      const d = dragState.objs?.find((o) => o.id === el.id);
      if (!d) return el;
      if (dragState.mode === 'move') {
        if (dragState.isGidMove) {
          const nextX = pt.x - d.ox, nextY = pt.y - d.oy;
          const updatedPathPts = el.pathPts?.map(pp => ({ x: pp.x + (nextX - el.x), y: pp.y + (nextY - el.y) }));
          return { ...el, x: nextX, y: nextY, pathPts: updatedPathPts || el.pathPts };
        }
        if (el.pathType === 'arc' && el.pathPts) {
          let bestT = 0, minDist = Infinity;
          for (let t = 0; t <= 1; t += 0.005) {
            const p = getPosOnPath('arc', el.pathPts, t);
            const dist = Math.hypot(pt.x - p.x, pt.y - p.y);
            if (dist < minDist) { minDist = dist; bestT = t; }
          }
          const f = getPosOnPath('arc', el.pathPts, bestT);
          return { ...el, x: f.x - el.w / 2, y: f.y - el.h / 2 };
        }
        return { ...el, x: pt.x - d.ox, y: pt.y - d.oy };
      }
      if (dragState.mode === 'resize') return { ...el, w: Math.max(10, pt.x - el.x), h: Math.max(10, pt.y - el.y) };
      if (dragState.mode === 'rotate') { 
        const cx = el.x + el.w / 2, cy = el.y + el.h / 2; 
        return { ...el, angle: Math.atan2(pt.y - cy, pt.x - cx) * 180 / Math.PI + 90 }; 
      }
      return el;
    }));
  };

  const handlePointerUp = () => {
    if (dragState) saveH(elements);
    setDragState(null);
    setSelectionBox(null);
  };

  const deleteSelected = () => {
    if (selectedIds.length === 0) return;
    const next = elements.filter(el => !selectedIds.includes(el.id));
    setElements(next);
    saveH(next);
    setSelectedIds([]);
  };

  const handleLoadPDF = async (e) => {
    const file = e.target.files?.[0]; if (!file || !window.pdfjsLib) return;
    const r = new FileReader();
    r.onload = async () => {
      try {
        const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(r.result) }).promise;
        const page = await pdf.getPage(1); const vp = page.getViewport({ scale: 2.0 });
        const cv = bgCanvasRef.current; if (!cv) return;
        cv.width = vp.width; cv.height = vp.height;
        await page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
      } catch (err) { console.error("PDF Load Error:", err); }
    };
    r.readAsArrayBuffer(file);
  };

  return (
    <div style={{...styles.body, touchAction: 'none'}} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
      <div style={{...styles.toolbar, flexDirection: 'column', alignItems: 'flex-start', gap: '8px', padding: '10px'}}>
        <div style={{display: 'flex', width: '100%', alignItems: 'center', gap: '10px'}}>
          <div style={styles.tbGroup}>
            <button style={toolBtnStyle(tool==='select')} onClick={()=>setTool('select')}>▷ 選択</button>
            <button style={toolBtnStyle(tool==='chair')} onClick={()=>setTool('chair')}>○ 椅子</button>
            <button style={toolBtnStyle(tool==='arc')} onClick={()=>setTool('arc')}>⌒ 弧配置</button>
            <button style={toolBtnStyle(tool==='line')} onClick={()=>setTool('line')}>─ 線配置</button>
            <button style={toolBtnStyle(tool==='label')} onClick={()=>setTool('label')}>Ａ 自由ラベル</button>
            <button style={toolBtnStyle(tool==='rect')} onClick={()=>setTool('rect')}>□ 四角枠</button>
            <button style={toolBtnStyle(tool==='dim')} onClick={()=>setTool('dim')}>↔ 寸法</button>
          </div>
          <div style={styles.sep} />
          <button style={{...toolBtnStyle(false), color: selectedIds.length > 0 ? 'red' : '#ccc'}} onClick={deleteSelected} disabled={selectedIds.length === 0}>🗑 選択削除</button>
        </div>
        <div style={{display: 'flex', width: '100%', alignItems: 'center', gap: '10px'}}>
          <div style={styles.tbGroup}>
            <button style={toolBtnStyle(false)} onClick={undo}>↩ 戻す</button>
            <button style={toolBtnStyle(false)} onClick={redo}>↪ 進む</button>
            <button style={toolBtnStyle(false)} onClick={()=>{ if(selectedIds.length<2)return; const gid=crypto.randomUUID(); const n=elements.map(el=>selectedIds.includes(el.id)?{...el,gid}:el); setElements(n); saveH(n); }}>グループ化</button>
            <button style={toolBtnStyle(false)} onClick={()=>{ const n=elements.map(el=>selectedIds.includes(el.id)?{...el,gid:undefined}:el); setElements(n); saveH(n); }}>解除</button>
          </div>
          <div style={styles.sep} />
          <div style={styles.tbGroup}>
            <button style={toolBtnStyle(false)} onClick={()=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify({elements})])); a.download='stage.json'; a.click(); }}>💾 保存</button>
            <button style={toolBtnStyle(false)} onClick={()=>templateInputRef.current?.click()}>📂 読込</button>
            <input type="file" ref={templateInputRef} style={{display:'none'}} onChange={e=>{
              const file = e.target.files?.[0]; if(!file) return;
              const r=new FileReader(); r.onload=ev=>{ try{ const d=JSON.parse(ev.target?.result); setElements(d.elements||[]); saveH(d.elements||[]); }catch(e){}};
              r.readAsText(file);
            }}/>
            <button style={toolBtnStyle(false)} onClick={()=>pdfInputRef.current?.click()}>📄 PDF読込</button>
            <button style={{...toolBtnStyle(false), color:'red'}} onClick={()=>window.confirm("全て消去しますか？")&&(setElements([]),saveH([]))}>⚠ 全消去</button>
          </div>
        </div>
      </div>
      <div style={styles.main}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} currentInst={currentInst} onSelectInst={(i, t)=>{setCurrentInst(i); setTool(t); setPts([]);}} />
        <div style={styles.canvasWrap}>
          <div style={{...styles.zoomCont, transform: `scale(${zoomLevel})`}}>
            <div ref={stageRef} style={{...styles.stage, touchAction: 'none'}} onPointerDown={handlePointerDown}>
              <canvas ref={bgCanvasRef} style={{...styles.bgCanvas, opacity: bgOpacity}} />
              <div style={styles.grid} />
              <svg style={styles.svgLayer}>
                {selectionBox && (
                  <rect 
                    x={Math.min(selectionBox.startX, selectionBox.currentX)} 
                    y={Math.min(selectionBox.startY, selectionBox.currentY)} 
                    width={Math.abs(selectionBox.currentX - selectionBox.startX)} 
                    height={Math.abs(selectionBox.currentY - selectionBox.startY)} 
                    fill="rgba(29, 158, 117, 0.1)" 
                    stroke="#1d9e75" 
                    strokeWidth="1"
                  />
                )}
                {pts.length === 1 && <line x1={pts[0].x} y1={pts[0].y} x2={mousePos.x} y2={mousePos.y} stroke="#1d9e75" strokeDasharray="4" />}
                {tool === 'arc' && pts.length === 2 && <path d={`M${pts[0].x},${pts[0].y} Q${mousePos.x},${mousePos.y} ${pts[1].x},${pts[1].y}`} fill="none" stroke="#1d9e75" strokeDasharray="4" />}
                {(() => {
                  const renderedGids = new Set();
                  return elements.filter(el => el.gid && el.pathPts).map(el => {
                    if (renderedGids.has(el.gid)) return null;
                    renderedGids.add(el.gid);
                    const isGroupSelected = elements.some(e => e.gid === el.gid && selectedIds.includes(e.id));
                    if (!isGroupSelected) return null;
                    const p = el.pathPts;
                    const strokeColor = "#007a55";
                    const dPath = el.pathType === 'arc' && p.length === 3 ? `M${p[0].x},${p[0].y} Q${p[2].x},${p[2].y} ${p[1].x},${p[1].y}` : null;
                    return (
                      <g key={el.gid}>
                        {el.pathType === 'arc' ? (
                          <path d={dPath} fill="none" stroke={strokeColor} strokeWidth="2" strokeDasharray="6,4" style={{pointerEvents:'none'}} />
                        ) : (
                          <line x1={p[0].x} y1={p[0].y} x2={p[1].x} y2={p[1].y} stroke={strokeColor} strokeWidth="2" strokeDasharray="6,4" style={{pointerEvents:'none'}} />
                        )}
                        {el.pathType === 'arc' ? (
                          <path data-gid={el.gid} d={dPath} fill="none" stroke="rgba(0,0,0,0)" strokeWidth="36" style={{pointerEvents:'stroke'}} />
                        ) : (
                          <line data-gid={el.gid} x1={p[0].x} y1={p[0].y} x2={p[1].x} y2={p[1].y} stroke="rgba(0,0,0,0)" strokeWidth="36" style={{pointerEvents:'stroke'}} />
                        )}
                      </g>
                    );
                  });
                })()}
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
                    {sel && (el.type==='rect' || el.type==='label') && (<HandleLayer onHandleDown={(e, mode) => setDragState({ mode, id: el.id })} />)}
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
              選択中({selectedIds.length}個) <button onClick={()=>setSelectedIds([])}>解除</button>
              内容: <input type="text" style={{width:80}} value={elements.find(e=>e.id===selectedIds[0])?.label || ""} onChange={e=>{const v=e.target.value; const n=elements.map(el=>selectedIds.includes(el.id)?{...el,label:v}:el); setElements(n);}} />
            </>
          ) : (
            <span style={{color: '#999', fontSize: '12px'}}>キャンバスをドラッグして範囲選択できます</span>
          )}
        </div>
        <div style={{fontSize: '12px'}}>
          ズーム <input type="range" min="0.3" max="2" step="0.05" value={zoomLevel} onChange={e=>setZoomLevel(parseFloat(e.target.value))} />
          不透明度 <input type="range" min="0" max="1" step="0.1" value={bgOpacity} onChange={e=>setBgOpacity(parseFloat(e.target.value))} />
        </div>
      </div>
    </div>
  );
}

