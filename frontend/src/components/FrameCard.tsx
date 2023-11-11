import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import { Button, Typography, Fab, Box } from "@mui/material";
import { Dialog, DialogContent } from '@mui/material';
import { useState } from 'react';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import CloseIcon from '@mui/icons-material/Close';
import { Carousel } from 'react-responsive-carousel';
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { BASE_URL } from '../config';
import storage from '../utils/storage';

interface Props {
    sources: string[];
    timecode: number;
    videoMlRef: any;
    classId: number;
    timecodeOrig: number;
    updateTimecodeOrig: (newTimecodeOrig: string) => void;
}

const classDict: { [index: number]: string } = {
    1: 'Воздушные шарики/игрушки',
    2: 'Торговая тележка/палатка',
    3: 'Продавец',
}

export default function FrameCard(props: Props) {
    const {  timecode, videoMlRef, classId, timecodeOrig , updateTimecodeOrig, sources} = props;

    function formatTime(seconds: number): string {
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

    function handleTimecodeOrig() {
        updateTimecodeOrig(String(timecodeOrig))
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
                title="detected object"
            >
                <Carousel showThumbs={false}>
                    {sources.map((source, index) => (
                        <div key={index}>
                            <img src={`${BASE_URL}/${source}?token=${storage.getToken()}`} alt={`detected object ${index + 1}`} />
                        </div>
                    ))}
                </Carousel>
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
                        fontSize: '15px',
                        color: '#0B0959',
                        textDecoration: 'none',
                        marginRight: 0,
                        paddingRight: 2,
                    }}
                >
                    из класса:
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
                    {classDict[classId]}
                </Typography>
            </CardContent>
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
            >
                <DialogContent>
                    <Carousel showThumbs={false}>
                        {sources.map((source, index) => (
                            <div key={index}>
                                <img src={`${BASE_URL}/${source}?token=${storage.getToken()}`} alt={`detected object ${index + 1}`} style={{ width: '100%', height: 'auto' }} />
                            </div>
                        ))}
                    </Carousel>
                    <Fab color="secondary" aria-label="close" onClick={handleClose} style={{ position: 'absolute', right: 10, top: 10 }}>
                        <CloseIcon />
                    </Fab>
                </DialogContent>
            </Dialog>
            <Box sx={{display: 'flex', justifyContent: 'space-around', flexDirection: 'column'}}>
                <CardActions>
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
                        Просмотреть на обработанном видео
                    </Typography>
                    <Button onClick={() => {
                        handleTimecode();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                        style={{ color: 'white', fontFamily: 'Nunito Sans', backgroundColor: '#0B0959', borderRadius: '8px', textTransform: 'capitalize' }}
                    >{formatTime(timecode)}</Button>
                </CardActions>
                <CardActions>
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
                        Просмотреть на оригинальном видео видео
                    </Typography>
                    <Button onClick={() => {
                        handleTimecodeOrig();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                        style={{ color: 'white', fontFamily: 'Nunito Sans', backgroundColor: '#0B0959', borderRadius: '8px', textTransform: 'capitalize' }}
                    >{formatTime(timecodeOrig)}</Button>
                </CardActions>
            </Box>
        </Card>

    );
}