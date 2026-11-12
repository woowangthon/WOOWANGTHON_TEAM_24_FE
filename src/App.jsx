import { useState } from 'react'
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom'
import './App.css'
import DashboardPage from './pages/DashboardPage.jsx'
import HomePage from './pages/HomePage.jsx'
import ProgressPage from './pages/ProgressPage.jsx'
import ReviewPage from './pages/ReviewPage.jsx'
import StudentPage from './pages/StudentPage.jsx'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

function RoleSelection({ onLogin }) {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function selectRole(role) {
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })

      if (!response.ok) {
        throw new Error('입장에 실패했습니다. 서버를 확인해 주세요.')
      }

      const data = await response.json()

      if (data.role !== role) {
        throw new Error('서버에서 예상하지 못한 역할을 받았습니다.')
      }

      onLogin(role)
      navigate(role === 'reviewer' ? '/dashboard' : '/student')
    } catch {
      setError('입장에 실패했습니다. BE 서버가 실행 중인지 확인해 주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section>
      <h1>보이는 강의</h1>
      <p>테스트 계정으로 입장할 역할을 선택해 주세요.</p>
      {error && <p role="alert">{error}</p>}
      <button type="button" disabled={loading} onClick={() => selectRole('reviewer')}>
        검수자로 입장
      </button>
      <button type="button" disabled={loading} onClick={() => selectRole('student')}>
        학생으로 입장
      </button>
    </section>
  )
}

function App() {
  const [role, setRole] = useState(() => {
    const savedRole = sessionStorage.getItem('role')
    return savedRole === 'reviewer' || savedRole === 'student'
      ? savedRole
      : null
  })

  function login(selectedRole) {
    sessionStorage.setItem('role', selectedRole)
    setRole(selectedRole)
  }

  function logout() {
    sessionStorage.removeItem('role')
    setRole(null)
  }

  function reviewerOnly(page) {
    return role === 'reviewer' ? page : <Navigate to="/" replace />
  }

  return (
    <BrowserRouter>
      <header className="site-header">
        <NavLink className="brand" to="/">보이는 강의</NavLink>
        <nav aria-label="주요 메뉴">
          {role === 'reviewer' && (
            <>
              <NavLink to="/dashboard">대시보드</NavLink>
              <NavLink to="/upload">자료 등록</NavLink>
            </>
          )}
          {role && <NavLink to="/student">학생 화면</NavLink>}
          {role && (
            <button type="button" onClick={logout}>역할 변경</button>
          )}
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<RoleSelection onLogin={login} />} />
          <Route path="/upload" element={reviewerOnly(<HomePage />)} />
          <Route path="/dashboard" element={reviewerOnly(<DashboardPage />)} />
          <Route path="/progress/:id" element={reviewerOnly(<ProgressPage />)} />
          <Route path="/review/:id" element={reviewerOnly(<ReviewPage />)} />
          <Route
            path="/student"
            element={role ? <StudentPage /> : <Navigate to="/" replace />}
          />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

export default App