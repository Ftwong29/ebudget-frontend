import React from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

// 主容器
const MainContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  backgroundColor: '#f5f7fa',
  display: 'flex',
  flexDirection: 'column',
}));

const DashboardPage = () => {
  return (
    <MainContainer>
      {/* Dashboard 内容区 */}
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Welcome to your Dashboard 👋
        </Typography>
        <Typography>
          You are successfully logged in. Here you can manage your budget data.
        </Typography>
      </Box>
    </MainContainer>
  );
};

export default DashboardPage;
