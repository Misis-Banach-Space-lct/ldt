import React, { useState, useEffect } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import { useNavigate } from 'react-router-dom';
import ApiStream from '../services/apiStream';
import StreamPlayerHls from './StreamPlayerHls';
import { STREAM_URL } from '../config';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';

function VideoCell({ fetchStreams }: { fetchStreams: Stream }) {
  const [selectedVideo, setSelectedVideo] = useState<any>(null);

  return (
<div style={{ 
    border: '1px solid black', 
    position: 'relative', 
    overflow: 'hidden', 
    aspectRatio: '1', 
    height: '100%', 
    width: '100%',
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center' 
}}>
    {selectedVideo ? (
        <>
            <StreamPlayerHls hls_url={`${STREAM_URL}/stream/${selectedVideo}/channel/0/hls/live/index.m3u8`} />
            <IconButton
                onClick={() => setSelectedVideo(null)}
                style={{ position: 'absolute', top: 0, right: 0, color: '#DFDFED'}}
            >
                <CloseIcon />
            </IconButton>
        </>
    ) : (
        <Fab onClick={() => {
            const video = window.prompt('Введите индекс видео:\n' +
                Object.entries(fetchStreams).map(([_, stream], index) => `${index + 1}. ${stream.name}`).join('\n'));
            if (video !== null) {
                setSelectedVideo(Object.keys(fetchStreams)[parseInt(video, 10) - 1]);
            }
        }}
            color="secondary" aria-label="add">
            <AddIcon />
        </Fab>
    )}
</div>

  );
};

interface Channel {
  status?: number;
  on_demand?: boolean;
  url: string;
}

interface Stream {
  channels: Record<string, Channel>;
  name: string;
}

const VideoGrid: React.FC = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [fetchStreams, setFetchedStreams] = useState<Stream>();

  const fetchStreamsFunc = async () => {
    let result = await ApiStream.getAllStreams();
    setFetchedStreams(result.data['payload']);
  };

  useEffect(() => {
    fetchStreamsFunc();
    setIsLoading(false)
  }, []);

  return (
    <>
      {!isLoading && fetchStreams &&
        <>
          <IconButton
            onClick={() => { navigate('/streams') }}
            style={{ position: 'absolute', top: 0, right: 0}}
          >
            <CloseIcon />
          </IconButton>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridGap: '0', width: 'calc(100vw - 30px)', height: 'calc(100vh - 50px)', padding: '1rem', position: 'fixed', top: '20px' }}>
            {Array.from({ length: 9 }).map((_, index) => (
              <VideoCell key={index} fetchStreams={fetchStreams} />
            ))}
          </div>
        </>}
    </>
  );
};

export default VideoGrid;
