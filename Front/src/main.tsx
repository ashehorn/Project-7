import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './App';
import NewPostForm from './components/NewPostForm/NewPostForm';
import Dashboard from './components/Dashboard/Dashboard';
import Login from './components/LoginPage/Login';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },

  {
    path: "/create",
    element: <Layout><NewPostForm /></Layout>,
  },
  {
    path: "/dashboard",
    element: <Layout><Dashboard /></Layout>,
  },
  {
    path: "/app",
    element: <Layout><div>Your App Content Here</div></Layout>,
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);