import CalculatorApp from './apps/CalculatorApp.jsx';
import NotesApp from './apps/NotesApp.jsx';
import MedScanApp from './apps/MedScanApp.jsx';

export const MINI_APP_COMPONENTS = {
  calculator: CalculatorApp,
  notes: NotesApp,
  medscan: MedScanApp,
};

export function getMiniAppComponent(id) {
  return MINI_APP_COMPONENTS[id];
}
