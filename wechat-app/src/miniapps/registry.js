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
    id: 'tools',
    name: 'כלים',
    nameCn: '工具箱',
    icon: '🧰',
    color: '#576b95',
    description: 'קיצורי דרך וכלים',
  },
];

export function getMiniApp(id) {
  return MINI_APPS.find((a) => a.id === id);
}
