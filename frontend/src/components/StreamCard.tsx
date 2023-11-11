import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import { Button, Typography, Box } from "@mui/material";
import backgroundImg from '../assets/video_card_background.png'
import arrowRightIcon from '../assets/arrowRight.svg';

interface Props {
    title: string;
    stream_id: string;
    status: string;
}

export default function VideoCard(props: Props) {
    const { stream_id, status, title } = props;

    let source = `/currentStream/${stream_id}`;

    return (
        <Card sx={{ width: '310px', boxShadow: '0px 0px 10px 5px rgba(0,0,0,0.1)', borderRadius: '15px', mt: 2, mb: 10, ml: 'auto', mr: 'auto' }} >
            <CardMedia
                sx={{ height: 175 }}
                image={backgroundImg}
                title="camera view"
            />
            <CardContent style={{ display: "flex", justifyContent: "space-between", flexDirection: 'column' }}>
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
                    Камера:
                </Typography>
                <Typography
                    sx={{
                        fontFamily: 'Nunito Sans',
                        fontWeight: 400,
                        fontSize: '15px',
                        color: 'black',
                        textDecoration: 'none',
                        marginRight: 0,
                        paddingRight: 2,
                    }}
                >
                    {title}
                </Typography>
            </CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', m: 2, mt: 0 }}>
                <Box sx={{
                    backgroundColor: (status === 'processing') ? '#F8D5C2' : '#CEE9DD',
                    borderRadius: '8px', p: 1, width: '120px'
                }}>
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
                        {(status === 'processing') ? 'Подклюключение создается' : 'Подключение создано'}<br></br>
                    </Typography>
                </Box>
                {(status !== 'processing') &&
                    <CardActions style={{ display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
                        <Button disabled={status === "progress"} href={source}
                            style={{ borderRadius: '20px', color: '#0B0959', fontSize: '15px' }}
                            sx={{ mt: 'auto', mb: 2, ml: 1, mr: 1, textTransform: 'lowercase' }}>Перейти
                            <img width="15px" height="15px" src={arrowRightIcon} alt="logo" style={{ margin: '0 5px' }} />
                        </Button>
                    </CardActions>}
            </Box>
        </Card>
    );

}
