import { Routes, Route, Navigate } from 'react-router-dom'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import ChangePassword from './pages/ChangePassword.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import MerchantKYC from './pages/merchant/MerchantKYC.jsx'
import MerchantStatus from './pages/merchant/MerchantStatus.jsx'
import ReviewerDashboard from './pages/reviewer/ReviewerDashboard.jsx'
import ReviewerDetail from './pages/reviewer/ReviewerDetail.jsx'

function PrivateRoute({ children, role }) {
  const token = localStorage.getItem('access_token')
  const userRole = localStorage.getItem('user_role')
  if (!token) return <Navigate to="/login" replace />
  if (role && userRole !== role) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/change-password" element={
        <PrivateRoute><ChangePassword /></PrivateRoute>
      } />

      <Route path="/kyc" element={
        <PrivateRoute role="merchant"><MerchantKYC /></PrivateRoute>
      } />
      <Route path="/kyc/status" element={
        <PrivateRoute role="merchant"><MerchantStatus /></PrivateRoute>
      } />

      <Route path="/reviewer" element={
        <PrivateRoute role="reviewer"><ReviewerDashboard /></PrivateRoute>
      } />
      <Route path="/reviewer/submissions/:id" element={
        <PrivateRoute role="reviewer"><ReviewerDetail /></PrivateRoute>
      } />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
