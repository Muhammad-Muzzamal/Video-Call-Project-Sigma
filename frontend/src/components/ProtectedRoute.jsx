import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    return !!token;
}

const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    const authed = isAuthenticated();

    useEffect(() => {
        if (!authed) {
            toast.error('Please login to access this page');
        }
    }, [authed]);

    if (!authed) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }
    return children;
}

export default ProtectedRoute;
