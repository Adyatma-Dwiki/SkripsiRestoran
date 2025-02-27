import { RouterProvider } from 'react-router-dom';
import { router } from './routers/routes';
import './index.css'
// Pastikan path ini benar

function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App;
