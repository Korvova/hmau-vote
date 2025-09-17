import './App.css';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import DivisionsPage from './pages/DivisionsPage.jsx';
import MeetingsPage from './pages/MeetingsPage.jsx';
import ArchivedMeetingsPage from './pages/ArchivedMeetingsPage.jsx';
import VotingPage from './pages/VotingPage.jsx';
import ScreenPage from './pages/ScreenPage.jsx';
import TemplatePage from './pages/TemplatePage.jsx';
import LinkProfilePage from './pages/LinkProfilePage.jsx';
import ConfigPage from './pages/ConfigPage.jsx';
import ControlMeetingPage from './pages/ControlMeetingPage.jsx';
import ProtocolMeetingPage from './pages/ProtocolMeetingPage.jsx';
import MeetingScreenPage from './pages/MeetingScreenPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import UserPage from './pages/UserPage.jsx';

function useAuth() {
  try {
    const raw = localStorage.getItem('authUser');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function Guard() {
  const user = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return user.isAdmin ? <Navigate to="/" replace /> : <Navigate to="/screen" replace />;
}
function RequireAdmin({ children }) {
  const user = useAuth();
  const loc = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: loc }} />;
  if (!user.isAdmin) return <Navigate to="/screen" replace />;
  return children;
}
function RequireUser({ children }) {
  const user = useAuth();
  const loc = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: loc }} />;
  return children;
}

function RequireNonAdmin({ children }) {
  const user = useAuth();
  const loc = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: loc }} />;
  if (user.isAdmin) return <Navigate to="/" replace />;
  return children;
}


function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RequireAdmin><HomePage /></RequireAdmin>} />
      <Route path="/users" element={<RequireAdmin><UsersPage /></RequireAdmin>} />
      <Route path="/divisions" element={<RequireAdmin><DivisionsPage /></RequireAdmin>} />
      <Route path="/meetings" element={<RequireAdmin><MeetingsPage /></RequireAdmin>} />
      <Route path="/meetings/archive" element={<RequireAdmin><ArchivedMeetingsPage /></RequireAdmin>} />
      <Route path="/vote" element={<RequireAdmin><VotingPage /></RequireAdmin>} />
      <Route path="/template" element={<RequireAdmin><TemplatePage /></RequireAdmin>} />
      <Route path="/linkprofile" element={<RequireAdmin><LinkProfilePage /></RequireAdmin>} />
      <Route path="/console" element={<RequireAdmin><ConfigPage /></RequireAdmin>} />
      <Route path="/console/meeting/:id" element={<RequireAdmin><ControlMeetingPage /></RequireAdmin>} />
      <Route path="/console/meeting/:id/screen" element={<RequireAdmin><MeetingScreenPage /></RequireAdmin>} />
      <Route path="/report/meeting/:id" element={<RequireAdmin><ProtocolMeetingPage /></RequireAdmin>} />
      <Route path="/screen" element={<RequireUser><ScreenPage /></RequireUser>} />
      <Route path="/user" element={<RequireNonAdmin><UserPage /></RequireNonAdmin>} />
      <Route path="*" element={<Guard />} />
    </Routes>
  );
}

export default App;
