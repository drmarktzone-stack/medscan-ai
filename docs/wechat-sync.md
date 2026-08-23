# WeChat MVP — Supabase sync (optional)
#
# 1. Create a Supabase project (free tier): https://supabase.com
# 2. Run supabase_wechat_schema.sql in SQL Editor
# 3. Enable Realtime for wechat_* tables (done by schema script)
# 4. Copy keys below into .env.local or .env.standalone

VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# When configured, WeChat at /wechat shows "Live" badge and syncs:
#   · profiles (wechat_profiles)
#   · messages (wechat_messages) — Realtime push
#   · moments (wechat_moments)
#
# Without Supabase — fully offline via localStorage (badge: "מקומי").
