import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import Register from './components/RegisterPage/Register.tsx'
import Create from './components/CreatePost/Create.tsx';
import {
  createBrowserRouter,
  RouterProvider
} from "react-router-dom";



const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "create",
    element: <Create />,
  }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router}/>
  </React.StrictMode>,
)
