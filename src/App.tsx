import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Login from './pages/Login';

// 路由保护组件
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = localStorage.getItem('authenticated') === 'true';
  const authTime = localStorage.getItem('authTime');

  // 检查是否已认证且认证未过期（1 小时）
  if (isAuthenticated && authTime) {
    const timeDiff = Date.now() - parseInt(authTime);
    const hoursElapsed = timeDiff / (1000 * 60 * 60);

    if (hoursElapsed < 1) {
      return <>{children}</>;
    } else {
      // 认证已过期，清除认证信息
      localStorage.removeItem('authenticated');
      localStorage.removeItem('authTime');
    }
  }

  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
