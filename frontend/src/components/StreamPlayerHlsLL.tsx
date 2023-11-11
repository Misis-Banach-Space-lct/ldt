import { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { Typography } from '@mui/material';

function StreamPlayerHlsLL({ hls_url }: { hls_url: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(hls_url);
      hls.attachMedia(videoEl);
    } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      videoEl.src = hls_url;
    }
  }, []);

  return (
    <div>
      <video ref={videoRef} autoPlay muted playsInline controls style={{ maxWidth: '100%', maxHeight: '100%'}} />
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
        Подключение HLS-LL
      </Typography>
    </div>
  );
};

export default StreamPlayerHlsLL;
