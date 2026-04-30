/* ═══════════════════════════════════════════════════════════════
   BioSmart 2.0 — app.jsx
   Sistema de Control de Asistencia Biométrico y Gestión de Carnetización
   ═══════════════════════════════════════════════════════════════ */

const { useState, useEffect, useRef, useCallback } = React;

// ══════════════════════════════════════════════════════════════
// ICONS — SVG inline (sin dependencias externas)
// ══════════════════════════════════════════════════════════════
const icons = {
  dashboard:  "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  register:   "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M19 8v6 M22 11h-6",
  attendance: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  reports:    "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  camera:     "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
  print:      "M6 9V2h12v7 M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2 M6 14h12v8H6z",
  check:      "M20 6L9 17l-5-5",
  x:          "M18 6L6 18 M6 6l12 12",
  scan:       "M9 2H4.5A2.5 2.5 0 0 0 2 4.5V9 M15 2h4.5A2.5 2.5 0 0 1 22 4.5V9 M2 15v4.5A2.5 2.5 0 0 0 4.5 22H9 M15 22h4.5a2.5 2.5 0 0 0 2.5-2.5V15",
  filter:     "M22 3H2l8 9.46V19l4 2v-8.54L22 3",
  export:     "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12",
  users:      "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
  trend:      "M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6",
  alert:      "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01",
  qr:         "M5 3H3v2h2V3z M21 3h-2v2h2V3z M5 19H3v2h2v-2z M3 3h6v6H3z M15 3h6v6h-6z M3 15h6v6H3z M15 15h2v2h-2z M19 15h2v2h-2z M17 17h2v2h-2z M15 19h2v2h-2z M19 19h2v2h-2z",
};

