import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import { Brightness4, Brightness7 } from '@mui/icons-material';

import MailIcon from '@mui/icons-material/Mail';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import StArE from './StArE';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { useThemeMode } from '../theme/ThemeProvider';
import { useTheme } from '@mui/material/styles';
interface DrawerList {
  toggleDrawer: (e: boolean) => void;
}

export default function DrawerList({ toggleDrawer }: DrawerList) {
  const { mode, toggleMode } = useThemeMode();

  const theme = useTheme();

  return (
    <Box
      component="div"
      sx={{ maxWidth: 250 }}
      role="presentation"
      onClick={() => toggleDrawer(false)}
    >
      <Box display={'flex'}justifyContent={'end'}>
        <IconButton sx={{ ml: 1 }} onClick={toggleMode} color="inherit">
          {theme.palette.mode === 'dark' ? <Brightness7 color='disabled'/> : <Brightness4 color='disabled' />}
        </IconButton>
      </Box>
      <Box
        display={'flex'}
        justifyContent={'center'}
        alignItems={'center'}
      >
        <StArE />
      </Box>
      <Box margin={2}>
        <Typography fontSize={'12px'}>Busquedas pasadas</Typography>
      </Box>
      <Divider />
      <List>
        {['Busqueda 1', 'Busqueda 2', 'Busqueda 3'].map((text, index) => (
          <ListItem key={text} disablePadding>
            <ListItemButton>
              <ListItemIcon>
                {index % 2 === 0 ? <BubbleChartIcon /> : <BarChartIcon />}
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
