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

function App() {
  const { mode, toggleMode } = useThemeMode();
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  return (
    <div>
      <AppBar position="static">
        <Toolbar
          sx={{
            display: 'flex',
            justifyContent: 'space-between'
          }}
        >
          <IconButton onClick={toggleDrawer(true)} color="inherit">
            <MenuRoundedIcon />
          </IconButton>
          

          <IconButton sx={{ ml: 1 }} onClick={toggleMode} color="inherit">
            {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Toolbar>
        <Drawer open={open} onClose={toggleDrawer(false)}>
            <DrawerList toggleDrawer={toggleDrawer} />
          </Drawer>
      </AppBar>

      <main style={{ padding: '1rem' }}>
        <Outlet />
      </main>
    </div>
  );
}

export default App;
