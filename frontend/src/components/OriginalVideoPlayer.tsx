import { Box, Paper } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { List, ListItem, ListItemIcon, ListItemText, ListItemButton } from '@mui/material';
import { BarLoader } from "react-spinners";
import { BASE_URL } from '../config';

import ApiVideo from '../services/apiVideo';
import storage from '../utils/storage';


interface Props {
    videoLink: string;
    videoRef: any;
    videoId?: number;
    timecode: string;
}

function VideoPlayer(props: Props) {
    const { videoLink, videoRef, videoId = 0, timecode} = props;
    const [numberOfThumbnails, setNumberOfThumbnails] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [thumbnails, setThumbnails] = useState<string[]>();
    const [selectedThumbnail, setselectedThumbnail] = useState<string>();
    const thumbnailRefs = useRef<(HTMLLIElement | null)[]>([]);


    const formatTime = (timeInSeconds: any) => {
        const roundedTimeInSeconds = Math.round(timeInSeconds);
        const hours = Math.floor(roundedTimeInSeconds / 3600);
        const minutes = Math.floor((roundedTimeInSeconds - (hours * 3600)) / 60);
        const seconds = roundedTimeInSeconds - (hours * 3600) - (minutes * 60);

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    useEffect(() => {
        const fetchVideoFrames = async () => {
            if (videoId) {
                setIsLoading(true);
                let result = await ApiVideo.getVideoFrames({
                    videoId: String(videoId),
                    type: '',
                }                    );
                setThumbnails(result.data);
                setNumberOfThumbnails(result.data.length);
            }
        };
        fetchVideoFrames();
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.currentTime = timecode;
            videoRef.current.pause();
        }
    }, [timecode]);

    useEffect(() => {
        let currentIndex = -1;
        if (videoRef.current) {
            videoRef.current.ontimeupdate = () => {
                if (videoRef.current && thumbnails) {
                    const currentTime = videoRef.current.currentTime;
                    const index = Math.floor(currentTime / (videoRef.current.duration / numberOfThumbnails));
                    if (index !== currentIndex) {
                        currentIndex = index;
                        setselectedThumbnail(thumbnails[index]);
                        if (thumbnailRefs.current[index] !== null && thumbnailRefs.current[index] !== undefined) {
                            thumbnailRefs.current[index]!.focus();
                            thumbnailRefs.current[index]!.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }
                    }
                }
            };
        }
    }, [videoRef, numberOfThumbnails, thumbnails]);



    return (
        <>
            {videoLink &&
                <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Box className="video">
                            <video style={{ maxWidth: '700px', maxHeight: '400px' }} ref={videoRef} src={videoLink} controls></video>
                        </Box>

                        <Paper sx={{backgroundColor: '#DFDFED', border: '1px solid white', borderRadius: '15px',}}>

                            <List sx={{
                                width: '100%',
                                maxWidth: 350,
                                borderRadius: '15px',
                                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                                border: '1px solid white',
                                position: 'relative',
                                overflow: 'auto',
                                maxHeight: 400,
                                '& ul': { padding: 0 },
                            }}>
                                {!isLoading ? thumbnails?.map((image, index) => {
                                    const timecode = videoRef.current?.duration ? formatTime(index * videoRef.current.duration / numberOfThumbnails) : '';
                                    return (
                                        <ListItem key={index} ref={(el) => thumbnailRefs.current[index] = el}
                                            onClick={() => {
                                                setselectedThumbnail(image);
                                                if (videoRef.current) {
                                                    videoRef.current.currentTime = index * videoRef.current.duration / numberOfThumbnails;
                                                    videoRef.current.pause()
                                                }
                                            }}>
                                            <ListItemButton>
                                                <ListItemIcon>
                                                    <img src={`${BASE_URL}/${image}?token=${storage.getToken()}`} alt="thumbnails" className={`width-100 ${image === selectedThumbnail ? "active-thumbnail" : ""}`} style={{ maxWidth: 200 }} />
                                                </ListItemIcon>
                                                <ListItemText sx={{ ml: 2 }} primary={`${timecode}`} />
                                            </ListItemButton>
                                        </ListItem>
                                    );
                                }) : <BarLoader aria-setsize={50} color={'#F3CF8E'} />}
                            </List>
                        </Paper>
                    </Box>
                </>}
        </>
    );
};

export default VideoPlayer;