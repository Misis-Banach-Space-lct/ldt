import { AppBar, Box, IconButton, Toolbar, Typography, Paper } from "@mui/material";
import logo from "../assets/logo.svg";
import homeicon from "../assets/home_icon.svg";
import Button from '@mui/material/Button';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import storage from '../utils/storage'

interface Props {
    isAuthorized: boolean;
    isAdmin: boolean;
}
function ResponsiveAppBar(props: Props) {
    const { isAuthorized, isAdmin } = props;

    return (
        <AppBar position="relative" style={{
            background: 'transparent',
            boxShadow: 'none',

        }} >
            <Paper sx={{ marginTop: 3, borderRadius: '15px', height: '64px', backgroundColor: 'rgba(255, 255, 255, 0.5)', border: '1px solid white' }}>
                <Toolbar disableGutters>
                    <IconButton
                        size="large"
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        href="/home"
                        sx={{ width: '50px', height: '50px', ml: 1 }}
                    >
                        <img width="45px" height="45px" src={logo} alt="logo" />
                    </IconButton>
                    <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'flex-end' }}>
                        {!isAuthorized ?
                            (
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
                                    }}
                                >
                                    Система мониторинга и видеодетекции объектов незаконной торговли
                                </Typography>
                            ) :
                            (
                                <>
                                    <Box sx={{ mr: 2 }}>
                                        <Button  href="/home"
                                            style={{ color: '#0B0959', fontFamily: 'Nunito Sans', backgroundColor: 'white', borderRadius: '8px', textTransform: 'capitalize', marginRight: 20, width: '150px', justifyContent: 'space-between', paddingRight: '15px' }}
                                        >
                                            <img width="25px" height="25px" src={homeicon} alt="logo" style={{ margin: '0 5px' }} />
                                            Дашборд</Button>
                                        {isAdmin &&
                                            <Button  href="/users"
                                                style={{ color: '#0B0959', fontFamily: 'Nunito Sans', backgroundColor: 'white', borderRadius: '8px', textTransform: 'capitalize', marginRight: 20, width: '150px', justifyContent: 'space-between' }}
                                            >
                                                <SupervisorAccountIcon />
                                                Пользователи</Button>}
                                        <Button onClick={storage.clearAll} href="/"
                                            style={{ color: 'white', fontFamily: 'Nunito Sans', backgroundColor: '#0B0959', borderRadius: '8px', textTransform: 'capitalize' }}
                                        >Выход</Button>
                                    </Box>
                                </>
                            )
                        }
                    </Box>
                </Toolbar>
            </Paper>
        </AppBar>

    );
}
export default ResponsiveAppBar;