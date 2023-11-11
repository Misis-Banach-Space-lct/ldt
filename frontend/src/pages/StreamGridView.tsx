import { Box } from "@mui/material";
import decoration_lineLINK from '../assets/decoration_line.svg';
import StreamGrid from '../components/StreamGrid'


function StreamGridView() {
    return (
        <>
            <Box
                sx={{
                    backgroundImage: `url(${decoration_lineLINK})`,
                    backgroundColor: '#DFDFED',
                    height: '100vh',
                    backgroundPosition: 'bottom',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '100vw',
                }}
            >
                <StreamGrid />
            </Box>
        </>
    )
}

export default StreamGridView;