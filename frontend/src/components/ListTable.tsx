import { List, ListItem, ListItemText, Accordion, AccordionSummary, AccordionDetails, Typography, Divider, Box, DialogContent } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ApiUser from '../services/apiUser';
import ApiGroup from '../services/apiGroup';
import { useState, useEffect } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from "@mui/material/IconButton";
import { Dialog, DialogTitle, Button, DialogActions } from '@mui/material'
import SelectGroupList from '../components/SelectGroupList'
import Fab from '@mui/material/Fab';

interface allGroups {
    id: number;
    title: string;
    createdAt: string;
    updatedAt: string;
}

interface UserData {
    id: number;
    email: string;
    firstName: string;
    groupId: number;
    lastName: string;
    role: "viewer" | "admin";
    createdAt: string;
    updatedAt: string;
    groupIds: number[];
}

interface Props {
    data: UserData[];
}

function ListTable({ data }: Props) {
    const [fetchedGroups, setFetchedGroups] = useState<allGroups[]>();
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const fetchGroups = async () => {
            let result = await ApiGroup.getAllGroups({
                limit: 100,
            });

            setFetchedGroups(result.data);
        };
        fetchGroups();
        setIsLoading(false);
    }, []);


    const [deleteGroupId, setDeleteGroupId] = useState<number>();
    const [openDialogNewGroup, setOpenDialogNewGroup] = useState<number | null>(null);
    const [openDialog, setOpenDialog] = useState<number | null>(null);
    const [openDialogDeleteUser, setOpenDialogDeleteUser] = useState<number | null>(null);

    function handleClose() {
        setOpenDialog(null);
    }

    function handleCloseDeleteUser() {
        setOpenDialogDeleteUser(null);
    }


    function handleDeleteGroup(userId: number) {
        if (deleteGroupId !== undefined) {
            let result = ApiUser.updateUserGroup({
                action: 'remove',
                userId: userId,
                groupId: deleteGroupId
            });

            result.then(_ => {
                setDeleteGroupId(undefined);
            });

        }
        setOpenDialog(null);
    }

    function handleDeleteUser(userId: number) {
        let result = ApiUser.deleteUser(userId);

        result.then(_ => {
            window.location.reload();
        });
        setOpenDialogDeleteUser(null);
    }

    function handleCloseNewGroup() {
        setOpenDialogNewGroup(null);
    }

    function handleAddGroup(userId: number) {
        if (groupId !== undefined) {
            let result = ApiUser.updateUserGroup({
                action: 'add',
                userId: userId,
                groupId: groupId
            });

            result.then(_ => {
                setGroupId(0);
            });
        }
        setOpenDialogNewGroup(null);
    }

    const [groupId, setGroupId] = useState<number>(0);
    const updateGroupId = (newGroupId: number) => {
        setGroupId(newGroupId);
    };
    return (
        <>
            {!isLoading &&
                <>
                    <List>
                        <ListItem>
                            <ListItemText primary="Фамилия" style={{ flex: '1 1 0px' }} />
                            <Divider orientation="vertical" flexItem sx={{ mr: 1 }} />
                            <ListItemText primary="Имя" style={{ flex: '1 1 0px' }} />
                            <Divider orientation="vertical" flexItem sx={{ mr: 1 }} />
                            <ListItemText primary="Email" style={{ flex: '1 1 0px' }} />
                            <Divider orientation="vertical" flexItem sx={{ mr: 1 }} />
                            <ListItemText primary="Роль" style={{ flex: '1 1 0px' }} />
                            <Divider orientation="vertical" flexItem sx={{ mr: 1 }} />
                            <ListItemText primary="Группы" style={{ flex: '1 1 0px' }} />
                            <Divider orientation="vertical" flexItem sx={{ mr: 1 }} />
                            <ListItemText primary="" style={{ flex: '0.3 1 0px' }} />
                        </ListItem>
                        {data.map((item, index) => (
                            <>
                                {(item.id !== 0) &&
                                    <ListItem key={index}>
                                        <ListItemText primary={item.lastName} style={{ flex: '1 1 0px' }} />
                                        <Divider orientation="vertical" flexItem sx={{ mr: 1 }} />
                                        <ListItemText primary={item.firstName} style={{ flex: '1 1 0px' }} />
                                        <Divider orientation="vertical" flexItem sx={{ mr: 1 }} />
                                        <ListItemText primary={item.email} style={{ flex: '1 1 0px' }} />
                                        <Divider orientation="vertical" flexItem sx={{ mr: 1 }} />
                                        <ListItemText primary={(item.role === 'admin') ? 'Администратор' : 'Пользователь'} style={{ flex: '1 1 0px' }} />
                                        <Divider orientation="vertical" flexItem sx={{ mr: 1 }} />
                                        <Accordion sx={{ width: '100%', backgroundColor: '#DFDFED', flex: '1 1 0px' }}>
                                            <AccordionSummary
                                                expandIcon={<ExpandMoreIcon />}
                                                aria-controls="panel1a-content"
                                                id="panel1a-header"
                                            >
                                                <Typography>Группы</Typography>
                                            </AccordionSummary>
                                            <AccordionDetails>
                                                <Box>
                                                    {item.groupIds && item.groupIds.map((id) => {
                                                        return (
                                                            <>
                                                                <Divider />
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'no-wrap', minHeight: '40px', mt: 1 }}>
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
                                                                        setOpenDialog(item.id)
                                                                    }} sx={{ color: '#0B0959' }}>
                                                                        <CloseIcon />
                                                                    </IconButton>
                                                                </Box>
                                                                <Divider />
                                                            </>
                                                        )
                                                    })}
                                                    <Divider />
                                                    <Button onClick={() => setOpenDialogNewGroup(item.id)}
                                                        style={{
                                                            color: 'white', fontFamily: 'Nunito Sans', marginTop: 1,
                                                            backgroundColor: '#0B0959', borderRadius: '8px', textTransform: 'capitalize'
                                                        }}
                                                    >Добавить в группу</Button>
                                                </Box>
                                            </AccordionDetails>
                                        </Accordion>

                                        <Dialog
                                            open={openDialog === item.id}
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
                                                    {`Вы точно хотите удалить пользователя из группы?`}
                                                </Typography>
                                            </DialogTitle>
                                            <DialogActions>
                                                <Button style={{ color: '#0B0959', fontFamily: 'Nunito Sans', backgroundColor: 'white', borderRadius: '8px' }}
                                                    onClick={handleClose}>Выйти</Button>
                                                <Button style={{ color: '#0B0959', fontFamily: 'Nunito Sans', backgroundColor: 'white', borderRadius: '8px' }}
                                                    onClick={() => handleDeleteGroup(item.id)}>Удалить</Button>
                                            </DialogActions>
                                        </Dialog>

                                        <Dialog
                                            open={openDialogNewGroup === item.id}
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
                                                    Добавить пользователя в группу:
                                                </Typography>
                                            </DialogTitle>
                                            <DialogContent>
                                                {item.groupIds && <SelectGroupList updateGroupId={updateGroupId} groupIds={item.groupIds} />}
                                            </DialogContent>
                                            <DialogActions>
                                                <Button style={{ color: '#0B0959', fontFamily: 'Nunito Sans', backgroundColor: 'white', borderRadius: '8px' }}
                                                    onClick={handleCloseNewGroup}>Закрыть</Button>
                                                <Button style={{ color: '#0B0959', fontFamily: 'Nunito Sans', backgroundColor: 'white', borderRadius: '8px' }}
                                                    onClick={() => handleAddGroup(item.id)}>Добавить</Button>
                                            </DialogActions>
                                        </Dialog>
                                        <Box style={{ flex: '0.3 1 0px' }} >
                                            <Fab sx={{ height: '10px', width: '35px', ml: 2 }}
                                                onClick={() => {
                                                    setOpenDialogDeleteUser(item.id)
                                                }}
                                                color="error" aria-label="add">
                                                <CloseIcon />
                                            </Fab>
                                            <Dialog
                                                open={openDialogDeleteUser === item.id}
                                                onClose={handleCloseDeleteUser}>
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
                                                        {`Вы точно хотите удалить пользователя?`}
                                                    </Typography>
                                                </DialogTitle>
                                                <DialogActions>
                                                    <Button style={{ color: '#0B0959', fontFamily: 'Nunito Sans', backgroundColor: 'white', borderRadius: '8px' }}
                                                        onClick={handleCloseDeleteUser}>Выйти</Button>
                                                    <Button style={{ color: '#0B0959', fontFamily: 'Nunito Sans', backgroundColor: 'white', borderRadius: '8px' }}
                                                        onClick={() => handleDeleteUser(item.id)}>Удалить</Button>
                                                </DialogActions>
                                            </Dialog>
                                        </Box>
                                    </ListItem>
                                }
                            </>
                        ))}
                    </List>
                </>}
        </>
    );
}

export default ListTable
