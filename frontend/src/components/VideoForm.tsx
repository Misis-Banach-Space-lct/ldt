import { Paper, Typography, Box, Button, InputAdornment, InputBase, IconButton, Divider, FormHelperText } from "@mui/material";
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useEffect, useState } from "react";
import dotIcon from '../assets/dot_icon.svg'
import SelectGroup from './SelectGroup'
import CloseIcon from '@mui/icons-material/Close'
import ApiVideo from "../services/apiVideo";


function VideoForm({updateIsVideoSent}: { updateIsVideoSent: (newIsVideoSent: boolean) => void}) {


    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [errorText, setErrorText] = useState('');
    const [groupId, setGroupId] = useState<number>(0);
    const updateGroupId = (newGroupId: number) => {
        setGroupId(newGroupId);
    };

    const [titleValue, setTitleValue] = useState<string>('');
    const [titleError, setTitleError] = useState<boolean>(false);
    const [titleHelperText, setTitleHelperText] = useState<string>('');

    function handleTitelChange(event: any) {
        setTitleValue(event.target.value)
    }

    const [isVideoSent, setIsVideoSent] = useState<boolean>(false);

    useEffect((() => {
        updateIsVideoSent(isVideoSent)
    })
    , [isVideoSent])

    const handleFileInputChange = (e: any) => {
        setIsVideoSent(false);
        const file = e.target.files[0];
        if (!file) {
            setSelectedFile(null);
            setErrorText('');
            return;
        }
        const allowedExtensions = ['.zip', '.mp4'];
        const fileExtension = file.name.split('.').pop();
        if (!allowedExtensions.includes(`.${fileExtension}`)) {
            setSelectedFile(null);
            setErrorText('Неверный формат, пожалуйста загрузите файл типа: .zip или .mp4');
            return;
        }
        setSelectedFile(file);
        setErrorText('');
    };

    const handleSendVideo = (event: any) => {
        let errorEmpty = false;
        event.preventDefault();

        if (!titleValue) {
            setTitleError(true);
            setTitleHelperText('Введите название видео')
            errorEmpty = true;
        }
        else {
            setTitleError(false);
            setTitleHelperText('')
            errorEmpty = false;
        }

        if (!selectedFile) {
            setErrorText('Загрузите файл типа: .zip или .mp4');
            errorEmpty = true;
        }
        else {
            setErrorText('');
            errorEmpty = false;
        }

        if (!errorEmpty) {
            if (selectedFile && selectedFile.type === 'video/mp4') {
                let result = ApiVideo.createOneVideo({
                    title: titleValue,
                    file: selectedFile,
                    groupId: groupId
                });

                result.then(_ => {
                    setSelectedFile(null);
                    setIsVideoSent(true);
                    setErrorText('');
                });

                result.catch(error => {
                    if (error.response.status === 400) {
                        setErrorText('Видео с таким названием уже существует');
                        setIsVideoSent(false);
                        errorEmpty = true;
                    }
                });
            }
            else if (selectedFile && selectedFile.type === 'application/zip') {
                let result = ApiVideo.createVideosAll({
                    title: titleValue,
                    file: selectedFile,
                    groupId: groupId
                });

                result.then(_ => {
                    setSelectedFile(null);
                    setIsVideoSent(true);
                    setErrorText('');
                });

                result.catch(error => {
                    if (error.response.status === 400) {
                        setErrorText('Видео с таким названием уже существует');
                        setSelectedFile(null);
                        setIsVideoSent(false);
                        errorEmpty = true;
                    }
                });
            }
        }
    };

    return (
        <>
            <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                <Box display="flex" alignItems="center" justifyContent="center" flexDirection={'column'} sx={{ mt: 3 }}>
                    <InputAdornment position="end">
                        <input
                            type="file"
                            id="fileInput"
                            style={{ display: 'none' }}
                            accept=".zip,.mp4"
                            onChange={handleFileInputChange}
                        />
                    </InputAdornment>
                    <label htmlFor="fileInput">
                        <Button sx={{ mt: 1, mb: 2, width: '400px', height: '200px' }}
                            component="span"
                            variant="outlined"
                            color="secondary"
                            startIcon={<CloudUploadIcon />}
                        >
                            Загрузить файл
                        </Button>
                    </label>
                    <Typography variant="body2" color="error">
                        {errorText}
                    </Typography>
                    {isVideoSent && <Typography sx={{fontSize: '25px'}} variant="body2" color="success.main">
                        Видео отправлено
                    </Typography>}
                    <Typography sx={{ mb: 2 }} variant="body2" color="textSecondary">
                        Требуется файл типа .zip <br></br>
                        Либо один файл типа .mp4
                    </Typography>
                    { selectedFile && (
                        <Paper elevation={3} sx={{ mb: 2, padding: '10px', display: 'flex', alignItems: 'center' }}>
                            <InsertDriveFileIcon sx={{ fontSize: 20, marginRight: '10px', color: '#4094AC' }} />
                            <Typography variant="body2">Выбранный файл: {selectedFile?.name}</Typography>
                            <IconButton onClick={() => {
                                setSelectedFile(null);
                                setErrorText('');
                            }}>
                                <CloseIcon />
                            </IconButton>
                        </Paper>
                    )}
                </Box>
                <Box sx={{ display: 'flex', height: '260px', flexDirection: 'column', justifyContent: 'space-between', mt: '20px' }}>
                    <Paper
                        component="form"
                        sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: '250px', height: '40px', backgroundColor: '#DFDFED' }}
                    >
                        <img width="15px" height="15px" src={dotIcon} alt="logo" style={{ margin: '0 5px' }} />
                        <Box>
                            <InputBase
                                sx={{
                                    ml: 1,
                                    flex: 1,
                                    color: titleError ? 'error.main' : 'inherit',
                                }}
                                error={titleError}
                                value={titleValue}
                                onChange={handleTitelChange}
                                placeholder="Введите название"
                                inputProps={{ 'aria-label': 'video title field' }}
                            />
                            {titleError &&
                                <>
                                    <Divider sx={{ borderColor: 'error.main' }} />
                                    <FormHelperText sx={{ color: 'error.main' }}>{titleHelperText}</FormHelperText>
                                </>
                            }
                        </Box>
                    </Paper>
                    <SelectGroup updateGroupId={updateGroupId} />
                    <Button onClick={handleSendVideo}
                        style={{ color: '#0B0959', fontFamily: 'Nunito Sans', backgroundColor: '#CEE9DD', borderRadius: '8px', textTransform: 'capitalize', marginRight: 20, width: '250px', height: '40px' }}
                    >
                        Обработать видео
                    </Button>
                </Box>
            </Box>
        </>
    )
};

export default VideoForm;