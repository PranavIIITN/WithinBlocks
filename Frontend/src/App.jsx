import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Customers from './pages/Customers'
import Invoices from './pages/Invoices'
import AppLayout from './layouts/AppLayout'
import CreateInvoice from './pages/CreateInvoice'
import AddProduct from './pages/AddProduct'
import EditProduct from './pages/EditProduct'
import InvoiceDetail from './pages/InvoiceDetail'
import Settings from './pages/Settings'
import Team from './pages/Team'
import AcceptInvite from './pages/AcceptInvite'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'





function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/accept-invite" element={<AcceptInvite />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<AddProduct />} /> 
        <Route path="products/:id/edit" element={<EditProduct />} />
        <Route path="customers" element={<Customers />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="invoices/new" element={<CreateInvoice />} />
        <Route path="invoices/:id" element={<InvoiceDetail />} />
        <Route path="team" element={<Team />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  )
}

export default App