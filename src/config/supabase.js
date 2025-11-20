import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Prefer values provided via Expo `app.config.js` (expo.extra), then fall back to process.env
const expoExtra = (Constants && (Constants.expoConfig?.extra || Constants.manifest?.extra)) || {};
const SUPABASE_URL = expoExtra.SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = expoExtra.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log('[supabase] DEBUG: expoExtra.SUPABASE_URL =', expoExtra.SUPABASE_URL);
console.log('[supabase] DEBUG: process.env.SUPABASE_URL =', process.env.SUPABASE_URL);
console.log('[supabase] DEBUG: Final SUPABASE_URL =', SUPABASE_URL);
console.log('[supabase] DEBUG: SUPABASE_ANON_KEY present?', !!SUPABASE_ANON_KEY);

function isValidUrl(u) {
	return typeof u === 'string' && /^https?:\/\//i.test(u);
}

let supabase;

if (!isValidUrl(SUPABASE_URL) || !SUPABASE_ANON_KEY) {
	console.error('[supabase] Missing or invalid SUPABASE_URL or SUPABASE_ANON_KEY.');
	console.error('[supabase] SUPABASE_URL:', SUPABASE_URL, '| isValid:', isValidUrl(SUPABASE_URL));
	console.error('[supabase] SUPABASE_ANON_KEY present?', !!SUPABASE_ANON_KEY);
	console.error('[supabase] To fix: ensure .env has SUPABASE_URL and SUPABASE_ANON_KEY, then restart Expo.');

	const makeError = (msg) => ({ data: null, error: new Error(msg) });

	supabase = {
		auth: {
			getUser: async () => ({ data: { user: null } }),
			onAuthStateChange: (_cb) => ({ subscription: { unsubscribe: () => {} } }),
			signUp: async () => makeError('Supabase not configured'),
			signInWithPassword: async () => makeError('Supabase not configured'),
			signOut: async () => makeError('Supabase not configured'),
		},
		from: (_table) => ({
			select: async () => makeError('Supabase not configured'),
			insert: async () => makeError('Supabase not configured'),
			update: async () => makeError('Supabase not configured'),
			delete: async () => makeError('Supabase not configured'),
		}),
	};
} else {
	// Configure Supabase to use session-based auth (not persistent storage)
	// This means session will be lost when app/server restarts
	supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
		auth: {
			// Don't persist session to storage - use memory only
			persistSession: false,
			// Don't auto refresh tokens
			autoRefreshToken: false,
			// Detect session changes
			detectSessionInUrl: false,
		},
	});
}

export { supabase };
export default supabase;
