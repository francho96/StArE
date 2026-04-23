import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Brightness4, Brightness7 } from '@mui/icons-material';

import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import StArE from './StArE';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { useThemeMode } from '../theme/ThemeProvider';
import { useTheme } from '@mui/material/styles';
import { useCallHistory } from '../hooks/useCallHistory';
import {
  clearResult,
  setLoading,
  setResultData,
  setVisualType,
} from '../redux/slices/resultSlice';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDocuments } from '../calls/google-fetch';
import { isAxiosError } from 'axios';
import { enqueueSnackbar } from 'notistack';
interface DrawerList {
  toggleDrawer: (e: boolean) => void;
}

export default function DrawerList({ toggleDrawer }: DrawerList) {
  const dispatch = useDispatch();

  const loading = useSelector((state: any) => state.result.loading);

  const handleSearch = async (query: string) => {
    dispatch(setLoading(true));
    const returnData = await fetchDocuments(query);

    if (isAxiosError(returnData)) {
      enqueueSnackbar('Error al consumir datos', { variant: 'error' });
      dispatch(setLoading(false));

      return;
    }
    dispatch(setResultData(returnData));

    dispatch(setLoading(false));
  };

  const { toggleMode } = useThemeMode();
  const theme = useTheme();
  const { history, clearHistory } = useCallHistory();
  return (
    <Box
      component="div"
      sx={{ maxWidth: 250 }}
      role="presentation"
      onClick={() => toggleDrawer(false)}
    >
      <Box display={'flex'} justifyContent={'end'}>
        <IconButton
          sx={{ ml: 1 }}
          onClick={() => (loading ? null : toggleMode())}
          color="inherit"
        >
          {theme.palette.mode === 'dark' ? (
            <Brightness7 color="disabled" />
          ) : (
            <Brightness4 color="disabled" />
          )}
        </IconButton>
      </Box>
      <Box display={'flex'} justifyContent={'center'} alignItems={'center'}>
        <StArE />
      </Box>
      <Box
        m={'8px 8px 8px 16px'}
        display={'flex'}
        justifyContent={'space-between'}
        alignItems={'center'}
      >
        <Typography fontSize={'12px'}>Busquedas pasadas</Typography>
        <ListItemIcon
          sx={{
            display: 'flex',
            justifyContent: 'end',
          }}
        >
          <DeleteIcon
            sx={{
              cursor: 'pointer',
            }}
            onClick={clearHistory}
          />
        </ListItemIcon>
      </Box>
      <Divider />

      <List>
        <ListItem disablePadding>
          <ListItemButton
            disabled={loading}
            onClick={() => (loading ? null : dispatch(clearResult()))}
          >
            <ListItemIcon>
              <AddIcon />
            </ListItemIcon>
            <ListItemText primary={'Nueva busqueda'} />
          </ListItemButton>
        </ListItem>
        <Divider />

        {history.length === 0 ? (
          <Box margin={2}>
            <Typography fontSize={'12px'}>Sin historial</Typography>
          </Box>
        ) : (
          <>
            {history.map((record, index) => (
              <ListItem key={`${record.query}-${index}`} disablePadding>
                <ListItemButton
                  disabled={loading}
                  onClick={() => {
                    if (loading) return;
                    // Restore visual type in redux
                    dispatch(setVisualType(record.type));
                    // Trigger search
                    handleSearch(record.query);
                  }}
                >
                  <ListItemIcon>
                    {record.type === 0 && <BubbleChartIcon />}
                    {record.type === 1 && <BarChartIcon />}
                    {record.type === 2 && <PieChartIcon />}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      record.query?.length > 12
                        ? `${record.query.slice(0, 12)}...`
                        : record.query
                    }
                    primaryTypographyProps={{ title: record.query }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </>
        )}
      </List>
    </Box>
  );
}
