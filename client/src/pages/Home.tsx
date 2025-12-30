import Box from '@mui/material/Box';
import StArESearch from '../components/StArESearch';
import BubbleChartComponent from '../visualizations/BubbleChart';
import { useState } from 'react';
import { fetchDocuments } from '../calls/google-fetch';
import { useCallHistory } from '../hooks/useCallHistory';
import { isAxiosError } from 'axios';
import { enqueueSnackbar } from 'notistack';
import { useDispatch, useSelector } from 'react-redux';
import { setLoading, setResultData } from '../redux/slices/resultSlice';
import CircularProgress from '@mui/material/CircularProgress';

function Home() {
  const [selectedOption, setSelectedOption] = useState(0);
  const { addCall } = useCallHistory();

  const dispatch = useDispatch();

  const resultData = useSelector((state: any) => state.result.data);

  const loading = useSelector((state: any) => state.result.loading);

  const safeData = resultData ? structuredClone(resultData) : null;


  const handleSearch = async (query: string) => {
    const trimmed = query?.trim();
    if (!trimmed) {
      enqueueSnackbar('Para buscar, es necesario escribir la busqueda', {variant: 'warning'})
      return;
    }

    dispatch(setLoading(true));
    addCall(trimmed);

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
    <Box>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height="600px"
      >
        {loading ? (
          <CircularProgress />
        ) : (
          <BubbleChartComponent data={safeData} />
        )}
      </Box>

      <StArESearch
        loading={loading}
        setSelectedOption={setSelectedOption}
        selectedOption={selectedOption}
        searched={!!safeData}
        handleSearch={handleSearch}
      />
    </Box>
  );
}

export default Home;
