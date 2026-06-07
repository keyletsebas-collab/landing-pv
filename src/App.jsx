import React, { useState, useEffect } from 'react';
import { supabase, supabaseAdmin } from './utils/supabaseClient';
import {
  Shield, Users, Trash2, Search, UserCheck, UserX, ShieldCheck,
  RefreshCw, Eye, EyeOff, KeyRound, Check, X, Loader2, AlertTriangle
} from 'lucide-react';

const ADMIN_READY = !!supabaseAdmin;


function App() {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [search, setSearch]         = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [showPasswords, setShowPasswords] = useState(false);

  // Password change modal state
  const [pwdModal, setPwdModal]     = useState(null); // { id, name, currentRef }
  const [newPwd, setNewPwd]         = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError]     = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('role', { ascending: false });
    if (error) {
      setError(error.message + ' | code: ' + error.code);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const toggleAdmin = async (userId, currentRole, currentStatus) => {
    setActionLoading(userId);
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const { error } = await supabase.rpc('update_profile_by_admin', {
      user_to_update: userId, new_role: newRole, new_status: currentStatus
    });
    if (error) alert('Error rol: ' + error.message);
    else await fetchUsers();
    setActionLoading(null);
  };

  const toggleStatus = async (userId, currentRole, currentStatus) => {
    setActionLoading(userId);
    const newStatus = currentStatus === 'inactive' ? 'active' : 'inactive';
    const { error } = await supabase.rpc('update_profile_by_admin', {
      user_to_update: userId, new_role: currentRole, new_status: newStatus
    });
    if (error) alert('Error estado: ' + error.message);
    else await fetchUsers();
    setActionLoading(null);
  };

  const deleteUser = async (userId, name) => {
    if (!confirm(`¿Eliminar permanentemente a "${name}"? No se puede deshacer.`)) return;
    setActionLoading(userId);
    const { error } = await supabase.rpc('delete_user_by_admin', { user_to_delete: userId });
    if (error) alert('Error eliminando: ' + error.message);
    else await fetchUsers();
    setActionLoading(null);
  };

  // ── Change password ─────────────────────────────────────────────────────
  const openPwdModal = (u) => {
    setPwdModal({ id: u.id, name: u.full_name || u.username, currentRef: u.password_ref || '' });
    setNewPwd('');
    setPwdError('');
    setPwdSuccess('');
  };

  const changePassword = async () => {
    if (!ADMIN_READY) {
      setPwdError('Service key no configurada. Agrega VITE_SUPABASE_SERVICE_KEY en Vercel.');
      return;
    }
    if (!newPwd || newPwd.length < 6) {
      setPwdError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setPwdLoading(true);
    setPwdError('');
    setPwdSuccess('');

    try {
      // 1. Change actual Supabase Auth password
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        pwdModal.id,
        { password: newPwd }
      );
      if (authError) throw new Error('Auth: ' + authError.message);

      // 2. Save reference in profiles table
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ password_ref: newPwd })
        .eq('id', pwdModal.id);
      if (dbError) throw new Error('DB: ' + dbError.message);

      setPwdSuccess(`✅ Contraseña de ${pwdModal.name} actualizada correctamente.`);
      await fetchUsers();
    } catch (err) {
      setPwdError(err.message);
    }
    setPwdLoading(false);
  };

  const filtered = users.filter(u =>
    (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.username || '').toLowerCase().includes(search.toLowerCase())
  );

  const total = users.length;
  const admins = users.filter(u => u.role === 'admin').length;
  const active = users.filter(u => u.status !== 'inactive').length;
  const inactive = users.filter(u => u.status === 'inactive').length;

  return (
    <div className="app-container animate">

      {/* ── Password change modal ── */}
      {pwdModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)',
          backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 999, padding: '1.5rem'
        }}>
          <div className="glass-heavy" style={{ width: '100%', maxWidth: '440px', padding: '2rem', borderRadius: '16px', animation: 'slideUp .25s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem' }}>
                <div style={{ padding: '8px', background: 'rgba(212,175,55,.15)', borderRadius: '10px' }}>
                  <KeyRound size={20} color="var(--accent)" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>Cambiar Contraseña</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>{pwdModal.name}</div>
                </div>
              </div>
              <button onClick={() => setPwdModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            {pwdModal.currentRef && (
              <div style={{ marginBottom: '1.2rem', padding: '.8rem 1rem', background: 'rgba(255,255,255,.04)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.3rem' }}>Contraseña actual (referencia)</div>
                <div style={{ fontFamily: 'monospace', fontSize: '.95rem', color: 'var(--accent)', letterSpacing: showPasswords ? 0 : '.12em' }}>
                  {showPasswords ? pwdModal.currentRef : '•'.repeat(Math.min(pwdModal.currentRef.length, 12))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '1.2rem' }}>
              <div style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '.5rem' }}>
                Nueva contraseña
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={newPwd}
                  onChange={e => setNewPwd(e.target.value)}
                  placeholder="Mínimo 6 caracteres..."
                  onKeyDown={e => e.key === 'Enter' && changePassword()}
                  autoFocus
                  style={{ paddingRight: '2.5rem' }}
                />
                <button onClick={() => setShowPasswords(!showPasswords)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                  {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {pwdError && (
              <div style={{ marginBottom: '1rem', padding: '.7rem 1rem', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: '8px', fontSize: '.82rem', color: '#f87171' }}>
                ⚠️ {pwdError}
              </div>
            )}
            {pwdSuccess && (
              <div style={{ marginBottom: '1rem', padding: '.7rem 1rem', background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.3)', borderRadius: '8px', fontSize: '.82rem', color: '#4ade80' }}>
                {pwdSuccess}
              </div>
            )}

            <div style={{ display: 'flex', gap: '.8rem' }}>
              <button onClick={changePassword} disabled={pwdLoading} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                {pwdLoading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Cambiando...</> : <><Check size={16} /> Cambiar Contraseña</>}
              </button>
              <button onClick={() => setPwdModal(null)} className="btn-ghost" style={{ padding: '.75rem 1rem' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service key warning banner */}
      {!ADMIN_READY && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem 1.4rem', display: 'flex', alignItems: 'center', gap: '1rem',
          background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.3)', borderRadius: '12px' }}>
          <AlertTriangle size={18} color="#fbbf24" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '.85rem' }}>
            <span style={{ fontWeight: 700, color: '#fbbf24' }}>Cambio de contraseñas desactivado — </span>
            <span style={{ color: 'var(--text-muted)' }}>Agrega </span>
            <code style={{ background: 'rgba(255,255,255,.08)', padding: '1px 6px', borderRadius: '4px', fontSize: '.8rem', color: '#f0ebe2' }}>VITE_SUPABASE_SERVICE_KEY</code>
            <span style={{ color: 'var(--text-muted)' }}> en Vercel → Settings → Environment Variables y redeploya.</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
        <div style={{ padding: '10px', background: 'var(--accent)', borderRadius: '12px', color: '#000' }}>
          <ShieldCheck size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1.1 }}>Gestión de Cuentas</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Verbo Eterno · Panel Administrativo</p>
        </div>
      </header>

      {/* Stats */}
      <section className="stats-grid">
        {[
          { icon: <Users size={24}/>, value: total,    label: 'Cuentas Totales',  bg: 'rgba(212,175,55,.1)', color: 'var(--accent)' },
          { icon: <Shield size={24}/>, value: admins,  label: 'Administradores',  bg: 'rgba(59,130,246,.1)', color: '#3b82f6' },
          { icon: <UserCheck size={24}/>, value: active, label: 'Activas',        bg: 'rgba(34,197,94,.1)',  color: '#22c55e' },
          { icon: <UserX size={24}/>, value: inactive, label: 'Inhabilitadas',    bg: 'rgba(239,68,68,.1)', color: '#ef4444' },
        ].map((s, i) => (
          <div key={i} className="glass stat-card">
            <div className="stat-icon-container" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </section>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '.8rem', padding: '.6rem 1.2rem', flex: 1, minWidth: '280px' }}>
          <Search size={18} color="var(--text-muted)" />
          <input placeholder="Buscar por nombre o correo..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-main)', width: '100%', fontSize: '.95rem' }} />
        </div>
        <button onClick={() => setShowPasswords(!showPasswords)} className="btn-ghost" style={{
          padding: '.8rem 1.2rem',
          color: showPasswords ? 'var(--accent)' : 'var(--text-muted)',
          borderColor: showPasswords ? 'rgba(212,175,55,.4)' : 'var(--border)',
          background: showPasswords ? 'rgba(212,175,55,.08)' : 'var(--glass)'
        }}>
          {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
          <span>{showPasswords ? 'Ocultar' : 'Ver'} contraseñas</span>
        </button>
        <button onClick={fetchUsers} disabled={loading} className="btn-ghost" style={{ padding: '.8rem 1.2rem' }}>
          <RefreshCw size={16} /> <span>Actualizar</span>
        </button>
      </div>

      {/* Table */}
      <div className="glass" style={{ padding: '1.5rem', overflowX: 'auto', minHeight: '40vh' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', gap: '1rem' }}>
            <div className="spinner" style={{ width: '30px', height: '30px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '.9rem' }}>Cargando...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <p style={{ color: '#ef4444', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1rem' }}>⚠️ Error de Conexión</p>
            <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.3)', borderRadius: '12px', padding: '1.5rem', maxWidth: '700px', margin: '0 auto', textAlign: 'left', fontSize: '.85rem', fontFamily: 'monospace', color: '#f87171', lineHeight: '1.6', wordBreak: 'break-all' }}>
              {error}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-muted)' }}>No se encontraron usuarios.</div>
        ) : (
          <div style={{ minWidth: '960px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', fontSize: '.82rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  <th style={{ padding: '1rem' }}>Miembro</th>
                  <th style={{ padding: '1rem' }}>Email</th>
                  <th style={{ padding: '1rem' }}>Contraseña</th>
                  <th style={{ padding: '1rem' }}>Estado</th>
                  <th style={{ padding: '1rem' }}>Rol</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="table-row" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1.1rem 1rem', fontWeight: 600, color: 'var(--text-main)' }}>{u.full_name || 'Sin nombre'}</td>
                    <td style={{ padding: '1.1rem 1rem', color: 'var(--text-muted)', fontSize: '.88rem' }}>{u.username}</td>

                    {/* Password cell */}
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                        <span style={{
                          fontFamily: 'monospace', fontSize: '.9rem', minWidth: '110px', display: 'inline-block',
                          color: u.password_ref ? 'var(--text-main)' : 'var(--text-muted)',
                          letterSpacing: (!showPasswords && u.password_ref) ? '.1em' : 0
                        }}>
                          {u.password_ref
                            ? (showPasswords ? u.password_ref : '•'.repeat(Math.min(u.password_ref.length, 12)))
                            : <span style={{ fontSize: '.75rem', fontStyle: 'italic', letterSpacing: 0, color: 'var(--text-muted)' }}>Sin registrar</span>
                          }
                        </span>
                        <button onClick={() => ADMIN_READY && openPwdModal(u)}
                          title={ADMIN_READY ? 'Cambiar contraseña' : 'Configura VITE_SUPABASE_SERVICE_KEY en Vercel'}
                          style={{ padding: '.32rem .5rem', borderRadius: '7px',
                            background: ADMIN_READY ? 'rgba(212,175,55,.08)' : 'rgba(255,255,255,.03)',
                            border: ADMIN_READY ? '1px solid rgba(212,175,55,.2)' : '1px solid var(--border)',
                            color: ADMIN_READY ? 'var(--accent)' : 'var(--text-muted)',
                            cursor: ADMIN_READY ? 'pointer' : 'not-allowed',
                            display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.72rem', fontWeight: 600,
                            transition: 'all .2s', whiteSpace: 'nowrap', opacity: ADMIN_READY ? 1 : 0.45 }}
                          onMouseEnter={e => ADMIN_READY && (e.currentTarget.style.background = 'rgba(212,175,55,.18)')}
                          onMouseLeave={e => ADMIN_READY && (e.currentTarget.style.background = 'rgba(212,175,55,.08)')}>
                          <KeyRound size={12} /> Cambiar
                        </button>
                      </div>
                    </td>

                    <td style={{ padding: '1.1rem 1rem' }}>
                      <span style={{ padding: '3px 9px', borderRadius: '10px', fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase',
                        background: u.status === 'inactive' ? 'rgba(239,68,68,.15)' : 'rgba(34,197,94,.15)',
                        color: u.status === 'inactive' ? '#f87171' : '#4ade80' }}>
                        {u.status === 'inactive' ? 'Inactivo' : 'Activo'}
                      </span>
                    </td>
                    <td style={{ padding: '1.1rem 1rem' }}>
                      <span style={{ padding: '3px 9px', borderRadius: '10px', fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase',
                        background: u.role === 'admin' ? 'rgba(212,175,55,.15)' : 'rgba(255,255,255,.05)',
                        color: u.role === 'admin' ? 'var(--accent)' : 'var(--text-muted)' }}>
                        {u.role === 'admin' ? 'Admin' : 'Usuario'}
                      </span>
                    </td>
                    <td style={{ padding: '1.1rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '.4rem', alignItems: 'center' }}>
                        <button disabled={actionLoading === u.id} onClick={() => toggleAdmin(u.id, u.role, u.status)}
                          className="btn-ghost" style={{ padding: '.35rem .75rem', fontSize: '.78rem' }}>
                          {actionLoading === u.id ? '...' : u.role === 'admin' ? 'Degradar' : 'Hacer Admin'}
                        </button>
                        <button disabled={actionLoading === u.id} onClick={() => toggleStatus(u.id, u.role, u.status)}
                          className="btn-ghost" style={{ padding: '.35rem .75rem', fontSize: '.78rem',
                            color: u.status === 'inactive' ? '#4ade80' : '#ff9800' }}>
                          {actionLoading === u.id ? '...' : u.status === 'inactive' ? 'Habilitar' : 'Inhabilitar'}
                        </button>
                        <button disabled={actionLoading === u.id} onClick={() => deleteUser(u.id, u.full_name || u.username)}
                          className="btn-ghost" style={{ padding: '.35rem .55rem', color: '#ef4444',
                            border: '1px solid rgba(239,68,68,.2)', background: 'rgba(239,68,68,.05)' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .table-row:hover { background: rgba(255,255,255,.02); }
        @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default App;
