import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Login } from '@/pages/Login';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

function HomePage() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Clinica Orchidea</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.email} ({user?.role})
            </span>
            <Button variant="outline" onClick={signOut}>
              Logout
            </Button>
          </div>
        </div>
      </nav>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">Benvenuto!</h2>
          <p className="text-muted-foreground mb-6">
            Sistema di Prenotazione Appuntamenti
          </p>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        {/* Toast notifications */}
        <Toaster position="top-right" />

        {/* Main routes */}
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />

          {/* TODO: Add more routes */}
          {/* <Route path="/doctors" element={<DoctorsPage />} /> */}
          {/* <Route path="/appointments" element={<AppointmentsPage />} /> */}
          {/* <Route path="/admin/*" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} /> */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
