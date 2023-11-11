import { Paper, TextField, Typography, Box, Button, InputAdornment, InputBase, IconButton, Divider, FormHelperText } from "@mui/material";
import DownloadIcon from '@mui/icons-material/Download';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useState, useEffect } from "react";
import dotIcon from '../assets/dot_icon.svg'
import SelectGroup from './SelectGroup'
import CloseIcon from '@mui/icons-material/Close';
import ApiStream from '../services/apiStream'
import ApiCamera from '../services/apiCamera';


function ConnectionForm({ updateIsVideoSent }: { updateIsVideoSent: (newIsVideoSent: boolean) => void }) {
    const [linkArr, setLinkArr] = useState<string[]>([]);
    const [error3, setError3] = useState(false);
    const [helperText3, setHelperText3] = useState('');
    const [disableButton, setdisableButton] = useState(false)
    const [disableUploadButton, setDisableUploadButton] = useState(false);

    const [isVideoSent, setIsVideoSent] = useState<boolean>(false);

    useEffect((() => {
        updateIsVideoSent(isVideoSent)
    })
        , [isVideoSent])


    const [groupId, setGroupId] = useState<number>(0);
    const updateGroupId = (newGroupId: number) => {
        setGroupId(newGroupId);
    };
    const [titleValue, setTitleValue] = useState<string>('');
    const [titleError, setTitleError] = useState<boolean>(false);
    const [titleHelperText, setTitleHelperText] = useState<string>('');

    function handleTitelChange(event: any) {
        setIsVideoSent(false);
        setTitleValue(event.target.value)
    }

    const handleMultipleLinksChange = (event: any) => {
        setIsVideoSent(false);
        const inputText = event.target.value;
        const lines = inputText.split('\n')
        let linkSet = new Set<string>();

        const urlRegex = /^(rtsp):\/\/[^\s/$.?#].[^\s]*$/i;
        let isInvalidFormat = false;
        for (let line of lines) {
            line = line.trim()
            if (
                urlRegex.test(
                    line
                ) && line.match(/rtsp/g).length === 1
            ) {
                setError3(false);
                setHelperText3('');
                linkSet.add(line);
            } else {
                setError3(true);
                isInvalidFormat = true;
                setHelperText3('Неверный формат ввода ссылки. Вводите каждую ссылку с новой строки');
            }
            if (inputText.trim() === '') {
                setError3(false);
                setHelperText3('');
                isInvalidFormat = false;
                setDisableUploadButton(false);
            }
        }
        setdisableButton(isInvalidFormat)
        setDisableUploadButton(inputText.trim() !== '' || isInvalidFormat);
        setLinkArr(Array.from(linkSet));
    }


    const handleSendVideo = (event: any) => {
        setIsVideoSent(false);
        let errorEmpty = false;
        event.preventDefault();

        if (!titleValue) {
            setTitleError(true);
            setTitleHelperText('Введите название подключения')
            errorEmpty = true;
        }
        else {
            setTitleError(false);
            setTitleHelperText('')
            errorEmpty = false;
        }

        if (!errorEmpty && linkArr) {
            let Urls = [];
            if (selectedFile) Urls = uploadedFiles;
            else Urls = linkArr;
            let streamTitle = ''
            function generateUUID(): string {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = Math.random() * 16 | 0,
                        v = c === 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            }
            for (let i = 0; i < Urls.length; i++) {
                if (Urls.length === 1) {
                    streamTitle = titleValue;
                }
                else {
                    streamTitle = `${titleValue}_${i}`
                }
                const uuid = generateUUID()
                ApiStream.createStream({
                    name: streamTitle,
                    channels: {
                        '0': {
                            url: Urls[i],
                            on_demand: true,
                            debug: false,
                        }
                    }
                }, uuid);
                ApiCamera.createCamera({
                    groupId: groupId,
                    uuid: uuid,
                    url: Urls[i],
                })

            }
            setSelectedFile(null);
            setIsVideoSent(true);
            setErrorText('');
        }
    };





    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const [errorText, setErrorText] = useState('');
    const [textFieldDisabled, setTextFieldDisabled] = useState(false);

    function parseCSV(csvData: string): { columns: number, urls: string[] } {
        setIsVideoSent(false);
        const lines = csvData.split('\n');
        const urls: string[] = [];
        let columns = 0;

        for (const line of lines) {
            const columnsInLine = line.split(',');
            if (columnsInLine.length > columns) {
                columns = columnsInLine.length;
            }

            for (const column of columnsInLine) {
                const trimmedColumn = column.trim();
                if (trimmedColumn) {
                    urls.push(trimmedColumn);
                }
            }
        }

        return { columns, urls };
    }

    const handleFileInputChange = (e: any) => {
        setIsVideoSent(false);
        const file = e.target.files[0];
        if (!file) {
            setSelectedFile(null);
            setErrorText('');
            return;
        }
        const allowedExtensions = ['.csv'];
        const fileExtension = file.name.split('.').pop();
        if (!allowedExtensions.includes(`.${fileExtension}`)) {
            setSelectedFile(null);
            setErrorText('Неверный формат, пожалуйста загрузите файл типа: .csv');
            setdisableButton(true);
            return;
        }
        setSelectedFile(file);
        setErrorText('');
        setTextFieldDisabled(true);
        const reader = new FileReader();
        reader.onload = (event: any) => {
            const csvData = event.target.result as string;
            const fileObjects = parseCSV(csvData);
            if (validateCSV(fileObjects)) {
                setdisableButton(false);
                setUploadedFiles(fileObjects.urls);
            } else {
                setErrorText('CSV файл должен содержать только одну колонку с URL.');
                setdisableButton(true);
            }
        };
        reader.readAsText(file);
    };

    function validateCSV(fileData: { columns: number, urls: string[] }): boolean {
        return fileData.columns === 1;
    }

    return (
        <>
            <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                <Box display="flex" alignItems="center" justifyContent="center" flexDirection={'column'} sx={{ mt: 3 }}>
                    <TextField multiline rows={6} onChange={handleMultipleLinksChange} error={error3} helperText={helperText3} disabled={textFieldDisabled}
                        id="outlined-basic" label="Введите ссылки(каждая ссылка с новой строки)" variant="standard"
                        sx={{ mt: 1, width: '400px', backgroundColor: '#DFDFED' }}
                        color="secondary"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <DownloadIcon sx={{ color: '#0B0959' }} />
                                    <input
                                        type="file"
                                        id="fileInput"
                                        style={{ display: 'none' }}
                                        accept=".csv"
                                        onChange={handleFileInputChange}
                                        disabled={disableUploadButton}
                                    />
                                </InputAdornment>
                            ),
                        }} />
                    <label htmlFor="fileInput">
                        <Button sx={{ mt: 1, mb: 2 }}
                            component="span"
                            variant="outlined"
                            color="secondary"
                            startIcon={<CloudUploadIcon />}
                            disabled={disableUploadButton}
                        >
                            Загрузить файл
                        </Button>
                    </label>
                    <Typography variant="body2" color="error">
                        {errorText}
                    </Typography>
                    <Typography sx={{ mb: 2 }} variant="body2" color="textSecondary">
                        Требуется файл типа .csv (один столбец с нужными ссылками)
                    </Typography>
                    {selectedFile && (
                        <Paper elevation={3} sx={{ mb: 2, padding: '10px', display: 'flex', alignItems: 'center' }}>
                            <InsertDriveFileIcon sx={{ fontSize: 20, marginRight: '10px', color: '#4094AC' }} />
                            <Typography variant="body2">Выбранный файл: {selectedFile.name}</Typography>
                            <IconButton onClick={() => {
                                setSelectedFile(null);
                                setTextFieldDisabled(false);
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
                                error={titleError}
                                value={titleValue}
                                onChange={handleTitelChange}
                                sx={{ ml: 1, flex: 1 }}
                                placeholder="Введите название"
                                inputProps={{ 'aria-label': 'stream title field' }}
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
                    <Button onClick={handleSendVideo} disabled={disableButton}
                        style={{ color: '#0B0959', fontFamily: 'Nunito Sans', backgroundColor: '#CEE9DD', borderRadius: '8px', textTransform: 'capitalize', marginRight: 20, width: '250px', height: '40px' }}
                    >
                        Создать подключение
                    </Button>
                </Box>
            </Box>
        </>
    )
};

export default ConnectionForm;