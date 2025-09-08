import Typography from '@mui/material/Typography';
import * as React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Input from '@mui/material/Input';
import FilledInput from '@mui/material/FilledInput';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import SearchIcon from '@mui/icons-material/Search';
import StArE from './StArE';
import Card from '@mui/material/Card';

import PieChartIcon from '@mui/icons-material/PieChart';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import { useTheme } from '@mui/material/styles';

function StArESearch() {

  const theme = useTheme()
  const cardSx = {
    mb: 3,
    display: 'flex',
    flexDirection: 'column',
    width: 1,
    height: 1,
    maxHeight: 300,
    p: 2,
    borderRadius: '20px',
    alignItems: 'center',
    cursor: 'pointer',
    border: `1px solid ${theme.palette.divider}`,
    ':hover': {
      backgroundColor: theme.palette.mode === 'dark' ? '#444' : '#ddd'
    },
    transition: 'all 0.2s linear'
  };
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column-reverse',
        alignItems: 'center',
      }}
    >
      <Typography fontSize={12} color={theme.palette.grey[600]}>
        StArE aún esta en proceso de pruebas
      </Typography>
      <FormControl
        sx={{ m: 1, maxWidth: '600px', width: 1 }}
        variant="outlined"
      >
        <OutlinedInput
          id="outlined-adornment-password"
          type={'text'}
          placeholder="Iniciemos una busqueda"
          endAdornment={
            <InputAdornment position="end">
              <IconButton edge="end">
                <SearchIcon />
              </IconButton>
            </InputAdornment>
          }
          sx={{
            borderRadius: '20px',
          }}
        />
      </FormControl>
      <Box
        display={'flex'}
        justifyContent={'space-between'}
        width={1}
        maxWidth={700}
        gap={2}
        height={1}
      >
        <Card sx={cardSx}>
          Burbujas
          <BubbleChartIcon color='disabled' />
        </Card>
        <Card sx={cardSx}>Barras
          <BarChartIcon color='disabled'/>
        </Card>
        <Card sx={cardSx}>Torta
          <PieChartIcon color='disabled' />
        </Card>
      </Box>
    </Box>
  );
}
export default StArESearch;
