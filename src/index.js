// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client'; // For React 18+
import './index.css'; // Global styles
import AppRouter from './AppRouter'; // Using AppRouter for more functionality

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
    <React.StrictMode>
        <>
            <AppRouter />
        </>
    </React.StrictMode>
);
