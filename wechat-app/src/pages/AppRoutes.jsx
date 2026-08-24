import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { WeChatProvider } from '@/lib/store.js';
import WeChatLayout from '@/components/WeChatLayout.jsx';
import ChatsPage from '@/pages/ChatsPage.jsx';
import ChatRoomPage from '@/pages/ChatRoomPage.jsx';
import ContactsPage from '@/pages/ContactsPage.jsx';
import DiscoverPage from '@/pages/DiscoverPage.jsx';
import MomentsPage from '@/pages/MomentsPage.jsx';
import ProfilePage from '@/pages/ProfilePage.jsx';
import MiniProgramsPage from '@/pages/MiniProgramsPage.jsx';
import MiniAppPage from '@/pages/MiniAppPage.jsx';
import QrPage from '@/pages/QrPage.jsx';
import ScanPage from '@/pages/ScanPage.jsx';
import PayPage from '@/pages/PayPage.jsx';

export default function AppRoutes() {
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </WeChatProvider>
  );
}
