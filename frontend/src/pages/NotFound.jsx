import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f0f2f5'
    }}>
      <Result
        status="404"
        title="404"
        subTitle="Lo sentimos, la página que visitaste no existe."
        extra={
          <Button 
            type="primary" 
            onClick={() => navigate('/')}
          >
            Volver al inicio
          </Button>
        }
      />
    </div>
  );
};

export default NotFound;
