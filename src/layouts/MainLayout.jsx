import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

// 主容器（整体布局）
const LayoutContainer = styled(Box)(({ theme }) => ({
  height: '100vh', // 全屏高度
  display: 'flex',
  flexDirection: 'column',
}));

// 内容区（Header + Footer 中间）
const ContentContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  marginTop: 64, // Header高度，一般64px
  marginBottom: 48, // Footer高度，假设48px
  overflowY: 'auto',
  padding: theme.spacing(3),
  backgroundColor: '#f5f7fa',
}));

const MainLayout = () => {
  return (
    <LayoutContainer>
      <Header />

      <ContentContainer>
        <Outlet /> {/* 动态页面内容 */}
      </ContentContainer>

      <Footer />
    </LayoutContainer>
  );
};

export default MainLayout;
