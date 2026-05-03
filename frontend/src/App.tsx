import { Toaster } from 'react-hot-toast';
import Router from './app/router';

function App() {
  return (
    <>
      <Router />

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            background: '#111827',
            color: '#fff',
            padding: '14px 16px',
          },
        }}
      />
    </>
  );
}

export default App;