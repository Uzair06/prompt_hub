# Supabase Setup Guide

This guide will help you set up Supabase for your Motia server.

## Step 1: Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in your project details:
   - Name your project
   - Set a database password (save this!)
   - Choose a region
   - Wait for the project to be created

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. You'll find:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (safe for client-side)
   - **service_role key** (KEEP SECRET - server-side only!)

## Step 3: Set Environment Variables

Create a `.env` file in the `server/` directory with:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Important:** 
- Never commit `.env` to version control
- The `.env` file should already be in `.gitignore`
- Use `SUPABASE_ANON_KEY` for user-authenticated requests (respects RLS)
- Use `SUPABASE_SERVICE_ROLE_KEY` only for admin operations (bypasses RLS)

## Step 4: Using Supabase in Your Code

### Basic Usage

```typescript
import { supabase, supabaseAdmin } from './src/supabase'

// Regular client (respects RLS)
const { data, error } = await supabase
  .from('your_table')
  .select('*')

// Admin client (bypasses RLS) - use with caution!
if (supabaseAdmin) {
  const { data, error } = await supabaseAdmin
    .from('your_table')
    .select('*')
}
```

### In Motia Steps

```typescript
import { ApiRouteHandler } from 'motia'
import { supabase } from '../src/supabase'

export const getUsers: ApiRouteHandler = async (request) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
  
  if (error) {
    return { status: 500, body: { error: error.message } }
  }
  
  return { status: 200, body: { users: data } }
}
```

### With Authentication

```typescript
import { getSupabaseClient } from '../src/supabase'

export const getProfile: ApiRouteHandler = async (request) => {
  const authToken = request.headers.authorization?.replace('Bearer ', '')
  
  if (!authToken) {
    return { status: 401, body: { error: 'Unauthorized' } }
  }
  
  const client = getSupabaseClient(authToken)
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .single()
  
  if (error) {
    return { status: 500, body: { error: error.message } }
  }
  
  return { status: 200, body: { profile: data } }
}
```

## Step 5: Database Schema

You can manage your database schema in two ways:

### Option 1: Supabase Dashboard (Recommended for beginners)
1. Go to **Table Editor** in your Supabase dashboard
2. Create tables, columns, and relationships visually
3. Set up Row Level Security (RLS) policies

### Option 2: SQL Migrations
1. Go to **SQL Editor** in your Supabase dashboard
2. Write SQL migrations
3. Run them directly or save as migration files

## Step 6: Row Level Security (RLS)

Always enable RLS on your tables for security:

```sql
-- Enable RLS
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own data"
ON your_table
FOR SELECT
USING (auth.uid() = user_id);
```

## Next Steps

- Check out the [Supabase Documentation](https://supabase.com/docs)
- Learn about [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- Explore [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- Set up [Database Functions](https://supabase.com/docs/guides/database/functions)

