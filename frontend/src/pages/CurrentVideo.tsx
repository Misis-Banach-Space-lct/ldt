import { Box, Container, Paper, Typography, Button } from "@mui/material";
import { Accordion, AccordionSummary, AccordionDetails, Tabs, Tab } from '@mui/material';
import { getVideoCover } from '@rajesh896/video-thumbnails-generator';
import { useState, useEffect, useRef } from "react";
import AppBar from '../components/AppBar';
import decoration_lineLINK from '../assets/decoration_line.svg';
import storage from '../utils/storage';
import OriginalVideoPlayer from "../components/OriginalVideoPlayer";
import VideoPlayer from "../components/VideoPlayer";
import { useAuth } from "../hooks/AuthProvider";
import { useParams } from "react-router-dom";
import ApiVideo from "../services/apiVideo";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ImageAnnotate from '../components/ImageAnnotate';
import { IArea } from '@bmunozg/react-image-area'
import { List, ListItem, ListItemIcon, ListItemText } from '@mui/material';

import FrameCard from "../components/FrameCard";
import { BASE_URL } from '../config';

interface Video {
    id: number;
    title: string;
    source: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    processedSource: string;
    groupIds: number[];
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box p={3}>
                    {children}
                </Box>
            )}
        </div>
    );
}



function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

interface AnnotatedArea extends IArea {
    classIndex: number;
}

interface LabelingData {
    areas: AnnotatedArea[];
    image: string;
}

