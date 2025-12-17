// import { createClient } from '@supabase/supabase-js'

// // Get environment variables
// const supabaseUrl = process.env.SUPABASE_URL
// const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
// // const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// if (!supabaseUrl) {
//   throw new Error('Missing SUPABASE_URL environment variable')
// }

// if (!supabaseAnonKey) {
//   throw new Error('Missing SUPABASE_ANON_KEY environment variable')
// }

// // Client for user-authenticated requests (uses anon key)
// // This respects Row Level Security (RLS) policies
// export const supabase = createClient(
//   supabaseUrl,
//   supabaseAnonKey,
//   {
//     auth: {
//       autoRefreshToken: true,
//       persistSession: false, // For server-side usage, we don't persist sessions
//     },
//     db: { schema: 'other_schema'}
//   }
// )

// // Admin client for server-side operations (bypasses RLS)
// // Use this only for server-side operations that need to bypass RLS
// // WARNING: Never expose the service role key to the client
// // export const supabaseAdmin = supabaseServiceRoleKey
// //   ? createClient(supabaseUrl, supabaseServiceRoleKey, {
// //       auth: {
// //         autoRefreshToken: false,
// //         persistSession: false,
// //       },
// //     })
// //   : null

// // Helper function to get Supabase client with optional auth token
// // export function getSupabaseClient(authToken?: string) {
// //   if (authToken && supabaseAnonKey) {
// //     return createClient(supabaseUrl, supabaseAnonKey, {
// //       global: {
// //         headers: {
// //           Authorization: `Bearer ${authToken}`,
// //         },
// //       },
// //       auth: {
// //         autoRefreshToken: true,
// //         persistSession: false,
// //       },
// //     })
// //   }
// //   return supabase
// // }

