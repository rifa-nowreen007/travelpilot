import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AIChatWidget from './components/AIChatWidget';
import OfflineBanner from './components/OfflineBanner';

import Home from './pages/Home';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminLogin from './pages/AdminLogin';
import UserDashboard from './pages/UserDashboard';
import MyTrips from './pages/MyTrips';
import LiveTracking from './pages/LiveTracking';
import Itinerary from './pages/Itinerary';
import Safety from './pages/Safety';
import GroupTrip from './pages/GroupTrip';
import GroupChatPage from './pages/GroupChatPage';
import Memories from './pages/Memories';
import PackingChecklist from './pages/PackingChecklist';
import AIAssistant from './pages/AIAssistant';
import AdminPanel from './pages/AdminPanel';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <OfflineBanner />
      <Navbar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Core app pages — require a logged-in account */}
          <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
          <Route path="/my-trips" element={<ProtectedRoute><MyTrips /></ProtectedRoute>} />
          <Route path="/tracking" element={<ProtectedRoute><LiveTracking /></ProtectedRoute>} />
          <Route path="/itinerary" element={<ProtectedRoute><Itinerary /></ProtectedRoute>} />
          <Route path="/safety" element={<ProtectedRoute><Safety /></ProtectedRoute>} />
          <Route path="/group" element={<ProtectedRoute><GroupTrip /></ProtectedRoute>} />
          <Route path="/group-chat" element={<ProtectedRoute><GroupChatPage /></ProtectedRoute>} />
          <Route path="/memories" element={<ProtectedRoute><Memories /></ProtectedRoute>} />
          <Route path="/packing" element={<ProtectedRoute><PackingChecklist /></ProtectedRoute>} />
          <Route path="/assistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Footer />
      <AIChatWidget />
    </div>
  );
}
