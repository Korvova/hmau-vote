import './App.css';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import DivisionsPage from './pages/DivisionsPage.jsx';
import MeetingsPage from './pages/MeetingsPage.jsx';
import ArchivedMeetingsPage from './pages/ArchivedMeetingsPage.jsx';
import VotingPage from './pages/VotingPage.jsx';
import ScreenPage from './pages/ScreenPage.jsx';
import ScreenConfigPage from './pages/ScreenConfigPage.jsx';
import ScreenEditorPage from './pages/ScreenEditorPage.jsx';
import RegistrationScreenEditor from './pages/RegistrationScreenEditor.jsx';
import AgendaScreenEditor from './pages/AgendaScreenEditor.jsx';
import VotingScreenEditor from './pages/VotingScreenEditor.jsx';
import FinalScreenEditor from './pages/FinalScreenEditor.jsx';
import TemplatePage from './pages/TemplatePage.jsx';
import DurationTemplatesPage from './pages/DurationTemplatesPage.jsx';
import LinkProfilePage from './pages/LinkProfilePage.jsx';
import ContactsPage from './pages/ContactsPage.jsx';
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
  return user.isAdmin ? <Navigate to="/" replace /> : <Navigate to="/user" replace />;
}
function RequireAdmin({ children }) {
  const user = useAuth();
  const loc = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: loc }} />;
  if (!user.isAdmin) return <Navigate to="/user" replace />;
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
  // Socket removed from App.jsx - connects only on pages needing real-time updates
  // Static pages (divisions, meetings, etc.) load instantly without socket
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RequireAdmin><HomePage /></RequireAdmin>} />
      <Route path="/users" element={<RequireAdmin><UsersPage /></RequireAdmin>} />
      <Route path="/divisions" element={<RequireAdmin><DivisionsPage /></RequireAdmin>} />
      <Route path="/meetings" element={<RequireUser><MeetingsPage /></RequireUser>} />
      <Route path="/meetings/archive" element={<RequireAdmin><ArchivedMeetingsPage /></RequireAdmin>} />
      <Route path="/vote" element={<RequireAdmin><VotingPage /></RequireAdmin>} />
      <Route path="/template" element={<RequireAdmin><TemplatePage /></RequireAdmin>} />
      <Route path="/duration-templates" element={<RequireAdmin><DurationTemplatesPage /></RequireAdmin>} />
      <Route path="/linkprofile" element={<RequireAdmin><LinkProfilePage /></RequireAdmin>} />
      <Route path="/contacts" element={<RequireAdmin><ContactsPage /></RequireAdmin>} />
      <Route path="/console" element={<RequireAdmin><ConfigPage /></RequireAdmin>} />
      <Route path="/console/meeting/:id" element={<RequireAdmin><ControlMeetingPage /></RequireAdmin>} />
      <Route path="/console/meeting/:id/screen" element={<RequireAdmin><MeetingScreenPage /></RequireAdmin>} />
      <Route path="/report/meeting/:id" element={<RequireUser><ProtocolMeetingPage /></RequireUser>} />
      <Route path="/screen" element={<RequireAdmin><ScreenConfigPage /></RequireAdmin>} />
      <Route path="/screen/edit/registration" element={<RequireAdmin><RegistrationScreenEditor /></RequireAdmin>} />
      <Route path="/meeting/:id/screen/edit/registration" element={<RequireAdmin><RegistrationScreenEditor /></RequireAdmin>} />
      <Route path="/screen/edit/agenda" element={<RequireAdmin><AgendaScreenEditor /></RequireAdmin>} />
      <Route path="/screen/edit/voting" element={<RequireAdmin><VotingScreenEditor /></RequireAdmin>} />
      <Route path="/screen/edit/final" element={<RequireAdmin><FinalScreenEditor /></RequireAdmin>} />
      <Route path="/screen/edit/:type" element={<RequireAdmin><ScreenEditorPage /></RequireAdmin>} />
      <Route path="/user" element={<RequireNonAdmin><UserPage /></RequireNonAdmin>} />
      <Route path="*" element={<Guard />} />
    </Routes>
  );
}

export default App;
