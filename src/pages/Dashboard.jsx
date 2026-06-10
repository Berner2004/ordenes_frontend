import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Filter, FileText, Wrench, DollarSign, CheckCircle, Clock, RefreshCw, BarChart2, Activity, ArrowRight } from 'lucide-react';
import api from '../services/api';

export default function Dashboard() {
    const navigate = useNavigate();
    const [ordenes, setOrdenes] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [cargando, setCargando] = useState(true);

    // Filtros
    const [filtroCategoria, setFiltroCategoria] = useState('');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');

    const cargarDatos = async () => {
        try {
            setCargando(true);
            const [resOrdenes, resCategorias] = await Promise.all([
                api.get('/ordenes'),
                api.get('/categorias')
            ]);
            setOrdenes(resOrdenes.data);
            setCategorias(resCategorias.data);
        } catch (error) {
            console.error('Error al cargar métricas', error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { cargarDatos(); }, []);

    // ==========================================
    //        FILTRADO GENERAL
    // ==========================================
    const ordenesFiltradas = ordenes.filter(orden => {
        if (filtroCategoria && orden.tipo_trabajo !== filtroCategoria) return false;

        const fechaOrden = orden.createdAt ? new Date(orden.createdAt) : new Date();
        if (fechaDesde && fechaOrden < new Date(fechaDesde + 'T00:00:00')) return false;
        if (fechaHasta && fechaOrden > new Date(fechaHasta + 'T23:59:59')) return false;

        return true;
    });

    // ==========================================
    //       KPIs PRINCIPALES
    // ==========================================
    const totalFiltradas = ordenesFiltradas.length;
    const abiertas = ordenesFiltradas.filter(o => o.estado === 'ABIERTA').length;
    const enTaller = ordenesFiltradas.filter(o => o.estado === 'EN TALLER').length;
    const paraFacturar = ordenesFiltradas.filter(o => o.estado === 'PARA FACTURAR').length;
    const finalizadas = ordenesFiltradas.filter(o => o.estado === 'FINALIZADA').length;

    const costoMaterialesTotal = ordenesFiltradas.reduce((sum, orden) => {
        const costoOrden = orden.items?.reduce((s, item) => s + ((item.costo || 0) * (item.cantidad || 1)), 0) || 0;
        return sum + costoOrden;
    }, 0);

    // ==========================================
    //    GRÁFICO DINÁMICO POR DÍAS (Línea de Tiempo)
    // ==========================================
    const ordenesPorFecha = {};
    ordenesFiltradas.forEach(orden => {
        const fecha = orden.createdAt ? new Date(orden.createdAt) : new Date();
        const fechaStr = fecha.toISOString().split('T')[0]; // Formato YYYY-MM-DD
        ordenesPorFecha[fechaStr] = (ordenesPorFecha[fechaStr] || 0) + 1;
    });

    // Ordenamos las fechas de más antigua a más reciente
    const fechasOrdenadas = Object.keys(ordenesPorFecha).sort();
    const datosGrafico = fechasOrdenadas.map(fecha => ({
        fechaOriginal: fecha,
        etiqueta: new Date(fecha + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase(),
        cantidad: ordenesPorFecha[fecha]
    }));

    const maxTrabajosDiarios = Math.max(...datosGrafico.map(d => d.cantidad), 1);

    // ==========================================
    //    TABLA EN VIVO: ÓRDENES DEL DÍA / RECIENTES
    // ==========================================
    // Tomamos las últimas 7 órdenes modificadas o creadas para el panel de acceso rápido
    const ordenesRecientes = [...ordenesFiltradas]
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
        .slice(0, 7);

    const limpiarFiltros = () => {
        setFiltroCategoria('');
        setFechaDesde('');
        setFechaHasta('');
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

    if (cargando) {
        return (
            <div className="flex justify-center items-center h-64 text-gray-500 font-bold gap-2">
                <RefreshCw className="h-6 w-6 animate-spin text-hidratec-primary" /> Analizando datos del sistema...
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            
            {/* ENCABEZADO */}
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-black text-hidratec-dark flex items-center gap-2">
                        <LayoutDashboard className="h-7 w-7 text-hidratec-primary" /> Dashboard Operativo
                    </h1>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Control de flujo, productividad y métricas en tiempo real</p>
                </div>
                <button onClick={cargarDatos} className="p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-hidratec-primary hover:text-hidratec-dark transition font-bold text-sm flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" /> Actualizar
                </button>
            </div>

            {/* FILTROS */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                    <label className="block text-xs font-black text-gray-500 uppercase mb-2 flex items-center gap-1"><Calendar className="h-3 w-3"/> Desde el día:</label>
                    <input type="date" className="w-full p-2 border rounded font-bold text-sm bg-gray-50" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
                </div>
                <div>
                    <label className="block text-xs font-black text-gray-500 uppercase mb-2 flex items-center gap-1"><Calendar className="h-3 w-3"/> Hasta el día:</label>
                    <input type="date" className="w-full p-2 border rounded font-bold text-sm bg-gray-50" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
                </div>
                <div>
                    <label className="block text-xs font-black text-gray-500 uppercase mb-2 flex items-center gap-1"><Filter className="h-3 w-3"/> Categoría / Tipo:</label>
                    <select className="w-full p-2 border rounded font-bold text-sm bg-gray-50 uppercase text-hidratec-secondary" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
                        <option value="">-- TODAS LAS CATEGORÍAS --</option>
                        {categorias.map(cat => <option key={cat._id} value={cat.nombre}>{cat.nombre}</option>)}
                    </select>
                </div>
                <div>
                    <button onClick={limpiarFiltros} className="w-full py-2 bg-gray-800 text-white font-bold text-sm rounded hover:bg-black transition">
                        Limpiar Filtros
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between border-l-4 border-hidratec-dark">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">Volumen Total (Filtro)</p>
                        <p className="text-2xl font-black text-hidratec-dark mt-1">{totalFiltradas}</p>
                    </div>
                    <FileText className="h-10 w-10 text-gray-300" />
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between border-l-4 border-blue-500">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">En Proceso / Diagnóstico</p>
                        <p className="text-2xl font-black text-blue-600 mt-1">{abiertas + enTaller}</p>
                    </div>
                    <Clock className="h-10 w-10 text-blue-200" />
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between border-l-4 border-red-500">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">Pendientes de Cobro</p>
                        <p className="text-2xl font-black text-red-600 mt-1">{paraFacturar}</p>
                    </div>
                    <Wrench className="h-10 w-10 text-red-200" />
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between border-l-4 border-green-500">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">Costo Materiales (Total)</p>
                        <p className="text-2xl font-black text-green-600 mt-1">${costoMaterialesTotal.toFixed(2)}</p>
                    </div>
                    <DollarSign className="h-10 w-10 text-green-200" />
                </div>
            </div>

            {/* GRÁFICOS Y ESTADO GENERAL */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LÍNEA DE TIEMPO (Gráfico Dinámico) */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 lg:col-span-2">
                    <h3 className="text-base font-black text-hidratec-dark mb-6 flex items-center gap-2 uppercase tracking-wide">
                        <BarChart2 className="h-5 w-5 text-hidratec-primary" /> Evolución de Ingresos (Línea de Tiempo)
                    </h3>
                    
                    {datosGrafico.length === 0 ? (
                        <div className="h-64 flex items-center justify-center text-gray-400 font-bold italic border-b border-gray-200">
                            No hay datos en el rango seleccionado
                        </div>
                    ) : (
                        <div className="overflow-x-auto pb-4">
                            <div className="flex items-end h-64 border-b border-gray-200 gap-2 min-w-max px-4">
                                {datosGrafico.map((dato, index) => {
                                    const porcentajeAltura = (dato.cantidad / maxTrabajosDiarios) * 100;
                                    
                                    return (
                                        <div key={index} className="flex flex-col items-center group w-16 flex-shrink-0">
                                            <span className="text-xs font-black text-hidratec-dark mb-2 opacity-0 group-hover:opacity-100 transition duration-200 bg-hidratec-light px-2 py-0.5 rounded shadow">
                                                {dato.cantidad}
                                            </span>
                                            
                                            <div 
                                                style={{ height: `${Math.max(porcentajeAltura, 8)}%` }} 
                                                className={`w-full rounded-t transition-all duration-300 shadow-sm border border-b-0 border-gray-200 ${
                                                    dato.cantidad > 0 ? 'bg-[#1e3a8a] hover:bg-hidratec-primary hover:border-hidratec-primary' : 'bg-gray-100'
                                                }`}
                                            ></div>
                                            
                                            <span className="text-[10px] font-bold text-gray-500 mt-2 text-center break-words w-full">
                                                {dato.etiqueta}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* ESTADO DEL FLUJO (Progreso) */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                    <h3 className="text-base font-black text-hidratec-dark mb-6 flex items-center gap-2 uppercase tracking-wide">
                        <CheckCircle className="h-5 w-5 text-hidratec-primary" /> Salud del Flujo
                    </h3>
                    
                    <div className="space-y-5">
                        {[
                            { name: '1. Abiertas / Ingreso', count: abiertas, color: 'bg-blue-500' },
                            { name: '2. En Ejecución Taller', count: enTaller, color: 'bg-yellow-500' },
                            { name: '3. Esperando Factura', count: paraFacturar, color: 'bg-red-500' },
                            { name: '4. Finalizadas', count: finalizadas, color: 'bg-green-500' }
                        ].map((item, index) => {
                            const porcentaje = totalFiltradas > 0 ? (item.count / totalFiltradas) * 100 : 0;
                            return (
                                <div key={index} className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-gray-600 uppercase">{item.name}</span>
                                        <span className="text-hidratec-dark font-black">{item.count} ({porcentaje.toFixed(0)}%)</span>
                                    </div>
                                    <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden border border-gray-200 shadow-inner">
                                        <div style={{ width: `${porcentaje}%` }} className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out`}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* SECCIÓN INFERIOR: ACCESO DIRECTO A ÓRDENES EN VIVO */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-base font-black text-hidratec-dark flex items-center gap-2 uppercase tracking-wide">
                        <Activity className="h-5 w-5 text-hidratec-primary" /> Actividad Reciente / Órdenes en Vivo
                    </h3>
                    <button onClick={() => navigate('/ordenes')} className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                        Ver todas <ArrowRight className="h-3 w-3" />
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white text-gray-500 text-xs uppercase border-b border-gray-200">
                                <th className="p-4 font-black">Nº Orden</th>
                                <th className="p-4 font-black">Cliente / Requerimiento</th>
                                <th className="p-4 font-black">Técnico Asignado</th>
                                <th className="p-4 font-black text-center">Estado Actual</th>
                                <th className="p-4 font-black text-center">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ordenesRecientes.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-400 italic font-bold">
                                        No hay actividad reciente.
                                    </td>
                                </tr>
                            ) : (
                                ordenesRecientes.map((orden) => (
                                    <tr key={orden._id} className="border-b border-gray-50 hover:bg-hidratec-light transition">
                                        <td className="p-4 font-black text-hidratec-dark">OT-{orden.numero_orden || 'S/N'}</td>
                                        <td className="p-4">
                                            <p className="font-bold text-gray-800 uppercase text-sm">{orden.cliente?.nombre}</p>
                                            <p className="text-xs text-gray-500 truncate max-w-xs uppercase">{orden.actividad_realizar}</p>
                                        </td>
                                        <td className="p-4 text-sm font-bold text-gray-600 uppercase">
                                            {orden.tecnico_responsable || 'SIN ASIGNAR'}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded text-[10px] font-black border uppercase tracking-wider ${getEstadoEstilo(orden.estado)}`}>
                                                {orden.estado}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            {/* Este botón envía al usuario a la vista de órdenes */}
                                            <button onClick={() => navigate('/ordenes')} className="p-2 bg-gray-100 hover:bg-blue-600 hover:text-white text-gray-600 rounded transition" title="Ir a Gestión de Órdenes">
                                                <ArrowRight className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}