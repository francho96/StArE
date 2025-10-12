import Box from '@mui/material/Box';
import StArESearch from '../components/StArESearch';
import BubbleChartComponent from '../visualizations/BubbleChart';
import { useState } from 'react';
import { fetchDocuments } from '../calls/google-fetch';

function Home() {
  const [selectedOption, setSelectedOption] = useState(0);

  const [result, setResult] = useState(null)

  const handleSearch = async (query: string) => {
    const returnData = await fetchDocuments(query);
    setResult(returnData)
  };

  return (
    <Box>
      <Box
        display={'flex'}
        alignItems={'center'}
        justifyContent={'center'}
        height={'600px'}
      >
        <BubbleChartComponent data={result}/>
      </Box>
      <StArESearch setSelectedOption={setSelectedOption} selectedOption={selectedOption} handleSearch={handleSearch}/>
    </Box>
  );
}
export default Home;
