import Button from '@mui/material/Button';
import { Outlet, Link } from 'react-router-dom';
import DrawerList from './components/Drawer';
import Drawer from '@mui/material/Drawer';
import { useState } from 'react';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import { useThemeMode } from './theme/ThemeProvider';
import { useTheme } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import StArE from './components/StArE';
import Box from '@mui/material/Box';
import { CallHistoryProvider } from './hooks/useCallHistory';

interface Props {
  window?: () => Window;
}

const drawerWidth = 240;

function App(props: Props) {
  const { window } = props;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleDrawerClose = () => {
    setIsClosing(true);
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

  const handleDrawerToggle = () => {
    if (!isClosing) {
      setMobileOpen(!mobileOpen);
    }
  };

  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  const container =
    window !== undefined ? () => window().document.body : undefined;

  return (
    <div>
      <CallHistoryProvider>
        <Box display={'flex'}>
          <Drawer
            container={container}
            variant="temporary"
            open={mobileOpen}
            onTransitionEnd={handleDrawerTransitionEnd}
            onClose={handleDrawerClose}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
              },
            }}
            slotProps={{
              root: {
                keepMounted: true, // Better open performance on mobile.
              },
            }}
          >
            <DrawerList toggleDrawer={toggleDrawer} />
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
              },
            }}
            open
          >
            <DrawerList toggleDrawer={toggleDrawer} />
          </Drawer>
          <AppBar
            sx={{
              display: { sm: 'none' },
              height: 60,
              backgroundColor: theme.palette.mode === 'dark' ? '#222' : '#fff',
              width: { sm: `calc(100% - ${drawerWidth}px)` },
              ml: { sm: `${drawerWidth}px` },
            }}
          >
            <Toolbar
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, display: { sm: 'none' } }}
              >
                <MenuRoundedIcon />
              </IconButton>
              <Box sx={{ display: { sm: 'none' } }}>
                <StArE small />
              </Box>
            </Toolbar>
          </AppBar>
        </Box>

        <Box
          sx={{
            padding: '1rem',
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            height: { sm: 1 },
            ml: { sm: `${drawerWidth}px` },
            mt: { sm: `60px` },
          }}
        >
          <Outlet />
        </Box>
      </CallHistoryProvider>
    </div>
  );
}

export default App;
