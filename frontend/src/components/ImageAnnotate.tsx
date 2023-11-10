import { AreaSelector, IArea } from '@bmunozg/react-image-area'
import { useState, useEffect, useReducer } from 'react';
import { Button, Select, MenuItem, Box, Typography, Paper, Divider } from '@mui/material';



interface ImageAnnotateProps {
  imageUrl: string;
  updateLabelingData: (newLabelingData: LabelingData[]) => void;
}

interface AnnotatedArea extends IArea {
  classIndex: number;
}

interface LabelingData {
  areas: AnnotatedArea[];
  image: string;
}

const labelingDataReducer = (state: LabelingData[], action: { type: string, areas: AnnotatedArea[], image: string }) => {
  switch (action.type) {
    case 'SUBMIT':
      return [...state, { areas: action.areas, image: action.image }];
    default:
      return state;
  }
};

function ImageAnnotate({ imageUrl, updateLabelingData }: ImageAnnotateProps) {
  const [areas, setAreas] = useState<AnnotatedArea[]>([]);
  const [selectedClass, setSelectedClass] = useState<number>(1);
  const [tempArea, setTempArea] = useState<IArea | null>(null);
  const [labelingData, dispatch] = useReducer(labelingDataReducer, []);

  useEffect(() => {
    if (labelingData) updateLabelingData(labelingData);
  }, [labelingData]);

  const onChangeHandler = (areas: IArea[]) => {
    setTempArea(areas[areas.length - 1]);
  }

  const applyClassToArea = () => {
    if (tempArea) {
      const newAreas = [...areas, { ...tempArea, classIndex: selectedClass }];
      setAreas(newAreas);
      setTempArea(null);
    }
  }

  const handleClassChange = (event: any) => {
    setSelectedClass(event.target.value as number);
  }

  const undoSelection = () => {
    setAreas(areas.slice(0, -1));
  }

  const handleSubmit = () => {
    dispatch({ type: 'SUBMIT', areas: areas, image: imageUrl });
    setTempArea(null);
    setAreas(areas.slice(0, 0));
  }

  const classDict: { [index: number]: string } = {
    0: 'Воздушные шарики/игрушки',
    1: 'Торговая тележка/палатка',
    2: 'Человек',
    3: 'Иной объект'
  }

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <AreaSelector
          areas={tempArea ? [...areas, tempArea] : areas}
          onChange={onChangeHandler}
        >
          <img src={imageUrl} alt='my image' width='800px' style={{ marginLeft: '30px' }} />
        </AreaSelector>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'column', height: '200px', margin: '0 30px' }}>
          <Select
            value={selectedClass}
            onChange={handleClassChange}
          >
            <MenuItem value={1}>Воздушные шарики/игрушки</MenuItem>
            <MenuItem value={2}>Торговая тележка/палатка</MenuItem>
            <MenuItem value={3}>Человек</MenuItem>
            <MenuItem value={4}>Иной объект</MenuItem>
          </Select>
          <Button
            style={{
              color: '#0B0959', fontFamily: 'Nunito Sans', backgroundColor: '#CEE9DD',
              borderRadius: '8px', margin: '20px 0'
            }}
            onClick={applyClassToArea}>
            Применить класс к области
          </Button>
          <Button
            style={{
              color: '#0B0959', fontFamily: 'Nunito Sans', backgroundColor: '#E9CECE',
              borderRadius: '8px', margin: '20px 0'
            }}
            onClick={undoSelection}>Отменить последнее выделение</Button>
          {(areas.length !== 0) &&
            <Box>
              <Typography
                sx={{
                  fontFamily: 'Nunito Sans',
                  fontWeight: 700,
                  fontSize: '15px',
                  color: '#0B0959',
                  textDecoration: 'none',
                  margin: 1,
                }}
              >
                Выделенные объекты:
              </Typography>
              <Paper sx={{ height: '200px', overflow: 'auto' }}>
                {areas.map((area, index) => (
                  <>
                    <Divider />
                    <Typography
                      sx={{
                        fontFamily: 'Nunito Sans',
                        fontWeight: 700,
                        fontSize: '15px',
                        color: '#0B0959',
                        textDecoration: 'none',
                        margin: 0.5,
                      }}
                    >
                      {/* {index + 1}. {JSON.stringify(area)} */}
                      {index + 1}. Класс {classDict[area.classIndex - 1]}
                    </Typography>
                  </>
                ))}
              </Paper>
            </Box>}
          <Button
            style={{
              color: 'white', fontFamily: 'Nunito Sans', backgroundColor: '#0B0959',
              borderRadius: '8px', margin: '5px 0'
            }}
            onClick={handleSubmit}>Отправить в модель</Button>
        </Box>

      </Box>
    </div>
  )
}

export default ImageAnnotate