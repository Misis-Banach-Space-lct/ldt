import { Box, Container, Typography, Paper, Switch } from "@mui/material";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import AppBar from '../components/AppBar';
import decoration_lineLINK from '../assets/decoration_line.svg';
import storage from '../utils/storage';
import { useAuth } from "../hooks/AuthProvider";
import StreamPlayerHls from "../components/StreamPlayerHls";
import StreamPlayerHlsll from '../components/StreamPlayerHlsLL'
// import FrameCard from "../components/FrameCard";
import { STREAM_URL } from "../config";
import ApiStream from "../services/apiStream.ts";
import { createTheme, ThemeProvider } from '@mui/material/styles';



const theme = createTheme({
    components: {
        MuiSwitch: {
            styleOverrides: {
                thumb: {
                    color: '#0B0959', 
                },
                track: {
                    backgroundColor: '#DFDFED',
                    opacity: 1,
                }
            },
        },
    },
});

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

    // const [thumbnails, setThumbnails] = useState<string[]>();
    const [videoData, setVideoData] = useState<any>();
    const [isLoading, setIsLoading] = useState(true);

    let { streamId } = useParams<{ streamId: string }>();

    const [checked, setChecked] = useState(false);

    const handleChange = (event: any) => {
        setChecked(event.target.checked);
    };

    const fetchVideoData = async () => {
        if (streamId) {
            let result = await ApiStream.getStreamInfo(streamId);
            setVideoData(result.data['payload']);
        }
        setIsLoading(false);
    };


    useEffect(() => {
        if (storage.getRole() === 'admin') setIsAdmin(true);
        else setIsAdmin(false);
        fetchVideoData();
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
                    <AppBar isAuthorized={isAuthorized} isAdmin={isAdmin} />
                    {!isLoading &&
                        <Box>
                            <Paper sx={{ pl: 2, pr: 2, mt: 2, borderRadius: '15px' }}>
                                <Typography
                                    sx={{
                                        fontFamily: 'Nunito Sans',
                                        fontWeight: 700,
                                        fontSize: '20px',
                                        color: '#0B0959',
                                        textDecoration: 'none',
                                        marginRight: 0,
                                        paddingRight: 2,
                                        paddingTop: '30px'
                                    }}
                                >
                                    Текущее подключение: {videoData?.name}
                                </Typography>
                                {streamId &&
                                    <Box sx={{ mt: 3 }}>
                                        {checked ? 
                                        <StreamPlayerHlsll hls_url={`${STREAM_URL}/stream/${streamId}/channel/0/hlsll/live/index.m3u8`} />:  
                                        <StreamPlayerHls hls_url={`${STREAM_URL}/stream/${streamId}/channel/0/hls/live/index.m3u8`} />}
                                        
                    
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <Typography
                                                sx={{
                                                    fontFamily: 'Nunito Sans',
                                                    fontWeight: 700,
                                                    fontSize: '15px',
                                                    color: '#0B0959',
                                                    textDecoration: 'none',
                                                    marginRight: 0,
                                                    alignSelf: 'center'
                                                }}
                                            >
                                                HLS
                                            </Typography>
                                            <ThemeProvider theme={theme}>
                                                <Switch
                                                    checked={checked}
                                                    onChange={handleChange}
                                                    inputProps={{ 'aria-label': 'controlled' }}
                                                />
                                            </ThemeProvider>
                                            <Typography
                                                sx={{
                                                    fontFamily: 'Nunito Sans',
                                                    fontWeight: 700,
                                                    fontSize: '15px',
                                                    color: '#0B0959',
                                                    textDecoration: 'none',
                                                    marginRight: 0,
                                                    paddingRight: 2,
                                                    alignSelf: 'center'
                                                }}
                                            >
                                                HLS-LL
                                            </Typography>
                                        </Box>
                                    </Box>}
                            </Paper>
                            <Box>
                                <Typography
                                    sx={{
                                        fontFamily: 'Nunito Sans',
                                        fontWeight: 700,
                                        fontSize: '25px',
                                        color: '#0B0959',
                                        textDecoration: 'none',
                                        marginRight: 0,
                                        paddingRight: 2,
                                        marginTop: 2,
                                        marginBottom: 2,
                                    }}
                                >
                                    Объекты незаконной торговли:
                                </Typography>
                                {/* {
                                    thumbnails?.filter(source => source.includes('processed')).map((source) => {
                                        return (
                                            <FrameCard source={`${BASE_URL}/${source}?token=${storage.getToken()}`} timecode="10" videoMlRef={''} />
                                        );
                                    })

                                } */}
                            </Box>
                        </Box>}
                </Container>
            </Box >

        </>
    )
}

export default CurrentStream