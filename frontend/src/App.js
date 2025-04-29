import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreatePickup from './pages/CreatePickup';
import PickupList from './pages/PickupList';
import Profile from './pages/Profile';
import PickupDetails from './pages/PickupDetails';
import AdminDashboard from './pages/AdminDashboard';
import NetworkAnalysis from './pages/NetworkAnalysis';
import AdminAnalytics from './pages/AdminAnalytics';

// Components
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import Feedback from './components/Feedback';
import AdminRoute from './components/AdminRoute';

// Context
import { AuthProvider } from './context/AuthContext';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2E7D32', // Green
    },
    secondary: {
      main: '#FFA000', // Amber
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/create-pickup"
              element={
                <PrivateRoute>
                  <CreatePickup />
                </PrivateRoute>
              }
            />
            <Route
              path="/my-pickups"
              element={
                <PrivateRoute>
                  <PickupList />
                </PrivateRoute>
              }
            />
            <Route
              path="/find-pickups"
              element={
                <PrivateRoute>
                  <PickupList />
                </PrivateRoute>
              }
            />
            <Route
              path="/pickups/:id"
              element={
                <PrivateRoute>
                  <PickupDetails />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <PrivateRoute>
                  <AnalyticsDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/feedback"
              element={
                <PrivateRoute>
                  <Feedback />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <PrivateRoute>
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                </PrivateRoute>
              }
            />
            <Route
              path="/network-analysis"
              element={
                <PrivateRoute>
                  <NetworkAnalysis />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <PrivateRoute>
                  <AdminRoute>
                    <AdminAnalytics />
                  </AdminRoute>
                </PrivateRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
