import '@fontsource/comfortaa';

import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';

function StArE() {
return (
    <Box
        sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: 1,
            position: 'relative', // Add relative positioning
        }}
    >
        <Typography fontSize={60} fontFamily={'comfortaa'}>
            StArE
        </Typography>
        <Box
            sx={{
                position: 'absolute',
                backgroundColor: 'white',
                top: 0,
                left: '50%',
                transform: 'translateX(-60%) translateY(270%)',
                height: '16px',
                width: '16px',
                borderRadius: '20px'
            }}
        />
        <Box
            sx={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-62%) translateY(125 %)',
                
            }}
        >


            <RemoveRedEyeIcon sx={{ fontSize: 25}} />
        </Box>


           
    </Box>
);
}
export default StArE;
