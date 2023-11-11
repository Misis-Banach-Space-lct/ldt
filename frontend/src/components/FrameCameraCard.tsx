import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import { Typography, Fab } from "@mui/material";
import { Dialog, DialogContent } from '@mui/material';
import { useState } from 'react';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import CloseIcon from '@mui/icons-material/Close';
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { BASE_URL } from '../config';
import storage from '../utils/storage';


interface Props {
    source: string;
}

export default function FrameCameraCard(props: Props) {
    const { source } = props;

    const [open, setOpen] = useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <Card sx={{ maxWidth: '910px', boxShadow: '0px 0px 10px 5px rgba(0,0,0,0.1)', borderRadius: '15px', mt: 2, mb: 10, ml: 'auto', mr: 'auto', display: 'flex' }} >
            <CardMedia
                sx={{ width: '50%', aspectRatio: '16/9', position: 'relative' }}
                title="detected object"
            >
                <img src={`${BASE_URL}/${source}?token=${storage.getToken()}`} alt={`detected object`} style={{width: '400px'}}/>
                <Fab color="secondary" aria-label="open" onClick={handleClickOpen} style={{ position: 'absolute', right: 10, top: 10 }}>
                    <ZoomOutMapIcon />
                </Fab>
            </CardMedia>
            <CardContent style={{ width: '50%' }}>
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
                    Обнаруженный объект
                </Typography>
                <Typography
                    sx={{
                        fontFamily: 'Nunito Sans',
                        fontWeight: 400,
                        fontSize: '25px',
                        color: '#0B0959',
                        textDecoration: 'none',
                        marginRight: 0,
                        paddingRight: 2,
                        marginTop: 2
                    }}
                >
                    незаконной торговли
                </Typography>
            </CardContent>
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
            >
                <DialogContent>
                    <img src={`${BASE_URL}/${source}?token=${storage.getToken()}`} alt={`detected object`} style={{width: '100%'}}/>
                    <Fab color="secondary" aria-label="close" onClick={handleClose} style={{ position: 'absolute', right: 10, top: 10 }}>
                        <CloseIcon />
                    </Fab>
                </DialogContent>
            </Dialog>
        </Card>
    );
}