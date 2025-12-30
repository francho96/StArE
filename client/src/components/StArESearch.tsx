import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import SearchIcon from '@mui/icons-material/Search';
import Card from '@mui/material/Card';

import PieChartIcon from '@mui/icons-material/PieChart';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import { useTheme } from '@mui/material/styles';
import { useState } from 'react';

type StArESearchProps = {
  selectedOption: number;
  loading: boolean;
  searched: boolean;
  setSelectedOption: (e: number) => void;
  handleSearch: (e: string) => void;
};

function StArESearch({
  loading,
  selectedOption,
  setSelectedOption,
  handleSearch,
  searched,
}: StArESearchProps) {
  const [query, setQuery] = useState('');
  const theme = useTheme();

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
      backgroundColor: theme.palette.mode === 'dark' ? '#444' : '#ddd',
    },
    transition: 'all 0.2s linear',
  };

  const cardSxDisabled = {
    mb: 3,
    display: 'flex',
    flexDirection: 'column',
    width: 1,
    height: 1,
    maxHeight: 300,
    p: 2,
    borderRadius: '20px',
    alignItems: 'center',
    backgroundColor: 'disabled',
    color: 'text.secondary',
    border: `1px solid ${theme.palette.divider}`,
    transition: 'all 0.2s linear',
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
      {!searched && (
        <>
          <FormControl
            sx={{ m: 1, maxWidth: '600px', width: 1 }}
            variant="outlined"
          >
            <OutlinedInput
              id="outlined-adornment-password"
              type={'text'}
              placeholder="Iniciemos una busqueda"
              onChange={(e) => setQuery(e.target.value)}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    edge="end"
                    onClick={() => (!loading ? handleSearch(query) : null)}
                  >
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              }
              sx={{
                borderRadius: '20px',
              }}
              disabled={loading}
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
            <Card
              sx={
                loading
                  ? { ...cardSx, ...cardSxDisabled }
                  : { ...cardSx, borderColor: selectedOption == 0 ? 'red' : '' }
              }
              onClick={() => setSelectedOption(0)}
            >
              Burbujas
              <BubbleChartIcon color="disabled" />
            </Card>
            <Card sx={cardSxDisabled} onClick={() => setSelectedOption(0)}>
              Barras
              <BarChartIcon color="disabled" />
            </Card>
            <Card sx={cardSxDisabled} onClick={() => setSelectedOption(0)}>
              Torta
              <PieChartIcon color="disabled" />
            </Card>
          </Box>
        </>
      )}
    </Box>
  );
}
export default StArESearch;
