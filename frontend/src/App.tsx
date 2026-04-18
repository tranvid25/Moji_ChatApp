import {BrowserRouter,Route,Routes} from 'react-router';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import ChatAppPage from './pages/ChatAppPage';
import {Toaster} from 'sonner';
function App() {
  return (
  <>
   <Toaster richColors/>
    <BrowserRouter>
      <Routes>
        {/* public routes*/}
        <Route
          path='/signin'
          element={<SignInPage/>}
        />
        <Route
          path='/signup'
          element={<SignUpPage/>}
        />

        <Route
          path='/chatApp'
          element={<ChatAppPage/>}
        />
        {/* protected routes*/}
      </Routes>
    </BrowserRouter>
  </>
  )
}

export default App
