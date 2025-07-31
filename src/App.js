import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { refreshUser } from './store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import Router from './routes/Router';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const [ready, setReady] = useState(false); // ✅ 加载完成标志

  useEffect(() => {
    const init = async () => {
      if (token) {
        await dispatch(refreshUser());
      } else {
        navigate('/login');
      }
      setReady(true); // ✅ 初始化结束
    };
    init();
  }, [token, dispatch, navigate]);

  // ✅ 未准备好，不渲染路由，避免提前访问接口
  if (!ready) {
    return (
      <Box
        sx={{
          display: 'flex',
          height: '100vh',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return <Router />;
}

export default App;
