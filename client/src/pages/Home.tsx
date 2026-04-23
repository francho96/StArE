import Box from '@mui/material/Box';
import StArESearch from '../components/StArESearch';
import BubbleChartComponent from '../visualizations/BubbleChart';
import BarChartComponent from '../visualizations/BarChart';
import PieChartComponent from '../visualizations/PieChart';
import { fetchDocuments } from '../calls/google-fetch';
import { useCallHistory } from '../hooks/useCallHistory';
import { isAxiosError } from 'axios';
import { enqueueSnackbar } from 'notistack';
import { useDispatch, useSelector } from 'react-redux';
import {
  setLoading,
  setResultData,
  setVisualType,
} from '../redux/slices/resultSlice';
import CircularProgress from '@mui/material/CircularProgress';

function Home() {
  const { addCall } = useCallHistory();

  const dispatch = useDispatch();

  const resultData = useSelector((state: any) => state.result.data);

  const loading = useSelector((state: any) => state.result.loading);

  const selectedOption = useSelector((state: any) => state.result.visualType);

  const safeData = resultData ? structuredClone(resultData) : null;

  const handleSearch = async (query: string) => {
    const trimmed = query?.trim();
    if (!trimmed) {
      enqueueSnackbar('Para buscar, es necesario escribir la busqueda', {
        variant: 'warning',
      });
      return;
    }

    dispatch(setLoading(true));
    addCall(trimmed, selectedOption);

    const returnData = await fetchDocuments(trimmed);

    if (isAxiosError(returnData)) {
      enqueueSnackbar('Error al consumir datos', { variant: 'error' });
      dispatch(setLoading(false));
      return;
    }

    dispatch(setResultData(returnData));
    dispatch(setLoading(false));
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        minHeight: 0,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexGrow: 1,
          width: '100%',
          overflow: 'hidden',
          minHeight: { xs: '300px', sm: '400px' },
        }}
      >
        {loading ? (
          <CircularProgress />
        ) : (
          <>
            {selectedOption === 0 && <BubbleChartComponent data={safeData} />}
            {selectedOption === 1 && <BarChartComponent data={safeData} />}
            {selectedOption === 2 && <PieChartComponent data={safeData} />}
          </>
        )}
      </Box>

      <StArESearch
        loading={loading}
        setSelectedOption={(type) => dispatch(setVisualType(type))}
        selectedOption={selectedOption}
        searched={!!safeData}
        handleSearch={handleSearch}
      />
    </Box>
  );
}

export default Home;
