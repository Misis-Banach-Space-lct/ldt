import { Box, Container, Paper, Typography, Button, InputBase, FormHelperText, Divider } from "@mui/material";
import { useState, useEffect } from "react";
import AppBar from '../components/AppBar';
import decoration_lineLINK from '../assets/decoration_line.svg';
import storage from '../utils/storage';
import SelectGroupUsers from '../components/SelectGroupUsers'
import SelectRole from '../components/SelectRole';
import { useAuth } from '../hooks/AuthProvider';
import ApiGroup from "../services/apiGroup";
import ApiUser from "../services/apiUser";
import ListTable from "../components/ListTable";
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';


interface FieldState {
    value: string;
    error: boolean;
    helperText: string;
    status: boolean;
};

interface FieldsState {
    [key: string]: FieldState;
};


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

interface allGroups {
    id: number;
    title: string;
    createdAt: string;
    updatedAt: string;
}

function Users() {
    const auth = useAuth();
    if (!auth) throw new Error("AuthProvider is missing");
    const { isAuthorized } = auth;
    const [isAdmin, setIsAdmin] = useState(true);
    if (!isAuthorized || !isAdmin) {
        return null;
    }


    const [fetchedUsers, setFetchedUsers] = useState<UserData[]>();
    const [isLoading, setIsLoading] = useState(true);
    const [openDialogNewUser, setOpenDialogNewUser] = useState<boolean>(false);
    const [userLogin, setUserLogin] = useState<string>('');
    const [userPassword, setUserPassword] = useState<string>('');


    const fetchUsersData = async () => {
        setIsLoading(true);
        let result = await ApiUser.getAllUsers({
            limit: 100,
            offset: 0,
        });
        setFetchedUsers(result.data);
    };


    const [groupId, setGroupId] = useState<number>(0);
    const updateGroupId = (newGroupId: number) => {
        setGroupId(newGroupId);
    };

    const [groupDeleteId, setGroupDeleteId] = useState<number | undefined>(undefined);
    const updateGroupDeleteId = (newGroupId: number) => {
        setGroupDeleteId(newGroupId);
        updateField('groupDelete', { status: false });
    };

    const [role, setRole] = useState<"viewer" | "admin">('admin');
    const updateRole = (newRole: "viewer" | "admin") => {
        setRole(newRole);
    };

    const [fields, setFields] = useState<FieldsState>({
        group: {
            value: "",
            error: false,
            helperText: '',
            status: false
        },
        groupDelete: {
            value: "",
            error: false,
            helperText: '',
            status: false
        },
        surname: {
            value: "",
            error: false,
            helperText: '',
            status: false
        },
        name: {
            value: "",
            error: false,
            helperText: '',
            status: false
        },
        email: {
            value: "",
            error: false,
            helperText: '',
            status: false
        },
    });

    const updateField = (fieldName: string, updates: Partial<FieldState>) => {
        setFields(prevFields => ({
            ...prevFields,
            [fieldName]: {
                ...prevFields[fieldName],
                ...updates
            }
        }));
    };

    const handleGroupChange = (event: any) => {
        updateField('group', { value: event.target.value, error: false, status: false });
    };

    const handleSubmitGroup = (event: any) => {
        let errorEmpty = false;
        event.preventDefault();

        if (!fields['group'].value) {
            updateField('group', { helperText: 'Введите название группы', error: true });
            errorEmpty = true;
        }
        else {
            updateField('group', { helperText: '', error: false });
            errorEmpty = false;
        }

        if (!errorEmpty) {
            let result = ApiGroup.createGroup({
                title: fields['group'].value,
            });

            result.then(_ => {
                updateField('group', { status: true });
            });

            result.catch(error => {
                if (error.response.status === 400) {
                    updateField('group', { helperText: 'Группа с таким названием уже существует', error: true, status: false });
                    errorEmpty = true;
                }
            });
        }
    };

    const handleDeleteGroup = (event: any) => {
        let errorEmpty = false;
        event.preventDefault();

        if (!groupDeleteId) {
            updateField('groupDelete', { helperText: 'Выберите группу (нельзя удалить общую)', error: true });
            errorEmpty = true;
        }
        else {
            updateField('groupDelete', { helperText: '', error: false });
            errorEmpty = false;
        }

        if (!errorEmpty && groupDeleteId !== undefined) {
            let result = ApiGroup.deleteGroup(groupDeleteId);

            result.then(_ => {
                updateField('groupDelete', { status: true });
            });
        }
    };

    const handleSurnameChange = (event: any) => {
        if (/^[А-Я][а-я]*$/.test(event.target.value)) {
            updateField('surname', { helperText: '', error: false });
        } else {
            updateField('surname', { helperText: 'Введите с заглавной буквы на русском языке', error: true });
        }
        updateField('surname', { value: event.target.value });
        updateField('surname', { status: false });
    };

    const handleNameChange = (event: any) => {
        if (/^[А-Я][а-я]*$/.test(event.target.value)) {
            updateField('name', { helperText: '', error: false });
        } else {
            updateField('name', { helperText: 'Введите с заглавной буквы на русском языке', error: true });
        }
        updateField('name', { value: event.target.value });
        updateField('surname', { status: false });
    };


    const handleEmailChange = (event: any) => {
        if (
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(
                event.target.value
            )
        ) {
            updateField('email', { helperText: '', error: false });
        } else {
            updateField('email', { helperText: 'Неверный формат ввода email', error: true });
        }
        updateField('email', { value: event.target.value });
        updateField('surname', { status: false });
    };

    const handleCreateUser = (event: any) => {
        let errorEmpty = false;
        event.preventDefault();

        if (!fields['surname'].value) {
            updateField('surname', { helperText: 'Введите фамилию', error: true });
            errorEmpty = true;
        }
        else {
            updateField('surname', { helperText: '', error: false });
            errorEmpty = false;
        }

        if (!fields['name'].value) {
            updateField('name', { helperText: 'Введите имя', error: true });
            errorEmpty = true;
        }
        else {
            updateField('name', { helperText: '', error: false });
            errorEmpty = false;
        }

        if (!fields['email'].value) {
            updateField('email', { helperText: 'Введите email', error: true });
            errorEmpty = true;
        }
        else {
            updateField('email', { helperText: '', error: false });
            errorEmpty = false;
        }


        if (!errorEmpty) {
            let result = ApiUser.createUser({
                email: fields['email'].value,
                firstName: fields['name'].value,
                lastName: fields['surname'].value,
                groupId: groupId,
                role: role,
            });

            result.then(response => {
                updateField('surname', { status: true });
                setUserLogin(response.data.username)
                setUserPassword(response.data.password)
                setOpenDialogNewUser(true);
            });
        }
    };

    const [fetchedGroups, setFetchedGroups] = useState<allGroups[]>();
    const fetchGroups = async () => {
        let result = await ApiGroup.getAllGroups({
            limit: 100,
        });

        setFetchedGroups(result.data);
    };

    useEffect(() => {
        if (fields['group'].status) fetchGroups()
    }, [fields['group'].status]);

    useEffect(() => {
        if (storage.getRole() === 'admin') setIsAdmin(true);
        else setIsAdmin(false);
        fetchUsersData();
        fetchGroups()
        setIsLoading(false);
    }, []);


    return (
        <> {!isLoading && fetchedGroups &&
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
                        <>
                            <Box sx={{ mt: 3, mb: 3 }}>
                                <Paper sx={{ marginTop: 3, borderRadius: '15px', padding: 3 }}>
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
                                        Пользователи:
                                    </Typography>
                                    <ListTable data={fetchedUsers || []} />
                                </Paper>
                            </Box>
                            <Box sx={{ mt: 3, mb: 3, display: 'flex', justifyContent: 'space-around' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-around', flexDirection: 'column' }}>
                                    <Paper sx={{ marginTop: 3, borderRadius: '15px', display: 'flex', justifyContent: 'space-between', flexDirection: 'column', height: '200px', p: 2 }}>
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
                                            Создать новую группу:
                                        </Typography>
                                        <Box>
                                            <InputBase
                                                sx={{
                                                    ml: 1,
                                                    flex: 1,
                                                    color: fields['group'].error ? 'error.main' : fields['group'].status ? 'success.main' : 'inherit',
                                                }}
                                                error={fields['group'].error}
                                                value={fields['group'].value}
                                                onChange={handleGroupChange}
                                                placeholder="Введите название"
                                                inputProps={{ 'aria-label': 'group name' }}
                                            />
                                            {fields['group'].error &&
                                                <>
                                                    <Divider sx={{ borderColor: 'error.main' }} />
                                                    <FormHelperText sx={{ color: 'error.main' }}>{fields['group'].helperText}</FormHelperText>
                                                </>
                                            }
                                            {fields['group'].status &&
                                                <>
                                                    <Divider sx={{ borderColor: 'success.main' }} />
                                                    <FormHelperText sx={{ color: 'success.main' }}>Группа успешно создана</FormHelperText>
                                                </>
                                            }
                                        </Box>

                                        <Button
                                            onClick={handleSubmitGroup}
                                            style={{ color: '#0B0959', fontFamily: 'Nunito Sans', backgroundColor: '#CEE9DD', borderRadius: '8px', textTransform: 'capitalize', marginRight: 20, width: '250px', height: '40px' }}
                                        >
                                            Создать
                                        </Button>
                                    </Paper>
                                    <Paper sx={{ marginTop: 3, borderRadius: '15px', display: 'flex', justifyContent: 'space-between', flexDirection: 'column', height: '200px', p: 2 }}>
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
                                            Удалить группу:
                                        </Typography>
                                        <Box>
                                            <SelectGroupUsers updateGroupId={updateGroupDeleteId} fetchedGroups={fetchedGroups} />
                                            {fields['groupDelete'].error &&
                                                <>
                                                    <Divider sx={{ borderColor: 'error.main' }} />
                                                    <FormHelperText sx={{ color: 'error.main' }}>{fields['groupDelete'].helperText}</FormHelperText>
                                                </>
                                            }
                                            {fields['groupDelete'].status &&
                                                <>
                                                    <Divider sx={{ borderColor: 'success.main' }} />
                                                    <FormHelperText sx={{ color: 'success.main' }}>Группа успешно удалена</FormHelperText>
                                                </>
                                            }
                                        </Box>

                                        <Button
                                            onClick={handleDeleteGroup}
                                            style={{ color: '#0B0959', fontFamily: 'Nunito Sans', backgroundColor: '#E9CECE', borderRadius: '8px', textTransform: 'capitalize', marginRight: 20, width: '250px', height: '40px' }}
                                        >
                                            Удалить
                                        </Button>
                                    </Paper>
                                </Box>
                                <Paper sx={{
                                    marginTop: 3, borderRadius: '15px', display: 'flex', justifyContent: 'space-between', flexDirection: 'column',
                                    height: '450px', width: '400px', p: 2, mb: 3
                                }}>
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
                                        Создать нового пользователя:
                                    </Typography>
                                    <Box>
                                        <InputBase
                                            sx={{
                                                height: '40px',
                                                marginTop: '10px',
                                                ml: 1,
                                                flex: 1,
                                                color: fields['surname'].error ? 'error.main' : fields['surname'].status ? 'success.main' : 'inherit',
                                            }}
                                            error={fields['surname'].error}
                                            value={fields['surname'].value}
                                            onChange={handleSurnameChange}
                                            placeholder="Введите фамилию"
                                            inputProps={{ 'aria-label': 'surname field' }}
                                        />
                                        {fields['surname'].error &&
                                            <>
                                                <Divider sx={{ borderColor: 'error.main' }} />
                                                <FormHelperText sx={{ color: 'error.main' }}>{fields['surname'].helperText}</FormHelperText>
                                            </>
                                        }
                                    </Box>
                                    <Box>
                                        <InputBase
                                            sx={{
                                                height: '40px',
                                                marginTop: '10px',
                                                ml: 1,
                                                flex: 1,
                                                color: fields['name'].error ? 'error.main' : fields['name'].status ? 'success.main' : 'inherit',
                                            }}
                                            error={fields['name'].error}
                                            value={fields['name'].value}
                                            onChange={handleNameChange}
                                            placeholder="Введите имя"
                                            inputProps={{ 'aria-label': 'name field' }}
                                        />
                                        {fields['name'].error &&
                                            <>
                                                <Divider sx={{ borderColor: 'error.main' }} />
                                                <FormHelperText sx={{ color: 'error.main' }}>{fields['name'].helperText}</FormHelperText>
                                            </>
                                        }
                                    </Box>
                                    <Box>
                                        <InputBase
                                            sx={{
                                                height: '40px',
                                                marginTop: '10px',
                                                ml: 1,
                                                flex: 1,
                                                color: fields['email'].error ? 'error.main' : fields['email'].status ? 'success.main' : 'inherit',
                                            }}
                                            error={fields['email'].error}
                                            value={fields['email'].value}
                                            onChange={handleEmailChange}
                                            placeholder="Введите email"
                                            inputProps={{ 'aria-label': 'email field' }}
                                        />
                                        {fields['email'].error &&
                                            <>
                                                <Divider sx={{ borderColor: 'error.main' }} />
                                                <FormHelperText sx={{ color: 'error.main' }}>{fields['email'].helperText}</FormHelperText>
                                            </>
                                        }
                                    </Box>

                                    <Box sx={{ marginTop: '10px' }}>
                                        <SelectGroupUsers updateGroupId={updateGroupId} fetchedGroups={fetchedGroups} />
                                    </Box>
                                    <Box sx={{ marginTop: '10px', marginBotton: '10px' }}>
                                        <SelectRole updateRole={updateRole} />
                                    </Box>
                                    {fields['surname'].status &&
                                        <>
                                            <Divider sx={{ borderColor: 'success.main' }} />
                                            <FormHelperText sx={{ color: 'success.main' }}>Пользователь успешно создан</FormHelperText>
                                        </>
                                    }
                                    <Button onClick={handleCreateUser}
                                        style={{ color: '#0B0959', fontFamily: 'Nunito Sans', backgroundColor: '#CEE9DD', borderRadius: '8px', textTransform: 'capitalize', marginRight: 20, width: '250px', height: '40px' }}
                                    >
                                        Создать
                                    </Button>
                                    <Dialog
                                        open={openDialogNewUser}
                                        onClose={() => { setOpenDialogNewUser(false) }}>
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
                                                {`Данные нового пользователя`}
                                            </Typography>
                                        </DialogTitle>
                                        <DialogContent>
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
                                                {`Логин: ${userLogin}`}
                                            </Typography>
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
                                                {`Пароль: ${userPassword}`}
                                            </Typography>
                                        </DialogContent>
                                        <DialogActions>
                                            <Button style={{ color: '#0B0959', fontFamily: 'Nunito Sans', backgroundColor: 'white', borderRadius: '8px' }}
                                                onClick={() => { 
                                                    setOpenDialogNewUser(false)
                                                    setUserLogin('')
                                                    setUserPassword('') 
                                                    window.location.reload()}}>Закрыть</Button>
                                        </DialogActions>
                                    </Dialog>
                                </Paper>
                            </Box>
                        </>
                    </Container>
                </Box >
            </>}
        </>
    )
}

export default Users