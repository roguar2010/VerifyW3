import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Verify from './pages/Verify';
import Issue from './pages/Issue';
import Institutions from './pages/Institutions';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="verificar" element={<Verify />} />
        <Route path="emisor" element={<Issue />} />
        <Route path="instituciones" element={<Institutions />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
