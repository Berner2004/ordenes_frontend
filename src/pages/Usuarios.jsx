import { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Trash2, X, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../services/api';

export default function Usuarios() {
    const [usuarios, setUsuarios] = useState([]);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [notificacion, setNotificacion] = useState({ mostrar: false, mensaje: '', tipo: 'exito' });
    
    const [formUsuario, setFormUsuario] = useState({ nombre: '', correo: '', password: '', rol: 'RECEPCION' });

    const mostrarAlerta = (mensaje, tipo = 'exito') => {
        setNotificacion({ mostrar: true, mensaje, tipo });
        setTimeout(() => setNotificacion({ mostrar: false, mensaje: '', tipo: 'exito' }), 3000);
    };

    const cargarUsuarios = async () => {
        try {
            const response = await api.get('/usuarios');
            setUsuarios(response.data);
        } catch (error) { console.error('Error al cargar usuarios'); }
    };

    useEffect(() => { cargarUsuarios(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/usuarios', formUsuario);
            mostrarAlerta('Usuario creado exitosamente');
            setModalAbierto(false);
            setFormUsuario({ nombre: '', correo: '', password: '', rol: 'RECEPCION' });
            cargarUsuarios();
        } catch (error) {
            mostrarAlerta(error.response?.data?.error || 'Error al crear usuario', 'error');
        }
    };

    const handleEliminar = async (id, nombre) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar el acceso a ${nombre}?`)) {
            try {
                await api.delete(`/usuarios/${id}`);
                mostrarAlerta('Usuario eliminado del sistema');
                cargarUsuarios();
            } catch (error) { mostrarAlerta('Error al eliminar usuario', 'error'); }
        }
    };

    return (
        <div className="relative">
            {notificacion.mostrar && (
                <div className={`fixed top-8 right-8 z-[100] px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 ${notificacion.tipo === 'exito' ? 'bg-hidratec-primary text-hidratec-dark' : 'bg-red-600 text-white'}`}>
                    {notificacion.tipo === 'exito' ? <CheckCircle className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                    <span className="font-black">{notificacion.mensaje}</span>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-8 flex justify-between items-center border-b border-gray-100">
                    <div>
                        <h1 className="text-3xl font-black text-hidratec-dark flex items-center gap-3">
                            <ShieldCheck className="h-8 w-8 text-hidratec-primary" /> Control de Acceso
                        </h1>
                        <p className="text-gray-500 mt-1">Gestión de credenciales y roles del personal</p>
                    </div>
                    <button onClick={() => setModalAbierto(true)} className="bg-hidratec-dark text-white font-bold px-6 py-3 rounded-lg hover:bg-black transition flex items-center gap-2">
                        <Plus className="h-5 w-5 text-hidratec-primary" /> Nuevo Usuario
                    </button>
                </div>

                <div className="p-8">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-hidratec-light text-hidratec-dark text-sm uppercase">
                                <th className="p-4 rounded-tl-lg">Personal</th>
                                <th className="p-4">Correo (Login)</th>
                                <th className="p-4">Rol Asignado</th>
                                <th className="p-4 text-center rounded-tr-lg">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuarios.map((u) => (
                                <tr key={u._id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="p-4 font-bold uppercase">{u.nombre}</td>
                                    <td className="p-4 text-gray-600">{u.correo}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-black ${u.rol === 'ADMIN' ? 'bg-red-100 text-red-700' : u.rol === 'TALLER' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-700'}`}>
                                            {u.rol}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <button onClick={() => handleEliminar(u._id, u.nombre)} className="p-2 text-red-400 hover:bg-red-100 rounded transition"><Trash2 className="h-5 w-5" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {modalAbierto && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border-t-8 border-hidratec-dark">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-black text-hidratec-dark">Crear Credenciales</h2>
                            <button onClick={() => setModalAbierto(false)}><X className="h-6 w-6 text-gray-400 hover:text-red-500" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo</label>
                                <input type="text" className="w-full p-3 border rounded focus:ring-2 focus:ring-hidratec-primary" required value={formUsuario.nombre} onChange={(e) => setFormUsuario({...formUsuario, nombre: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Correo de Acceso</label>
                                <input type="email" className="w-full p-3 border rounded focus:ring-2 focus:ring-hidratec-primary" required value={formUsuario.correo} onChange={(e) => setFormUsuario({...formUsuario, correo: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña</label>
                                <input type="password" minLength="6" className="w-full p-3 border rounded focus:ring-2 focus:ring-hidratec-primary" required value={formUsuario.password} onChange={(e) => setFormUsuario({...formUsuario, password: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nivel de Acceso (Rol)</label>
                                <select className="w-full p-3 border rounded focus:ring-2 focus:ring-hidratec-primary font-bold" value={formUsuario.rol} onChange={(e) => setFormUsuario({...formUsuario, rol: e.target.value})}>
                                    <option value="RECEPCION">RECEPCIÓN (Crea Órdenes)</option>
                                    <option value="TALLER">TALLER (Ejecuta Trabajos)</option>
                                    <option value="ADMIN">ADMINISTRADOR (Acceso Total)</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full py-4 mt-4 bg-hidratec-dark text-white rounded-lg font-black hover:bg-black transition text-lg">
                                Registrar Usuario
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}