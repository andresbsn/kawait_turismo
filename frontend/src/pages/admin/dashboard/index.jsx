import React from 'react';
import { Navigate } from 'react-router-dom';

// Este componente redirige a la ruta del dashboard
const Dashboard = () => {
  return <Navigate to="/admin/dashboard" replace />;
};

export default Dashboard;
