import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Trash2, CheckCircle, AlertTriangle, Camera, Receipt, X } from 'lucide-react';
import api from '../services/api';

export default function Ordenes() {
    const navigate = useNavigate();
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const esAdmin = usuario.rol === 'ADMIN';

    const [ordenes, setOrdenes] = useState([]);
    const [notificacion, setNotificacion] = useState({ mostrar: false, mensaje: '', tipo: 'exito' });

    // Estados para Auditoría
    const [modalAuditoria, setModalAuditoria] = useState(false);
    const [ordenVisualizar, setOrdenVisualizar] = useState(null);

    // Estados para Facturación
    const [modalFacturacion, setModalFacturacion] = useState(false);
    const [ordenFacturar, setOrdenFacturar] = useState(null);
    const [formFactura, setFormFactura] = useState({
        facturacion_tipo: 'CONTADO',
        facturacion_nombre: '',
        facturacion_ruc: '',
        facturacion_numero: ''
    });

    const mostrarAlerta = (mensaje, tipo = 'exito') => {
        setNotificacion({ mostrar: true, mensaje, tipo });
        setTimeout(() => setNotificacion({ mostrar: false, mensaje: '', tipo: 'exito' }), 3000);
    };

    const cargarOrdenes = async () => {
        try {
            const response = await api.get('/ordenes');
            setOrdenes(response.data);
        } catch (error) { mostrarAlerta('Error al cargar el historial', 'error'); }
    };

    useEffect(() => { cargarOrdenes(); }, []);

    const handleEliminar = async (id, numero_orden) => {
        if (window.confirm(`⚠️ ATENCIÓN ⚠️\n¿Eliminar la Orden OT-${numero_orden || 'S/N'}? Esta acción no se puede deshacer.`)) {
            try {
                await api.delete(`/ordenes/${id}`);
                mostrarAlerta(`Orden eliminada con éxito`);
                cargarOrdenes(); 
            } catch (error) { mostrarAlerta(error.response?.data?.error || 'Error', 'error'); }
        }
    };

    const abrirAuditoria = (orden) => {
        setOrdenVisualizar(orden);
        setModalAuditoria(true);
    };

    const abrirFacturacion = (orden) => {
        setOrdenFacturar(orden);
        setFormFactura({
            facturacion_tipo: 'CONTADO',
            facturacion_nombre: orden.cliente?.nombre || '',
            facturacion_ruc: orden.cliente?.ruc || '',
            facturacion_numero: ''
        });
        setModalFacturacion(true);
    };

    const procesarFacturacion = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('estado', 'FINALIZADA');
            formData.append('facturacion_tipo', formFactura.facturacion_tipo);
            formData.append('facturacion_nombre', formFactura.facturacion_nombre);
            formData.append('facturacion_ruc', formFactura.facturacion_ruc);
            formData.append('facturacion_numero', formFactura.facturacion_numero);

            await api.put(`/ordenes/${ordenFacturar._id}`, formData);
            
            setModalFacturacion(false);
            mostrarAlerta('¡Orden Finalizada y Facturada exitosamente!');
            cargarOrdenes();
        } catch (error) { mostrarAlerta('Error al procesar facturación', 'error'); }
    };

    // Formateador de Fecha y Hora exacta
    const formatoFechaHora = (fecha) => {
        if (!fecha) return 'Pendiente...';
        return new Date(fecha).toLocaleString('es-ES', { 
            day: '2-digit', month: 'short', year: 'numeric', 
            hour: '2-digit', minute: '2-digit', hour12: true 
        }).toUpperCase();
    };

    const getEstadoEstilo = (estado) => {
        switch(estado) {
            case 'ABIERTA': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'EN TALLER': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'PARA FACTURAR': return 'bg-red-100 text-red-700 border-red-200';
            case 'FINALIZADA': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden relative">
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
                        <FileText className="h-8 w-8 text-hidratec-primary" /> Gestión de Órdenes
                    </h1>
                    <p className="text-gray-500 mt-1">Historial completo de trabajos de la empresa</p>
                </div>
                <button onClick={() => navigate('/ordenes/nueva')} className="bg-hidratec-dark text-white font-bold px-6 py-3 rounded-lg shadow hover:bg-black transition flex items-center gap-2">
                    <Plus className="h-5 w-5 text-hidratec-primary" /> Nuevo Ingreso
                </button>
            </div>

            <div className="p-8">
                {ordenes.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No hay órdenes registradas en el sistema.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-hidratec-light text-hidratec-dark text-sm uppercase">
                                    <th className="p-4 rounded-tl-lg w-24">Nº Orden</th>
                                    <th className="p-4 w-32">Fecha</th>
                                    <th className="p-4">Cliente / Requerimiento</th>
                                    <th className="p-4">Categoría</th>
                                    <th className="p-4 w-40 text-center">Estado</th>
                                    {/* COLUMNA SIEMPRE VISIBLE PARA RECEPCIÓN Y ADMIN */}
                                    <th className="p-4 text-center rounded-tr-lg w-32">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ordenes.map((orden) => (
                                    <tr key={orden._id} onClick={() => abrirAuditoria(orden)} className="border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer">
                                        <td className="p-4">
                                            <span className="font-black text-lg text-hidratec-dark">OT-{orden.numero_orden || 'S/N'}</span>
                                        </td>
                                        <td className="p-4 text-sm font-bold text-gray-500">
                                            {new Date(orden.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                                        </td>
                                        <td className="p-4">
                                            <p className="font-bold text-hidratec-dark uppercase">{orden.cliente?.nombre || 'CLIENTE ELIMINADO'}</p>
                                            <p className="text-xs text-gray-500 line-clamp-1">{orden.actividad_realizar || 'Sin descripción'}</p>
                                            
                                            {orden.foto_ingreso && (
                                                <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded mt-2 font-bold border border-blue-200">
                                                    <Camera className="h-3 w-3" /> CONTIENE FOTO
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 font-bold text-gray-700 uppercase text-sm">{orden.tipo_trabajo}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-3 py-1 rounded text-xs font-black border ${getEstadoEstilo(orden.estado)}`}>{orden.estado}</span>
                                        </td>
                                        
                                        {/* COLUMNA DE ACCIONES */}
                                        <td className="p-4 flex justify-center gap-2 items-center">
                                            {/* BOTÓN FACTURAR: Visible para Recepción y Admin */}
                                            {orden.estado === 'PARA FACTURAR' && (
                                                <button onClick={(e) => { e.stopPropagation(); abrirFacturacion(orden); }} className="p-2 bg-green-100 text-green-700 hover:bg-green-600 hover:text-white rounded-lg transition font-bold text-xs flex items-center gap-1 shadow-sm" title="Procesar Facturación">
                                                    <Receipt className="h-5 w-5" /> FACTURAR
                                                </button>
                                            )}

                                            {/* BOTÓN ELIMINAR: Visible SOLO para Admin */}
                                            {esAdmin && (
                                                <button onClick={(e) => { e.stopPropagation(); handleEliminar(orden._id, orden.numero_orden); }} className="p-2 text-red-400 hover:bg-red-100 hover:text-red-600 rounded-lg transition" title="Eliminar Orden">
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODAL DE AUDITORÍA Y TRAZABILIDAD */}
            {/* MODAL DE AUDITORÍA Y TRAZABILIDAD */}
            {modalAuditoria && ordenVisualizar && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-white">
                            <div>
                                <h2 className="text-2xl font-black text-hidratec-dark">HISTORIAL DE ORDEN: OT-{ordenVisualizar.numero_orden || 'S/N'}</h2>
                                {ordenVisualizar.numero_cotizacion && (
                                    <p className="text-xs font-bold text-gray-400 uppercase mt-1">📋 Cotización: {ordenVisualizar.numero_cotizacion}</p>
                                )}
                                <p className="text-sm font-bold text-gray-500 uppercase">{ordenVisualizar.cliente?.nombre}</p>
                            </div>
                            <button onClick={() => setModalAuditoria(false)} className="bg-gray-100 hover:bg-red-500 hover:text-white p-2 rounded-full transition">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-gray-50">
                            
                            {/* 1. INGRESO Y RECEPCIÓN */}
                            <div className="bg-[#f0f7ff] rounded-lg p-6 shadow-sm border border-blue-200">
                                <h3 className="text-lg font-black text-[#1e3a8a] mb-4 flex items-center justify-between">
                                    <span>1. INGRESO Y RECEPCIÓN</span>
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">📅 Registrado: {formatoFechaHora(ordenVisualizar.createdAt)}</span>
                                </h3>
                                <div className="bg-white p-5 rounded-lg border border-blue-100 shadow-sm">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div className="md:col-span-2">
                                            <p className="text-xs font-bold text-gray-400 mb-1">REQUERIMIENTO:</p>
                                            <p className="font-bold text-gray-800 uppercase">{ordenVisualizar.actividad_realizar || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 mb-1">CATEGORÍA:</p>
                                            <p className="font-bold text-gray-800 uppercase">{ordenVisualizar.tipo_trabajo}</p>
                                        </div>
                                    </div>
                                    {ordenVisualizar.foto_ingreso && (
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 mb-2">EVIDENCIA DE INGRESO:</p>
                                            <a href={ordenVisualizar.foto_ingreso} target="_blank" rel="noreferrer">
                                                <img src={ordenVisualizar.foto_ingreso} alt="Ingreso" className="w-32 h-32 object-cover rounded border-2 border-blue-200 p-1 bg-white hover:opacity-80 transition" title="Clic para ampliar" />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 2. EJECUCIÓN EN TALLER */}
                            <div className="bg-[#fffbeb] rounded-lg p-6 shadow-sm border border-yellow-200">
                                <h3 className="text-lg font-black text-[#b45309] mb-4">2. EJECUCIÓN EN TALLER</h3>
                                
                                {/* MATERIALES */}
                                {ordenVisualizar.items?.filter(i => i.descripcion?.trim() !== '').length > 0 && (
                                    <div className="mb-6">
                                        <p className="font-black text-gray-500 text-sm mb-2 uppercase">MATERIALES UTILIZADOS:</p>
                                        <div className="bg-white border rounded-lg overflow-hidden">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-gray-50 border-b">
                                                    <tr><th className="p-3 w-20 text-center text-gray-500">CANT</th><th className="p-3 text-gray-500">DESCRIPCIÓN</th></tr>
                                                </thead>
                                                <tbody>
                                                    {ordenVisualizar.items.filter(i => i.descripcion?.trim() !== '').map((i, idx) => (
                                                        <tr key={idx} className="border-b last:border-0"><td className="p-3 font-black text-center">{i.cantidad}</td><td className="p-3 font-bold uppercase">{i.descripcion}</td></tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* NOVEDADES */}
                                {ordenVisualizar.novedades?.filter(n => n.motivo?.trim() !== '' || n.foto).length > 0 && (
                                    <div>
                                        <p className="font-black text-gray-500 text-sm mb-2 uppercase">NOVEDADES REPORTADAS:</p>
                                        <div className="space-y-4">
                                            {ordenVisualizar.novedades.filter(n => n.motivo?.trim() !== '' || n.foto).map((nov, idx) => (
                                                <div key={idx} className="bg-white p-5 rounded-lg border border-yellow-300 shadow-sm">
                                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-400 mb-1">Motivo:</p>
                                                            <p className="font-black text-[#1e3a8a] text-base">{nov.motivo}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-400 mb-1">Fecha:</p>
                                                            <p className="font-bold text-gray-800">{nov.fecha ? nov.fecha.split('T')[0] : 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                    {nov.foto && (
                                                        <a href={nov.foto} target="_blank" rel="noreferrer" className="inline-block">
                                                            <img src={nov.foto} alt="Novedad" className="w-32 h-32 object-cover rounded border-2 border-yellow-300 p-1 hover:opacity-80 transition" title="Clic para ampliar" />
                                                        </a>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {(!ordenVisualizar.items?.some(i => i.descripcion?.trim() !== '') && !ordenVisualizar.novedades?.some(n => n.motivo?.trim() !== '' || n.foto)) && (
                                    <p className="text-gray-400 italic text-sm">Aún no se han registrado datos en el taller.</p>
                                )}
                            </div>

                            {/* 3. SALIDA */}
                            <div className="bg-[#f0fdf4] rounded-lg p-6 shadow-sm border border-green-200">
                                <h3 className="text-lg font-black text-[#15803d] mb-4 flex items-center justify-between">
                                    <span>3. RESULTADO Y SALIDA</span>
                                    {ordenVisualizar.fecha_finalizado && (
                                        <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">✅ Finalizado Taller: {formatoFechaHora(ordenVisualizar.fecha_finalizado)}</span>
                                    )}
                                </h3>
                                <div className="bg-white p-5 rounded-lg border border-green-100 shadow-sm mb-4">
                                    <p className="text-xs font-bold text-gray-400 mb-2">A CARGO DE:</p>
                                    <p className="font-black text-gray-800 uppercase">{ordenVisualizar.tecnico_responsable || 'SIN ASIGNAR'}</p>
                                </div>
                                <div className="bg-white p-5 rounded-lg border border-green-100 shadow-sm">
                                    <p className="text-xs font-bold text-gray-400 mb-2">EVIDENCIA DE EQUIPO FINALIZADO:</p>
                                    {ordenVisualizar.foto_salida ? (
                                        <a href={ordenVisualizar.foto_salida} target="_blank" rel="noreferrer">
                                            <img src={ordenVisualizar.foto_salida} alt="Salida" className="w-48 h-48 object-cover rounded border-2 border-green-300 p-1 hover:opacity-80 transition" title="Clic para ampliar" />
                                        </a>
                                    ) : (
                                        <p className="text-gray-400 italic text-sm">No se adjuntó foto de salida.</p>
                                    )}
                                </div>
                            </div>

                            {/* 4. FACTURACIÓN */}
                            {ordenVisualizar.estado === 'FINALIZADA' && (
                                <div className="bg-[#f3f4f6] rounded-lg p-6 shadow-sm border border-gray-300">
                                    <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center justify-between">
                                        <span>4. CIERRE ADMINISTRATIVO</span>
                                        {ordenVisualizar.fecha_facturado && (
                                            <span className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">🔒 Facturado: {formatoFechaHora(ordenVisualizar.fecha_facturado)}</span>
                                        )}
                                    </h3>
                                    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 mb-1">FACTURADO A:</p>
                                            <p className="font-black text-gray-800 uppercase">{ordenVisualizar.facturacion_nombre}</p>
                                            <p className="text-sm font-mono text-gray-500">RUC: {ordenVisualizar.facturacion_ruc}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 mb-1">TIPO DE PAGO / FACTURA:</p>
                                            <p className="font-black text-gray-800 uppercase">{ordenVisualizar.facturacion_tipo}</p>
                                            <p className="text-sm font-mono text-gray-500">Nº: {ordenVisualizar.facturacion_numero || 'PENDIENTE'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE FACTURACIÓN Y CIERRE */}
            {modalFacturacion && ordenFacturar && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border-t-8 border-green-500">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-green-50">
                            <h2 className="text-xl font-black text-green-800 flex items-center gap-2"><Receipt className="h-6 w-6"/> Cierre de Facturación</h2>
                            <button onClick={() => setModalFacturacion(false)}><X className="h-6 w-6 text-gray-500 hover:text-red-500" /></button>
                        </div>
                        
                        <form onSubmit={procesarFacturacion} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Tipo de Pago / Condición</label>
                                <select className="w-full p-3 border rounded focus:ring-2 focus:ring-green-500 font-bold bg-gray-50"
                                    value={formFactura.facturacion_tipo} onChange={(e) => setFormFactura({...formFactura, facturacion_tipo: e.target.value})}>
                                    <option value="CONTADO">AL CONTADO</option>
                                    <option value="CRÉDITO 15 DÍAS">CRÉDITO 15 DÍAS</option>
                                    <option value="CRÉDITO 30 DÍAS">CRÉDITO 30 DÍAS</option>
                                    <option value="TARJETA DE CRÉDITO">TARJETA DE CRÉDITO</option>
                                    <option value="TRANSFERENCIA">TRANSFERENCIA / DEPÓSITO</option>
                                    <option value="SIN FACTURA / INTERNO">SIN FACTURA / TRABAJO INTERNO</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Facturar a nombre de (Razón Social)</label>
                                <input type="text" required className="w-full p-3 border rounded focus:ring-2 focus:ring-green-500"
                                    value={formFactura.facturacion_nombre} onChange={(e) => setFormFactura({...formFactura, facturacion_nombre: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">RUC de Facturación</label>
                                <input type="text" required className="w-full p-3 border rounded focus:ring-2 focus:ring-green-500"
                                    value={formFactura.facturacion_ruc} onChange={(e) => setFormFactura({...formFactura, facturacion_ruc: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nº de Factura Física/Electrónica</label>
                                <input type="text" className="w-full p-3 border rounded focus:ring-2 focus:ring-green-500 font-mono text-lg" placeholder="Ej: 001-002-00001234"
                                    value={formFactura.facturacion_numero} onChange={(e) => setFormFactura({...formFactura, facturacion_numero: e.target.value})} />
                            </div>
                            <button type="submit" className="w-full py-4 mt-2 bg-green-600 text-white rounded-lg font-black hover:bg-green-700 transition shadow-lg text-lg flex items-center justify-center gap-2">
                                <CheckCircle className="h-6 w-6"/> Cerrar Orden
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}