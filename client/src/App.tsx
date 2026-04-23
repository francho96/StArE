import { Outlet } from 'react-router-dom';
import DrawerList from './components/Drawer';
import Drawer from '@mui/material/Drawer';
import { useState } from 'react';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import { useTheme } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
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

  const container =
    window !== undefined ? () => window().document.body : undefined;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
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
            <DrawerList toggleDrawer={handleDrawerToggle} />
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
            <DrawerList toggleDrawer={handleDrawerToggle} />
          </Drawer>
          <AppBar
            position="fixed"
            sx={{
              display: { sm: 'none' },
              height: 60,
              backgroundColor: theme.palette.mode === 'dark' ? '#222' : '#fff',
              width: { sm: `calc(100% - ${drawerWidth}px)` },
              ml: { sm: `${drawerWidth}px` },
              color: theme.palette.text.primary,
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
          component="main"
          sx={{
            padding: '1rem',
            flexGrow: 1,
            ml: { sm: `${drawerWidth}px` },
            mt: { xs: `60px`, sm: 0 },
            display: 'flex',
            flexDirection: 'column',
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            minHeight: { xs: 'calc(100dvh - 60px)', sm: '100dvh' },
            boxSizing: 'border-box',
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Box>
      </CallHistoryProvider>
    </Box>
  );
}

export default App;
