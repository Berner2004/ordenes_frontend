import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Building, Users, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../services/api';

export default function Clientes() {
    const [clientes, setClientes] = useState([]);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    
    // Estado para Notificaciones Flotantes
    const [notificacion, setNotificacion] = useState({ mostrar: false, mensaje: '', tipo: 'exito' });

    const [clienteForm, setClienteForm] = useState({
        nombre: '', ruc: '', direccion: '', telefono: '', correo: ''
    });

    const mostrarAlerta = (mensaje, tipo = 'exito') => {
        setNotificacion({ mostrar: true, mensaje, tipo });
        setTimeout(() => setNotificacion({ mostrar: false, mensaje: '', tipo: 'exito' }), 3000);
    };

    const cargarClientes = async () => {
        try {
            const response = await api.get('/clientes');
            setClientes(response.data);
        } catch (error) {
            mostrarAlerta('Error al cargar la base de datos', 'error');
        }
    };

    useEffect(() => { cargarClientes(); }, []);

    const abrirModalNuevo = () => {
        setModoEdicion(false);
        setClienteForm({ nombre: '', ruc: '', direccion: '', telefono: '', correo: '' });
        setModalAbierto(true);
    };

    const abrirModalEdicion = (cliente) => {
        setModoEdicion(true);
        setClienteForm({
            ...cliente,
            telefono: cliente.telefono || cliente.contacto || '',
            correo: cliente.correo || ''
        }); 
        setModalAbierto(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (modoEdicion) {
                await api.put(`/clientes/${clienteForm._id}`, clienteForm);
                mostrarAlerta('Empresa actualizada correctamente');
            } else {
                await api.post('/clientes', clienteForm);
                mostrarAlerta('Nueva empresa registrada');
            }
            setModalAbierto(false);
            cargarClientes(); 
        } catch (error) {
            mostrarAlerta(error.response?.data?.error || 'Error al guardar los datos', 'error');
        }
    };

    const handleEliminar = async (id, nombre) => {
        // La ventana de confirmación (window.confirm) es normal dejarla por seguridad
        if (window.confirm(`¿Seguro que deseas eliminar a la empresa ${nombre}?`)) {
            try {
                await api.delete(`/clientes/${id}`);
                mostrarAlerta('Empresa eliminada del directorio'); // Notificación amarilla bonita
                cargarClientes();
            } catch (error) {
                // AQUI ESTABA EL ERROR: Cambiamos el viejo alert() por mostrarAlerta()
                mostrarAlerta(error.response?.data?.error || 'Error al eliminar la empresa', 'error');
            }
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden relative">
            
            {/* NOTIFICACIÓN FLOTANTE */}
            {notificacion.mostrar && (
                <div className={`fixed top-8 right-8 z-[100] px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 transform transition-all duration-300 ${
                    notificacion.tipo === 'exito' ? 'bg-hidratec-primary text-hidratec-dark border-b-4 border-black' : 'bg-red-600 text-white border-b-4 border-red-900'
                }`}>
                    {notificacion.tipo === 'exito' ? <CheckCircle className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                    <span className="font-black tracking-wide">{notificacion.mensaje}</span>
                </div>
            )}

            <div className="p-8 flex justify-between items-center border-b border-gray-100">
                <div>
                    <h1 className="text-3xl font-black text-hidratec-dark flex items-center gap-3">
                        <Users className="h-8 w-8 text-hidratec-primary" /> Directorio de Clientes
                    </h1>
                    <p className="text-gray-500 mt-1">Base de datos de empresas para facturación</p>
                </div>
                <button onClick={abrirModalNuevo} className="bg-hidratec-dark text-white font-bold px-6 py-3 rounded-lg shadow hover:bg-black transition flex items-center gap-2">
                    <Plus className="h-5 w-5 text-hidratec-primary" /> Nueva Empresa
                </button>
            </div>

            <div className="p-8">
                {clientes.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <Building className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No hay clientes registrados.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-hidratec-light text-hidratec-dark text-sm uppercase">
                                    <th className="p-4 rounded-tl-lg">Empresa / RUC</th>
                                    <th className="p-4">Dirección</th>
                                    <th className="p-4">Contacto Empresarial</th>
                                    <th className="p-4 text-center rounded-tr-lg">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clientes.map((cliente) => (
                                    <tr key={cliente._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                        <td className="p-4">
                                            <p className="font-bold text-hidratec-dark uppercase">{cliente.nombre}</p>
                                            <p className="text-sm text-gray-500 font-mono">{cliente.ruc}</p>
                                        </td>
                                        <td className="p-4 text-sm uppercase text-gray-600">{cliente.direccion || 'N/A'}</td>
                                        <td className="p-4">
                                            <p className="font-medium text-gray-800">{cliente.telefono || cliente.contacto || 'SIN TELÉFONO'}</p>
                                            <p className="text-sm text-gray-500">{cliente.correo || 'SIN CORREO'}</p>
                                        </td>
                                        <td className="p-4 flex justify-center gap-3">
                                            <button onClick={() => abrirModalEdicion(cliente)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Editar">
                                                <Edit className="h-5 w-5" />
                                            </button>
                                            <button onClick={() => handleEliminar(cliente._id, cliente.nombre)} className="p-2 text-hidratec-secondary hover:bg-red-50 rounded-lg transition" title="Eliminar">
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {modalAbierto && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border-t-8 border-hidratec-primary">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-hidratec-dark">{modoEdicion ? 'Editar Empresa' : 'Registrar Empresa'}</h2>
                            <button onClick={() => setModalAbierto(false)} className="text-gray-400 hover:text-hidratec-secondary"><X className="h-6 w-6" /></button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Comercial / Empresa *</label>
                                <input type="text" className="w-full p-3 border rounded focus:ring-2 focus:ring-hidratec-primary" required
                                    value={clienteForm.nombre} onChange={(e) => setClienteForm({...clienteForm, nombre: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">RUC *</label>
                                <input type="text" className="w-full p-3 border rounded focus:ring-2 focus:ring-hidratec-primary" required
                                    value={clienteForm.ruc} onChange={(e) => setClienteForm({...clienteForm, ruc: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Dirección</label>
                                <input type="text" className="w-full p-3 border rounded focus:ring-2 focus:ring-hidratec-primary"
                                    value={clienteForm.direccion} onChange={(e) => setClienteForm({...clienteForm, direccion: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Teléfono General</label>
                                    <input type="text" className="w-full p-3 border rounded focus:ring-2 focus:ring-hidratec-primary"
                                        value={clienteForm.telefono} onChange={(e) => setClienteForm({...clienteForm, telefono: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Correo Electrónico</label>
                                    <input type="email" className="w-full p-3 border rounded focus:ring-2 focus:ring-hidratec-primary"
                                        value={clienteForm.correo} onChange={(e) => setClienteForm({...clienteForm, correo: e.target.value})} />
                                </div>
                            </div>
                            <div className="pt-6 flex justify-end gap-3">
                                <button type="button" onClick={() => setModalAbierto(false)} className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-bold">Cancelar</button>
                                <button type="submit" className="px-5 py-2 bg-hidratec-primary text-hidratec-dark rounded-lg font-bold hover:bg-yellow-500 shadow-md">
                                    {modoEdicion ? 'Actualizar Empresa' : 'Guardar Empresa'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}