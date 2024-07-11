import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Route, createRoutesFromElements } from 'react-router-dom';
import Layout from './App';
import NewPostForm from './components/NewPostForm/NewPostForm';
import Dashboard from './components/Dashboard/Dashboard';
import Login from './components/LoginPage/Login';
import { AuthProvider } from './components/AuthContext';
import PrivateRoute from './components/PrivateRoute';

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Login />} />
      <Route element={<PrivateRoute />}>
        <Route path="/create" element={<Layout><NewPostForm /></Layout>} />
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/app" element={<Layout><div>Your App Content Here</div></Layout>} />
      </Route>
    </>
  )
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
);