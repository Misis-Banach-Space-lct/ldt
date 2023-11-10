import { Box } from "@mui/material";
import { useState } from "react";
import { Accordion, AccordionSummary, AccordionDetails, Tabs, Tab } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ConnectionForm from './ConnectionForm'
import VideoForm from './VideoForm';

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


function NewConnection(  {updateIsVideoSent}: { updateIsVideoSent: (newIsVideoSent: boolean) => void}) {
    const [value, setValue] = useState(0);
    const handleChange = (_: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };



    return (
        <>
            <Accordion>
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
                        <Tab label="Создать подключение" {...a11yProps(0)}
                            sx={{
                                fontFamily: 'Nunito Sans', textTransform: 'capitalize',
                                '&.Mui-selected': {
                                    fontSize: '20px',
                                },
                                transition: 'font-size 0.3s ease',
                            }} />
                        <Tab label="Загрузить видео" {...a11yProps(1)}
                            sx={{
                                fontFamily: 'Nunito Sans', textTransform: 'capitalize',
                                '&.Mui-selected': {
                                    fontSize: '20px',
                                },
                                transition: 'font-size 0.3s ease',
                            }} />
                    </Tabs>

                </AccordionSummary>
                <AccordionDetails sx={{ height: '450px' }}>
                    <CustomTabPanel value={value} index={0}>
                        <ConnectionForm />
                    </CustomTabPanel>
                    <CustomTabPanel value={value} index={1}>
                        <VideoForm updateIsVideoSent={updateIsVideoSent}/>
                    </CustomTabPanel>
                </AccordionDetails>
            </Accordion>
        </>
    )
}

export default NewConnection