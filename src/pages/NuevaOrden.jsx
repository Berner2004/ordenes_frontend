import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, UserPlus, X, CheckCircle, AlertTriangle, Camera, UploadCloud } from 'lucide-react';
import api from '../services/api';

export default function NuevaOrden() {
    const navigate = useNavigate();

    const [notificacion, setNotificacion] = useState({ mostrar: false, mensaje: '', tipo: 'exito' });
    const [clientes, setClientes] = useState([]);
    const [categoriasBD, setCategoriasBD] = useState([]);
    const [tecnicosBD, setTecnicosBD] = useState([]);
    const [mostrarModal, setMostrarModal] = useState(false);
    
    const [fotoPreview, setFotoPreview] = useState(null);
    const [fotoArchivo, setFotoArchivo] = useState(null);

    const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', ruc: '', direccion: '', telefono: '', correo: '' });
    
    const [formulario, setFormulario] = useState({
        cliente: '', ubicacion: '', responsable_cliente: '', cargo_cliente: '',
        tecnico_responsable: '', personal_extra: '', trabajo_remoto: 'NO',
        tipo_trabajo: '',
        actividad_realizar: '',
        numero_cotizacion: '',
        numero_orden: '' // Número de orden calculado dinámicamente
    });

    const mostrarAlerta = (mensaje, tipo = 'exito') => {
        setNotificacion({ mostrar: true, mensaje, tipo });
        setTimeout(() => setNotificacion({ mostrar: false, mensaje: '', tipo: 'exito' }), 3000);
    };

    useEffect(() => {
        const cargarDatosInciales = async () => {
            try {
                // Cargamos clientes, categorías, técnicos y el próximo número de orden al mismo tiempo
                const [resClientes, resCategorias, resTecnicos, resNumero] = await Promise.all([
                    api.get('/clientes'),
                    api.get('/categorias'),
                    api.get('/usuarios/tecnicos'),
                    api.get('/ordenes/proximo-numero')
                ]);
                
                setClientes(resClientes.data);
                setCategoriasBD(resCategorias.data);
                setTecnicosBD(resTecnicos.data);

                // Si hay categorías, seleccionamos la primera por defecto y cargamos el número de orden
                if (resCategorias.data.length > 0) {
                    setFormulario(prev => ({
                        ...prev,
                        tipo_trabajo: resCategorias.data[0].nombre,
                        numero_orden: resNumero.data.proximoNumero.toString()
                    }));
                } else {
                    // Si no hay categorías pero hay número, al menos cargamos el número
                    setFormulario(prev => ({
                        ...prev,
                        numero_orden: resNumero.data.proximoNumero.toString()
                    }));
                }
            } catch (error) { console.error('Error:', error); }
        };
        cargarDatosInciales();
    }, []);

    const handleChange = (e) => {
        setFormulario({ ...formulario, [e.target.name]: e.target.value });
    };

    const handleClienteChange = (e) => {
        const idCliente = e.target.value;
        const clienteSelect = clientes.find(c => c._id === idCliente);
        setFormulario({
            ...formulario, 
            cliente: idCliente, 
            ubicacion: clienteSelect?.direccion || '', 
            responsable_cliente: '', 
            cargo_cliente: ''
        });
    };

    // Manejar la selección de imagen
    const handleCapturarFoto = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFotoArchivo(file);
            setFotoPreview(URL.createObjectURL(file)); // Crea un enlace temporal para ver la foto en pantalla
        }
    };

    const handleCrearCliente = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/clientes', nuevoCliente);
            setClientes([...clientes, response.data.cliente]);
            setFormulario({ ...formulario, cliente: response.data.cliente._id, ubicacion: response.data.cliente.direccion || '' });
            setMostrarModal(false);
            mostrarAlerta('Nuevo cliente registrado exitosamente');
        } catch (error) { mostrarAlerta('Error al crear el cliente. Verifica el RUC.', 'error'); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formulario.cliente) return mostrarAlerta('Selecciona un cliente del directorio', 'error');

        try {
            // Como enviamos una imagen, ya no podemos usar un JSON normal, debemos usar un FormData (paquete de archivos)
            const formData = new FormData();
            
            // Metemos todos los campos de texto al paquete
            Object.keys(formulario).forEach(key => {
                formData.append(key, formulario[key]);
            });
            formData.append('numero_cotizacion', formulario.numero_cotizacion);

            // Metemos la foto al paquete si existe
            if (fotoArchivo) {
                formData.append('foto', fotoArchivo);
            }

            // Enviamos todo configurando el encabezado para contenido "multipart"
            await api.post('/ordenes', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            mostrarAlerta('¡Orden generada y enviada a Taller con evidencia!');
            setTimeout(() => navigate('/ordenes'), 1500);
        } catch (error) { 
            mostrarAlerta('Hubo un error al crear la orden de trabajo', 'error'); 
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden relative pb-10">
            {notificacion.mostrar && (
                <div className={`fixed top-8 right-8 z-[100] px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 ${notificacion.tipo === 'exito' ? 'bg-hidratec-primary text-hidratec-dark' : 'bg-red-600 text-white'}`}>
                    {notificacion.tipo === 'exito' ? <CheckCircle className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                    <span className="font-black">{notificacion.mensaje}</span>
                </div>
            )}

            <div className="bg-hidratec-dark px-8 py-5 flex justify-between items-center border-b-4 border-hidratec-primary">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-wide">PANEL DE RECEPCIÓN</h1>
                    <p className="text-hidratec-primary font-semibold text-sm">Registro de ingreso y evidencia fotográfica</p>
                </div>
                <button onClick={() => navigate('/ordenes')} className="text-gray-300 hover:text-white flex items-center gap-2">
                    <ArrowLeft className="h-5 w-5" /> Regresar
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* COLUMNA IZQUIERDA Y CENTRAL: DATOS (Ocupa 2 espacios) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white border-2 border-hidratec-primary rounded-lg overflow-hidden">
                        <div className="bg-hidratec-primary text-hidratec-dark font-black text-center py-2">INFORMACIÓN GENERAL</div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">CLIENTE / EMPRESA *</label>
                                <div className="flex gap-2">
                                    <select name="cliente" value={formulario.cliente} onChange={handleClienteChange} className="flex-1 p-2 border rounded focus:ring-2 focus:ring-hidratec-primary font-bold bg-gray-50" required>
                                        <option value="">-- Seleccionar --</option>
                                        {clientes.map(cli => <option key={cli._id} value={cli._id}>{cli.nombre}</option>)}
                                    </select>
                                    <button type="button" onClick={() => setMostrarModal(true)} className="bg-hidratec-dark text-white px-3 py-2 rounded hover:bg-black"><UserPlus className="h-4 w-4" /></button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">CATEGORÍA / TIPO DE TRABAJO *</label>
                                <select name="tipo_trabajo" value={formulario.tipo_trabajo} onChange={handleChange} className="w-full p-2 border rounded font-bold text-hidratec-secondary bg-gray-50">
                                    {categoriasBD.map(cat => (
                                        <option key={cat._id} value={cat.nombre}>{cat.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Nº DE ORDEN DE TRABAJO (EDITABLE)</label>
                                <input type="text" name="numero_orden" value={formulario.numero_orden} onChange={handleChange} className="w-full p-2 border-2 border-hidratec-primary rounded uppercase font-black text-lg text-hidratec-dark bg-hidratec-primary bg-opacity-10 focus:ring-2 focus:ring-hidratec-primary" placeholder="Calculando..." />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Nº DE COTIZACIÓN ASOCIADA (OPCIONAL)</label>
                                <input type="text" name="numero_cotizacion" value={formulario.numero_cotizacion} onChange={handleChange} className="w-full p-2 border rounded uppercase font-mono text-sm" placeholder="Ej. COT-2025-001" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">RESPONSABLE QUE INGRESA EL EQUIPO</label>
                                <input type="text" name="responsable_cliente" value={formulario.responsable_cliente} onChange={handleChange} className="w-full p-2 border rounded uppercase" placeholder="Ej. Ing. Juan Pérez" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">UBICACIÓN / PROCEDENCIA</label>
                                <input type="text" name="ubicacion" value={formulario.ubicacion} onChange={handleChange} className="w-full p-2 border rounded uppercase" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">TÉCNICO ASIGNADO</label>
                                <select name="tecnico_responsable" value={formulario.tecnico_responsable} onChange={handleChange} className="w-full p-2 border rounded font-bold bg-gray-50">
                                    <option value="">-- SIN ASIGNAR --</option>
                                    {tecnicosBD.map(tecnico => (
                                        <option key={tecnico._id} value={tecnico.nombre}>
                                            {tecnico.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">¿TRABAJO REMOTO / EN CAMPO?</label>
                                <select name="trabajo_remoto" value={formulario.trabajo_remoto} onChange={handleChange} className="w-full p-2 border rounded font-bold">
                                    <option value="NO">NO (En Taller)</option>
                                    <option value="SI">SÍ (En Campo)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border-2 border-hidratec-primary rounded-lg overflow-hidden">
                        <div className="bg-hidratec-primary text-hidratec-dark font-black text-center py-2">DETALLE DEL REQUERIMIENTO</div>
                        <div className="p-4">
                            <textarea name="actividad_realizar" value={formulario.actividad_realizar} onChange={handleChange} rows="4" className="w-full p-3 border rounded focus:ring-2 focus:ring-hidratec-primary" placeholder="Describa el estado, accesorios recibidos y el requerimiento exacto del cliente..."></textarea>
                        </div>
                    </div>
                </div>

                {/* COLUMNA DERECHA: EVIDENCIA FOTOGRÁFICA */}
                <div className="space-y-6">
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden flex flex-col items-center justify-center p-6 min-h-[300px] relative">
                        {fotoPreview ? (
                            <>
                                <img src={fotoPreview} alt="Evidencia" className="w-full h-auto rounded shadow-md object-cover" />
                                <button type="button" onClick={() => { setFotoPreview(null); setFotoArchivo(null); }} className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-lg">
                                    <X className="h-4 w-4" />
                                </button>
                            </>
                        ) : (
                            <div className="text-center text-gray-400">
                                <Camera className="h-16 w-16 mx-auto mb-2 opacity-50" />
                                <p className="font-bold text-sm mb-4">Evidencia Fotográfica de Ingreso</p>
                                
                                <label className="cursor-pointer bg-hidratec-dark text-white px-4 py-2 rounded-lg font-bold hover:bg-black transition flex items-center justify-center gap-2">
                                    <UploadCloud className="h-5 w-5" /> Subir o Tomar Foto
                                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCapturarFoto} />
                                </label>
                                <p className="text-xs mt-2 text-gray-400">Soporta cámara de celular o PC</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded text-xs text-gray-600">
                        <p className="font-semibold text-blue-700 mb-1">💡 Tip: Número de orden</p>
                        <p>El sistema sugiere el número correlativo, pero puedes hacer clic y cambiarlo si es necesario.</p>
                    </div>

                    <button type="submit" className="w-full bg-hidratec-dark text-white font-black py-4 rounded-lg shadow-lg hover:bg-black transition flex items-center justify-center gap-3 text-lg">
                        <Save className="h-6 w-6 text-hidratec-primary" /> Generar Ingreso
                    </button>
                </div>
            </form>

            {/* Modal de Cliente Rápido */}
            {mostrarModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border-t-8 border-hidratec-primary">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-hidratec-dark">Registro Rápido</h2>
                            <button onClick={() => setMostrarModal(false)}><X className="h-6 w-6 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleCrearCliente} className="p-6 space-y-4">
                            <input type="text" placeholder="Empresa *" required className="w-full p-3 border rounded" onChange={(e) => setNuevoCliente({...nuevoCliente, nombre: e.target.value})} />
                            <input type="text" placeholder="RUC *" required className="w-full p-3 border rounded" onChange={(e) => setNuevoCliente({...nuevoCliente, ruc: e.target.value})} />
                            <input type="text" placeholder="Dirección" className="w-full p-3 border rounded" onChange={(e) => setNuevoCliente({...nuevoCliente, direccion: e.target.value})} />
                            <button type="submit" className="w-full py-3 bg-hidratec-dark text-white rounded-lg font-bold hover:bg-black">Guardar Cliente</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}