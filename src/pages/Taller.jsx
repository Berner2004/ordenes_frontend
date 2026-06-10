import { useState, useEffect } from 'react';
import { Wrench, CheckCircle, Clock, Plus, Trash2, X, Save, AlertTriangle, Eye, Camera, UploadCloud } from 'lucide-react';
import api from '../services/api';

// Función helper para construir URLs de imágenes
const getImageUrl = (fotoPath) => {
    if (!fotoPath) return '';
    if (fotoPath.startsWith('http://') || fotoPath.startsWith('https://')) {
        return fotoPath;
    }
    return `https://ordenes-backend-cy57.onrender.com${fotoPath}`; // Ajustado a tu URL real si aplica
};

export default function Taller() {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const esSoloLectura = usuario.rol !== 'TALLER'; 

    const [ordenes, setOrdenes] = useState([]);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [ordenActiva, setOrdenActiva] = useState(null);
    const [items, setItems] = useState([]);
    const [novedades, setNovedades] = useState([]);
    const [notificacion, setNotificacion] = useState({ mostrar: false, mensaje: '', tipo: 'exito' });
    
    // ESTADOS PARA MÚLTIPLES FOTOS DE SALIDA Y NOVEDADES
    const [archivosSalida, setArchivosSalida] = useState([]);
    const [previewsSalida, setPreviewsSalida] = useState([]);
    const [archivosNovedades, setArchivosNovedades] = useState({}); // { 0: [file1, file2], 1: [file3] }

    const mostrarAlerta = (mensaje, tipo = 'exito') => {
        setNotificacion({ mostrar: true, mensaje, tipo });
        setTimeout(() => setNotificacion({ mostrar: false, mensaje: '', tipo: 'exito' }), 3000);
    };

    const cargarOrdenes = async () => {
        try {
            const response = await api.get('/ordenes');
            let ordenesTaller = response.data.filter(
                (o) => o.estado === 'ABIERTA' || o.estado === 'EN TALLER'
            );
            
            ordenesTaller.sort((a, b) => {
                const esMioA = a.tecnico_responsable === usuario.nombre ? 1 : 0;
                const esMioB = b.tecnico_responsable === usuario.nombre ? 1 : 0;
                return esMioB - esMioA; 
            });

            setOrdenes(ordenesTaller);
        } catch (error) { console.error('Error al cargar órdenes'); }
    };

    useEffect(() => { cargarOrdenes(); }, []);

    const abrirModal = (orden) => {
        setOrdenActiva(orden);
        setItems(orden.items?.length > 0 ? orden.items : [{ cantidad: 1, descripcion: '', stock: 0, compra: 0, costo: 0, observaciones: '' }]);
        setNovedades(orden.novedades?.length > 0 ? orden.novedades : []);
        
        // Limpiamos los estados de fotos cada vez que se abre una orden nueva
        setArchivosSalida([]);
        setPreviewsSalida([]);
        setArchivosNovedades({});
        
        setModalAbierto(true);
    };

    // HANDLERS PARA ITEMS
    const handleItemChange = (index, field, value) => {
        if (esSoloLectura) return;
        const nuevosItems = [...items];
        nuevosItems[index][field] = value; 
        setItems(nuevosItems);
    };
    const agregarItem = () => setItems([...items, { cantidad: 1, descripcion: '', stock: 0, compra: 0, costo: 0, observaciones: '' }]);
    const eliminarItem = (index) => setItems(items.filter((_, i) => i !== index));

    // HANDLERS PARA NOVEDADES
    const handleNovedadChange = (index, field, value) => {
        if (esSoloLectura) return;
        const nuevasNovedades = [...novedades];
        nuevasNovedades[index][field] = value; 
        setNovedades(nuevasNovedades);
    };
    const agregarNovedad = () => setNovedades([...novedades, { item: '', fecha: '', motivo: '', suspendido: false, cancelado: false, reinicio: false, cierre: false, porcentaje_estado: '' }]);
    const eliminarNovedad = (index) => {
        setNovedades(novedades.filter((_, i) => i !== index));
        // Limpiar las fotos adjuntas a esa novedad si la eliminan
        const nuevasFotos = { ...archivosNovedades };
        delete nuevasFotos[index];
        setArchivosNovedades(nuevasFotos);
    };

    // HANDLER PARA CAPTURAR FOTOS DE NOVEDADES
    const handleCapturarFotosNovedad = (index, e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setArchivosNovedades(prev => ({
                ...prev,
                [index]: [...(prev[index] || []), ...files]
            }));
        }
    };

    // HANDLERS PARA FOTOS DE SALIDA (TALLER)
    const handleCapturarFotosSalida = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setArchivosSalida([...archivosSalida, ...files]);
            const nuevosPreviews = files.map(file => URL.createObjectURL(file));
            setPreviewsSalida([...previewsSalida, ...nuevosPreviews]);
        }
    };

    const eliminarFotoSalida = (index) => {
        setArchivosSalida(archivosSalida.filter((_, i) => i !== index));
        setPreviewsSalida(previewsSalida.filter((_, i) => i !== index));
    };

    // ENVÍO DE DATOS AL BACKEND
    const guardarOrden = async (nuevoEstado) => {
        if (esSoloLectura) return;
        try {
            const formData = new FormData();
            formData.append('estado', nuevoEstado);
            formData.append('items', JSON.stringify(items));
            formData.append('novedades', JSON.stringify(novedades));

            // Empaquetar múltiples fotos de salida
            if (archivosSalida.length > 0) {
                for (let i = 0; i < archivosSalida.length; i++) {
                    formData.append('fotos_salida', archivosSalida[i]);
                }
            }

            // Empaquetar múltiples fotos de novedades
            Object.keys(archivosNovedades).forEach(index => {
                const archivos = archivosNovedades[index];
                if (archivos && archivos.length > 0) {
                    for (let i = 0; i < archivos.length; i++) {
                        formData.append(`novedad_foto_${index}`, archivos[i]);
                    }
                }
            });

            // Usamos la ruta específica de salida si vamos a facturar, si no, actualizamos el progreso normal
            const url = nuevoEstado === 'PARA FACTURAR' 
                        ? `/ordenes/${ordenActiva._id}/salida` 
                        : `/ordenes/${ordenActiva._id}`;

            await api.put(url, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setModalAbierto(false);
            mostrarAlerta(`Orden actualizada a: ${nuevoEstado}`);
            cargarOrdenes();
        } catch (error) { 
            mostrarAlerta('Error al actualizar la orden', 'error'); 
        }
    };

    const inputClase = "w-full p-2 border rounded font-bold disabled:bg-gray-100 disabled:text-gray-500 disabled:border-transparent disabled:cursor-not-allowed text-sm";

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

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-hidratec-dark flex items-center gap-3">
                        <Wrench className="h-8 w-8 text-hidratec-primary" /> Panel de Taller
                    </h1>
                    <p className="text-gray-500 mt-1">Ejecución de trabajos y control de materiales</p>
                </div>
                {esSoloLectura && (
                    <div className="bg-blue-50 text-blue-800 border border-blue-200 px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-sm">
                        <Eye className="h-5 w-5" /> MODO LECTURA (ADMIN)
                    </div>
                )}
            </div>

            {ordenes.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 py-20 text-center">
                    <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500 opacity-50" />
                    <h2 className="text-xl font-bold text-gray-700">Taller Libre</h2>
                    <p className="text-gray-500">No hay órdenes pendientes de ejecución en este momento.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ordenes.map(orden => {
                        const esMiOrden = orden.tecnico_responsable === usuario.nombre;
                        return (
                            <div key={orden._id} onClick={() => abrirModal(orden)}
                                className={`bg-white rounded-xl shadow-md transition cursor-pointer flex flex-col hover:shadow-lg ${
                                    esMiOrden ? 'border-2 border-hidratec-primary ring-2 ring-yellow-200' : 'border-t-4 border-gray-300'
                                }`} 
                            >
                                {esMiOrden && (
                                    <div className="bg-gradient-to-r from-yellow-400 to-hidratec-primary text-hidratec-dark font-black text-center py-1.5 text-sm">
                                        ⭐ ASIGNADA A TI
                                    </div>
                                )}
                                <div className="p-5 flex-1">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="bg-hidratec-dark text-white text-xs font-black px-3 py-1 rounded">
                                            OT: {orden.numero_orden || 'S/N'}
                                        </span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded flex items-center gap-1 ${orden.estado === 'ABIERTA' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            <Clock className="h-3 w-3" /> {orden.estado}
                                        </span>
                                    </div>
                                    <h3 className="font-black text-lg text-gray-800 uppercase line-clamp-1">{orden.cliente?.nombre || 'CLIENTE ELIMINADO'}</h3>
                                    <p className="text-sm font-bold text-hidratec-secondary uppercase mt-1">{orden.tipo_trabajo}</p>
                                    <div className="mt-3 text-xs bg-gray-100 rounded p-2 border-l-2 border-hidratec-secondary">
                                        <span className="font-black text-gray-600">TÉCNICO A CARGO:</span>
                                        <div className="font-bold text-gray-800 mt-0.5">
                                            {orden.tecnico_responsable || 'SIN ASIGNAR'}
                                        </div>
                                    </div>
                                    {(orden.foto_ingreso || (orden.fotos_ingreso && orden.fotos_ingreso.length > 0)) && (
                                        <div className="mt-3 text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded inline-flex items-center gap-1 font-bold">
                                            <Camera className="h-3 w-3" /> CONTIENE FOTOS
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {modalAbierto && ordenActiva && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col border-t-8 border-hidratec-dark">
                        
                        <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <div>
                                <h2 className="text-2xl font-black text-hidratec-dark">
                                    OT-{ordenActiva.numero_orden}: {ordenActiva.cliente?.nombre}
                                </h2>
                                <p className="text-sm font-bold text-gray-500">{ordenActiva.tipo_trabajo}</p>
                            </div>
                            {esSoloLectura && (
                                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded flex items-center gap-1">
                                    <Eye className="h-4 w-4"/> VISTA DE AUDITORÍA
                                </span>
                            )}
                            <button onClick={() => setModalAbierto(false)} className="p-2 bg-gray-200 hover:bg-red-500 hover:text-white rounded-full transition">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1 space-y-8 bg-gray-100">
                            
                            {/* --- INFORMACIÓN DE INGRESO (CON SOPORTE PARA MÚLTIPLES FOTOS) --- */}
                            <div className="bg-white p-5 rounded-lg border-l-4 border-hidratec-secondary shadow-sm flex flex-col md:flex-row gap-6 items-start">
                                <div className="flex-1">
                                    <h3 className="text-xs font-black text-gray-400 mb-1 uppercase">Requerimiento de Recepción:</h3>
                                    <p className="font-bold text-gray-800 uppercase text-sm">{ordenActiva.actividad_realizar || 'SIN DESCRIPCIÓN'}</p>
                                </div>
                                
                                {/* Mostrar galería si hay array de fotos, o la foto única si es un registro antiguo */}
                                {(ordenActiva.fotos_ingreso?.length > 0 || ordenActiva.foto_ingreso) && (
                                    <div className="w-full md:w-80 flex-shrink-0">
                                        <h3 className="text-xs font-black text-gray-400 mb-2 uppercase text-center md:text-left">Evidencia de Ingreso:</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            {/* Renderizamos el array nuevo */}
                                            {ordenActiva.fotos_ingreso && ordenActiva.fotos_ingreso.map((foto, idx) => (
                                                <a key={idx} href={getImageUrl(foto)} target="_blank" rel="noreferrer" className="block border rounded p-1 hover:border-hidratec-primary transition">
                                                    <img src={getImageUrl(foto)} alt={`Ingreso ${idx}`} className="w-full h-20 object-cover rounded" />
                                                </a>
                                            ))}
                                            {/* Renderizamos el formato antiguo de 1 foto por compatibilidad */}
                                            {ordenActiva.foto_ingreso && (
                                                <a href={getImageUrl(ordenActiva.foto_ingreso)} target="_blank" rel="noreferrer" className="block border rounded p-1 hover:border-hidratec-primary transition">
                                                    <img src={getImageUrl(ordenActiva.foto_ingreso)} alt="Ingreso" className="w-full h-20 object-cover rounded" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* MATERIALES UTILIZADOS */}
                            <div className="bg-white border-2 border-hidratec-primary rounded-lg overflow-hidden shadow-sm">
                                <div className="bg-hidratec-primary text-hidratec-dark font-black text-center py-2 flex justify-between items-center px-4">
                                    <span>MATERIALES UTILIZADOS</span>
                                    {!esSoloLectura && (
                                        <button onClick={agregarItem} className="bg-hidratec-dark text-white text-xs px-3 py-1 rounded flex items-center gap-1 hover:bg-black transition">
                                            <Plus className="h-3 w-3" /> Añadir Material
                                        </button>
                                    )}
                                </div>
                                <div className="overflow-x-auto p-4">
                                    <table className="w-full text-left border-collapse min-w-[800px]">
                                        <thead>
                                            <tr className="text-gray-500 text-xs uppercase border-b-2 border-gray-200">
                                                <th className="p-2 w-20">Cant.</th>
                                                <th className="p-2">Descripción</th>
                                                <th className="p-2 w-20">Stock</th>
                                                <th className="p-2 w-20">Compra</th>
                                                <th className="p-2 w-24">Costo ($)</th>
                                                <th className="p-2">Observaciones</th>
                                                {!esSoloLectura && <th className="p-2 w-10"></th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item, index) => (
                                                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="p-1"><input type="number" disabled={esSoloLectura} className={`${inputClase} text-center`} value={item.cantidad} onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)} /></td>
                                                    <td className="p-1"><input type="text" disabled={esSoloLectura} className={`${inputClase} uppercase`} placeholder="EJ: MANGUERA..." value={item.descripcion} onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)} /></td>
                                                    <td className="p-1"><input type="number" disabled={esSoloLectura} className={`${inputClase} text-center`} value={item.stock} onChange={(e) => handleItemChange(index, 'stock', e.target.value)} /></td>
                                                    <td className="p-1"><input type="number" disabled={esSoloLectura} className={`${inputClase} text-center`} value={item.compra} onChange={(e) => handleItemChange(index, 'compra', e.target.value)} /></td>
                                                    <td className="p-1"><input type="number" step="0.01" disabled={esSoloLectura} className={`${inputClase} text-center`} value={item.costo} onChange={(e) => handleItemChange(index, 'costo', e.target.value)} /></td>
                                                    <td className="p-1"><input type="text" disabled={esSoloLectura} className={`${inputClase} uppercase`} value={item.observaciones} onChange={(e) => handleItemChange(index, 'observaciones', e.target.value)} /></td>
                                                    {!esSoloLectura && (
                                                        <td className="p-1 text-center">
                                                            <button onClick={() => eliminarItem(index)} className="p-2 text-red-400 hover:bg-red-100 rounded transition"><Trash2 className="h-4 w-4" /></button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* NOVEDADES REPORTADAS (CON SOPORTE MULTI FOTO) */}
                            <div className="bg-white border-2 border-hidratec-primary rounded-lg overflow-hidden shadow-sm mt-6">
                                <div className="bg-hidratec-primary text-hidratec-dark font-black text-center py-2 flex justify-between items-center px-4">
                                    <span>NOVEDADES REPORTADAS</span>
                                    {!esSoloLectura && (
                                        <button onClick={agregarNovedad} className="bg-hidratec-dark text-white text-xs px-3 py-1 rounded flex items-center gap-1 hover:bg-black transition">
                                            <Plus className="h-3 w-3" /> Añadir Novedad
                                        </button>
                                    )}
                                </div>
                                <div className="overflow-x-auto p-4">
                                    <table className="w-full text-left border-collapse min-w-[900px]">
                                        <thead>
                                            <tr className="text-gray-500 text-xs uppercase border-b-2 border-gray-200">
                                                <th className="p-2">Item</th>
                                                <th className="p-2 w-32">Fecha</th>
                                                <th className="p-2">Motivo</th>
                                                <th className="p-2 w-20 text-center">Suspendido</th>
                                                <th className="p-2 w-20 text-center">Cancelado</th>
                                                <th className="p-2 w-24 text-center">Evidencia</th>
                                                {!esSoloLectura && <th className="p-2 w-10"></th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {novedades.map((novedad, index) => (
                                                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="p-1"><input type="text" disabled={esSoloLectura} className={`${inputClase} uppercase`} value={novedad.item} onChange={(e) => handleNovedadChange(index, 'item', e.target.value)} /></td>
                                                    <td className="p-1"><input type="date" disabled={esSoloLectura} className={inputClase} value={novedad.fecha ? novedad.fecha.split('T')[0] : ''} onChange={(e) => handleNovedadChange(index, 'fecha', e.target.value)} /></td>
                                                    <td className="p-1"><input type="text" disabled={esSoloLectura} className={`${inputClase} uppercase`} value={novedad.motivo} onChange={(e) => handleNovedadChange(index, 'motivo', e.target.value)} /></td>
                                                    <td className="p-1 text-center"><input type="checkbox" disabled={esSoloLectura} checked={novedad.suspendido} onChange={(e) => handleNovedadChange(index, 'suspendido', e.target.checked)} /></td>
                                                    <td className="p-1 text-center"><input type="checkbox" disabled={esSoloLectura} checked={novedad.cancelado} onChange={(e) => handleNovedadChange(index, 'cancelado', e.target.checked)} /></td>
                                                    
                                                    {/* COLUMNA DE EVIDENCIA MULTI FOTO */}
                                                    <td className="p-1 text-center">
                                                        {!esSoloLectura && (
                                                            <label className="cursor-pointer inline-flex items-center justify-center p-2 text-blue-500 hover:bg-blue-100 rounded transition" title="Adjuntar fotos">
                                                                <Camera className="h-4 w-4" />
                                                                <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleCapturarFotosNovedad(index, e)} />
                                                            </label>
                                                        )}
                                                        {archivosNovedades[index]?.length > 0 && (
                                                            <span className="block text-[10px] font-bold text-hidratec-secondary mt-1">
                                                                +{archivosNovedades[index].length} fotos
                                                            </span>
                                                        )}
                                                    </td>

                                                    {!esSoloLectura && (
                                                        <td className="p-1 text-center">
                                                            <button onClick={() => eliminarNovedad(index)} className="p-2 text-red-400 hover:bg-red-100 rounded transition"><Trash2 className="h-4 w-4" /></button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* SECCIÓN DE FOTOS DE SALIDA (GALERÍA MÚLTIPLE) */}
                            {!esSoloLectura && (
                                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col justify-center mt-6">
                                    {previewsSalida.length > 0 ? (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                                                {previewsSalida.map((prev, index) => (
                                                    <div key={index} className="relative group">
                                                        <img src={prev} alt={`Salida ${index + 1}`} className="w-full h-24 object-cover rounded shadow border" />
                                                        <button type="button" onClick={() => eliminarFotoSalida(index)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600 transition">
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            {previewsSalida.length < 20 && (
                                                <div className="text-center mt-4">
                                                    <label className="cursor-pointer inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-100 transition shadow-sm">
                                                        <UploadCloud className="h-4 w-4" /> Añadir más fotos de salida
                                                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleCapturarFotosSalida} />
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-400">
                                            <Camera className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                            <p className="font-bold text-sm mb-3">Evidencia Fotográfica de Salida</p>
                                            <label className="cursor-pointer bg-hidratec-dark text-white px-4 py-2 rounded-lg font-bold hover:bg-black transition inline-flex items-center justify-center gap-2">
                                                <UploadCloud className="h-5 w-5" /> Tomar/Subir Fotos Finales
                                                <input type="file" multiple accept="image/*" className="hidden" onChange={handleCapturarFotosSalida} />
                                            </label>
                                            <p className="text-xs mt-2 text-gray-400">Puedes adjuntar hasta 20 imágenes del equipo finalizado.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>

                        <div className="p-5 border-t border-gray-200 bg-white flex justify-end gap-4 items-center rounded-b-xl">
                            {esSoloLectura ? (
                                <button onClick={() => setModalAbierto(false)} className="px-8 py-3 bg-hidratec-dark text-white font-black rounded-lg shadow hover:bg-black transition">
                                    Cerrar Vista
                                </button>
                            ) : (
                                <>
                                    <button onClick={() => guardarOrden('EN TALLER')} className="px-6 py-3 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition flex items-center gap-2">
                                        <Save className="h-5 w-5" /> Guardar Progreso (Pausar)
                                    </button>
                                    <button onClick={() => guardarOrden('PARA FACTURAR')} className="px-8 py-3 bg-hidratec-dark text-white font-black rounded-lg shadow-lg hover:bg-black transition flex items-center gap-2">
                                        <CheckCircle className="h-6 w-6 text-green-400" /> Finalizar Trabajo
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}