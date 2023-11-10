import VideoCard from "./VideoCard";
import SelectGroup from './SelectGroup'
import { Box, Typography, Button } from "@mui/material";
import ApiVideo from "../services/apiVideo";
import { useEffect, useState } from "react";
import arrowRight from '../assets/arrowRight.svg'


interface AllVideos {
    id: number;
    title: string;
    source: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    processedSource: string;
    groupIds: number[];
}



function DisplayedVideos({ limit, offset, isAll, isVideoSent }: { limit: number, offset: number, isAll: boolean, isVideoSent: boolean }) {
    const [fetchVideos, setFetchedVideos] = useState<AllVideos[]>();
    const [count, setCount] = useState(0)
    const [selectedGroupId, setSelectedGroupId] = useState<number>(0);


    const fetchVideosFunc = async () => {
        let result = await ApiVideo.getAllVideos({
            limit: limit,
            offset: offset,
            // groupId: selectedGroupId,
        });
        setFetchedVideos(result.data);
    };

    useEffect(() => {
        fetchVideosFunc();
        const interval = setInterval(() => {
            fetchVideosFunc();
            setCount(count + 1);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if(isVideoSent) fetchVideosFunc();
    }, [isVideoSent]);

    // function handleFilter() {
        //реакция на клик

        // const fetchVideosFilter = async () => {
        //     let result = await ApiVideo.getAllVideosFilter({
        //         limit: limit,
        //         offset: offset,
        //         groupId: selectedGroupId,
        //     });
        //     setFetchedVideos(result.data);
        // };
        // fetchVideosFilter();
    // }

    const updateGroupId = (newGroupId: number) => {
        setSelectedGroupId(newGroupId);
        console.log(selectedGroupId)
    };


    return (
        <>
            <Box>
                <Box sx={{display: 'flex'}}>
                    <SelectGroup updateGroupId={updateGroupId} />
                    <div style={{
                        color: '#0B0959',
                        border: '3px dashed #0B0959',
                        padding: '10px',
                        width: '227px',
                        marginLeft: '20px'
                    }}>
                        Фильтрация по группе
                    </div>
                </Box>
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
                        Видео:
                    </Typography>
                    {!isAll && <Button href="/videos"
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
                <Box sx={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', mt: 1 }}>
                    {fetchVideos?.map((video: AllVideos, index) => {
                        return (
                            <VideoCard
                                key={index}
                                title={video.title}
                                video_id={video.id}
                                time={video.createdAt}
                                status={video.status}
                            />
                        );
                    })}
                </Box>
            </Box>
        </>
    )
}

export default DisplayedVideos