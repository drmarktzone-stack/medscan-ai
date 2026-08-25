import React, { Suspense, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import { I18nProvider } from "@/freeai/lib/i18n.jsx";
import { routerBasename } from "@/lib/clinic/standalone";
import FreeAINotFound from "@/freeai/pages/FreeAINotFound.jsx";
import { R } from "@/freeai/lib/routes.js";
import RouteFallback from "@/freeai/components/RouteFallback.jsx";
import { lazyWithRetry } from "@/freeai/lib/lazyWithRetry.js";
import ErrorBoundary from "@/freeai/components/ErrorBoundary.jsx";
import { preloadPuter } from "@/freeai/lib/chatEngine.js";

const FreeAIHub = lazyWithRetry(() => import("@/freeai/pages/FreeAIHub"), "FreeAIHub");
const FreeAIPlannerPage = lazyWithRetry(() => import("@/freeai/pages/FreeAIPlannerPage"), "FreeAIPlannerPage");
const FreeAIProvidersPage = lazyWithRetry(() => import("@/freeai/pages/FreeAIProvidersPage"), "FreeAIProvidersPage");
const FreeAIWorkspacePage = lazyWithRetry(() => import("@/freeai/pages/FreeAIWorkspacePage"), "FreeAIWorkspacePage");
const FreeAIStudio = lazyWithRetry(() => import("@/freeai/pages/FreeAIStudio"), "FreeAIStudio");
const FreeAIPricingPage = lazyWithRetry(() => import("@/freeai/pages/FreeAIPricingPage"), "FreeAIPricingPage");
const FreeAICheckoutPage = lazyWithRetry(() => import("@/freeai/pages/FreeAICheckoutPage"), "FreeAICheckoutPage");
const FreeAIMarketingPage = lazyWithRetry(() => import("@/freeai/pages/FreeAIMarketingPage"), "FreeAIMarketingPage");
const CreditPassportPage = lazyWithRetry(() => import("@/freeai/pages/CreditPassportPage"), "CreditPassportPage");

const KidsHubPage = lazyWithRetry(() => import("@/freeai/kids/pages/KidsHubPage"), "KidsHubPage");
const KidsStudyPage = lazyWithRetry(() => import("@/freeai/kids/pages/KidsStudyPage"), "KidsStudyPage");
const KidsCreatePage = lazyWithRetry(() => import("@/freeai/kids/pages/KidsCreatePage"), "KidsCreatePage");
const KidsGamePage = lazyWithRetry(() => import("@/freeai/kids/pages/KidsGamePage"), "KidsGamePage");
const KidsGalleryPage = lazyWithRetry(() => import("@/freeai/kids/pages/KidsGalleryPage"), "KidsGalleryPage");
const KidsBodyPage = lazyWithRetry(() => import("@/freeai/kids/pages/KidsBodyPage"), "KidsBodyPage");
const KidsChatPage = lazyWithRetry(() => import("@/freeai/kids/pages/KidsChatPage"), "KidsChatPage");
const KidsDailyPage = lazyWithRetry(() => import("@/freeai/kids/pages/KidsDailyPage"), "KidsDailyPage");
const KidsParentPage = lazyWithRetry(() => import("@/freeai/kids/pages/KidsParentPage"), "KidsParentPage");
const KidsLabsPage = lazyWithRetry(() => import("@/freeai/kids/pages/KidsLabsPage"), "KidsLabsPage");

/** Standalone FreeAI Hub + Kids — no MedScan, no auth, no clinic. */
export default function FreeAIApp() {
  useEffect(() => {
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1500));
    idle(() => preloadPuter());
  }, []);

  return (
    <I18nProvider>
      <Router basename={routerBasename(import.meta.env.BASE_URL)}>
        <ScrollToTop />
        <ErrorBoundary>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Navigate to={R.hub} replace />} />
              {/* Landing straight on the built entry file should not 404. */}
              <Route path="/freeai.html" element={<Navigate to={R.hub} replace />} />
              <Route path="/index.html" element={<Navigate to={R.hub} replace />} />

              <Route path={R.hub} element={<FreeAIHub />} />
              <Route path={R.create} element={<FreeAIWorkspacePage />} />
              <Route path={R.studio} element={<FreeAIStudio />} />
              <Route path={R.pricing} element={<FreeAIPricingPage />} />
              <Route path={R.checkout} element={<FreeAICheckoutPage />} />
              <Route path={R.marketing} element={<FreeAIMarketingPage />} />
              <Route path={R.passport} element={<CreditPassportPage />} />
              <Route path={R.planner} element={<FreeAIPlannerPage />} />
              <Route path={R.providers} element={<FreeAIProvidersPage />} />

              <Route path={R.kids} element={<KidsHubPage />} />
              <Route path={R.kidsChat} element={<KidsChatPage />} />
              <Route path={R.kidsDaily} element={<KidsDailyPage />} />
              <Route path={R.kidsParent} element={<KidsParentPage />} />
              <Route path={R.kidsStudy} element={<KidsStudyPage />} />
              <Route path={R.kidsBody} element={<KidsBodyPage />} />
              <Route path={R.kidsCreate} element={<KidsCreatePage />} />
              <Route path={R.kidsGame} element={<KidsGamePage />} />
              <Route path={R.kidsGallery} element={<KidsGalleryPage />} />
              <Route path={`${R.kidsLabs}/:categoryId`} element={<KidsLabsPage />} />
              <Route path={R.kidsLabs} element={<KidsLabsPage />} />

              {/* Legacy /freeai/* → new paths (old bookmarks) */}
              <Route path="/freeai" element={<Navigate to={R.hub} replace />} />
              <Route path="/freeai/create" element={<Navigate to={R.create} replace />} />
              <Route path="/freeai/studio" element={<Navigate to={R.studio} replace />} />
              <Route path="/freeai/pricing" element={<Navigate to={R.pricing} replace />} />
              <Route path="/freeai/checkout" element={<Navigate to={R.checkout} replace />} />
              <Route path="/freeai/marketing" element={<Navigate to={R.marketing} replace />} />
              <Route path="/freeai/passport" element={<Navigate to={R.passport} replace />} />
              <Route path="/freeai/planner" element={<Navigate to={R.planner} replace />} />
              <Route path="/freeai/providers" element={<Navigate to={R.providers} replace />} />
              <Route path="/freeai/kids" element={<Navigate to={R.kids} replace />} />
              <Route path="/freeai/kids/study" element={<Navigate to={R.kidsStudy} replace />} />
              <Route path="/freeai/kids/body" element={<Navigate to={R.kidsBody} replace />} />
              <Route path="/freeai/kids/create" element={<Navigate to={R.kidsCreate} replace />} />
              <Route path="/freeai/kids/game" element={<Navigate to={R.kidsGame} replace />} />
              <Route path="/freeai/kids/gallery" element={<Navigate to={R.kidsGallery} replace />} />
              <Route path="/freeai/kids/labs" element={<Navigate to={R.kidsLabs} replace />} />
              <Route path="/freeai/kids/chat" element={<Navigate to={R.kidsChat} replace />} />
              <Route path="/freeai/kids/daily" element={<Navigate to={R.kidsDaily} replace />} />
              <Route path="/freeai/kids/parent" element={<Navigate to={R.kidsParent} replace />} />

              <Route path="*" element={<FreeAINotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </Router>
    </I18nProvider>
  );
}
