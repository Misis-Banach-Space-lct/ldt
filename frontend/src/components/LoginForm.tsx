import { useState, useEffect } from "react";
import { TextField, Typography, Box, Button, InputAdornment } from "@mui/material";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ApiAuth from "../services/apiAuth";


interface LoginFormProps {
    updateAuthorized: (newAuthorized: boolean) => void;
}

const LoginForm = ({ updateAuthorized }: LoginFormProps) => {
    const [isAuthorized, setAuthorized] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error1, setError1] = useState(false);
    const [helperText1, setHelperText1] = useState('');
    const [error2, setError2] = useState(false);
    const [helperText2, setHelperText2] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const handleTogglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleEmailChange = (event: any) => {
        setEmail(event.target.value);
    };

    const handlePasswordChange = (event: any) => {
        setPassword(event.target.value);
    };

    useEffect(() => {
        updateAuthorized(isAuthorized);
    }, [isAuthorized]);


    const handleSubmit = (event: any) => {
        let errorEmpty = false;
        event.preventDefault();

        if (!email) {
            setError1(true);
            errorEmpty = true;
            setHelperText1('Введите логин');
        }
        else {
            setError1(false);
            errorEmpty = false;
            setHelperText1('');
        }

        if (!password) {
            setError2(true);
            errorEmpty = true;
            setHelperText2('Введите пароль');
        }
        else {
            setError2(false);
            errorEmpty = false;
            setHelperText2('');
        }

        if (!errorEmpty) {

            let result = ApiAuth.loginUser({
                username: email,
                password: password,
            });


            result.then(response => {
                console.log(response);
                setAuthorized(true);
            });


            result.catch(error => {
                if (error.response.status === 401) {
                    alert('Ошибка ввода данных, проверьте данные или пройдите регистрацию');
                }
            });
        }
    };

    return (
        <Box
            style={{
                width: '350px', minHeight: '400px', borderRadius: '30px'
            }}>
            <Typography variant="h2"
                sx={{
                    textAlign: 'center',
                    mr: 2,
                    mt: 4,
                    ml: 0,
                    fontFamily: 'Nunito Sans',
                    fontWeight: 700,
                    fontSize: '24px',
                    color: '#1F1B4C',
                    textDecoration: 'none',
                }}
            >
                Добро Пожаловать!
            </Typography>
            <Typography variant="body1"
                sx={{
                    textAlign: 'center',
                    mr: 2,
                    mt: 2,
                    ml: 0,
                    fontFamily: 'Nunito Sans',
                    fontWeight: 400,
                    fontSize: '16px',
                    textDecoration: 'none',
                    color: '#1F1B4C'
                }}
            >
                Пожалуйста введите свой логин и пароль
            </Typography>
            <Box display="flex" alignItems="center" justifyContent="center" flexDirection={'column'} sx={{ mt: 4 }}>
                <TextField
                    id="outlined-basic-1"
                    label="Логин"
                    variant="outlined"
                    color="secondary"
                    error={error1}
                    helperText={helperText1}
                    value={email}
                    onChange={handleEmailChange}
                    sx={{
                        width: '300px',
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                        },
                    }}
                />

                <Box sx={{ mt: 3 }}>
                    <TextField type={showPassword ? 'text' : 'password'}
                        id="outlined-basic-2"
                        label="Пароль"
                        variant="outlined"
                        color="secondary"
                        sx={{
                            width: '300px',
                            mt: 3,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '8px',
                            },
                        }}
                        error={error2}
                        helperText={helperText2}
                        value={password}
                        onChange={handlePasswordChange}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    {!showPassword ? <VisibilityOffIcon onClick={handleTogglePasswordVisibility} sx={{ color: '#1F1B4C' }} /> : <VisibilityIcon onClick={handleTogglePasswordVisibility} sx={{ color: '#1F1B4C' }} />}
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>
                <Button onClick={handleSubmit}
                    sx={{ mt: 3, width: '300px' }}
                    style={{ color: 'white', fontFamily: 'Nunito Sans', backgroundColor: '#0B0959', borderRadius: '8px', textTransform: 'capitalize' }}
                >Вход</Button>
            </Box>
        </Box>
    )
}

export default LoginForm
