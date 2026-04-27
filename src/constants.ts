export const MAIN_INST = [
  { l: 'Pic', c: '#e35' }, { l: 'Fl', c: '#e35' }, { l: 'Ob', c: '#e35' },
  { l: 'B♭Cl', c: '#2a4a8a' }, { l: 'B.Cl', c: '#2a4a8a' },
  { l: 'A.Sax', c: '#d82' }, { l: 'T.Sax', c: '#d82' }, { l: 'B.Sax', c: '#d82' },
  { l: 'Fg', c: '#583' }, { l: 'Tp', c: '#c33' }, { l: 'Tb', c: '#c33' },
  { l: 'Hr', c: '#c33' }, { l: 'Tu', c: '#c33' }, { l: 'Eu', c: '#c33' }, { l: 'Stb', c: '#555' }
];

export const OTHER_INST = [
  { l: 'Cor Angl.', c: '#e35' }, { l: 'E♭Cl', c: '#2a4a8a' }, { l: 'A.Cl', c: '#2a4a8a' },
  { l: 'CA.Cl', c: '#2a4a8a' }, { l: 'S.Sax', c: '#d82' }
];

export const PERC = {
  label: ["BD", "Chime", "Harp", "Piano", "Vib.", "Xlo.", "Marb.", "Glo.", "W.C.", "T.-tam", "Timb.", "Bongos", "Congas", "StPa", "Base", "Synth."],
  chair: ["Timp.", "S.D.", "4Tom", "S.Cym", "C.Cym", "Drm", "Bongos", "Congas"],
  marching: ["M.S.D.", "M.BD1", "M.BD2", "M.BD3", "M.BD4", "M.TD"]
};

export const styles: any = {
  body: { display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#f5f5f5', fontFamily: 'sans-serif' },
  toolbar: { display: 'flex', gap: '0px', padding: '8px 16px', background: '#ffffff', borderBottom: '1px solid #ddd', alignItems: 'center', flexWrap: 'nowrap', overflowX: 'auto', zIndex: 100 },
  tbGroup: { display: 'flex', gap: '6px', padding: '0 8px', alignItems: 'center', whiteSpace: 'nowrap', fontSize: '12px', backgroundColor: '#ffffff' },
  sep: { width: '1px', height: '20px', background: '#eee', margin: '0 8px' },
  main: { display: 'flex', flex: 1, overflow: 'hidden' },
  sidebar: { width: '220px', background: '#fff', borderRight: '1px solid #ddd', display: 'flex', flexDirection: 'column' },
  tabs: { display: 'flex', borderBottom: '1px solid #eee' },
  instList: { flex: 1, overflowY: 'auto', padding: '8px' },
  inst: { display: 'flex', alignItems: 'center', padding: '6px 8px', cursor: 'pointer', borderRadius: '4px', fontSize: '12px' },
  dot: { width: '8px', height: '8px', borderRadius: '50%', marginRight: '8px', flexShrink: 0 },
  percHeader: { fontSize: '10px', color: '#999', margin: '12px 0 4px 4px', fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: '2px' },
  canvasWrap: { flex: 1, position: 'relative', overflow: 'auto', background: '#eee', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  zoomCont: { position: 'relative', boxShadow: '0 0 20px rgba(0,0,0,0.1)', transformOrigin: 'center' },
  stage: { width: '1200px', height: '800px', background: '#fff', position: 'relative', overflow: 'hidden', cursor: 'crosshair', touchAction: 'none' },
  bgCanvas: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' },
  grid: { position: 'absolute', width: '100%', height: '100%', backgroundImage: 'linear-gradient(#eee 1px, transparent 1px), linear-gradient(90deg, #eee 1px, transparent 1px)', backgroundSize: '20px 20px', pointerEvents: 'none' },
  svgLayer: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 },
  elemBase: { position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none', cursor: 'move' },
  propsBar: { height: '48px', background: '#fff', borderTop: '1px solid #ddd', display: 'flex', alignItems: 'center', padding: '0 16px', justifyContent: 'space-between', fontSize: '12px' },
  props: { display: 'flex', gap: '12px', alignItems: 'center' },
  valInput: { width: '45px', padding: '2px', textAlign: 'center' }
};