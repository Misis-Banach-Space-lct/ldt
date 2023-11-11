import StreamCard from "./StreamCard";
import { Box, Typography, Button } from "@mui/material";
import ApiStream from "../services/apiStream";
import { useEffect, useState } from "react";
import arrowRight from '../assets/arrowRight.svg'


interface Channel {
    status?: number;
    on_demand?: boolean;
    url: string;
}

interface Stream {
    channels: Record<string, Channel>;
    name: string;
}


function DisplayedConnections({ isAll, isVideoSent }: { limit: number, offset: number, isAll: boolean, isVideoSent: boolean }) {
    const [fetchStreams, setFetchedStreams] = useState<Stream>();
    const [isLoading, setIsLoading] = useState(true)


    const fetchStreamsFunc = async () => {
        let result = await ApiStream.getAllStreams();
        setFetchedStreams(result.data['payload']);
    };

    useEffect(() => {
        fetchStreamsFunc();
        setIsLoading(false)
    }, []);


    useEffect(() => {
        if (isVideoSent) fetchStreamsFunc();
    }, [isVideoSent]);


    return (
        <>
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography
                        sx={{
                            fontFamily: 'Nunito Sans',
                            fontWeight: 700,
                            fontSize: '18px',
                            color: '#0B0959',
                            textDecoration: 'none',
                            marginRight: 0,
                            marginTop: 2,
                            paddingRight: 2,
                        }}
                    >
                        Подключенные камеры:
                    </Typography>
                    {!isAll && <Button href="/streams"
                        style={{
                            color: '#0B0959', fontFamily: 'Nunito Sans', backgroundColor: 'transparent',
                            borderRadius: '8px', textTransform: 'lowercase', marginRight: 20, width: '70px',
                            justifyContent: 'space-between', paddingRight: '15px', fontSize: '20px'
                        }}
                    >
                        все
                        <img width="15px" height="15px" src={arrowRight} alt="logo" style={{ margin: '0 5px', paddingTop: '2px' }} />
                    </Button>}
                </Box>
                <Button href='/streamsView' style={{ color: 'white', fontFamily: 'Nunito Sans', backgroundColor: '#0B0959', borderRadius: '8px', textTransform: 'capitalize' }}>
                    Просмотреть сетку камер
                </Button>
                {!isLoading &&
                    <Box sx={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', mt: 1 }}>
                        {fetchStreams && Object.entries(fetchStreams).map(([key, stream], index) => {
                            if (isAll === false && index > 2) {
                                return null;
                            }
                            return (
                                <StreamCard
                                    key={index}
                                    title={stream.name}
                                    stream_id={key}
                                    status={'ready'}
                                />
                            );
                        })}
                    </Box>

                }
            </Box>
        </>
    )
}

export default DisplayedConnections