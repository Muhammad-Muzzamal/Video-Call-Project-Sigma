import { BrowserRouter, Routes, Route } from "react-router-dom"
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import { Toaster } from 'react-hot-toast';
import VideoMeet from "./pages/VideoMeet";


const App = () => {
  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toasterId="default"
        toastOptions={{
          // Define default options
          className: '',
          duration: 5000,
          removeDelay: 1000,
          style: {
            background: '#363636',
            color: '#fff',
          },

          // Default options for specific types
          success: {
            duration: 3000,
            iconTheme: {
              primary: 'green',
              secondary: 'black',
            },
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path='/:url' element={<VideoMeet />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App;