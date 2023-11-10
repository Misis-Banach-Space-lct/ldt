import { Box, Container } from "@mui/material";
import { useState, useEffect } from "react";
import AppBar from '../components/AppBar';
import decoration_lineLINK from '../assets/decoration_line.svg';
import storage from '../utils/storage';
import DisplayedVideos from "../components/DisplayedVideos";
import { useAuth } from '../hooks/AuthProvider';


function AllVideos() {
    const limit = 100;
    const offset = 0;
    const auth = useAuth();
    if (!auth) throw new Error("AuthProvider is missing");
    const { isAuthorized } = auth;

    const [isAdmin, setIsAdmin] = useState(false);

    if (!isAuthorized) {
        return null; 
    }

    useEffect(() => {
        if (storage.getRole() === 'admin') setIsAdmin(true);
        else setIsAdmin(false);
    }, []);


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
                    <AppBar isAuthorized={true} isAdmin={isAdmin} />
                    <Box sx={{ mt: 3, mb: 3 }}> 
                        <DisplayedVideos limit={limit} offset={offset} isAll={true} isVideoSent={false}/>
                    </Box>
                </Container>
            </Box>

        </>
    )
}

export default AllVideos