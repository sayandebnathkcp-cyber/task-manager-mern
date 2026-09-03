import { createContext, useContext, useState, useEffect } from 'react';
import API, { clearStoredUser, getStoredUser, saveStoredUser } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // On mount, check if user info exists in localStorage
    useEffect(() => {
        setUser(getStoredUser());
        setLoading(false);
    }, []);

    const register = async (name, email, password) => {
        const { data } = await API.post('/auth/register', { name, email, password });
        const userInfo = {
            _id: data.user._id,
            name: data.user.name,
            email: data.user.email,
            token: data.token
        };
        saveStoredUser(userInfo);
        setUser(userInfo);
        return data;
    };

    const login = async (email, password) => {
        const { data } = await API.post('/auth/login', { email, password });
        const userInfo = {
            _id: data.user._id,
            name: data.user.name,
            email: data.user.email,
            token: data.token
        };
        saveStoredUser(userInfo);
        setUser(userInfo);
        return data;
    };

    const logout = () => {
        clearStoredUser();
        setUser(null);
    };

    const value = {
        user,
        loading,
        register,
        login,
        logout,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
