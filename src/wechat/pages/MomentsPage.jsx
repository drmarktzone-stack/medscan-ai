import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Camera } from 'lucide-react';
import WeChatAvatar from '@/wechat/components/WeChatAvatar.jsx';
import { useWeChat, getContact, ME_ID } from '@/wechat/lib/store.js';
import { formatMomentTime } from '@/wechat/lib/format.js';

function MomentCard({ moment, state, actions }) {
  const author = moment.authorId === ME_ID ? state.profile : getContact(state, moment.authorId);
  const [commentDraft, setCommentDraft] = useState('');
  const [showComment, setShowComment] = useState(false);
  const liked = moment.likes.includes(ME_ID);

  function resolveName(id) {
    if (id === ME_ID) return state.profile.name;
    return getContact(state, id)?.name || 'משתמש';
  }

  return (
    <article className="flex gap-3 px-4 py-4 border-b border-[#ededed] bg-white">
      <WeChatAvatar emoji={author?.avatar} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="text-[#576b95] font-medium text-[15px] mb-1">
          {author?.remark || author?.name}
        </div>
        <p className="text-[15px] text-[#191919] leading-relaxed whitespace-pre-wrap">
          {moment.content}
        </p>
        {moment.images.length > 0 && (
          <div className="grid grid-cols-3 gap-1 mt-2 max-w-[220px]">
            {moment.images.map((img, i) => (
              <div
                key={i}
                className="aspect-square bg-[#f0f0f0] rounded-sm flex items-center justify-center text-3xl"
              >
                {img}
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-[12px] text-[#b2b2b2]">{formatMomentTime(moment.time)}</span>
          <div className="flex items-center bg-[#f7f7f7] rounded px-2 py-0.5 gap-2">
            <button
              type="button"
              onClick={() => actions.toggleMomentLike(moment.id)}
              className={liked ? 'text-[#fa5151]' : 'text-[#576b95]'}
            >
              <Heart className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              onClick={() => setShowComment((v) => !v)}
              className="text-[#576b95]"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {(moment.likes.length > 0 || moment.comments.length > 0) && (
          <div className="mt-2 bg-[#f7f7f7] rounded px-2 py-1.5 text-sm">
            {moment.likes.length > 0 && (
              <div className="flex items-start gap-1 text-[#576b95] pb-1 border-b border-[#ededed] mb-1">
                <Heart className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="currentColor" />
                <span>{moment.likes.map(resolveName).join(', ')}</span>
              </div>
            )}
            {moment.comments.map((c) => (
              <div key={c.id} className="text-[#191919]">
                <span className="text-[#576b95]">{resolveName(c.authorId)}</span>
                {': '}
                {c.text}
              </div>
            ))}
          </div>
        )}

        {showComment && (
          <div className="mt-2 flex gap-2">
            <input
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              placeholder="תגובה..."
              className="flex-1 text-sm border border-[#d9d9d9] rounded px-2 py-1 outline-none focus:border-[#07c160]"
            />
            <button
              type="button"
              onClick={() => {
                actions.addMomentComment(moment.id, commentDraft);
                setCommentDraft('');
                setShowComment(false);
              }}
              className="text-sm text-[#576b95] font-medium"
            >
              שלח
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export default function MomentsPage() {
  const { state, actions } = useWeChat();
  const [composer, setComposer] = useState('');
  const [showComposer, setShowComposer] = useState(false);

  return (
    <div className="min-h-screen bg-[#ededed] max-w-lg mx-auto pb-8">
      <header className="sticky top-0 z-40 bg-[#ededed] border-b border-[#d9d9d9]">
        <div className="flex items-center h-11 px-2">
          <Link to="/wechat/discover" className="text-[#576b95] text-sm px-2">
            ‹ חזרה
          </Link>
          <h1 className="flex-1 text-center font-semibold text-[17px] text-[#191919]">
            朋友圈 Moments
          </h1>
          <button
            type="button"
            onClick={() => setShowComposer((v) => !v)}
            className="p-2 text-[#191919]"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="relative h-48 bg-gradient-to-br from-[#576b95] to-[#2e4057] mb-12">
        <div className="absolute -bottom-8 right-4 flex items-end gap-3">
          <span className="text-white font-medium text-lg mb-2 drop-shadow">
            {state.profile.name}
          </span>
          <WeChatAvatar emoji={state.profile.avatar} size="xl" className="border-2 border-white" />
        </div>
      </div>

      {showComposer && (
        <div className="mx-4 mb-4 p-3 bg-white rounded-lg shadow-sm">
          <textarea
            value={composer}
            onChange={(e) => setComposer(e.target.value)}
            placeholder="מה חדש?"
            rows={3}
            className="w-full text-[15px] outline-none resize-none"
          />
          <button
            type="button"
            onClick={() => {
              if (composer.trim()) {
                actions.publishMoment(composer);
                setComposer('');
                setShowComposer(false);
              }
            }}
            className="mt-2 px-4 py-1.5 bg-[#07c160] text-white text-sm rounded-md"
          >
            פרסום
          </button>
        </div>
      )}

      <section>
        {state.moments.map((m) => (
          <MomentCard key={m.id} moment={m} state={state} actions={actions} />
        ))}
      </section>
    </div>
  );
}
