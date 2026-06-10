import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(''); 
        
        try {
            // ¡AQUÍ ESTÁ LA SOLUCIÓN! Le damos la URL completa y estricta
            const response = await api.post('https://ordenes-backend-cy57.onrender.com/api/auth/login', { correo: email, password });
            
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('usuario', JSON.stringify(response.data));
            localStorage.setItem('rol', response.data.rol);

            if (response.data.rol === 'TALLER') {
                navigate('/taller');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            console.error("Detalle del error:", err);
            setError(err.response?.data?.error || 'Error al conectar con el servidor.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-hidratec-light">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border-t-8 border-hidratec-primary">
                
                {/* Contenedor del Logo */}
                <div className="flex justify-center mb-6">
                    <img 
                        src="/hidratec-logo.png" 
                        alt="Logo HIDRATEC" 
                        className="h-20 object-contain"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/150x60?text=HIDRATEC'; }} 
                    />
                </div>
                
                <h2 className="text-2xl font-black text-center text-hidratec-dark mb-1">ACCESO AL SISTEMA</h2>
                <p className="text-center text-gray-500 mb-8 text-sm font-medium tracking-wide">ÓRDENES DE TRABAJO</p>

                {/* Alerta de Error */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-sm text-sm">
                        <p className="font-bold">Error de acceso</p>
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-hidratec-dark text-sm font-bold mb-2">Correo Electrónico</label>
                        <input 
                            type="email" 
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hidratec-primary focus:border-transparent transition-all"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="usuario@hidratec.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-hidratec-dark text-sm font-bold mb-2">Contraseña</label>
                        <input 
                            type="password" 
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hidratec-primary focus:border-transparent transition-all"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="w-full bg-hidratec-primary text-hidratec-dark font-black py-3 px-4 rounded-lg hover:bg-yellow-500 transition duration-300 shadow-md mt-4 uppercase"
                    >
                        Ingresar
                    </button>
                </form>
            </div>
        </div>
    );
}