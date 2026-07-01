import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppContext } from './context/AppContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import QuoteCalculator from './pages/QuoteCalculator';
import Quotes from './pages/Quotes';
import CreateOrder from './pages/CreateOrder';
import Production from './pages/Production';
import Finance from './pages/Finance';
import AdminTestPricing from './pages/AdminTestPricing';
import AdminExtraPricing from './pages/AdminExtraPricing';

// New placeholders
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Inventory from './pages/Inventory';
import Cashbook from './pages/Cashbook';
import Debt from './pages/Debt';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { currentUser } = useAppContext();
    if (!currentUser) return <Navigate to="/login" />;
    if (allowedRoles && !allowedRoles.includes(currentUser.role)) return <Navigate to="/" />;
    return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calculator" element={<ProtectedRoute allowedRoles={['admin','sale']}><QuoteCalculator /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute allowedRoles={['admin','sale']}><Quotes /></ProtectedRoute>} />
          <Route path="/create-order" element={<ProtectedRoute allowedRoles={['admin','sale']}><CreateOrder /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute allowedRoles={['admin','sale']}><Customers /></ProtectedRoute>} />
          
          <Route path="/production" element={<ProtectedRoute allowedRoles={['admin','production']}><Production /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute allowedRoles={['admin','production','accountant']}><Inventory /></ProtectedRoute>} />
          
          <Route path="/finance" element={<ProtectedRoute allowedRoles={['admin','accountant']}><Finance /></ProtectedRoute>} />
          <Route path="/cashbook" element={<ProtectedRoute allowedRoles={['admin','accountant']}><Cashbook /></ProtectedRoute>} />
          <Route path="/debt" element={<ProtectedRoute allowedRoles={['admin','accountant']}><Debt /></ProtectedRoute>} />
          <Route path="/suppliers" element={<ProtectedRoute allowedRoles={['admin','accountant','production']}><Suppliers /></ProtectedRoute>} />

          <Route path="/test-pricing" element={<ProtectedRoute allowedRoles={['admin','sale']}><AdminTestPricing /></ProtectedRoute>} />
          <Route path="/test-extra" element={<ProtectedRoute allowedRoles={['admin','sale']}><AdminExtraPricing /></ProtectedRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
// Trigger HMR
export default App;