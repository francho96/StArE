import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import App from './App';
import Home from './pages/Home';
import About from './pages/About';
import { ThemeModeProvider } from './theme/ThemeProvider';
import { Provider } from 'react-redux';
import store from './redux/store';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'about',
        element: <About />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeModeProvider>
      <Provider store={store}>
        <SnackbarProvider maxSnack={3}>
          <RouterProvider router={router} />
        </SnackbarProvider>
      </Provider>
    </ThemeModeProvider>
  </React.StrictMode>
);
