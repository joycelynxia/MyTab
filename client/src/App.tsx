import './App.css'
import Header from './components/Header'
import GroupPage from './pages/GroupPage'
import HomePage from './pages/HomePage'
import { Routes, Route, BrowserRouter } from 'react-router-dom'

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/groups/:groupId' element={<GroupPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;
