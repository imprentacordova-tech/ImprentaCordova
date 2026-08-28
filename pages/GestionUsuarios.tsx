import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { User } from '../types';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logActivity } from '../services/activityLogService';
import { formatDate } from '../utils';
import { SEO } from '../components/SEO';
import { C, S, MONO, DISPLAY, PANEL_KEYFRAMES } from '../components/panelTheme';

const ROL_STYLE: Record<string, React.CSSProperties> = {
    Admin: { background: '#FFFBEB', color: '#7A5A00', border: '1px solid #F4E3A8' },
    'Diseñador': { background: '#F5F3FF', color: '#6D28D9', border: '1px solid #DDD3FE' },
    Operador: { background: C.chipBlue, color: C.royal, border: `1px solid ${C.borderStrong}` },
};

const UserFormModal: React.FC<{ user: Partial<User> | null; onClose: () => void; onSave: (u: Partial<User>) => void }> = ({ user, onClose, onSave }) => {
    const [f, setF] = useState<Partial<User>>({});
    useEffect(() => { setF(user || { nombre: '', email: '', rol: 'Operador', estado: 'Activo', requirePassword: false, password: '' }); }, [user]);
    if (!user) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,17,64,.45)', backdropFilter: 'blur(2px)' }} onClick={onClose} />
            <form onSubmit={e => { e.preventDefault(); onSave(f); }} style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440, ...S.card, overflow: 'hidden' }}>
                <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.divider}`, background: C.surfaceAlt }}>
                    <h2 style={{ ...S.h2, fontSize: 17 }}>{f.id ? 'Editar usuario' : 'Nuevo usuario'}</h2>
                </div>
                <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <label style={{ display: 'block' }}><span style={S.fieldLabel}>Nombre completo</span>
                        <input value={f.nombre || ''} onChange={e => setF({ ...f, nombre: e.target.value })} required style={S.input} /></label>
                    <label style={{ display: 'block' }}><span style={S.fieldLabel}>Correo electrónico</span>
                        <input type="email" value={f.email || ''} onChange={e => setF({ ...f, email: e.target.value })} required style={S.input} /></label>
                    <label style={{ display: 'block' }}><span style={S.fieldLabel}>Rol</span>
                        <select value={f.rol || 'Operador'} onChange={e => setF({ ...f, rol: e.target.value as any })} style={{ ...S.input, cursor: 'pointer' }}>
                            <option value="Admin">Administrador</option>
                            <option value="Operador">Operador</option>
                            <option value="Diseñador">Diseñador</option>
                        </select></label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: C.body }}>
                        <input type="checkbox" checked={f.requirePassword || false} onChange={e => setF({ ...f, requirePassword: e.target.checked })} style={{ cursor: 'pointer' }} />
                        Requiere contraseña para iniciar sesión
                    </label>
                    {f.requirePassword && (
                        <label style={{ display: 'block' }}><span style={S.fieldLabel}>Contraseña</span>
                            <input type="text" value={f.password || ''} onChange={e => setF({ ...f, password: e.target.value })} style={{ ...S.input, fontFamily: MONO }} /></label>
                    )}
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose} style={S.softBtn}>Cancelar</button>
                        <button type="submit" style={S.primaryBtn}>Guardar</button>
                    </div>
                </div>
            </form>
        </div>
    );
};

const GestionUsuariosPage: React.FC = () => {
    const auth = useAuth();
    const outletContext = useOutletContext<{ currentUser?: User }>() || {};
    const currentUser = outletContext.currentUser || auth.user;
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('users').select('*').order('nombre', { ascending: true });
        if (!error && data) {
            setUsers(data.map((u: any) => ({
                id: u.id, nombre: u.nombre, email: u.email, rol: u.rol, estado: u.estado,
                ultimoAcceso: u.ultimo_acceso, requirePassword: u.require_password, password: u.password,
            })) as User[]);
        }
        setLoading(false);
    };
    useEffect(() => { fetchUsers(); }, []);

    const filtered = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return [...users].filter(u => u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }, [users, searchTerm]);

    const handleSave = async (user: Partial<User>) => {
        const dbUser = { nombre: user.nombre, email: user.email, rol: user.rol, estado: user.estado, require_password: user.requirePassword, password: user.password };
        if (user.id) {
            await supabase.from('users').update(dbUser).eq('id', user.id);
            logActivity(currentUser.nombre, currentUser.rol, 'USUARIO_MODIFICADO', `Modificó a ${user.nombre}`, 'Seguridad');
        } else {
            await supabase.from('users').insert([dbUser]);
            logActivity(currentUser.nombre, currentUser.rol, 'USUARIO_CREADO', `Creó usuario: ${user.nombre}`, 'Seguridad');
        }
        setEditingUser(null);
        await fetchUsers();
    };

    const toggleEstado = async (u: User) => {
        const nuevo = u.estado === 'Activo' ? 'Inactivo' : 'Activo';
        await supabase.from('users').update({ estado: nuevo }).eq('id', u.id);
        logActivity(currentUser.nombre, currentUser.rol, 'USUARIO_MODIFICADO', `${nuevo === 'Activo' ? 'Activó' : 'Desactivó'} a ${u.nombre}`, 'Seguridad');
        fetchUsers();
    };

    return (
        <div style={S.page}>
            <style>{PANEL_KEYFRAMES}</style>
            <SEO title="Gestión de Usuarios · Imprenta Córdova" />
            <div style={S.wrap}>

                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                    <div>
                        <p style={S.eyebrow}>Sistema</p>
                        <h1 style={S.h1}>Gestión de Usuarios</h1>
                    </div>
                    <button style={S.primaryBtn} onClick={() => setEditingUser({})}>Crear usuario</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14 }}>
                    {[
                        { l: 'Total de usuarios', v: users.length, c: C.ink },
                        { l: 'Activos', v: users.filter(u => u.estado === 'Activo').length, c: C.successDot },
                        { l: 'Inactivos', v: users.filter(u => u.estado === 'Inactivo').length, c: C.danger },
                    ].map(k => (
                        <div key={k.l} style={{ ...S.card, borderRadius: 14, padding: '17px 19px' }}>
                            <div style={S.colHead}>{k.l}</div>
                            <div style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 600, letterSpacing: '-.04em', color: k.c, marginTop: 8, lineHeight: 1 }}>{k.v}</div>
                        </div>
                    ))}
                </div>

                <div style={{ ...S.card, borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ color: C.faint, fontSize: 13 }}>⌕</span>
                    <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar usuario o correo…"
                        style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', fontSize: 13.5, color: C.ink, fontFamily: 'inherit' }} />
                </div>

                <div style={{ ...S.card, overflow: 'hidden' }}>
                    {loading ? (
                        <div style={{ padding: 48, textAlign: 'center', color: C.faint, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.2em' }}>Cargando usuarios…</div>
                    ) : filtered.length === 0 ? (
                        <div style={{ padding: 48, textAlign: 'center', color: C.muted, fontSize: 13 }}>Sin coincidencias.</div>
                    ) : filtered.map(u => (
                        <div key={u.id} style={{ padding: '15px 20px', borderBottom: `1px solid ${C.rowLine}`, display: 'grid', gridTemplateColumns: 'auto 1.3fr 1.4fr auto auto auto', gap: 14, alignItems: 'center' }}>
                            <span style={{ width: 36, height: 36, borderRadius: 10, background: C.chipBlue, border: `1px solid ${C.borderStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.5, fontWeight: 800, color: C.royal }}>
                                {u.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                            <span style={{ fontSize: 14, fontWeight: 600, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.nombre}</span>
                            <span style={{ fontSize: 12.5, color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</span>
                            <span><span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 10.5, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', ...(ROL_STYLE[u.rol] || ROL_STYLE.Operador) }}>{u.rol}</span></span>
                            <span style={{ fontSize: 12, color: C.faint, textAlign: 'right' }}>{u.ultimoAcceso ? formatDate(u.ultimoAcceso) : '—'}</span>
                            <span style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                <button style={{ ...S.softBtn, padding: '6px 10px', fontSize: 11.5, ...(u.estado === 'Activo' ? { background: '#F2F7F2', color: C.success } : { background: '#FEF2F2', color: '#B91C1C' }) }}
                                    onClick={() => toggleEstado(u)}>{u.estado === 'Activo' ? 'Activo' : 'Inactivo'}</button>
                                <button style={{ ...S.softBtn, padding: '6px 10px', fontSize: 11.5 }} onClick={() => setEditingUser(u)}>Editar</button>
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <UserFormModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleSave} />
        </div>
    );
};

export default GestionUsuariosPage;
