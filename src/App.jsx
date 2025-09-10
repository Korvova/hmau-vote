import './App.css';
import { Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/users" element={<UsersPage />} />
      <Route path="/divisions" element={<DivisionsPage />} />
      <Route path="/meetings" element={<MeetingsPage />} />
      <Route path="/meetings/archive" element={<ArchivedMeetingsPage />} />
      <Route path="/vote" element={<VotingPage />} />
      <Route path="/screen" element={<ScreenPage />} />
      <Route path="/template" element={<TemplatePage />} />
      <Route path="/linkprofile" element={<LinkProfilePage />} />
      <Route path="/console" element={<ConfigPage />} />
      <Route path="/console/meeting/:id" element={<ControlMeetingPage />} />
      <Route path="/console/meeting/:id/screen" element={<MeetingScreenPage />} />
      <Route path="/report/meeting/:id" element={<ProtocolMeetingPage />} />
    </Routes>
  );
}

export default App;
