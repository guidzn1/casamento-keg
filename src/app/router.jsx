import { createBrowserRouter } from "react-router-dom";
import SiteLayout from "./SiteLayout";

import Home from "../pages/Home";
import Cerimonia from "../pages/Cerimonia";
import Novidades from "../pages/Novidades";
import Presentes from "../pages/Presentes";
import Rsvp from "../pages/Rsvp";
import NotFound from "../pages/NotFound";

import AdminLogin from "../pages/admin/Login";
import AdminDashboard from "../pages/admin/Dashboard";
import ProtectedRoute from "../components/ProtectedRoute";
import AdminGuard from "../pages/admin/AdminGuard";



export const router = createBrowserRouter([
  {
    path: "/",
    element: <SiteLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "cerimonia", element: <Cerimonia /> },
      { path: "novidades", element: <Novidades /> },
      { path: "presentes", element: <Presentes /> },
      { path: "rsvp", element: <Rsvp /> },
    ],
  },

  /* ===== ADMIN ===== */
  {
    path: "/admin",
    element: <AdminLogin />,
  },
{
  path: "/admin/dashboard",
  element: (
    <AdminGuard>
      <AdminDashboard />
    </AdminGuard>
  ),
},



  /* ===== 404 ===== */
  {
    path: "*",
    element: <NotFound />,
  },
]);
