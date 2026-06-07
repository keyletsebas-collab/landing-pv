import React, { useState, useEffect } from 'react';
import { supabase } from './utils/supabaseClient';
import { Shield, Users, Trash2, Search, UserCheck, UserX, ShieldCheck, RefreshCw } from 'lucide-react';

function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('profiles').select('*').order('role', { ascending: false });
    if (error) {
      setError(error.message + ' | code: ' + error.code + ' | details: ' + JSON.stringify(error.details));
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
          { icon: <Users size={24}/>, value: total, label: 'Cuentas Totales', bg: 'rgba(212,175,55,.1)', color: 'var(--accent)' },
          { icon: <Shield size={24}/>, value: admins, label: 'Administradores', bg: 'rgba(59,130,246,.1)', color: '#3b82f6' },
          { icon: <UserCheck size={24}/>, value: active, label: 'Activas', bg: 'rgba(34,197,94,.1)', color: '#22c55e' },
          { icon: <UserX size={24}/>, value: inactive, label: 'Inhabilitadas', bg: 'rgba(239,68,68,.1)', color: '#ef4444' },
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
            <div style={{ marginTop: '1.5rem', fontSize: '.8rem', color: 'var(--text-muted)' }}>
              <p>URL: <strong style={{ color: '#fff' }}>{import.meta.env.VITE_SUPABASE_URL || 'NO CONFIGURADA'}</strong></p>
              <p style={{ marginTop: '.3rem' }}>KEY: <strong style={{ color: '#fff' }}>{import.meta.env.VITE_SUPABASE_ANON_KEY ? `SÍ (${import.meta.env.VITE_SUPABASE_ANON_KEY.length} chars)` : 'NO CONFIGURADA'}</strong></p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-muted)' }}>No se encontraron usuarios.</div>
        ) : (
          <div style={{ minWidth: '860px' }}>
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
                    <td style={{ padding: '1.1rem 1rem', fontWeight: 600 }}>{u.full_name || 'Sin nombre'}</td>
                    <td style={{ padding: '1.1rem 1rem', color: 'var(--text-muted)', fontSize: '.9rem' }}>{u.username}</td>
                    <td style={{ padding: '1.1rem 1rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      ••••••••
                      <span style={{ display: 'block', fontSize: '.6rem', color: 'var(--accent)', opacity: .7 }}>Bcrypt</span>
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
                          className="btn-ghost" style={{ padding: '.35rem .75rem', fontSize: '.78rem', color: u.status === 'inactive' ? '#4ade80' : '#ff9800' }}>
                          {actionLoading === u.id ? '...' : u.status === 'inactive' ? 'Habilitar' : 'Inhabilitar'}
                        </button>
                        <button disabled={actionLoading === u.id} onClick={() => deleteUser(u.id, u.full_name || u.username)}
                          className="btn-ghost" style={{ padding: '.35rem .55rem', color: '#ef4444', border: '1px solid rgba(239,68,68,.2)', background: 'rgba(239,68,68,.05)' }}>
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

      <style>{`.table-row:hover { background: rgba(255,255,255,.02); }`}</style>
    </div>
  );
}

export default App;
