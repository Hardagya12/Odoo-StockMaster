import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if it exists
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Auth service
export const authService = {
    signup: async (userData) => {
        const response = await api.post('/auth/signup', userData);
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getCurrentUser: async () => {
        const response = await api.get('/auth/me');
        return response.data.user;
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },

    forgotPassword: async (email) => {
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    },

    verifyOTP: async (email, otp) => {
        const response = await api.post('/auth/verify-otp', { email, otp });
        return response.data;
    },

    resetPassword: async (resetToken, newPassword) => {
        const response = await api.post('/auth/reset-password', { resetToken, newPassword });
        return response.data;
    },

    updateProfile: async (userData) => {
        const response = await api.put('/auth/profile', userData);
        if (response.data.user) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },
};

// Product service
export const productService = {
    getAll: async (params = {}) => {
        const response = await api.get('/products', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/products/${id}`);
        return response.data;
    },

    create: async (productData) => {
        const response = await api.post('/products', productData);
        return response.data;
    },

    update: async (id, productData) => {
        const response = await api.put(`/products/${id}`, productData);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/products/${id}`);
        return response.data;
    },
};

// Category service
export const categoryService = {
    getAll: async () => {
        const response = await api.get('/categories');
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/categories/${id}`);
        return response.data;
    },

    create: async (categoryData) => {
        const response = await api.post('/categories', categoryData);
        return response.data;
    },

    update: async (id, categoryData) => {
        const response = await api.put(`/categories/${id}`, categoryData);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/categories/${id}`);
        return response.data;
    },
};

// Warehouse service
export const warehouseService = {
    getAll: async () => {
        const response = await api.get('/warehouses');
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/warehouses/${id}`);
        return response.data;
    },

    create: async (warehouseData) => {
        const response = await api.post('/warehouses', warehouseData);
        return response.data;
    },

    update: async (id, warehouseData) => {
        const response = await api.put(`/warehouses/${id}`, warehouseData);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/warehouses/${id}`);
        return response.data;
    },
};

// Location service
export const locationService = {
    getAll: async (params = {}) => {
        const response = await api.get('/locations', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/locations/${id}`);
        return response.data;
    },

    create: async (locationData) => {
        const response = await api.post('/locations', locationData);
        return response.data;
    },

    update: async (id, locationData) => {
        const response = await api.put(`/locations/${id}`, locationData);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/locations/${id}`);
        return response.data;
    },
};

// Receipt service
export const receiptService = {
    getAll: async (params = {}) => {
        const response = await api.get('/receipts', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/receipts/${id}`);
        return response.data;
    },

    create: async (receiptData) => {
        const response = await api.post('/receipts', receiptData);
        return response.data;
    },

    update: async (id, receiptData) => {
        const response = await api.put(`/receipts/${id}`, receiptData);
        return response.data;
    },

    validate: async (id) => {
        const response = await api.post(`/receipts/${id}/validate`);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/receipts/${id}`);
        return response.data;
    },
};

// Delivery service
export const deliveryService = {
    getAll: async (params = {}) => {
        const response = await api.get('/deliveries', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/deliveries/${id}`);
        return response.data;
    },

    create: async (deliveryData) => {
        const response = await api.post('/deliveries', deliveryData);
        return response.data;
    },

    update: async (id, deliveryData) => {
        const response = await api.put(`/deliveries/${id}`, deliveryData);
        return response.data;
    },

    validate: async (id) => {
        const response = await api.post(`/deliveries/${id}/validate`);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/deliveries/${id}`);
        return response.data;
    },
};

// Transfer service
export const transferService = {
    getAll: async (params = {}) => {
        const response = await api.get('/transfers', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/transfers/${id}`);
        return response.data;
    },

    create: async (transferData) => {
        const response = await api.post('/transfers', transferData);
        return response.data;
    },

    update: async (id, transferData) => {
        const response = await api.put(`/transfers/${id}`, transferData);
        return response.data;
    },

    validate: async (id) => {
        const response = await api.post(`/transfers/${id}/validate`);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/transfers/${id}`);
        return response.data;
    },
};

// Adjustment service
export const adjustmentService = {
    getAll: async (params = {}) => {
        const response = await api.get('/adjustments', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/adjustments/${id}`);
        return response.data;
    },

    create: async (adjustmentData) => {
        const response = await api.post('/adjustments', adjustmentData);
        return response.data;
    },

    update: async (id, adjustmentData) => {
        const response = await api.put(`/adjustments/${id}`, adjustmentData);
        return response.data;
    },

    validate: async (id) => {
        const response = await api.post(`/adjustments/${id}/validate`);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/adjustments/${id}`);
        return response.data;
    },
};

// Stock move service
export const stockMoveService = {
    getAll: async (params = {}) => {
        const response = await api.get('/stock-moves', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/stock-moves/${id}`);
        return response.data;
    },
};

// Dashboard service
export const dashboardService = {
    getStats: async (params = {}) => {
        const response = await api.get('/dashboard', { params });
        return response.data;
    },
};

// Stock service
export const stockService = {
    getAll: async (params = {}) => {
        const response = await api.get('/stock', { params });
        return response.data;
    },

    adjust: async (stockData) => {
        const response = await api.post('/stock', stockData);
        return response.data;
    },
};

export default api;
