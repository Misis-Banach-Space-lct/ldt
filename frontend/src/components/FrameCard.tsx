import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import { Button, Typography, Fab } from "@mui/material";
import { Dialog, DialogContent } from '@mui/material';
import { useState } from 'react';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import CloseIcon from '@mui/icons-material/Close';

interface Props {
    source: string;
    timecode: string;
    videoMlRef: any;
}

export default function FrameCard(props: Props) {
    const { source, timecode, videoMlRef } = props;

    function formatTime(secondsString: string): string {
        const seconds = parseInt(secondsString, 10);
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor((seconds % 3600) % 60);
    
        const hDisplay = h > 0 ? (h < 10 ? '0' + h : h) + ':' : '';
        const mDisplay = m > 0 ? (m < 10 ? '0' + m : m) + ':' : '00:';
        const sDisplay = s > 0 ? (s < 10 ? '0' + s : s) : '00';
        return hDisplay + mDisplay + sDisplay; 
    }
    

    function handleTimecode() {
        if (videoMlRef.current) {
            videoMlRef.current.currentTime = timecode;
            videoMlRef.current.pause();
        }
    }

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
                image={source}
                title="detected object"
            >
                <Fab color="secondary" aria-label="open" onClick={handleClickOpen} style={{ position: 'absolute', right: 10, top: 10 }}>
                    <ZoomOutMapIcon />
                </Fab>
            </CardMedia>
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
            >
                <DialogContent>
                    <img src={source} alt="detected object" style={{ width: '100%', height: 'auto' }} />
                    <Fab color="secondary" aria-label="close" onClick={handleClose} style={{ position: 'absolute', right: 10, top: 10 }}>
                        <CloseIcon />
                    </Fab>
                </DialogContent>
            </Dialog>
            <CardContent style={{ display: "flex", justifyContent: "space-between", flexDirection: 'column', width: '50%' }}>
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
                        fontSize: '15px',
                        color: 'black',
                        textDecoration: 'none',
                        marginRight: 0,
                        paddingRight: 2,
                    }}
                >
                    объект
                </Typography>
            </CardContent>
            <CardActions>
                <Button onClick={handleTimecode}
                    style={{ color: 'white', fontFamily: 'Nunito Sans', backgroundColor: '#0B0959', borderRadius: '8px', textTransform: 'capitalize' }}
                >{formatTime(timecode)}</Button>
            </CardActions>
        </Card>

    );
}