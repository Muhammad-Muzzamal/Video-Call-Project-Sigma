import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    return !!token;
}

const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    if (!isAuthenticated()) {
        toast.error('Please login to access this page');
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }
    return children;
}

export default ProtectedRoute;
