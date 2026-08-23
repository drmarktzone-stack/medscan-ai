import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import AppLayout from "@/components/AppLayout";
import { I18nProvider } from '@/lib/i18n';
import { PatientSessionProvider } from '@/lib/doctorped/patientSession';
import { ClinicProfileProvider } from '@/lib/clinic/profileContext';
import { routerBasename } from '@/lib/clinic/standalone';

import VisionPaywallGate from "@/components/payment/VisionPaywallGate";
import LaunchGuidePage from '@/pages/LaunchGuidePage';
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage';
import PricingPage from '@/pages/PricingPage';
import CheckoutPage from '@/pages/CheckoutPage';
import StartPage from '@/pages/StartPage';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Home from '@/pages/Home';
import ECGAnalysis from '@/pages/ECGAnalysis';
import ECGComparison from '@/pages/ECGComparison';
import SkinAnalysis from '@/pages/SkinAnalysis';
import RadiologyAnalysis from '@/pages/RadiologyAnalysis';
import LabInterpreter from '@/pages/LabInterpreter';
import PatientContext from '@/pages/PatientContext';
import ProtocolRunner from '@/pages/ProtocolRunner';
import Differential from '@/pages/Differential';
import KnowledgeAdmin from '@/pages/KnowledgeAdmin';
import KnowledgeImport from '@/pages/KnowledgeImport';
import NelsonBook from '@/pages/NelsonBook';
import VerifyKnowledge from '@/pages/VerifyKnowledge';
import History from '@/pages/History';
import KnowledgeBase from '@/pages/KnowledgeBase';
import Evaluation from '@/pages/Evaluation';
import ECGValidation from '@/pages/ECGValidation';
import SkinValidation from '@/pages/SkinValidation';
import KnowledgeCoverage from '@/pages/KnowledgeCoverage';
import DoctorPedWorkbench from '@/pages/DoctorPedWorkbench';
import ParentHub from '@/pages/ParentHub';
import ParentPortal from '@/pages/ParentPortal';
import ParentResults from '@/pages/ParentResults';
import ParentFollowUp from '@/pages/ParentFollowUp';
import AppointmentGuidePage from '@/pages/AppointmentGuidePage';
import EmergencyCardPage from '@/pages/EmergencyCardPage';
import VisitTranslatorPage from '@/pages/VisitTranslatorPage';
import DaycareReturnPage from '@/pages/DaycareReturnPage';
import RoleGate from "@/components/clinic/RoleGate";
import {
  ToxicologyPage, TraumaPage, GrowthPage, NutritionPage, NeurodevPage,
  ChronicPage, SyndromesPage, MetabolicPage, GeneticsPage, CsfPage,
  UltrasoundPage, EegPage, AudioPage, ReferralsPage,
} from '@/pages/doctorped/tools';
import FreeAIHub from '@/freeai/pages/FreeAIHub';
import FreeAIPlannerPage from '@/freeai/pages/FreeAIPlannerPage';
import FreeAIProvidersPage from '@/freeai/pages/FreeAIProvidersPage';
import FreeAIWorkspacePage from '@/freeai/pages/FreeAIWorkspacePage';
import FreeAIStudio from '@/freeai/pages/FreeAIStudio';
import FreeAIPricingPage from '@/freeai/pages/FreeAIPricingPage';
import FreeAICheckoutPage from '@/freeai/pages/FreeAICheckoutPage';
import FreeAIMarketingPage from '@/freeai/pages/FreeAIMarketingPage';
import CreditPassportPage from '@/freeai/pages/CreditPassportPage';
import WeChatApp from '@/wechat/pages/WeChatApp.jsx';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <Routes>
      {/* FreeAI Hub — creative AI with free credits (public, no auth) */}
      <Route path="/freeai" element={<FreeAIHub />} />
      <Route path="/freeai/create" element={<FreeAIWorkspacePage />} />
      <Route path="/freeai/studio" element={<FreeAIStudio />} />
      <Route path="/freeai/pricing" element={<FreeAIPricingPage />} />
      <Route path="/freeai/checkout" element={<FreeAICheckoutPage />} />
      <Route path="/freeai/marketing" element={<FreeAIMarketingPage />} />
      <Route path="/freeai/passport" element={<CreditPassportPage />} />
      <Route path="/freeai/planner" element={<FreeAIPlannerPage />} />
      <Route path="/freeai/providers" element={<FreeAIProvidersPage />} />

      {/* WeChat MVP — messaging super-app demo (public, no auth) */}
      <Route path="/wechat/*" element={<WeChatApp />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/start" element={<StartPage />} />
      <Route path="/launch" element={<LaunchGuidePage />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<RoleGate />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route element={<VisionPaywallGate />}>
            <Route path="/ecg" element={<ECGAnalysis />} />
            <Route path="/ecg-compare" element={<ECGComparison />} />
            <Route path="/skin" element={<SkinAnalysis />} />
            <Route path="/radiology" element={<RadiologyAnalysis />} />
          </Route>
          <Route path="/ecg-validate" element={<ECGValidation />} />
          <Route path="/skin-validate" element={<SkinValidation />} />
          <Route path="/labs" element={<LabInterpreter />} />
          <Route path="/patient-context" element={<PatientContext />} />
          <Route path="/protocols" element={<ProtocolRunner />} />
          <Route path="/differential" element={<Differential />} />
          <Route path="/knowledge-admin" element={<KnowledgeAdmin />} />
          <Route path="/knowledge-import" element={<KnowledgeImport />} />
          <Route path="/book" element={<NelsonBook />} />
          <Route path="/verify" element={<VerifyKnowledge />} />
          <Route path="/history" element={<History />} />
          <Route path="/knowledge-base" element={<KnowledgeBase />} />
          <Route path="/evaluation" element={<Evaluation />} />
          <Route path="/knowledge-coverage" element={<KnowledgeCoverage />} />
          <Route path="/doctorped" element={<DoctorPedWorkbench />} />
          <Route path="/parent" element={<ParentHub />} />
          <Route path="/parent/visit" element={<ParentPortal />} />
          <Route path="/parent/results" element={<ParentResults />} />
          <Route path="/parent/follow-up" element={<ParentFollowUp />} />
          <Route path="/appointments" element={<AppointmentGuidePage />} />
          <Route path="/parent/emergency" element={<EmergencyCardPage />} />
          <Route path="/parent/visit-notes" element={<VisitTranslatorPage />} />
          <Route path="/parent/gan" element={<DaycareReturnPage />} />
          <Route path="/tox" element={<ToxicologyPage />} />
          <Route path="/trauma" element={<TraumaPage />} />
          <Route path="/growth" element={<GrowthPage />} />
          <Route path="/nutrition" element={<NutritionPage />} />
          <Route path="/neurodev" element={<NeurodevPage />} />
          <Route path="/chronic" element={<ChronicPage />} />
          <Route path="/syndromes" element={<SyndromesPage />} />
          <Route path="/metabolic" element={<MetabolicPage />} />
          <Route path="/genetics" element={<GeneticsPage />} />
          <Route path="/csf" element={<CsfPage />} />
          <Route path="/us" element={<UltrasoundPage />} />
          <Route path="/eeg" element={<EegPage />} />
          <Route path="/audio" element={<AudioPage />} />
          <Route path="/referrals" element={<ReferralsPage />} />
        </Route>
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <I18nProvider>
        <ClinicProfileProvider>
        <PatientSessionProvider>
        <QueryClientProvider client={queryClientInstance}>
        <Router basename={routerBasename(import.meta.env.BASE_URL)}>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        </QueryClientProvider>
        </PatientSessionProvider>
        </ClinicProfileProvider>
      </I18nProvider>
    </AuthProvider>
  )
}

export default App