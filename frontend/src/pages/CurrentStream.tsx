import { Box, Container } from "@mui/material";
import { useState, useEffect } from "react";
import AppBar from '../components/AppBar';
import decoration_lineLINK from '../assets/decoration_line.svg';
import storage from '../utils/storage';
import { useAuth } from "../hooks/AuthProvider";


function CurrentStream() {
    const auth = useAuth();
    if (!auth) throw new Error("AuthProvider is missing");
    const { isAuthorized } = auth;
    const [isAdmin, setIsAdmin] = useState(false);


    useEffect(() => {
        if (storage.getRole() === 'admin') setIsAdmin(true);
        else setIsAdmin(false);
    }, []);

    if (!isAuthorized) {
        return null;
    }


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
                    <AppBar isAuthorized={isAuthorized} isAdmin={isAdmin} />
                    <>
                        <Box sx={{ mt: 10}}>
                            {/* <VideoPlayer videoLink='' /> */}
                        </Box>
                    </>
                </Container>
            </Box >

        </>
    )
}

export default CurrentStream