import { useState, useEffect } from 'react';
import { Tags, Plus, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../services/api';

export default function Categorias() {
    const [categorias, setCategorias] = useState([]);
    const [nuevaCategoria, setNuevaCategoria] = useState('');
    const [notificacion, setNotificacion] = useState({ mostrar: false, mensaje: '', tipo: 'exito' });

    const mostrarAlerta = (mensaje, tipo = 'exito') => {
        setNotificacion({ mostrar: true, mensaje, tipo });
        setTimeout(() => setNotificacion({ mostrar: false, mensaje: '', tipo: 'exito' }), 3000);
    };

    const cargarCategorias = async () => {
        try {
            const response = await api.get('/categorias');
            setCategorias(response.data);
        } catch (error) { mostrarAlerta('Error al cargar categorías', 'error'); }
    };

    useEffect(() => { cargarCategorias(); }, []);

    const handleCrear = async (e) => {
        e.preventDefault();
        if (!nuevaCategoria.trim()) return;
        try {
            await api.post('/categorias', { nombre: nuevaCategoria });
            setNuevaCategoria('');
            cargarCategorias();
            mostrarAlerta('Tipo de trabajo agregado con éxito');
        } catch (error) {
            mostrarAlerta(error.response?.data?.error || 'Error al crear', 'error');
        }
    };

    const handleEliminar = async (id, nombre) => {
        if (window.confirm(`¿Eliminar la categoría "${nombre}"?`)) {
            try {
                await api.delete(`/categorias/${id}`);
                cargarCategorias();
                mostrarAlerta('Categoría eliminada');
            } catch (error) { mostrarAlerta('Error al eliminar', 'error'); }
        }
    };

    return (
        <div className="relative">
            {notificacion.mostrar && (
                <div className={`fixed top-8 right-8 z-[100] px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 transform transition-all duration-300 ${
                    notificacion.tipo === 'exito' ? 'bg-hidratec-primary text-hidratec-dark border-b-4 border-black' : 'bg-red-600 text-white border-b-4 border-red-900'
                }`}>
                    {notificacion.tipo === 'exito' ? <CheckCircle className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                    <span className="font-black tracking-wide">{notificacion.mensaje}</span>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden max-w-4xl mx-auto">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h1 className="text-2xl font-black text-hidratec-dark flex items-center gap-3">
                            <Tags className="h-7 w-7 text-hidratec-primary" /> Tipos de Trabajo
                        </h1>
                        <p className="text-gray-500 mt-1">Configura las categorías disponibles para el Panel de Recepción</p>
                    </div>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* FORMULARIO */}
                    <div className="md:col-span-1">
                        <form onSubmit={handleCrear} className="bg-hidratec-light p-6 rounded-xl border border-gray-200">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Nueva Categoría</label>
                            <input 
                                type="text" 
                                className="w-full p-3 border rounded focus:ring-2 focus:ring-hidratec-primary mb-4" 
                                placeholder="Ej: SOLDADURA..." 
                                value={nuevaCategoria} 
                                onChange={(e) => setNuevaCategoria(e.target.value)} 
                                required 
                            />
                            <button type="submit" className="w-full bg-hidratec-dark text-white font-bold py-3 rounded hover:bg-black transition flex justify-center items-center gap-2">
                                <Plus className="h-5 w-5" /> Agregar
                            </button>
                        </form>
                    </div>

                    {/* LISTA */}
                    <div className="md:col-span-2">
                        {categorias.length === 0 ? (
                            <p className="text-gray-400 text-center py-10 font-bold">No hay categorías configuradas. Crea una a la izquierda.</p>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-100 text-gray-500 text-xs uppercase">
                                        <th className="p-3 rounded-tl-lg">Nombre de la Categoría</th>
                                        <th className="p-3 text-center rounded-tr-lg w-20">Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categorias.map(cat => (
                                        <tr key={cat._id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="p-3 font-bold text-hidratec-dark uppercase">{cat.nombre}</td>
                                            <td className="p-3 text-center">
                                                <button onClick={() => handleEliminar(cat._id, cat.nombre)} className="text-red-400 hover:text-red-600 p-2"><Trash2 className="h-5 w-5" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}