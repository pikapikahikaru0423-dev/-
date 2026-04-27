import React from 'react';
import { MAIN_INST, OTHER_INST, PERC, styles } from './constants';

export const toolBtnStyle = (active: boolean) => ({
  padding: '6px 10px', fontSize: '11px', border: '1px solid', borderRadius: '4px', cursor: 'pointer',
  background: active ? '#e1f5ee' : '#ffffff', borderColor: active ? '#1d9e75' : '#ccc', color: active ? '#0f6e56' : '#333'
});

const tabStyle = (active: boolean) => ({
  flex: 1, padding: '12px 0', textAlign: 'center' as const, fontSize: '11px', cursor: 'pointer',
  borderBottom: active ? '2px solid #1d9e75' : '1px solid transparent', color: active ? '#1d9e75' : '#999', fontWeight: active ? 'bold' : 'normal'
});

export const HandleLayer = ({ onHandleDown }: any) => (
  <>
    <div onPointerDown={(e) => { e.stopPropagation(); onHandleDown(e, 'resize'); }} style={{ position: 'absolute', right: -5, bottom: -5, width: 10, height: 10, background: '#1d9e75', cursor: 'nwse-resize', zIndex: 110, borderRadius: '2px' }} />
    <div onPointerDown={(e) => { e.stopPropagation(); onHandleDown(e, 'rotate'); }} style={{ position: 'absolute', left: '50%', top: -25, transform: 'translateX(-50%)', width: 10, height: 10, background: '#1d9e75', cursor: 'alias', zIndex: 110, borderRadius: '50%' }} />
  </>
);

export const Sidebar = ({ activeTab, setActiveTab, currentInst, onSelectInst }: any) => {
  const instItem = (active: boolean) => ({ ...styles.inst, background: active ? '#f0f9f6' : 'transparent' });
  return (
    <div style={styles.sidebar}>
      <div style={styles.tabs}>
        <div onClick={()=>setActiveTab('main')} style={tabStyle(activeTab==='main')}>木・金</div>
        <div onClick={()=>setActiveTab('other')} style={tabStyle(activeTab==='other')}>その他</div>
        <div onClick={()=>setActiveTab('perc')} style={tabStyle(activeTab==='perc')}>Perc.</div>
      </div>
      <div style={styles.instList}>
        {activeTab === 'main' && MAIN_INST.map(i => (
          <div key={i.l} onClick={()=>onSelectInst(i, 'chair')} style={instItem(currentInst.l===i.l)}><span style={{...styles.dot, background:i.c}}/>{i.l}</div>
        ))}
        {activeTab === 'other' && OTHER_INST.map(i => (
          <div key={i.l} onClick={()=>onSelectInst(i, 'chair')} style={instItem(currentInst.l===i.l)}><span style={{...styles.dot, background:i.c}}/>{i.l}</div>
        ))}
        {activeTab === 'perc' && (
          <>
            <div style={styles.percHeader}>ラベル形式</div>
            {PERC.label.map(l => (
              <div key={l} style={instItem(currentInst.l===l)} onClick={()=>onSelectInst({l, c:"#333"}, 'label')}><span style={{...styles.dot, background:'#333', borderRadius:2}}/>{l}</div>
            ))}
            <div style={styles.percHeader}>円形(椅子)形式</div>
            {PERC.chair.map(l => (
              <div key={l} style={instItem(currentInst.l===l)} onClick={()=>onSelectInst({l, c:"#2a4a8a"}, 'chair')}><span style={{...styles.dot, background:'#2a4a8a'}}/>{l}</div>
            ))}
            <div style={styles.percHeader}>マーチング</div>
            {PERC.marching.map(l => (
              <div key={l} style={instItem(currentInst.l===l)} onClick={()=>onSelectInst({l, c:"#555"}, 'chair')}><span style={{...styles.dot, background:'#555'}}/>{l}</div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};