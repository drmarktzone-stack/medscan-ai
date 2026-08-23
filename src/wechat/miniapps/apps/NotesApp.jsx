import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { uid } from '@/wechat/lib/format.js';

const NOTES_KEY = 'wechat_mini_notes_v1';

function loadNotes() {
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveNotes(notes) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export default function NotesApp() {
  const [notes, setNotes] = useState(loadNotes);
  const [activeId, setActiveId] = useState(notes[0]?.id ?? null);

  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  const active = notes.find((n) => n.id === activeId);

  function addNote() {
    const note = { id: uid('note'), title: 'פתקית חדשה', body: '', updated: Date.now() };
    setNotes((prev) => [note, ...prev]);
    setActiveId(note.id);
  }

  function update(field, value) {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === activeId ? { ...n, [field]: value, updated: Date.now() } : n,
      ),
    );
  }

  function remove(id) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeId === id) setActiveId(null);
  }

  return (
    <div className="flex min-h-[calc(100vh-44px)]">
      <aside className="w-28 bg-[#f7f7f7] border-r border-[#d9d9d9] flex flex-col">
        <button
          type="button"
          onClick={addNote}
          className="m-2 p-2 bg-[#07c160] text-white rounded-md flex items-center justify-center gap-1 text-xs"
        >
          <Plus className="w-3 h-3" /> חדש
        </button>
        <ul className="flex-1 overflow-y-auto">
          {notes.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => setActiveId(n.id)}
                className={`w-full text-left px-2 py-2 text-xs truncate border-b border-[#ededed] ${
                  activeId === n.id ? 'bg-white text-[#07c160]' : 'text-[#888]'
                }`}
              >
                {n.title || 'ללא כותרת'}
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <div className="flex-1 p-4 bg-white">
        {active ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <input
                value={active.title}
                onChange={(e) => update('title', e.target.value)}
                className="flex-1 text-lg font-semibold outline-none"
                placeholder="כותרת"
              />
              <button type="button" onClick={() => remove(active.id)} className="text-[#fa5151] p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={active.body}
              onChange={(e) => update('body', e.target.value)}
              placeholder="כתוב/י כאן..."
              className="w-full h-[calc(100vh-160px)] resize-none outline-none text-[15px] leading-relaxed"
            />
          </>
        ) : (
          <div className="text-center text-[#b2b2b2] mt-20 text-sm">
            {notes.length === 0 ? 'לחץ/י + לפתקית חדשה' : 'בחר/י פתקית'}
          </div>
        )}
      </div>
    </div>
  );
}
