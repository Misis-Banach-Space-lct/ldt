import { Box, DialogContent, Paper } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ApiGroup from '../services/apiGroup';
import ApiVideo from '../services/apiVideo';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import { Dialog, DialogTitle, Button, DialogActions } from '@mui/material'
import SelectGroupList from '../components/SelectGroupList'
import storage from '../utils/storage';

interface Props {
    videoMlLink: string;
    videoMlRef: any;
    videoTitle?: string;
    groupIds?: number[];
    videoId?: number;
    onGroupChange: any;
}

interface allGroups {
    id: number;
    title: string;
    createdAt: string;
    updatedAt: string;
}

function VideoPlayer(props: Props) {
    const [isAdmin, setIsAdmin] = useState(false);
    useEffect(() => {
        if (storage.getRole() === 'admin') setIsAdmin(true);
        else setIsAdmin(false);
    }, []);

    const { videoMlLink, videoMlRef, videoTitle = "Текущее видео", groupIds = [], videoId = 0, onGroupChange } = props;
    const navigate = useNavigate();

    const [fetchedGroups, setFetchedGroups] = useState<allGroups[]>();
    useEffect(() => {
        const fetchGroups = async () => {
            let result = await ApiGroup.getAllGroups({
                limit: 100,
            });

            setFetchedGroups(result.data);
        };
        fetchGroups();
    }, []);


    const [deleteGroupId, setDeleteGroupId] = useState<number>();
    const [openDialog, setOpenDialog] = useState(false);
    const [openDialogNewGroup, setOpenDialogNewGroup] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [isGroupAdded, setIsGroupAdded] = useState(false);
    const [isGroupRemoved, setIsGroupRemoved] = useState(false);

    function handleClose() {
        setOpenDialog(false);
        setIsGroupRemoved(false);
    }
    function handleOpen() {
        setOpenDialog(true);
        setIsGroupRemoved(false);
    }

    useEffect(() => {
        onGroupChange();
    }, [isGroupAdded, isGroupRemoved]);

    function handleDeleteGroup() {
        if (deleteGroupId !== undefined) {
            let result = ApiVideo.updateVideoGroup({
                action: 'remove',
                videoId: videoId,
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
        if (groupId !== undefined) {
            let result = ApiVideo.updateVideoGroup({
                action: 'add',
                videoId: videoId,
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

        let result = ApiVideo.deleteVideo(videoId);

        result.then(_ => {
            navigate('/home');
        });
    };
    return (
        <>
            {videoMlLink &&
                <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Box className="video">
                            {!isAdmin &&
                                <Typography
                                    sx={{
                                        fontFamily: 'Nunito Sans',
                                        fontWeight: 700,
                                        fontSize: '25px',
                                        color: '#0B0959',
                                        textDecoration: 'none',
                                        marginRight: 0,
                                        paddingRight: 2,
                                    }}
                                >
                                    Текущее видео: {videoTitle}
                                </Typography>}
                            <video controls style={{ maxWidth: '700px', maxHeight: '400px' }} ref={videoMlRef} src={videoMlLink}></video>
                        </Box>
                        {isAdmin &&
                            <Paper sx={{ width: '250px', p: 2 }} elevation={20}>
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
                                        Текущее видео:
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
                                        {videoTitle}
                                    </Typography>
                                </Box>
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
                                            {groupIds.map((id) => {
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
                                            >Добавить видео в группу</Button>
                                        </Box>
                                    </AccordionDetails>
                                </Accordion>

                                <Button
                                    onClick={() => { setOpenDeleteDialog(true) }}
                                    style={{ marginTop: 40, color: '#0B0959', fontFamily: 'Nunito Sans', backgroundColor: '#E9CECE', borderRadius: '8px', textTransform: 'capitalize', marginRight: 20, width: '250px', height: '40px' }}
                                >
                                    Удалить видео
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
                                            {`Вы точно хотите удалить видео?`}
                                        </Typography>
                                    </DialogTitle>
                                    <DialogActions>
                                        <Button style={{ color: '#0B0959', fontFamily: 'Nunito Sans', backgroundColor: 'white', borderRadius: '8px' }}
                                            onClick={() => { setOpenDeleteDialog(false) }}>Выйти</Button>
                                        <Button style={{ color: '#0B0959', fontFamily: 'Nunito Sans', backgroundColor: 'white', borderRadius: '8px' }}
                                            onClick={handleDeleteVideo}>Удалить</Button>
                                    </DialogActions>
                                </Dialog>

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
                                            {`Вы точно хотите удалить видео из группы?`}
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
                                            Добавить видео в группу:
                                        </Typography>
                                    </DialogTitle>
                                    <DialogContent>
                                        <SelectGroupList updateGroupId={updateGroupId} groupIds={groupIds} />
                                    </DialogContent>
                                    <DialogActions>
                                        <Button style={{ color: '#0B0959', fontFamily: 'Nunito Sans', backgroundColor: 'white', borderRadius: '8px' }}
                                            onClick={handleCloseNewGroup}>Закрыть</Button>
                                        <Button style={{ color: '#0B0959', fontFamily: 'Nunito Sans', backgroundColor: 'white', borderRadius: '8px' }}
                                            onClick={handleAddGroup}>Добавить</Button>
                                    </DialogActions>
                                </Dialog>
                            </Paper>}
                    </Box>
                </>}
        </>
    );
};

export default VideoPlayer;