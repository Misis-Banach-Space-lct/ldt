import { List, ListItem, ListItemText, Accordion, AccordionSummary, AccordionDetails, Typography, Divider, Box, DialogContent } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ApiUser from '../services/apiUser';
import ApiGroup from '../services/apiGroup';
import { useState, useEffect } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from "@mui/material/IconButton";
import { Dialog, DialogTitle, Button, DialogActions } from '@mui/material'
import SelectGroupList from '../components/SelectGroupList'


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
    const [isGroupAdded, setIsGroupAdded] = useState(false);
    const [isGroupRemoved, setIsGroupRemoved] = useState(false);
    const [openDialogNewGroup, setOpenDialogNewGroup] = useState<number | null>(null);
    const [openDialog, setOpenDialog] = useState<number | null>(null);

    function handleClose() {
        setOpenDialog(null);
        setIsGroupRemoved(false);
    }


    useEffect(() => {
        // if(isGroupAdded) onGroupChange();
        // if(isGroupRemoved) onGroupChange();
    }, [isGroupAdded, isGroupRemoved]);

    function handleDeleteGroup(userId: number) {
        if (deleteGroupId && deleteGroupId !== 0) {
            let result = ApiUser.updateUserGroup({
                action: 'remove',
                userId: userId,
                groupId: deleteGroupId
            });

            result.then(_ => {
                setIsGroupRemoved(true);
                setDeleteGroupId(undefined);
            });

        }
        setOpenDialog(null);
    }

    function handleCloseNewGroup() {
        setOpenDialogNewGroup(null);
        setIsGroupAdded(false);
    }

    function handleAddGroup(userId: number) {
        if (groupId && groupId !== 0) {
            let result = ApiUser.updateUserGroup({
                action: 'add',
                userId: userId,
                groupId: groupId
            });

            result.then(_ => {
                setIsGroupAdded(true);
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
                            <ListItemText primary="ID" style={{ flex: '1 1 0px' }} />
                            <Divider orientation="vertical" flexItem sx={{ mr: 1 }} />
                            <ListItemText primary="Last Name" style={{ flex: '1 1 0px' }} />
                            <Divider orientation="vertical" flexItem sx={{ mr: 1 }} />
                            <ListItemText primary="First Name" style={{ flex: '1 1 0px' }} />
                            <Divider orientation="vertical" flexItem sx={{ mr: 1 }} />
                            <ListItemText primary="Email" style={{ flex: '1 1 0px' }} />
                            <Divider orientation="vertical" flexItem sx={{ mr: 1 }} />
                            <ListItemText primary="Role" style={{ flex: '1 1 0px' }} />
                            <Divider orientation="vertical" flexItem sx={{ mr: 1 }} />
                            <ListItemText primary="Group IDs" style={{ flex: '1 1 0px' }} />
                        </ListItem>
                        {data.map((item, index) => (
                            <>
                                {(item.id !== 0) &&
                                    <ListItem key={index}>
                                        <ListItemText primary={item.id} style={{ flex: '1 1 0px' }} />
                                        <Divider orientation="vertical" flexItem sx={{ mr: 1 }} />
                                        <ListItemText primary={item.lastName} style={{ flex: '1 1 0px' }} />
                                        <Divider orientation="vertical" flexItem sx={{ mr: 1 }} />
                                        <ListItemText primary={item.firstName} style={{ flex: '1 1 0px' }} />
                                        <Divider orientation="vertical" flexItem sx={{ mr: 1 }} />
                                        <ListItemText primary={item.email} style={{ flex: '1 1 0px' }} />
                                        <Divider orientation="vertical" flexItem sx={{ mr: 1 }} />
                                        <ListItemText primary={item.role} style={{ flex: '1 1 0px' }} />
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
                                                                        variant="h1"
                                                                        sx={{
                                                                            fontFamily: 'Nunito Sans',
                                                                            fontWeight: 700,
                                                                            fontSize: '15px',
                                                                            color: '#0B0959',
                                                                            textDecoration: 'none',
                                                                            marginRight: 0,
                                                                            paddingRight: 2,
                                                                            marginTop: 1.5,
                                                                        }}
                                                                    >
                                                                        {id}. {fetchedGroups?.find(group => group.id === id)?.title}
                                                                    </Typography>
                                                                    {(id !== 0) &&
                                                                        <IconButton key={id} onClick={() => {
                                                                            setDeleteGroupId(id);
                                                                            setOpenDialog(id)
                                                                        }}>
                                                                            <CloseIcon />
                                                                        </IconButton>}
                                                                </Box>
                                                                <Divider />
                                                            </>
                                                        )
                                                    })}
                                                    <Button onClick={() => setOpenDialogNewGroup(item.id)}
                                                        style={{ color: 'white', fontFamily: 'Nunito Sans', backgroundColor: '#0B0959', borderRadius: '8px', textTransform: 'capitalize' }}
                                                    >Добавить в группу</Button>
                                                </Box>
                                            </AccordionDetails>
                                        </Accordion>

                                        <Dialog
                                            open={openDialog === item.id}
                                            onClose={handleClose}>
                                            <DialogTitle>
                                                {`Вы точно хотите удалить видео из группы?`}
                                            </DialogTitle>
                                            <DialogActions>
                                                <Button onClick={handleClose}>Выйти</Button>
                                                <Button onClick={() => handleDeleteGroup(item.id)}>Удалить</Button>
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
                                                <Button onClick={handleCloseNewGroup}>Закрыть</Button>
                                                <Button onClick={() => handleAddGroup(item.id)}>Добавить</Button>
                                            </DialogActions>
                                        </Dialog>
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
