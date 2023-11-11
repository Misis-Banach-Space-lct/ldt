import { Box, Container, Typography, Paper, Switch } from "@mui/material";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import AppBar from '../components/AppBar';
import decoration_lineLINK from '../assets/decoration_line.svg';
import storage from '../utils/storage';
import { useAuth } from "../hooks/AuthProvider";
import StreamPlayerHls from "../components/StreamPlayerHls";
import StreamPlayerHlsll from '../components/StreamPlayerHlsLL'
import { STREAM_URL } from "../config";
import ApiStream from "../services/apiStream.ts";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import ApiGroup from '../services/apiGroup';
import ApiCamera from '../services/apiCamera';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import { Dialog, DialogTitle, Button, DialogActions, DialogContent } from '@mui/material'
import SelectGroupList from '../components/SelectGroupList'

import FrameCameraCard from "../components/FrameCameraCard.tsx";


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

interface allGroups {
    id: number;
    title: string;
    createdAt: string;
    updatedAt: string;
}

interface VideoBackData {
    id: number;
    createdAt: string;
    updatedAt: string;
    uuid: string;
    url: string;
    groupIds: number[];
}

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

    const [videoData, setVideoData] = useState<any>();
    const [videoBackData, setVideoBackData] = useState<VideoBackData>();
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

            let result_2 = await ApiCamera.getCameraData(streamId)
            setVideoBackData(result_2.data);

        }
    };

    const [count, setCount] = useState(0)
    useEffect(() => {
        fetchVideoMlFrames();
        const interval = setInterval(() => {
            fetchVideoMlFrames();
            setCount(count + 1);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (storage.getRole() === 'admin') setIsAdmin(true);
        else setIsAdmin(false);
        fetchVideoData();
        fetchVideoMlFrames();
        setIsLoading(false);
    }, []);


    //groups
    const [isGroupAdded, setIsGroupAdded] = useState(false);
    const [isGroupRemoved, setIsGroupRemoved] = useState(false);

    const navigate = useNavigate();

    const [fetchedGroups, setFetchedGroups] = useState<allGroups[]>();
    const [thumbnails, setThumbnails] = useState<string[]>();

    const fetchVideoMlFrames = async () => {
        if (streamId) {
            let result = await ApiCamera.getCameraMlFrames(streamId);
            setThumbnails(result.data);
        }
    };

    useEffect(() => {
        const fetchGroups = async () => {
            let result = await ApiGroup.getAllGroups({
                limit: 100,
            });

            setFetchedGroups(result.data);
        };
        fetchGroups();
    }, [isGroupAdded, isGroupRemoved]);


    const [deleteGroupId, setDeleteGroupId] = useState<number>();
    const [openDialog, setOpenDialog] = useState(false);
    const [openDialogNewGroup, setOpenDialogNewGroup] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

    function handleClose() {
        setOpenDialog(false);
        setIsGroupRemoved(false);
    }
    function handleOpen() {
        setOpenDialog(true);
        setIsGroupRemoved(false);
    }

    function handleDeleteGroup() {
        if (deleteGroupId !== undefined && streamId) {
            let result = ApiCamera.updateCameraGroup({
                action: 'remove',
                cameraUuid: streamId,
                groupId: deleteGroupId
            });

            result.then(_ => {
                setIsGroupRemoved(true);
                setDeleteGroupId(undefined);
            });

        }
        setOpenDialog(false);
    }

    function handleCloseNewGroup() {
        setOpenDialogNewGroup(false);
        setIsGroupAdded(false);
    }
    function handleOpenDialogNewGroup() {
        setOpenDialogNewGroup(true);
        setIsGroupAdded(false);
    }
    function handleAddGroup() {
        if (groupId !== undefined && streamId) {
            let result = ApiCamera.updateCameraGroup({
                action: 'add',
                cameraUuid: streamId,
                groupId: groupId
            });

            result.then(_ => {
                setIsGroupAdded(true);
                setGroupId(0);
            });
        }
        setOpenDialogNewGroup(false);
    }

    const [groupId, setGroupId] = useState<number>(0);
    const updateGroupId = (newGroupId: number) => {
        setGroupId(newGroupId);
    };

    const handleDeleteVideo = (event: any) => {
        event.preventDefault();

        if (streamId) {
            let result = ApiCamera.deleteCamera(streamId);
            let result_2 = ApiStream.deleteStream(streamId);

            Promise.all([result, result_2])
                .then((_: any) => {
                    navigate('/home');
                })
        }
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
                    <AppBar isAuthorized={isAuthorized} isAdmin={isAdmin} />
                    {!isLoading &&
                        <Box>
                            <Paper sx={{ pl: 2, pr: 2, mt: 2, borderRadius: '15px' }}>
                                {!isAdmin &&
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
                                    </Typography>}
                                {streamId &&
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                        <Box sx={{ mt: 3, maxWidth: '900px' }}>
                                            {checked ?
                                                <StreamPlayerHlsll hls_url={`${STREAM_URL}/stream/${streamId}/channel/0/hlsll/live/index.m3u8`} /> :
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
                                        </Box>
                                        <Paper sx={{ width: '250px', p: 2, height: '400px', margin: 2, marginTop: 10 }} elevation={20}>
                                            <Box>
                                                <Typography
                                                    sx={{
                                                        fontFamily: 'Nunito Sans',
                                                        fontWeight: 700,
                                                        fontSize: '15px',
                                                        color: '#0B0959',
                                                        textDecoration: 'none',
                                                        marginRight: 0,
                                                        paddingRight: 2,
                                                    }}
                                                >
                                                    Текущее подключение:
                                                </Typography>
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
                                                    {videoData?.name}
                                                </Typography>
                                            </Box>
                                            {videoBackData &&
                                                <>
                                                    <Accordion sx={{ width: '100%', backgroundColor: '#DFDFED' }}>
                                                        <AccordionSummary
                                                            expandIcon={<ExpandMoreIcon />}
                                                            aria-controls="panel1a-content"
                                                            id="panel1a-header"
                                                        >
                                                            <Typography>Группы</Typography>
                                                        </AccordionSummary>
                                                        <AccordionDetails>
                                                            <Box>
                                                                {videoBackData?.groupIds.map((id) => {
                                                                    return (
                                                                        <>
                                                                            <Divider />
                                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'no-wrap', minHeight: '40px' }}>
                                                                                <Typography
                                                                                    sx={{
                                                                                        fontFamily: 'Nunito Sans',
                                                                                        fontWeight: 700,
                                                                                        fontSize: '15px',
                                                                                        color: '#0B0959',
                                                                                        textDecoration: 'none',
                                                                                        marginRight: 0,
                                                                                        padding: 0.5,
                                                                                    }}
                                                                                >
                                                                                    {id}. {fetchedGroups?.find(group => group.id === id)?.title}
                                                                                </Typography>

                                                                                <IconButton key={id} onClick={() => {
                                                                                    setDeleteGroupId(id);
                                                                                    handleOpen();
                                                                                }} sx={{ color: '#0B0959' }}>
                                                                                    <CloseIcon />
                                                                                </IconButton>
                                                                            </Box>
                                                                            <Divider />
                                                                        </>
                                                                    )
                                                                })}
                                                                <Button onClick={handleOpenDialogNewGroup}
                                                                    style={{ color: 'white', fontFamily: 'Nunito Sans', backgroundColor: '#0B0959', borderRadius: '8px', textTransform: 'capitalize' }}
                                                                >Добавить камеру в группу</Button>
                                                            </Box>
                                                        </AccordionDetails>
                                                    </Accordion>

                                                    <Dialog
                                                        open={openDialog}
                                                        onClose={handleClose}>
                                                        <DialogTitle>
                                                            <Typography
                                                                sx={{
                                                                    fontFamily: 'Nunito Sans',
                                                                    fontWeight: 700,
                                                                    fontSize: '15px',
                                                                    color: '#0B0959',
                                                                    textDecoration: 'none',
                                                                    marginRight: 0,
                                                                    paddingRight: 2,
                                                                }}
                                                            >
                                                                {`Вы точно хотите удалить подключение из группы?`}
                                                            </Typography>
                                                        </DialogTitle>
                                                        <DialogActions>
                                                            <Button style={{ color: '#0B0959', fontFamily: 'Nunito Sans', backgroundColor: 'white', borderRadius: '8px' }}
                                                                onClick={handleClose}>Выйти</Button>
                                                            <Button style={{ color: '#0B0959', fontFamily: 'Nunito Sans', backgroundColor: 'white', borderRadius: '8px' }}
                                                                onClick={handleDeleteGroup}>Удалить</Button>
                                                        </DialogActions>
                                                    </Dialog>

                                                    <Dialog
                                                        open={openDialogNewGroup}
                                                        onClose={handleCloseNewGroup}>
                                                        <DialogTitle>
                                                            <Typography
                                                                sx={{
                                                                    fontFamily: 'Nunito Sans',
                                                                    fontWeight: 700,
                                                                    fontSize: '15px',
                                                                    color: '#0B0959',
                                                                    textDecoration: 'none',
                                                                    marginRight: 0,
                                                                    paddingRight: 2,
                                                                }}
                                                            >
                                                                Добавить камеру в группу:
                                                            </Typography>
                                                        </DialogTitle>
                                                        <DialogContent>
                                                            <SelectGroupList updateGroupId={updateGroupId} groupIds={videoBackData?.groupIds} />
                                                        </DialogContent>
                                                        <DialogActions>
                                                            <Button style={{ color: '#0B0959', fontFamily: 'Nunito Sans', backgroundColor: 'white', borderRadius: '8px' }}
                                                                onClick={handleCloseNewGroup}>Закрыть</Button>
                                                            <Button style={{ color: '#0B0959', fontFamily: 'Nunito Sans', backgroundColor: 'white', borderRadius: '8px' }}
                                                                onClick={handleAddGroup}>Добавить</Button>
                                                        </DialogActions>
                                                    </Dialog>
                                                </>}
                                            <Button
                                                onClick={() => { setOpenDeleteDialog(true) }}
                                                style={{ marginTop: 40, color: '#0B0959', fontFamily: 'Nunito Sans', backgroundColor: '#E9CECE', borderRadius: '8px', textTransform: 'capitalize', marginRight: 20, width: '250px', height: '40px' }}
                                            >
                                                Удалить подключение
                                            </Button>
                                            <Dialog
                                                open={openDeleteDialog}
                                                onClose={() => { setOpenDeleteDialog(false) }}>
                                                <DialogTitle>
                                                    <Typography
                                                        sx={{
                                                            fontFamily: 'Nunito Sans',
                                                            fontWeight: 700,
                                                            fontSize: '15px',
                                                            color: '#0B0959',
                                                            textDecoration: 'none',
                                                            marginRight: 0,
                                                            paddingRight: 2,
                                                        }}
                                                    >
                                                        {`Вы точно хотите удалить подключение?`}
                                                    </Typography>
                                                </DialogTitle>
                                                <DialogActions>
                                                    <Button style={{ color: '#0B0959', fontFamily: 'Nunito Sans', backgroundColor: 'white', borderRadius: '8px' }}
                                                        onClick={() => { setOpenDeleteDialog(false) }}>Выйти</Button>
                                                    <Button style={{ color: '#0B0959', fontFamily: 'Nunito Sans', backgroundColor: 'white', borderRadius: '8px' }}
                                                        onClick={handleDeleteVideo}>Удалить</Button>
                                                </DialogActions>
                                            </Dialog>
                                        </Paper>
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
                                {
                                    thumbnails?.map((source) => {
                                        return (
                                            <FrameCameraCard source={source} />
                                        );
                                    })
                                }
                            </Box>
                        </Box>}
                </Container>
            </Box >

        </>
    )
}

export default CurrentStream