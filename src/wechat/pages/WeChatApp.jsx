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

export default function WeChatApp() {
  return (
    <WeChatProvider>
      <Routes>
        <Route element={<WeChatLayout />}>
          <Route index element={<ChatsPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="discover" element={<DiscoverPage />} />
          <Route path="me" element={<ProfilePage />} />
        </Route>
        <Route path="chat/:chatId" element={<ChatRoomPage />} />
        <Route path="moments" element={<MomentsPage />} />
        <Route path="*" element={<Navigate to="/wechat" replace />} />
      </Routes>
    </WeChatProvider>
  );
}
