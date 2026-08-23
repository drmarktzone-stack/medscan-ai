import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { getMiniApp } from '@/wechat/miniapps/registry.js';
import { getMiniAppComponent } from '@/wechat/miniapps/components.js';
import MiniAppShell from '@/wechat/miniapps/MiniAppShell.jsx';

export default function MiniAppPage() {
  const { appId } = useParams();
  const app = getMiniApp(appId);

  if (!app) return <Navigate to="/wechat/discover/mini" replace />;

  const AppComponent = getMiniAppComponent(appId);
  if (!AppComponent) return <Navigate to="/wechat/discover/mini" replace />;

  return (
    <MiniAppShell app={app}>
      <AppComponent />
    </MiniAppShell>
  );
}
