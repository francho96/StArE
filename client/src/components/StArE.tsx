import '@fontsource/comfortaa';

import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';

function StArE({small}: { small?: boolean}) {
return (
    <Box
        sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative', // Add relative positioning
        }}
    >
        <Typography fontSize={small ? 30 : 60} fontFamily={'comfortaa'}  sx={{
        backgroundImage: 'linear-gradient(to right, #ff0000, #0000ff)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
            StArE
        </Typography>
        <Box
            sx={{
                position: 'absolute',
                background: 'linear-gradient(to right, #ff0000, #0000ff)',
                top: 0,
                left: '50%',
                transform: small ? 'translateX(-60%) translateY(320%)' : 'translateX(-65%) translateY(320%)',
                height: small ?  '7px' : '14px',
                width: small ?  '7px' : '14px',
                borderRadius: '20px'
            }}
        />
        <Box
            sx={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: small ? 'translateX(-62%) translateY(62%)' : 'translateX(-62%) translateY(125%)',
                
            }}
        >


            <RemoveRedEyeIcon sx={{ fontSize: small ? 12 : 25, color: 'black'}} />
        </Box>


           
    </Box>
);
}
export default StArE;
