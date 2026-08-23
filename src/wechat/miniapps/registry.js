export const MINI_APPS = [
  {
    id: 'calculator',
    name: 'מחשבון',
    nameCn: '计算器',
    icon: '🔢',
    color: '#07c160',
    description: 'מחשבון פשוט',
  },
  {
    id: 'notes',
    name: 'פתקיות',
    nameCn: '笔记',
    icon: '📝',
    color: '#10aeff',
    description: 'פתקיות אישיות',
  },
  {
    id: 'medscan',
    name: 'MedScan',
    nameCn: '医疗助手',
    icon: '🩺',
    color: '#576b95',
    description: 'כלים רפואיים',
  },
];

export function getMiniApp(id) {
  return MINI_APPS.find((a) => a.id === id);
}
