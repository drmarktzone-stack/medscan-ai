import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { WeChatProvider } from '@/wechat/lib/store.js';
import WeChatLayout from '@/wechat/components/WeChatLayout.jsx';
import ChatsPage from '@/wechat/pages/ChatsPage.jsx';
import ChatRoomPage from '@/wechat/pages/ChatRoomPage.jsx';
import ContactsPage from '@/wechat/pages/ContactsPage.jsx';
import DiscoverPage from '@/wechat/pages/DiscoverPage.jsx';
import MomentsPage from '@/wechat/pages/MomentsPage.jsx';
import ProfilePage from '@/wechat/pages/ProfilePage.jsx';
import MiniProgramsPage from '@/wechat/pages/MiniProgramsPage.jsx';
import MiniAppPage from '@/wechat/pages/MiniAppPage.jsx';
import QrPage from '@/wechat/pages/QrPage.jsx';
import ScanPage from '@/wechat/pages/ScanPage.jsx';
import PayPage from '@/wechat/pages/PayPage.jsx';

export default function WeChatApp() {
  return (
    <WeChatProvider>
      <Routes>
        <Route element={<WeChatLayout />}>
          <Route index element={<ChatsPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="discover" element={<DiscoverPage />} />
          <Route path="discover/mini" element={<MiniProgramsPage />} />
          <Route path="me" element={<ProfilePage />} />
        </Route>
        <Route path="chat/:chatId" element={<ChatRoomPage />} />
        <Route path="moments" element={<MomentsPage />} />
        <Route path="mini/:appId" element={<MiniAppPage />} />
        <Route path="qr" element={<QrPage />} />
        <Route path="scan" element={<ScanPage />} />
        <Route path="pay" element={<PayPage />} />
        <Route path="*" element={<Navigate to="/wechat" replace />} />
      </Routes>
    </WeChatProvider>
  );
}
