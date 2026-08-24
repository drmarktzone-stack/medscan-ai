import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { getMiniApp } from '@/miniapps/registry.js';
import { getMiniAppComponent } from '@/miniapps/components.js';
import MiniAppShell from '@/miniapps/MiniAppShell.jsx';

export default function MiniAppPage() {
  const { appId } = useParams();
  const app = getMiniApp(appId);

  if (!app) return <Navigate to="/discover/mini" replace />;

  const AppComponent = getMiniAppComponent(appId);
  if (!AppComponent) return <Navigate to="/discover/mini" replace />;

  return (
    <MiniAppShell app={app}>
      <AppComponent />
    </MiniAppShell>
  );
}
