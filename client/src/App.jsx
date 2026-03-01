import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Toast from './components/ui/Toast';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import CompleteRegistration from './pages/CompleteRegistration';
import Dashboard from './pages/Dashboard';
import Board from './pages/Board';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Chat from './pages/Chat';
import Calendar from './pages/Calendar';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <WorkspaceProvider>
            <NotificationProvider>
              <Toast />
              <Routes>
                {/* Public */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify" element={<VerifyEmail />} />
                <Route path="/complete-registration" element={<CompleteRegistration />} />

                {/* Private */}
                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/board" element={<Board />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/calendar" element={<Calendar />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </NotificationProvider>
          </WorkspaceProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