function CurrentVideo() {
    const auth = useAuth();
    if (!auth) throw new Error("AuthProvider is missing");
    const { isAuthorized } = auth;
    const [isAdmin, setIsAdmin] = useState(false);
    const [labelingData, setLabelingData] = useState<LabelingData[]>();

    const [value, setValue] = useState(0);
    const handleChange = (_: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
        console.log(value)
    };

    const [videoData, setVideoData] = useState<Video>();
    const [videoSource, setVideoSource] = useState<string>();
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLabeling, setSelectedLabeling] = useState<string>();

    const [thumbnails, setThumbnails] = useState<string[]>();


    const fetchVideoFrames = async () => {
        if (videoId) {
            let result = await ApiVideo.getVideoFrames({
                videoId: videoId,
                type: 'processed'
            });
            setThumbnails(result.data);
        }
    };



    if (!isAuthorized) {
        return null;
    }

    const updateLabelingData = (newLAbelingData: LabelingData[]) => {
        setLabelingData(newLAbelingData);
    };

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const videoMlRef = useRef<HTMLVideoElement | null>(null);

    let { videoId } = useParams<{ videoId: string }>();

    const fetchVideoData = async () => {
        if (videoId) {
            let result = await ApiVideo.getVideoData(videoId);
            setVideoData(result.data);
            setVideoSource(result.data.source);
            console.log(result.data.source);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (storage.getRole() === 'admin') setIsAdmin(true);
        else setIsAdmin(false);
        fetchVideoData();
        fetchVideoFrames();
    }, []);

    function handleSelectButton() {
        if (videoRef.current && videoSource) {
            getVideoCover(`${BASE_URL}/${videoSource}?token=${storage.getToken()}`, videoRef.current.currentTime).then((res) => {
                setSelectedLabeling(res);
            })
        }
    }

    const classDict: { [index: number]: string } = {
        0: 'Воздушные шарики/игрушки',
        1: 'Торговая тележка/палатка',
        2: 'Человек',
        3: 'Иной объект'
    }

    return (
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
                    <AppBar isAuthorized={isAuthorized} isAdmin={isAdmin} />
                    <>
                        {!isLoading &&
                            <>
                                <Box sx={{ mt: 3 }}>
                                    <Accordion defaultExpanded={true}>
                                        <AccordionSummary
                                            expandIcon={<ExpandMoreIcon />}
                                            aria-controls="panel1a-content"
                                            id="panel1a-header"
                                            sx={{
                                                height: '64px'
                                            }}
                                        >
                                            <Tabs
                                                value={value}
                                                onChange={handleChange}
                                                aria-label="basic tabs example"
                                                indicatorColor="secondary"
                                                textColor="secondary"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                }}
                                            >
                                                <Tab label="Результат обработки" {...a11yProps(0)}
                                                    sx={{
                                                        fontFamily: 'Nunito Sans', textTransform: 'capitalize',
                                                        '&.Mui-selected': {
                                                            fontSize: '20px',
                                                        },
                                                        transition: 'font-size 0.3s ease',
                                                    }} />
                                                <Tab label="Исходное видео" {...a11yProps(1)}
                                                    sx={{
                                                        fontFamily: 'Nunito Sans', textTransform: 'capitalize',
                                                        '&.Mui-selected': {
                                                            fontSize: '20px',
                                                        },
                                                        transition: 'font-size 0.3s ease',
                                                    }} />
                                            </Tabs>

                                        </AccordionSummary>
                                        <AccordionDetails sx={{ height: '500px' }}>
                                            <CustomTabPanel value={value} index={0}>
                                                <VideoPlayer onGroupChange={fetchVideoData}
                                                    videoMlRef={videoMlRef} videoTitle={videoData?.title} groupIds={videoData?.groupIds}
                                                    videoMlLink={`${BASE_URL}/${videoData?.processedSource}?token=${storage.getToken()}`} videoId={videoData?.id} />
                                            </CustomTabPanel>
                                            <CustomTabPanel value={value} index={1}>
                                                <Box sx={{ mt: 1 }}>
                                                    <OriginalVideoPlayer  videoId={videoData?.id} videoRef={videoRef} videoLink={`${BASE_URL}/${videoSource}?token=${storage.getToken()}`} />
                                                </Box>
                                            </CustomTabPanel>
                                        </AccordionDetails>
                                    </Accordion>
                                </Box>
                                {(value === 1) &&
                                    <Box sx={{ mt: 5, mb: 3 }}>
                                        <Paper sx={{ marginTop: 3, borderRadius: '15px', backgroundColor: 'rgba(255, 255, 255, 0.5)', border: '1px solid white' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Box sx={{ m: 3, maxWidth: '700px' }}>
                                                    <Typography
                                                        variant="h2"
                                                        sx={{
                                                            fontFamily: 'Nunito Sans',
                                                            fontWeight: 700,
                                                            fontSize: '15px',
                                                            color: '#0B0959',
                                                            textDecoration: 'none',
                                                            marginRight: 0,
                                                            paddingRight: 2,
                                                            marginBottom: 2,
                                                        }}
                                                    >
                                                        Дополнительное обучение
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontFamily: 'Nunito Sans',
                                                            fontWeight: 300,
                                                            fontSize: '15px',
                                                            color: '#0B0959',
                                                            textDecoration: 'none',
                                                            marginRight: 0,
                                                            paddingRight: 2,
                                                        }}
                                                    >
                                                        Вы можете помочь модели еще лучше находить объекты незаконной торговли!
                                                    </Typography>
                                                    <Button onClick={handleSelectButton}
                                                        style={{
                                                            color: 'white', fontFamily: 'Nunito Sans', backgroundColor: '#0B0959',
                                                            borderRadius: '8px', textTransform: 'capitalize', margin: '20px 0'
                                                        }}
                                                    >Выбрать текущий кадр</Button>
                                                </Box>
                                            </Box>
                                            {selectedLabeling &&
                                                <>
                                                    <Box sx={{ mb: 10, width: '100%' }}>
                                                        <ImageAnnotate imageUrl={selectedLabeling} updateLabelingData={updateLabelingData} />
                                                    </Box>
                                                    {labelingData &&
                                                        <Typography
                                                            sx={{
                                                                fontFamily: 'Nunito Sans',
                                                                fontWeight: 700,
                                                                fontSize: '15px',
                                                                color: '#0B0959',
                                                                textDecoration: 'none',
                                                                marginRight: 0,
                                                                paddingRight: 2,
                                                                marginBottom: 2,
                                                                paddingLeft: 2
                                                            }}
                                                        >
                                                            Кадры и объекты, отправленные в модель для дообучения:
                                                        </Typography>
                                                    }
                                                    <List sx={{
                                                        width: '100%',
                                                        borderRadius: '15px',
                                                        backgroundColor: 'rgba(255, 255, 255, 0.5)',
                                                        border: '1px solid white',
                                                        position: 'relative',
                                                        overflow: 'auto',
                                                        '& ul': { padding: 0 },
                                                    }}>
                                                        {
                                                            labelingData?.map((data) => {
                                                                return (
                                                                    <ListItem sx={{ overflow: 'auto' }}>
                                                                        <ListItemIcon>
                                                                            <img src={data.image} alt="thumbnails" style={{ maxWidth: 200 }} />
                                                                        </ListItemIcon>
                                                                        <ListItemText sx={{ m: 2 }} primary={`Выделены объекты:`} />
                                                                        {
                                                                            data.areas.map((area) => {
                                                                                return (
                                                                                    <ListItemText sx={{ m: 2 }} primary={`Класс: ${classDict[area.classIndex - 1]}`} />
                                                                                );
                                                                            })
                                                                        }
                                                                    </ListItem>
                                                                );
                                                            })
                                                        }
                                                    </List>
                                                </>

                                            }
                                        </Paper>
                                    </Box>
                                }
                                {(value === 0) &&
                                    <>
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
                                            Объекты незаконной торговли:
                                        </Typography>
                                        {
                                            thumbnails?.filter(source => source.includes('processed')).map((source) => {
                                                return (
                                                    <FrameCard source={`${BASE_URL}/${source}?token=${storage.getToken()}`} timecode="10" videoMlRef={videoMlRef} />
                                                );
                                            })

                                        }
                                    </>
                                }
                            </>
                        }
                    </>
                </Container>
            </Box >

        </>
    )
}

export default CurrentVideo


