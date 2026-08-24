import CalculatorApp from './apps/CalculatorApp.jsx';
import NotesApp from './apps/NotesApp.jsx';
import ToolsApp from './apps/ToolsApp.jsx';

export const MINI_APP_COMPONENTS = {
  calculator: CalculatorApp,
  notes: NotesApp,
  tools: ToolsApp,
};

export function getMiniAppComponent(id) {
  return MINI_APP_COMPONENTS[id];
}
