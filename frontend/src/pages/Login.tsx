import { Box, Container } from "@mui/material";

import AppBar from '../components/AppBar';
import LoginForm from '../components/LoginForm';
import decoration_lineLINK from '../assets/decoration_line.svg';
import logo from "../assets/logo.svg";
import { useLocation, useNavigate } from 'react-router-dom';

import { useEffect } from 'react';
import { useAuth } from '../hooks/AuthProvider'


function Login() {
    const auth = useAuth();
    if (!auth) throw new Error("AuthProvider is missing");
    const { isAuthorized, setIsAuthorized } = auth;
    const location = useLocation();
    const navigate = useNavigate();
    const { from } = location.state || { from: { pathname: "/home" } };

    useEffect(() => {
        if (isAuthorized) {
            navigate(from.pathname);
        }
    }, [isAuthorized, navigate, from]);

    const updateAuthorized = (newAuthorized: boolean) => {
        setIsAuthorized(newAuthorized);
    };

    return (
        <>
            <Box
                sx={{
                    backgroundImage: `url(${decoration_lineLINK})`,
                    backgroundColor: '#DFDFED',
                    minHeight: '100vh',
                    padding: '0 80px',
                    backgroundPosition: 'bottom',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '100vw',
                }}
            >
                <Container>
                    <AppBar isAuthorized={false} isAdmin={false} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginTop: '100px' }}>
                        <LoginForm updateAuthorized={updateAuthorized} />
                        <img width="350px" height="350px" src={logo} alt="logo" />
                    </Box>
                </Container>
            </Box>

        </>
    )
}

export default Login;