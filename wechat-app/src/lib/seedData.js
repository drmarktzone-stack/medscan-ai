/** Demo seed data for WeChat MVP (local-only). */

export const ME_ID = 'me';

export function createSeedState() {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;

  const profile = {
    id: ME_ID,
    name: 'ד"ר סמר',
    wechatId: 'dr_samar',
    avatar: '🩺',
    status: 'זמין/ה',
    region: 'ישראל',
    wallet: { balance: 188.88, currency: 'CNY' },
  };

  const contacts = [
    { id: 'c1', name: '李明 Li Ming', wechatId: 'li_ming', avatar: '👨‍💼', remark: 'שותף עסקי', region: 'שנגחאי', tags: ['work'] },
    { id: 'c2', name: 'Sarah Chen', wechatId: 'sarah_chen', avatar: '👩‍⚕️', remark: 'רופאת ילדים', region: 'בייג\'ינג', tags: ['medical'] },
    { id: 'c3', name: 'משפחת כהן', wechatId: 'cohen_family', avatar: '👨‍👩‍👧', remark: '', region: 'תל אביב', tags: ['family'] },
    { id: 'c4', name: 'קבוצת WeiChat Dev', wechatId: 'weichat_team', avatar: '💬', remark: 'צוות פיתוח', region: '', tags: ['group'], isGroup: true, members: [ME_ID, 'c1', 'c2'] },
    { id: 'c5', name: 'David Wu', wechatId: 'david_wu', avatar: '🧑‍💻', remark: 'WeChat Dev', region: 'שנז\'ן', tags: ['tech'] },
  ];

  const chats = [
    {
      id: 'chat-c1',
      contactId: 'c1',
      syncChatId: 'direct:dr_samar:li_ming',
      type: 'direct',
      pinned: true,
      muted: false,
      lastMessage: 'מחר נפגש ב-10:00?',
      lastTime: now - 12 * 60 * 1000,
      unread: 2,
    },
    {
      id: 'chat-c4',
      contactId: 'c4',
      type: 'group',
      pinned: false,
      muted: false,
      lastMessage: 'Sarah: ה-MVP מוכן לבדיקה 🎉',
      lastTime: now - 45 * 60 * 1000,
      unread: 5,
    },
    {
      id: 'chat-c2',
      contactId: 'c2',
      syncChatId: 'direct:dr_samar:sarah_chen',
      type: 'direct',
      pinned: false,
      muted: false,
      lastMessage: 'שלחתי את התוצאות',
      lastTime: now - 3 * hour,
      unread: 0,
    },
    {
      id: 'chat-c3',
      contactId: 'c3',
      syncChatId: 'direct:cohen_family:dr_samar',
      type: 'direct',
      pinned: false,
      muted: true,
      lastMessage: 'תודה רבה!',
      lastTime: now - day,
      unread: 0,
    },
    {
      id: 'chat-c5',
      contactId: 'c5',
      syncChatId: 'direct:david_wu:dr_samar',
      type: 'direct',
      pinned: false,
      muted: false,
      lastMessage: 'Check out Mini Programs API',
      lastTime: now - 2 * day,
      unread: 0,
    },
  ];

  const messages = {
    'chat-c1': [
      { id: 'm1', senderId: 'c1', type: 'text', content: '你好！שלום ד"ר סמר', time: now - 2 * hour },
      { id: 'm2', senderId: ME_ID, type: 'text', content: '你好 Li Ming! איך הולך?', time: now - 110 * 60 * 1000 },
      { id: 'm3', senderId: 'c1', type: 'text', content: 'הכל טוב. רציתי לדבר על שיתוף פעולה.', time: now - 90 * 60 * 1000 },
      { id: 'm4', senderId: 'c1', type: 'text', content: 'מחר נפגש ב-10:00?', time: now - 12 * 60 * 1000 },
    ],
    'chat-c4': [
      { id: 'g1', senderId: 'c1', type: 'text', content: 'היי, סיימתי את ה-backend', time: now - 2 * hour },
      { id: 'g2', senderId: 'c2', type: 'text', content: 'מעולה! אני בודקת את ה-UI', time: now - 90 * 60 * 1000 },
      { id: 'g3', senderId: 'c2', type: 'text', content: 'ה-MVP מוכן לבדיקה 🎉', time: now - 45 * 60 * 1000 },
    ],
    'chat-c2': [
      { id: 's1', senderId: ME_ID, type: 'text', content: 'היי Sarah, יש לי שאלה על תוצאות בדיקות', time: now - 5 * hour },
      { id: 's2', senderId: 'c2', type: 'text', content: 'בטח, שלח', time: now - 4 * hour },
      { id: 's3', senderId: ME_ID, type: 'text', content: 'CRP 45, WBC 14', time: now - 3.5 * hour },
      { id: 's4', senderId: 'c2', type: 'text', content: 'שלחתי את התוצאות', time: now - 3 * hour },
    ],
    'chat-c3': [
      { id: 'f1', senderId: 'c3', type: 'text', content: 'שלום, הבן שלנו מרגיש יותר טוב', time: now - 1.2 * day },
      { id: 'f2', senderId: ME_ID, type: 'text', content: 'שמח לשמוע! המשיכו עם הנוזלים', time: now - 1.1 * day },
      { id: 'f3', senderId: 'c3', type: 'text', content: 'תודה רבה!', time: now - day },
    ],
    'chat-c5': [
      { id: 'w1', senderId: 'c5', type: 'text', content: 'Hey! Building a WeChat clone?', time: now - 3 * day },
      { id: 'w2', senderId: ME_ID, type: 'text', content: 'Yes — MVP with chats, moments, contacts', time: now - 2.5 * day },
      { id: 'w3', senderId: 'c5', type: 'text', content: 'Check out Mini Programs API', time: now - 2 * day },
    ],
  };

  const moments = [
    {
      id: 'mo1',
      authorId: 'c2',
      content: 'יום נפלא במרפאת ילדים 🌸',
      images: [],
      likes: ['c1', ME_ID],
      comments: [{ id: 'co1', authorId: 'c1', text: 'כל הכבוד!' }],
      time: now - 4 * hour,
    },
    {
      id: 'mo2',
      authorId: 'c1',
      content: 'שנגחאי בלילה ✨',
      images: ['🌃', '🍜'],
      likes: ['c5'],
      comments: [],
      time: now - day,
    },
    {
      id: 'mo3',
      authorId: ME_ID,
      content: 'WeiChat MVP — צ\'אטים, Moments, sync. standalone app.',
      images: ['💚'],
      likes: ['c2', 'c5'],
      comments: [{ id: 'co2', authorId: 'c5', text: 'Looks great!' }],
      time: now - 2 * day,
    },
  ];

  return { profile, contacts, chats, messages, moments };
}
