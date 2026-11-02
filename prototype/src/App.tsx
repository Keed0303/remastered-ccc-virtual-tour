import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

// Each page loads its own global stylesheet, so links between them are full page loads.
const CampusPage = lazy(() => import('./components/campus/CampusPage'));
const AdminPage = lazy(() => import('./components/admin/AdminPage'));

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<CampusPage />} />
        <Route path="/index.html" element={<Navigate to="/" replace />} />
        <Route path="/admin.html" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Suspense>
  );
}
