import { useEffect, useRef, useState } from 'react';
import { List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { generateVideoThumbnails } from '@rajesh896/video-thumbnails-generator';
import loadingSVG from '../assets/dot_icon.svg';

const VideoThumbnailsFromUrl = () => {
  const [inputUrl, setInputUrl] = useState<string >("")
  const [numberOfThumbnails, setNumberOfThumbnails] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState("");
  const [thumbnails, setThumbnails] = useState<string[]>();
  const [selectedThumbnail, setselectedThumbnail] = useState<string>();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const formatTime = (timeInSeconds: any) => {
    const roundedTimeInSeconds = Math.round(timeInSeconds);
    const hours = Math.floor(roundedTimeInSeconds / 3600);
    const minutes = Math.floor((roundedTimeInSeconds - (hours * 3600)) / 60);
    const seconds = roundedTimeInSeconds - (hours * 3600) - (minutes * 60);
  
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  

  useEffect(() => {
    if (inputUrl) {
      setIsLoading(true);
      setIsError("")
      generateVideoThumbnails(inputUrl as unknown as File, numberOfThumbnails, "url").then((res) => {
        setIsLoading(false);
        setThumbnails(res);
      }).catch((Err) => {
        setIsError(Err)
        setIsLoading(false);
      })
    }
  }, [inputUrl, numberOfThumbnails]);

  return (
    <div className='fromUrl'>
      {inputUrl && <div className="video text-center">
        <video ref={videoRef} src={inputUrl} poster={selectedThumbnail || ""} controls onLoadedMetadata={() => {
          if (videoRef.current) {
            const duration = videoRef.current.duration;
            if (duration) {
              setNumberOfThumbnails(Math.floor(duration));
            }
          }
        }}></video>
      </div>}
      <div className="formgroup">
        <input type={"url"} onChange={(e) => {
            setInputUrl(e.target.value)
        }} placeholder="Direct URL of video file"/>
        <button onClick={() => {
          if (inputUrl) {
            setIsLoading(true);
            setIsError("")
            generateVideoThumbnails(inputUrl as unknown as File, numberOfThumbnails, "url").then((res) => {
              setIsLoading(false);
              setThumbnails(res);
            }).catch((Err) => {
              setIsError(Err)
              setIsLoading(false);
            })
          }
        
        }}
        disabled={inputUrl ? false : true}
        >Generate Thumbnails</button>
      </div>
      <List>
        {!isLoading ? thumbnails?.map((image, index) => {
          const timecode = videoRef.current?.duration ? formatTime(index * videoRef.current.duration / numberOfThumbnails) : '';
          return (
            <ListItem button key={index} onClick={() => {
              setselectedThumbnail(image);
              if (videoRef.current) {
                videoRef.current.currentTime = index * videoRef.current.duration / numberOfThumbnails;
                videoRef.current.play();
              }
            }}>
              <ListItemIcon>
                <img src={image} alt="thumbnails" className={`width-100 ${image === selectedThumbnail ? "active" : ""}`} style={{ maxWidth: 200 }} />
              </ListItemIcon>
              <ListItemText primary={`Таймкод: ${timecode}`} />
            </ListItem>
          );
        }) : <img src={loadingSVG} alt="" className='no-border' />}
        {isError && <pre style={{maxWidth: 800, margin: "auto", overflow: "auto"}}>{JSON.stringify(isError, undefined, 2)} </pre>}
      </List>
    </div>
  )
}

export default VideoThumbnailsFromUrl
