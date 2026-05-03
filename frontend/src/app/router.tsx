import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../features/auth/pages/login.page';
import Dashboard from '../pages/dashboard';
import ContractsPage from '../features/contracts/pages/contracts.page';
import CreateContractPage from '../features/contracts/pages/create-contract.page';
import EditContractPage from '../features/contracts/pages/edit-contract.page';
import AppLayout from '../components/layout/app-layout';
import ContractDetailsPage from '../features/contracts/pages/contract-details.page';
import UsersPage from '../features/users/pages/users.page';
import SignaturePage from '../features/contracts/pages/signature.page';

type StoredUserRole = 'ADMIN' | 'USER';
const isAuth = () => !!localStorage.getItem('token');

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return isAuth() ? children : <Navigate to="/" />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role') as StoredUserRole | null;

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signature/:token" element={<SignaturePage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/contracts"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ContractsPage />
              </AppLayout>
            </ProtectedRoute>
          }
          />
          <Route
          path="/contracts/new"
          element={
           <ProtectedRoute>
            <AppLayout>
             <CreateContractPage />
            </AppLayout>
           </ProtectedRoute>
          }
          />

          <Route
          path="/contracts/:id/edit"
          element={
           <ProtectedRoute>
            <AppLayout>
              <EditContractPage />
           </AppLayout>
           </ProtectedRoute>
           
          }
          />
          <Route
          path="/contracts/:id"
          element={
          <ProtectedRoute>
          <AppLayout>
          <ContractDetailsPage />
          </AppLayout>
          </ProtectedRoute>
           }
         />

         <Route
         path="/users"
         element={
           <AdminRoute>
           < AppLayout>
             <UsersPage />
           </AppLayout>
           </AdminRoute>
         }
        />
      </Routes>
    </BrowserRouter>
  );
}
