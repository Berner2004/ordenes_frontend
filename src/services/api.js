import axios from 'axios';

const api = axios.create({
    baseURL: 'https://ordenes-backend-cy57.onrender.com', // Cambia esto por la URL de tu backend
});

// Interceptor: Antes de cada petición, revisa si hay un token y lo adjunta
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;