const Ic = ({ name, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={icons[name] || icons.dashboard} />
  </svg>
);

// ══════════════════════════════════════════════════════════════
// STORAGE — localStorage con estructura preparada para API futura
// ══════════════════════════════════════════════════════════════
const storage = {
  // Users CRUD
  getUsers:      () => { try { return JSON.parse(localStorage.getItem('bio_users') || '[]'); } catch { return []; } },
  saveUsers:     (u) => localStorage.setItem('bio_users', JSON.stringify(u)),

  // Attendance CRUD
  getAttendance: () => { try { return JSON.parse(localStorage.getItem('bio_attendance') || '[]'); } catch { return []; } },
  saveAttendance:(a) => localStorage.setItem('bio_attendance', JSON.stringify(a)),

  // Future-proof: swap these for fetch() calls to connect a real API
  // e.g.  getUsers: () => fetch('/api/users').then(r => r.json())
};

// ══════════════════════════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════════════════════════
const fmtDate  = (d) => new Date(d).toLocaleDateString('es-SV', { day:'2-digit', month:'2-digit', year:'numeric' });
const fmtTime  = (d) => new Date(d).toLocaleTimeString('es-SV', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
const fmtDateInput = (d) => new Date(d).toISOString().split('T')[0];
const genId    = () => Math.random().toString(36).substr(2, 9).toUpperCase();
const getStatus = (ts) => {
  const h = new Date(ts).getHours();
  if (h < 8)  return 'early';
  if (h <= 8) return 'ontime';
  return 'late';
};

// ══════════════════════════════════════════════════════════════
// CLOCK WIDGET
// ══════════════════════════════════════════════════════════════
function Clock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i); }, []);
  return (
    <div className="clock-widget">
      <div className="clock-time">
        {t.toLocaleTimeString('es-SV', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}
      </div>
      <div className="clock-date">
        {t.toLocaleDateString('es-SV', { weekday:'short', day:'2-digit', month:'short', year:'numeric' })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// QR CODE
// ══════════════════════════════════════════════════════════════
function QRCode({ data, size = 80 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = '';
    try {
      new window.QRCode(ref.current, {
        text: data || 'N/A', width: size, height: size,
        colorDark: '#000000', colorLight: '#ffffff',
        correctLevel: window.QRCode.CorrectLevel.M,
      });
    } catch (e) {
      ref.current.innerHTML = '<span style="font-size:10px;color:#aaa">QR</span>';
    }
  }, [data, size]);
  return (
    <div ref={ref} style={{ width: size, height: size, display:'flex', alignItems:'center', justifyContent:'center' }} />
  );
}

// ══════════════════════════════════════════════════════════════
// CARNET VIEW
// ══════════════════════════════════════════════════════════════
function CarnetView({ user }) {
  if (!user) return null;
  const qrData = JSON.stringify({ id: user.id, nombre: user.nombre, cargo: user.cargo, nie: user.nie });
  return (
    <div className="carnet-wrapper">
      <div className="carnet" id="carnet-preview">
        <div className="carnet-header">
          <div className="carnet-logo">🏫 INSTITUCIÓN EDUCATIVA</div>
          <div className="carnet-inst">Sistema de Control Biométrico</div>
        </div>
        <div className="carnet-photo-wrap">
          <div className="carnet-photo">
            {user.foto ? <img src={user.foto} alt="foto" /> : '👤'}
          </div>
        </div>
        <div className="carnet-body">
          <div className="carnet-name">{user.nombre || 'Sin nombre'}</div>
          <div className="carnet-cargo">{user.cargo || 'Sin cargo'}</div>
          <div className="carnet-divider" />
          {user.nie   && <div className="carnet-field"><span className="carnet-field-label">NIE/DUI</span><span className="carnet-field-value">{user.nie}</span></div>}
          {user.grado && <div className="carnet-field"><span className="carnet-field-label">Grado/Sección</span><span className="carnet-field-value">{user.grado}</span></div>}
          <div className="carnet-field"><span className="carnet-field-label">ID</span><span className="carnet-field-value">{user.id}</span></div>
          <div className="carnet-field"><span className="carnet-field-label">Año</span><span className="carnet-field-value">{new Date().getFullYear()}</span></div>
          <div className="carnet-qr-wrap">
            <div className="carnet-qr"><QRCode data={qrData} size={72} /></div>
          </div>
        </div>
        <div className="carnet-footer">
          <span className="carnet-footer-text">CARNET OFICIAL • {new Date().getFullYear()}</span>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// CAMERA CAPTURE
// ══════════════════════════════════════════════════════════════
function CameraCapture({ onCapture, captured }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [err, setErr] = useState(null);

  const startCamera = async () => {
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width:320, height:240, facingMode:'user' } });
      if (videoRef.current) { videoRef.current.srcObject = stream; setStreaming(true); }
    } catch (e) {
      setErr('Cámara no disponible. Usa la foto demo.');
    }
  };

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    canvasRef.current.width = 320; canvasRef.current.height = 240;
    ctx.drawImage(videoRef.current, 0, 0, 320, 240);
    const data = canvasRef.current.toDataURL('image/jpeg', 0.8);
    if (videoRef.current.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    setStreaming(false);
    onCapture(data);
  };

  const useDemo = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 120; canvas.height = 120;
    const ctx = canvas.getContext('2d');
    const colors = ['#1e90ff','#00e5a0','#ffb830','#ff4566','#9b59b6'];
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.fillRect(0, 0, 120, 120);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath(); ctx.arc(60, 45, 25, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(60, 100, 40, 0, Math.PI * 2); ctx.fill();
    onCapture(canvas.toDataURL());
  };

  return (
    <div>
      <div className="camera-container" onClick={!streaming && !captured ? startCamera : undefined}>
        {captured ? (
          <img src={captured} alt="captured" />
        ) : streaming ? (
          <video ref={videoRef} autoPlay playsInline style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        ) : (
          <div className="camera-overlay">
            <div className="camera-icon">📷</div>
            <div className="camera-text">{err || 'Clic para activar cámara'}</div>
          </div>
        )}
        <canvas ref={canvasRef} style={{ display:'none' }} />
      </div>
      <div style={{ display:'flex', gap:8, marginTop:8 }}>
        {streaming  && <button className="btn btn-primary btn-sm"   style={{flex:1}} onClick={capture}>📸 Capturar</button>}
        {!streaming && !captured && <button className="btn btn-secondary btn-sm" style={{flex:1}} onClick={startCamera}>🎥 Cámara</button>}
        {!streaming && !captured && <button className="btn btn-secondary btn-sm" style={{flex:1}} onClick={useDemo}>👤 Demo</button>}
        {captured   && <button className="btn btn-secondary btn-sm" style={{flex:1}} onClick={() => { onCapture(null); setStreaming(false); }}>🔄 Retomar</button>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// WELCOME POPUP con Cooldown de 5 segundos
// ══════════════════════════════════════════════════════════════
function WelcomePopup({ user, onClose }) {
  const [progress, setProgress] = useState(100);
  const [seconds,  setSeconds]  = useState(5);
  const now = new Date();

  useEffect(() => {
    const start    = Date.now();
    const duration = 5000;
    const iv = setInterval(() => {
      const elapsed   = Date.now() - start;
      const remaining = Math.max(0, duration - elapsed);
      setProgress((remaining / duration) * 100);
      setSeconds(Math.ceil(remaining / 1000));
      if (remaining <= 0) { clearInterval(iv); onClose(); }
    }, 100);
    return () => clearInterval(iv);
  }, [onClose]);

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-card" onClick={e => e.stopPropagation()}>
        <div style={{ fontSize:11, color:'var(--success)', letterSpacing:2, marginBottom:8, textTransform:'uppercase' }}>
          ✅ Registro Exitoso
        </div>
        <div className="popup-photo">
          {user.foto ? <img src={user.foto} alt="" /> : '👤'}
        </div>
        <div className="popup-greeting">¡Bienvenido/a!</div>
        <div className="popup-name">{user.nombre}</div>
        <div className="popup-cargo">{user.cargo}{user.grado ? ` • ${user.grado}` : ''}</div>
        <div className="popup-time">{fmtTime(now)}</div>
        <div className="popup-date">{fmtDate(now)}</div>
        <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:4 }}>Asistencia registrada correctamente</div>
        <div className="cooldown-bar-wrap">
          <div className="cooldown-bar" style={{ width:`${progress}%`, background:`hsl(${progress*1.2},70%,50%)` }} />
        </div>
        <div className="cooldown-text">Sistema bloqueado por {seconds}s (anti-duplicado)</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// NOTIFICATION HOOK
// ══════════════════════════════════════════════════════════════
function useNotifs() {
  const [notifs, setNotifs] = useState([]);
  const add = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setNotifs(n => [...n, { id, msg, type }]);
    setTimeout(() => setNotifs(n => n.filter(x => x.id !== id)), 3000);
  }, []);
  return { notifs, add };
}

