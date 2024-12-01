import { RouterProvider } from 'react-router-dom';
import { router } from './routers/routes';
// Pastikan path ini benar

function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App;
