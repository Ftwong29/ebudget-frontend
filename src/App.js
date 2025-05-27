import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { refreshUser } from './store/slices/authSlice'; // ✅ 用新的
import Router from './routes/Router';
function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(refreshUser());
  }, [dispatch]);

  return <Router />;
}

export default App;

