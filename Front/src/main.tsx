import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import Register from './components/RegisterPage/Register.tsx'
import NewPostForm from './components/NewPostForm/NewPostForm.tsx';
import Dashboard from './components/Dashboard/Dashboard.tsx';
import {
  createBrowserRouter,
  RouterProvider
} from "react-router-dom";

// let userID = undefined;
// async function login() {
//   await for a userID
//   userID = response.userID;
// }

// const postData = [
//   {username: "test",
//   text: "test",
//   likes: 0,
//   comments: 0,
//   postId: 0,
// }
// ]


// postData.map((post, index) =>
//   <Post username={post.username} text={post.text} key={} />
// )

//When you map things, each one needs a "key" prop
//{} means you need an explicit return


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
    element: <NewPostForm/>,
  },
  {
    path: "dashboard",
    element: <Dashboard/>,
  }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router}/>
  </React.StrictMode>,
)