// ══════════════════════════════════════════════════════════════
// DASHBOARD MODULE
// ══════════════════════════════════════════════════════════════
function Dashboard({ users, attendance }) {
  const today      = fmtDateInput(new Date());
  const todayRecs  = attendance.filter(a => fmtDateInput(new Date(a.timestamp)) === today);
  const todayIds   = new Set(todayRecs.map(a => a.userId));
  const presentToday = todayIds.size;
  const totalUsers   = users.length;
  const absent       = Math.max(0, totalUsers - presentToday);
  const late         = todayRecs.filter(a => getStatus(a.timestamp) === 'late').length;
  const ontime       = todayRecs.filter(a => getStatus(a.timestamp) !== 'late').length;
  const recentAtt    = [...attendance].sort((a,b) => b.timestamp - a.timestamp).slice(0, 8);

  const cargoStats = ['Docente','Estudiante','Administrativo'].map(c => ({
    cargo:   c,
    total:   users.filter(u => u.cargo === c).length,
    present: todayRecs.filter(a => { const u = users.find(x=>x.id===a.userId); return u && u.cargo===c; }).length,
  }));

  return (
    <div className="section-enter">
      {/* Stats */}
      <div className="stats-grid">
        {[
          { label:'Asistencias Hoy',      value: presentToday, color:'var(--success)',       bg:'var(--success-glow)',         icon:'✅', change:'+'+presentToday+' hoy' },
          { label:'Ausentes',             value: absent,       color:'var(--danger)',        bg:'var(--danger-glow)',          icon:'❌', change: totalUsers+' registrados' },
          { label:'Retardos',             value: late,         color:'var(--warning)',       bg:'rgba(255,184,48,0.15)',       icon:'⏰', change:'A tiempo: '+ontime },
          { label:'Personal Registrado',  value: totalUsers,   color:'var(--accent-bright)', bg:'var(--accent-glow)',          icon:'👥', change:'En sistema' },
        ].map((s,i) => (
          <div key={i} className="stat-card">
            <div className="glow" style={{ background: s.bg }} />
            <div style={{ fontSize:24, marginBottom:4 }}>{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-change" style={{ color: s.color }}>{s.change}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="two-col" style={{ marginBottom:16 }}>
        <div className="card">
          <div className="card-title"><Ic name="users" size={14}/> Actividad por Cargo</div>
          {cargoStats.map(c => (
            <div key={c.cargo} style={{ marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                <span>{c.cargo}</span>
                <span style={{ fontFamily:'JetBrains Mono, monospace', color:'var(--accent-bright)' }}>{c.present}/{c.total}</span>
              </div>
              <div style={{ background:'var(--bg-secondary)', borderRadius:4, height:6, overflow:'hidden' }}>
                <div style={{ width:`${c.total ? (c.present/c.total)*100 : 0}%`, height:'100%', background:'var(--accent)', borderRadius:4, transition:'width 0.5s' }} />
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-title"><Ic name="trend" size={14}/> Últimas Asistencias</div>
          <div style={{ maxHeight:160, overflowY:'auto' }}>
            {recentAtt.length === 0 ? (
              <div style={{ textAlign:'center', color:'var(--text-muted)', fontSize:12, padding:20 }}>Sin registros aún</div>
            ) : recentAtt.map(a => {
              const u = users.find(x => x.id === a.userId);
              if (!u) return null;
              return (
                <div key={a.id} className="att-item" style={{ padding:'7px 10px', marginBottom:6 }}>
                  <div className="att-avatar">{u.foto ? <img src={u.foto} alt="" /> : '👤'}</div>
                  <div>
                    <div className="att-name" style={{ fontSize:12 }}>{u.nombre}</div>
                    <div className="att-sub">{u.cargo}</div>
                  </div>
                  <div className="att-time">{fmtTime(a.timestamp)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* System status */}
      <div className="card">
        <div className="card-title"><Ic name="alert" size={14}/> Estado del Sistema</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
          {[
            { label:'Base de Datos',       status:'Operativo', color:'var(--success)' },
            { label:'Escáner Biométrico',  status:'Listo',     color:'var(--success)' },
            { label:'Módulo QR',           status:'Activo',    color:'var(--accent-bright)' },
          ].map(s => (
            <div key={s.label} style={{ background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 12px' }}>
              <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4 }}>{s.label}</div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:s.color, boxShadow:`0 0 6px ${s.color}` }} />
                <span style={{ fontSize:12, color:s.color, fontWeight:600 }}>{s.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// REGISTER MODULE
// ══════════════════════════════════════════════════════════════
function RegisterModule({ users, setUsers, addNotif }) {
  const emptyForm = { nombre:'', cargo:'Estudiante', nie:'', grado:'' };
  const [tab, setTab]             = useState('form');
  const [form, setForm]           = useState(emptyForm);
  const [foto, setFoto]           = useState(null);
  const [preview, setPreview]     = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const handleSubmit = () => {
    if (!form.nombre.trim()) { addNotif('Ingresa el nombre completo', 'danger'); return; }
    const newUser = { ...form, foto, id: genId(), createdAt: Date.now() };
    const updated = [...users, newUser];
    setUsers(updated);
    storage.saveUsers(updated);
    addNotif('✅ Usuario registrado: ' + form.nombre);
    setPreview(newUser);
    setForm(emptyForm);
    setFoto(null);
    setTab('carnet');
  };

  const deleteUser = (id) => {
    const updated = users.filter(u => u.id !== id);
    setUsers(updated);
    storage.saveUsers(updated);
    addNotif('Usuario eliminado', 'danger');
    if ((selectedUser || preview)?.id === id) { setSelectedUser(null); setPreview(null); }
  };

  const printCarnet = () => {
    const el = document.getElementById('carnet-preview');
    if (!el) return;
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Carnet BioSmart</title>
      <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@700&family=JetBrains+Mono:wght@500&family=Exo+2:wght@400;600&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="styles.css">
      <style>body{background:#0a1628;display:flex;justify-content:center;padding:40px;}</style>
      </head><body>${el.outerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  const displayUser = preview || selectedUser;

  return (
    <div className="section-enter">
      <div className="tabs">
        {[
          { id:'form',   label:'➕ Nuevo Registro' },
          { id:'list',   label:`👥 Personal (${users.length})` },
          { id:'carnet', label:'🪪 Carnet' },
        ].map(t => (
          <button key={t.id} className={`tab${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* ── Formulario ── */}
      {tab === 'form' && (
        <div className="two-col">
          <div className="card">
            <div className="card-title"><Ic name="register" size={14}/> Datos del Usuario</div>
            <div className="form-grid">
              <div className="form-group full">
                <label className="form-label">Nombre Completo *</label>
                <input className="form-input" value={form.nombre}
                  onChange={e => setForm(f => ({...f, nombre: e.target.value}))}
                  placeholder="Ej: María José García" />
              </div>
              <div className="form-group">
                <label className="form-label">Cargo *</label>
                <select className="form-input form-select" value={form.cargo}
                  onChange={e => setForm(f => ({...f, cargo: e.target.value}))}>
                  {['Docente','Estudiante','Administrativo','Director'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">NIE / DUI</label>
                <input className="form-input" value={form.nie}
                  onChange={e => setForm(f => ({...f, nie: e.target.value}))}
                  placeholder="00000000-0" />
              </div>
              <div className="form-group full">
                <label className="form-label">Grado / Sección</label>
                <input className="form-input" value={form.grado}
                  onChange={e => setForm(f => ({...f, grado: e.target.value}))}
                  placeholder="Ej: 9° Bachillerato Sección A" />
              </div>
            </div>
            <div style={{ marginTop:16, display:'flex', gap:8 }}>
              <button className="btn btn-primary" style={{ flex:1 }} onClick={handleSubmit}>
                <Ic name="check" /> Registrar Usuario
              </button>
              <button className="btn btn-secondary" onClick={() => { setForm(emptyForm); setFoto(null); }}>Limpiar</button>
            </div>
          </div>
          <div className="card">
            <div className="card-title"><Ic name="camera" size={14}/> Foto de Perfil</div>
            <CameraCapture onCapture={setFoto} captured={foto} />
            {foto && (
              <div style={{ marginTop:12, padding:10, background:'var(--bg-secondary)', borderRadius:8, border:'1px solid var(--border)' }}>
                <div style={{ fontSize:11, color:'var(--success)' }}>✅ Foto capturada correctamente</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Lista de Personal ── */}
      {tab === 'list' && (
        <div className="card">
          <div className="card-title"><Ic name="users" size={14}/> Personal Registrado</div>
          {users.length === 0 ? (
            <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>👥</div>
              <div>No hay usuarios registrados aún</div>
            </div>
          ) : (
            <div style={{ maxHeight:460, overflowY:'auto' }}>
              {users.map(u => (
                <div key={u.id} className="att-item">
                  <div className="att-avatar">{u.foto ? <img src={u.foto} alt="" /> : '👤'}</div>
                  <div style={{ flex:1 }}>
                    <div className="att-name">{u.nombre}</div>
                    <div className="att-sub">{u.cargo}{u.grado ? ` • ${u.grado}` : ''}</div>
                  </div>
                  <span className="badge badge-info" style={{ marginRight:8 }}>{u.id}</span>
                  <button className="btn btn-secondary btn-sm" style={{ marginRight:4 }}
                    onClick={() => { setSelectedUser(u); setPreview(null); setTab('carnet'); }}>🪪</button>
                  <button className="btn btn-sm"
                    style={{ background:'var(--danger-glow)', color:'var(--danger)', border:'1px solid rgba(255,69,102,0.3)' }}
                    onClick={() => deleteUser(u.id)}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Carnet ── */}
      {tab === 'carnet' && (
        <div className="two-col">
          <div className="card">
            <div className="card-title">🪪 Previsualización de Carnet</div>
            {displayUser ? (
              <>
                <CarnetView user={displayUser} />
                <div style={{ display:'flex', gap:8, marginTop:16 }}>
                  <button className="btn btn-primary" style={{ flex:1 }} onClick={printCarnet}>
                    <Ic name="print" /> Imprimir / Exportar
                  </button>
                  <button className="btn btn-secondary btn-sm"
                    onClick={() => { setPreview(null); setSelectedUser(null); }}>✕</button>
                </div>
              </>
            ) : (
              <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🪪</div>
                <div>Registra o selecciona un usuario desde la lista</div>
              </div>
            )}
          </div>
          <div className="card">
            <div className="card-title">👥 Seleccionar Usuario</div>
            <div style={{ maxHeight:460, overflowY:'auto' }}>
              {users.map(u => (
                <div key={u.id} className="att-item" style={{ cursor:'pointer' }}
                  onClick={() => { setSelectedUser(u); setPreview(null); }}>
                  <div className="att-avatar">{u.foto ? <img src={u.foto} alt="" /> : '👤'}</div>
                  <div>
                    <div className="att-name">{u.nombre}</div>
                    <div className="att-sub">{u.cargo}</div>
                  </div>
                  {displayUser?.id === u.id && <span style={{ color:'var(--accent-bright)', fontSize:18 }}>✓</span>}
                </div>
              ))}
              {users.length === 0 && <div style={{ color:'var(--text-muted)', fontSize:12, textAlign:'center', padding:20 }}>Sin usuarios</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ATTENDANCE MODULE
// ══════════════════════════════════════════════════════════════
function AttendanceModule({ users, attendance, setAttendance, addNotif }) {
  const [tab,      setTab]      = useState('scanner');
  const [popup,    setPopup]    = useState(null);
  const [cooldown, setCooldown] = useState(false);
  const [qrInput,  setQrInput]  = useState('');

  const recordAttendance = useCallback((user) => {
    if (cooldown) { addNotif('⏳ Sistema en cooldown, espera 5s', 'warning'); return; }
    const today = fmtDateInput(new Date());
    const alreadyToday = attendance.find(a => a.userId === user.id && fmtDateInput(new Date(a.timestamp)) === today);
    if (alreadyToday) { addNotif(`${user.nombre} ya registró asistencia hoy`, 'warning'); return; }

    const rec     = { id: genId(), userId: user.id, timestamp: Date.now(), type:'scan' };
    const updated = [...attendance, rec];
    setAttendance(updated);
    storage.saveAttendance(updated);
    setPopup(user);
    setCooldown(true);
    setTimeout(() => { setCooldown(false); setPopup(null); }, 5100);
  }, [attendance, cooldown, setAttendance, addNotif]);

  const handleQR = () => {
    const q = qrInput.trim();
    if (!q) return;
    let id = q;
    try { const parsed = JSON.parse(q); id = parsed.id; } catch {}
    const user = users.find(u => u.id === id);
    if (user) { recordAttendance(user); setQrInput(''); }
    else addNotif('❌ Usuario no encontrado', 'danger');
  };

  const todayRecs = attendance
    .filter(a => fmtDateInput(new Date(a.timestamp)) === fmtDateInput(new Date()))
    .sort((a,b) => b.timestamp - a.timestamp);

  return (
    <div className="section-enter">
      {popup && <WelcomePopup user={popup} onClose={() => {}} />}

      <div className="tabs">
        {[
          { id:'scanner', label:'📷 Escáner Visual' },
          { id:'qr',      label:'📱 Lector QR' },
          { id:'manual',  label:'📋 Registro Manual' },
        ].map(t => (
          <button key={t.id} className={`tab${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* ── Visual Scanner ── */}
      {tab === 'scanner' && (
        <div className="two-col">
          <div className="card">
            <div className="card-title"><Ic name="scan" size={14}/> Escáner Biométrico</div>
            <div className="scanner-area">
              <div style={{ textAlign:'center', zIndex:2 }}>
                <div style={{ fontSize:48, marginBottom:12 }}>👁️</div>
                <div style={{ fontSize:13, color:'var(--text-secondary)' }}>Reconocimiento facial activo</div>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>Selecciona un usuario abajo para simular</div>
              </div>
              <div className="scanner-crosshair">
                <div className="scan-line" />
                <div className="scan-corner tl" /><div className="scan-corner tr" />
                <div className="scan-corner bl" /><div className="scan-corner br" />
              </div>
            </div>
            {cooldown && (
              <div style={{ marginTop:10, padding:10, background:'rgba(255,184,48,0.1)', border:'1px solid rgba(255,184,48,0.3)', borderRadius:8, textAlign:'center', fontSize:12, color:'var(--warning)' }}>
                ⏳ Sistema en cooldown anti-duplicado activo...
              </div>
            )}
            <div style={{ marginTop:12 }}>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:8, textTransform:'uppercase', letterSpacing:1 }}>Simular Reconocimiento:</div>
              <div className="user-scan-list">
                {users.map(u => (
                  <div key={u.id} className="user-scan-item" onClick={() => recordAttendance(u)}>
                    <div className="user-scan-avatar">{u.foto ? <img src={u.foto} alt="" /> : '👤'}</div>
                    <div>
                      <div style={{ fontWeight:600, fontSize:12, lineHeight:1.2 }}>{u.nombre.split(' ')[0]}</div>
                      <div style={{ fontSize:10, color:'var(--text-muted)' }}>{u.cargo}</div>
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <div style={{ color:'var(--text-muted)', fontSize:12, gridColumn:'1/-1', textAlign:'center', padding:16 }}>
                    Registra usuarios primero
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-title">📋 Registros de Hoy ({todayRecs.length})</div>
            {todayRecs.length === 0 ? (
              <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>Sin registros hoy</div>
            ) : (
              <div style={{ maxHeight:420, overflowY:'auto' }}>
                {todayRecs.map(a => {
                  const u  = users.find(x => x.id === a.userId);
                  if (!u) return null;
                  const st = getStatus(a.timestamp);
                  return (
                    <div key={a.id} className="att-item">
                      <div className="att-avatar">{u.foto ? <img src={u.foto} alt="" /> : '👤'}</div>
                      <div style={{ flex:1 }}>
                        <div className="att-name">{u.nombre}</div>
                        <div className="att-sub">{u.cargo}</div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div className="att-time">{fmtTime(a.timestamp)}</div>
                        <span className={`badge ${st==='late'?'badge-warning':'badge-success'}`} style={{ fontSize:9 }}>
                          {st==='late' ? 'Retardo' : 'A tiempo'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── QR Scanner ── */}
      {tab === 'qr' && (
        <div className="two-col">
          <div className="card">
            <div className="card-title"><Ic name="qr" size={14}/> Lectura de Código QR</div>
            <div className="scanner-area" style={{ height:220 }}>
              <div style={{ textAlign:'center', zIndex:2 }}>
                <div style={{ fontSize:48, marginBottom:12 }}>📱</div>
                <div style={{ fontSize:13, color:'var(--text-secondary)' }}>Apunta la cámara al código QR del carnet</div>
              </div>
              <div className="scanner-crosshair">
                <div className="scan-corner tl" /><div className="scan-corner tr" />
                <div className="scan-corner bl" /><div className="scan-corner br" />
              </div>
            </div>
            <div style={{ marginTop:12 }}>
              <div className="form-label" style={{ marginBottom:6 }}>Ingresa ID del usuario manualmente:</div>
              <div style={{ display:'flex', gap:8 }}>
                <input className="form-input" style={{ flex:1 }} value={qrInput}
                  onChange={e => setQrInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleQR()}
                  placeholder="ID del usuario (ej: AB123CD)" />
                <button className="btn btn-primary" onClick={handleQR}><Ic name="check" /></button>
              </div>
              <div style={{ marginTop:12 }}>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:8 }}>Acceso rápido por usuario:</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {users.map(u => (
                    <button key={u.id} className="btn btn-secondary btn-sm" onClick={() => recordAttendance(u)}>
                      {u.nombre.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-title">📋 Historial Reciente</div>
            {[...attendance].sort((a,b) => b.timestamp-a.timestamp).slice(0,10).map(a => {
              const u = users.find(x => x.id === a.userId);
              if (!u) return null;
              return (
                <div key={a.id} className="att-item" style={{ marginBottom:6 }}>
                  <div className="att-avatar">{u.foto ? <img src={u.foto} alt="" /> : '👤'}</div>
                  <div style={{ flex:1 }}>
                    <div className="att-name" style={{ fontSize:12 }}>{u.nombre}</div>
                    <div className="att-sub">{fmtDate(a.timestamp)}</div>
                  </div>
                  <div className="att-time">{fmtTime(a.timestamp)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Manual ── */}
      {tab === 'manual' && (
        <div className="card">
          <div className="card-title">📋 Registro Manual de Asistencia</div>
          <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:16 }}>
            Marca la asistencia de cada persona individualmente.
          </div>
          {users.length === 0 ? (
            <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>
              Registra usuarios primero en el módulo de Registro Maestro
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:8 }}>
              {users.map(u => {
                const today = fmtDateInput(new Date());
                const done  = attendance.some(a => a.userId === u.id && fmtDateInput(new Date(a.timestamp)) === today);
                return (
                  <div key={u.id} style={{
                    background: 'var(--bg-secondary)',
                    border: `1px solid ${done ? 'var(--success)' : 'var(--border)'}`,
                    borderRadius: 8, padding: 12,
                    display: 'flex', alignItems: 'center', gap: 10,
                    opacity: done ? 0.7 : 1,
                  }}>
                    <div className="att-avatar">{u.foto ? <img src={u.foto} alt="" /> : '👤'}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:600 }}>{u.nombre.split(' ').slice(0,2).join(' ')}</div>
                      <div style={{ fontSize:10, color:'var(--text-muted)' }}>{u.cargo}</div>
                    </div>
                    {done
                      ? <span style={{ color:'var(--success)', fontSize:18 }}>✅</span>
                      : <button className="btn btn-success btn-sm" onClick={() => recordAttendance(u)} disabled={cooldown}>✓</button>
                    }
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// REPORTS MODULE
// ══════════════════════════════════════════════════════════════
function ReportsModule({ users, attendance }) {
  const [filters, setFilters] = useState({ dateFrom:'', dateTo:'', cargo:'', grado:'' });
  const today = fmtDateInput(new Date());

  const filtered = attendance.filter(a => {
    const d = fmtDateInput(new Date(a.timestamp));
    const u = users.find(x => x.id === a.userId);
    if (!u) return false;
    if (filters.dateFrom && d < filters.dateFrom) return false;
    if (filters.dateTo   && d > filters.dateTo)   return false;
    if (filters.cargo    && u.cargo !== filters.cargo) return false;
    if (filters.grado    && !u.grado?.toLowerCase().includes(filters.grado.toLowerCase())) return false;
    return true;
  }).sort((a,b) => b.timestamp - a.timestamp);

  const exportCSV = () => {
    const headers = ['ID Registro','Nombre','Cargo','Grado','NIE/DUI','Fecha','Hora','Estado'];
    const rows = filtered.map(a => {
      const u = users.find(x => x.id === a.userId) || {};
      return [a.id, u.nombre||'', u.cargo||'', u.grado||'', u.nie||'',
              fmtDate(a.timestamp), fmtTime(a.timestamp),
              getStatus(a.timestamp)==='late' ? 'Retardo' : 'A tiempo'];
    });
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type:'text/csv;charset=utf-8' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `asistencia_${today}.csv`;
    a.click();
  };

  const todayCount = attendance.filter(a => fmtDateInput(new Date(a.timestamp)) === today).length;
  const lateCount  = attendance.filter(a => fmtDateInput(new Date(a.timestamp)) === today && getStatus(a.timestamp) === 'late').length;
  const absent     = Math.max(0, users.length - new Set(attendance.filter(a => fmtDateInput(new Date(a.timestamp)) === today).map(a => a.userId)).size);

  return (
    <div className="section-enter">
      {/* Quick stats */}
      <div className="stats-grid" style={{ marginBottom:16 }}>
        {[
          { label:'Total Filtrados',   value: filtered.length, color:'var(--accent-bright)' },
          { label:'Asistencias Hoy',   value: todayCount,      color:'var(--success)' },
          { label:'Retardos Hoy',      value: lateCount,       color:'var(--warning)' },
          { label:'Ausentes Hoy',      value: absent,          color:'var(--danger)' },
        ].map((s,i) => (
          <div key={i} className="stat-card">
            <div className="stat-value" style={{ fontSize:22, color:s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters + Table */}
      <div className="card">
        <div className="card-title" style={{ marginBottom:12 }}><Ic name="filter" size={14}/> Filtros Avanzados</div>
        <div className="filter-bar">
          <div className="form-group" style={{ flex:'0 0 150px' }}>
            <label className="form-label">Desde</label>
            <input type="date" className="form-input" value={filters.dateFrom}
              onChange={e => setFilters(f => ({...f, dateFrom: e.target.value}))} />
          </div>
          <div className="form-group" style={{ flex:'0 0 150px' }}>
            <label className="form-label">Hasta</label>
            <input type="date" className="form-input" value={filters.dateTo}
              onChange={e => setFilters(f => ({...f, dateTo: e.target.value}))} />
          </div>
          <div className="form-group" style={{ flex:'0 0 140px' }}>
            <label className="form-label">Cargo</label>
            <select className="form-input form-select" value={filters.cargo}
              onChange={e => setFilters(f => ({...f, cargo: e.target.value}))}>
              <option value="">Todos</option>
              {['Docente','Estudiante','Administrativo','Director'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex:'1 1 140px' }}>
            <label className="form-label">Grado / Sección</label>
            <input className="form-input" value={filters.grado}
              onChange={e => setFilters(f => ({...f, grado: e.target.value}))}
              placeholder="Buscar grado..." />
          </div>
          <div className="form-group" style={{ justifyContent:'flex-end' }}>
            <label className="form-label">&nbsp;</label>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-primary btn-sm" onClick={exportCSV}>
                <Ic name="export" size={13} /> Exportar CSV
              </button>
              <button className="btn btn-secondary btn-sm"
                onClick={() => setFilters({ dateFrom:'', dateTo:'', cargo:'', grado:'' })}>✕ Limpiar</button>
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th><th>Foto</th><th>Nombre</th><th>Cargo</th>
                <th>Grado</th><th>NIE/DUI</th><th>Fecha</th><th>Hora</th><th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="9" style={{ textAlign:'center', color:'var(--text-muted)', padding:32 }}>
                  Sin registros con los filtros aplicados
                </td></tr>
              ) : filtered.map((a, i) => {
                const u    = users.find(x => x.id === a.userId);
                if (!u) return null;
                const late = getStatus(a.timestamp) === 'late';
                return (
                  <tr key={a.id}>
                    <td style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'var(--text-muted)' }}>{i+1}</td>
                    <td><div className="att-avatar" style={{ width:28, height:28 }}>{u.foto ? <img src={u.foto} alt="" /> : '👤'}</div></td>
                    <td style={{ fontWeight:600 }}>{u.nombre}</td>
                    <td><span className="badge badge-info">{u.cargo}</span></td>
                    <td style={{ color:'var(--text-secondary)' }}>{u.grado || '—'}</td>
                    <td style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11 }}>{u.nie || '—'}</td>
                    <td style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11 }}>{fmtDate(a.timestamp)}</td>
                    <td style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'var(--accent-bright)' }}>{fmtTime(a.timestamp)}</td>
                    <td><span className={`badge ${late ? 'badge-warning' : 'badge-success'}`}>{late ? 'Retardo' : 'A tiempo'}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div style={{ marginTop:10, fontSize:11, color:'var(--text-muted)', textAlign:'right' }}>
            {filtered.length} registros encontrados
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════════
function App() {
  const [module,     setModule]     = useState('dashboard');
  const [users,      setUsers]      = useState(storage.getUsers);
  const [attendance, setAttendance] = useState(storage.getAttendance);
  const { notifs, add: addNotif }   = useNotifs();

  const navItems = [
    { id:'dashboard', label:'Dashboard',       icon:'dashboard', section:'Principal' },
    { id:'register',  label:'Registro Maestro', icon:'register',  section:'Módulos' },
    { id:'attendance',label:'Asistencia',       icon:'attendance',section:'Módulos' },
    { id:'reports',   label:'Reportes',         icon:'reports',   section:'Análisis' },
  ];
  const sections = [...new Set(navItems.map(n => n.section))];
  const titles   = {
    dashboard:  'Panel de Control',
    register:   'Registro Maestro',
    attendance: 'Control de Asistencia',
    reports:    'Reportes y Auditoría',
  };

  return (
    <div className="app-shell">
      {/* Notifications */}
      <div className="notif">
        {notifs.map(n => (
          <div key={n.id} className="notif-item">
            <div className="notif-dot" style={{
              background: n.type==='success' ? 'var(--success)' : n.type==='warning' ? 'var(--warning)' : 'var(--danger)'
            }} />
            {n.msg}
          </div>
        ))}
      </div>

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">🛡️</div>
          <div className="logo-title">BioSmart</div>
          <div className="logo-sub">Control de Asistencia v2.0</div>
        </div>
        <nav className="sidebar-nav">
          {sections.map(sec => (
            <div key={sec} className="nav-section">
              <div className="nav-section-label">{sec}</div>
              {navItems.filter(n => n.section === sec).map(n => (
                <div key={n.id} className={`nav-item${module===n.id?' active':''}`} onClick={() => setModule(n.id)}>
                  <span className="nav-icon"><Ic name={n.icon} size={18} /></span>
                  <span>{n.label}</span>
                </div>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <Clock />
          <div style={{ marginTop:8, fontSize:10, color:'var(--text-muted)', textAlign:'center' }}>
            {users.length} usuarios • {attendance.length} registros
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="main-content">
        <div className="topbar">
          <div>
            <div className="topbar-title">{titles[module]}</div>
          </div>
          <span className="topbar-badge">BioSmart 2.0</span>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
            <div className="status-text">Sistema Operativo</div>
            <div className="status-dot" />
          </div>
        </div>
        <div className="content-area">
          {module === 'dashboard'  && <Dashboard   users={users} attendance={attendance} />}
          {module === 'register'   && <RegisterModule users={users} setUsers={setUsers} addNotif={addNotif} />}
          {module === 'attendance' && <AttendanceModule users={users} attendance={attendance} setAttendance={setAttendance} addNotif={addNotif} />}
          {module === 'reports'    && <ReportsModule users={users} attendance={attendance} />}
        </div>
      </div>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
