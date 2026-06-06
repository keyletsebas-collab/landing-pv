import React, { useState, useEffect } from 'react';
import { supabase } from './utils/supabaseClient';
import { 
  Shield, 
  Users, 
  Trash2, 
  Search, 
  KeyRound, 
  Mail, 
  UserCheck, 
  UserX, 
  User,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

function App() {
  const [users, setUsers] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoadingList(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: false });
      
      if (error) throw error;
      if (data) setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || JSON.stringify(err));
    } finally {
      setLoadingList(false);
    }
  };

  const toggleAdmin = async (userId, currentRole, currentStatus) => {
    setActionLoading(userId);
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const { error } = await supabase.rpc('update_profile_by_admin', {
        user_to_update: userId,
        new_role: newRole,
        new_status: currentStatus
      });
      
      if (error) {
        if (error.message?.includes('does not exist')) {
          throw new Error(
            'La función RPC "update_profile_by_admin" no existe en Supabase.\n\n' +
            'Por favor, asegúrate de ejecutar el código del archivo "user_deletion_setup.sql" en tu consola de Supabase.'
          );
        }
        throw error;
      }
      await fetchUsers();
    } catch (err) {
      alert('Error al actualizar el rol: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleUserStatus = async (userId, currentRole, currentStatus) => {
    setActionLoading(userId);
    const newStatus = currentStatus === 'inactive' ? 'active' : 'inactive';
    try {
      const { error } = await supabase.rpc('update_profile_by_admin', {
        user_to_update: userId,
        new_role: currentRole,
        new_status: newStatus
      });
      
      if (error) {
        if (error.message?.includes('does not exist')) {
          throw new Error(
            'La función RPC "update_profile_by_admin" no existe en Supabase.\n\n' +
            'Por favor, asegúrate de ejecutar el código del archivo "user_deletion_setup.sql" en tu consola de Supabase.'
          );
        }
        throw error;
      }
      await fetchUsers();
    } catch (err) {
      alert('Error al actualizar el estado: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    const confirmation = confirm(
      `¿Estás seguro de que deseas eliminar permanentemente a "${userName || 'este usuario'}"?\n\n` +
      `Esta acción borrará su cuenta en auth.users y su perfil asociado. No se puede deshacer.`
    );
    if (!confirmation) return;

    setActionLoading(userId);
    try {
      const { error } = await supabase.rpc('delete_user_by_admin', { user_to_delete: userId });
      if (error) {
        if (error.message?.includes('does not exist')) {
          throw new Error(
            'La función RPC "delete_user_by_admin" no existe en Supabase.\n\n' +
            'Por favor, asegúrate de ejecutar el código del archivo "user_deletion_setup.sql" en tu consola de Supabase.'
          );
        }
        throw error;
      }
      await fetchUsers();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase())
  );

  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const activeCount = users.filter(u => u.status !== 'inactive').length;
  const inactiveCount = users.filter(u => u.status === 'inactive').length;

  return (
    <div className="app-container animate">
      {/* Top Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '3rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '10px', background: 'var(--accent)', borderRadius: '12px', color: '#000' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>Gestión de Cuentas</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.2rem' }}>Verbo Eterno • Panel Administrativo Directo</p>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <section className="stats-grid">
        <div className="glass stat-card">
          <div className="stat-icon-container" style={{ background: 'rgba(212, 175, 55, 0.1)', color: 'var(--accent)' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="stat-value">{totalUsers}</div>
            <div className="stat-label">Cuentas Totales</div>
          </div>
        </div>

        <div className="glass stat-card">
          <div className="stat-icon-container" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <Shield size={24} />
          </div>
          <div>
            <div className="stat-value">{adminCount}</div>
            <div className="stat-label">Administradores</div>
          </div>
        </div>

        <div className="glass stat-card">
          <div className="stat-icon-container" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
            <UserCheck size={24} />
          </div>
          <div>
            <div className="stat-value">{activeCount}</div>
            <div className="stat-label">Cuentas Activas</div>
          </div>
        </div>

        <div className="glass stat-card">
          <div className="stat-icon-container" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <UserX size={24} />
          </div>
          <div>
            <div className="stat-value">{inactiveCount}</div>
            <div className="stat-label">Inhabilitadas</div>
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.6rem 1.2rem', flex: 1, minWidth: '280px' }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            placeholder="Buscar por nombre o correo electrónico..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-main)', width: '100%', fontSize: '0.95rem' }}
          />
        </div>
        <button 
          onClick={fetchUsers} 
          className="btn-ghost" 
          disabled={loadingList} 
          style={{ padding: '0.8rem 1.2rem' }}
          title="Recargar lista"
        >
          <RefreshCw size={16} className={loadingList ? 'spinner-sm' : ''} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="glass" style={{ padding: '1.5rem', overflowX: 'auto', minHeight: '40vh' }}>
        {loadingList ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', gap: '1rem' }}>
            <div className="spinner" style={{ width: '30px', height: '30px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Obteniendo base de datos...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#ef4444' }}>
            <p style={{ fontWeight: 600, fontSize: '1.25rem', marginBottom: '1rem' }}>⚠️ Error de Conexión con la Base de Datos</p>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 1.5rem auto', lineHeight: '1.6' }}>
              Detalle del error: <strong>{error}</strong>
            </p>

            <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
              <div className="glass-heavy" style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                VITE_SUPABASE_URL detectado: <strong style={{ color: '#fff' }}>{import.meta.env.VITE_SUPABASE_URL || 'VACÍO (No detectado)'}</strong>
              </div>
              <div className="glass-heavy" style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                VITE_SUPABASE_ANON_KEY detectado: <strong style={{ color: '#fff' }}>{import.meta.env.VITE_SUPABASE_ANON_KEY ? `SÍ (Longitud: ${import.meta.env.VITE_SUPABASE_ANON_KEY.length} caracteres)` : 'VACÍO (No detectado)'}</strong>
              </div>
            </div>

            <div className="glass-heavy" style={{ display: 'inline-block', padding: '1.5rem', borderRadius: '16px', textAlign: 'left', fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '500px' }}>
              <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Posibles soluciones:</p>
              <ul style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <li>Asegúrate de haber configurado <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> en tu panel de Vercel.</li>
                <li>Verifica que hayas realizado un <strong>Redeploy</strong> de la landing en Vercel después de guardar las variables.</li>
                <li>Si estás en local, comprueba que el archivo <code>.env</code> exista en esta carpeta y tenga las llaves correctas.</li>
              </ul>
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-muted)' }}>
            No se encontraron usuarios en el sistema.
          </div>
        ) : (
          <div style={{ minWidth: '900px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '1rem' }}>Miembro</th>
                  <th style={{ padding: '1rem' }}>Email / Usuario</th>
                  <th style={{ padding: '1rem' }}>Contraseña</th>
                  <th style={{ padding: '1rem' }}>Estado</th>
                  <th style={{ padding: '1rem' }}>Rol</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id} className="table-row" style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.2s' }}>
                    <td style={{ padding: '1.2rem 1rem', fontWeight: 600 }}>{u.full_name || 'Sin nombre'}</td>
                    <td style={{ padding: '1.2rem 1rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>{u.username}</td>
                    <td style={{ padding: '1.2rem 1rem' }}>
                      <div style={{ display: 'inline-flex', flexDirection: 'column' }}>
                        <span style={{ fontFamily: 'monospace', letterSpacing: '0.1em', fontSize: '0.95rem', color: 'var(--text-muted)' }}>••••••••</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--accent)', marginTop: '2px', opacity: 0.8 }}>Bcrypt Hash (Supabase)</span>
                      </div>
                    </td>
                    <td style={{ padding: '1.2rem 1rem' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700,
                        background: u.status === 'inactive' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                        color: u.status === 'inactive' ? '#f87171' : '#4ade80',
                        textTransform: 'uppercase', letterSpacing: '0.03em'
                      }}>{u.status === 'inactive' ? 'Inactivo' : 'Activo'}</span>
                    </td>
                    <td style={{ padding: '1.2rem 1rem' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700,
                        background: u.role === 'admin' ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255,255,255,0.05)',
                        color: u.role === 'admin' ? 'var(--accent)' : 'var(--text-muted)',
                        textTransform: 'uppercase', letterSpacing: '0.03em'
                      }}>{u.role === 'admin' ? 'Admin' : 'Usuario'}</span>
                    </td>
                    <td style={{ padding: '1.2rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
                        {/* Toggle Admin */}
                        <button 
                          disabled={actionLoading === u.id}
                          onClick={() => toggleAdmin(u.id, u.role, u.status)}
                          className="btn-ghost"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                        >
                          {actionLoading === u.id ? '...' : (u.role === 'admin' ? 'Degradar' : 'Hacer Admin')}
                        </button>
                        
                        {/* Toggle Status */}
                        <button 
                          disabled={actionLoading === u.id}
                          onClick={() => toggleUserStatus(u.id, u.role, u.status)}
                          className="btn-ghost"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: u.status === 'inactive' ? '#4ade80' : '#ff9800' }}
                        >
                          {actionLoading === u.id ? '...' : (u.status === 'inactive' ? 'Habilitar' : 'Inhabilitar')}
                        </button>

                        {/* Delete User */}
                        <button 
                          disabled={actionLoading === u.id}
                          onClick={() => handleDeleteUser(u.id, u.full_name || u.username)}
                          className="btn-ghost"
                          style={{ color: '#ef4444', padding: '0.4rem 0.6rem', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)' }}
                        >
                          <Trash2 size={15} />
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
        .table-row:hover {
          background-color: rgba(255, 255, 255, 0.015);
        }
      `}</style>
    </div>
  );
}

export default App;
