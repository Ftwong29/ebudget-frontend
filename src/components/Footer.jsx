import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useSelector } from 'react-redux';
import { styled } from '@mui/material/styles';

// 底部固定 Footer
const FooterContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  left: 0,
  width: '100%',
  backgroundColor: '#e0e3e7',
  padding: theme.spacing(1),
  textAlign: 'center',
  zIndex: 1200,
}));

// 右下角小卡片 (User Info)
const UserInfoCard = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(10), // 比 Footer 稍微往上
  right: theme.spacing(2),
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
  backgroundColor: '#ffffff',
  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
  zIndex: 1300,
}));

const Footer = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <>
      {/* Footer 版权信息 */}
      <FooterContainer>
        <Typography variant="body2" color="textSecondary">
          © {new Date().getFullYear()} eBudget. All rights reserved. | Version 0.2.2
        </Typography>
      </FooterContainer>

      {/* User Info 小卡片 */}
      {/* {user && (
        <UserInfoCard>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Login Info
          </Typography>
          <Typography variant="body2">User ID: {user.userid}</Typography>
          <Typography variant="body2">Department: {user.department}</Typography>
          <Typography variant="body2">Company: {user.branchcode2}</Typography>
        </UserInfoCard>
      )} */}
    </>
  );
};

export default Footer;
