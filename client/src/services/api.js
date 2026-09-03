import axios from 'axios';

const USER_INFO_KEY = 'userInfo';
const defaultApiUrl = 'http://localhost:5001/api';

const getStorage = () => {
    if (typeof window === 'undefined') return null;

    try {
        return window.localStorage;
    } catch {
        return null;
    }
};

export const getStoredUser = () => {
    const storage = getStorage();
    if (!storage) return null;

    try {
        const storedUser = storage.getItem(USER_INFO_KEY);
        if (!storedUser) return null;

        const userInfo = JSON.parse(storedUser);
        if (!userInfo || typeof userInfo.token !== 'string' || !userInfo.token) {
            throw new Error('Stored user is invalid');
        }

        return userInfo;
    } catch {
        storage.removeItem(USER_INFO_KEY);
        return null;
    }
};

export const saveStoredUser = (userInfo) => {
    const storage = getStorage();
    if (storage) {
        storage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
    }
};

export const clearStoredUser = () => {
    const storage = getStorage();
    if (storage) {
        storage.removeItem(USER_INFO_KEY);
    }
};

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL?.replace(/\/$/, '') || defaultApiUrl
});

// Request interceptor — attach JWT token to every outgoing request
API.interceptors.request.use(
    (config) => {
        const userInfo = getStoredUser();
        if (userInfo?.token) {
            config.headers.Authorization = `Bearer ${userInfo.token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor — handle 401 (expired/invalid token)
API.interceptors.response.use(
    (response) => response,
    (error) => {
        const requestUrl = error.config?.url || '';
        const isAuthRequest = /^\/?auth(?:\/|$)/.test(requestUrl);

        if (error.response?.status === 401 && !isAuthRequest) {
            clearStoredUser();

            if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                window.location.assign('/login');
            }
        }
        return Promise.reject(error);
    }
);

export default API;
