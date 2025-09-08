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
        


           
    </Box>
);
}
export default StArE;
