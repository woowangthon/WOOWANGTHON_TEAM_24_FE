import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import './App.css'
import DashboardPage from './pages/DashboardPage.jsx'
import HomePage from './pages/HomePage.jsx'
import ProgressPage from './pages/ProgressPage.jsx'
import ReviewPage from './pages/ReviewPage.jsx'
import StudentPage from './pages/StudentPage.jsx'

const navigation = [
  { to: '/', label: '홈', end: true },
  { to: '/dashboard', label: '대시보드' },
  { to: '/progress/1', label: '진행 화면' },
  { to: '/review/1', label: '검수 화면' },
  { to: '/student', label: '학생 화면' },
]

function App() {
  return (
    <BrowserRouter>
      <header className="site-header">
        <NavLink className="brand" to="/">보이는 강의</NavLink>
        <nav aria-label="주요 메뉴">
          {navigation.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/progress/:id" element={<ProgressPage />} />
          <Route path="/review/:id" element={<ReviewPage />} />
          <Route path="/student" element={<StudentPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

export default App
