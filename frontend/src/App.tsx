import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import CurrentStream from './pages/CurrentStream';
import Login from './pages/Login';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import PrivateRoute from './routes/PrivateRoute'
import { AuthProvider } from './hooks/AuthProvider';
import AllVideos from './pages/AllVideos';
import CurrentVideo from './pages/CurrentVideo';
import { Box } from '@mui/material';

const theme = createTheme({
  palette: {
    secondary: {
      main: '#0B0959'
    },
    error: {
      main: '#860000'
    },
    success: {
      main: '#00440f'
    }
  }
});

function App() {
  return (
    <>
      <ThemeProvider theme={theme}>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/home" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/users" element={<PrivateRoute><Users /></PrivateRoute>} />
              <Route path="/videos" element={<PrivateRoute><AllVideos /></PrivateRoute>} />
              <Route path="/videoStream/1" element={<PrivateRoute><CurrentStream /></PrivateRoute>} />
              <Route path="/currentVideo/:videoId" element={<PrivateRoute><CurrentVideo /></PrivateRoute>} />
            </Routes>
          </AuthProvider>
          <Box sx={{height: '100px', backgroundColor: '#DFDFED'}}>
          </Box>
      </ThemeProvider>
    </>
  )
}

export default App