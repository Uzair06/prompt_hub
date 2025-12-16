/**
 * Database utility functions for Supabase
 * Common helper functions for database operations
 */

import { supabase, supabaseAdmin } from './supabase'
import type { PostgrestError } from '@supabase/supabase-js'

export interface DbResult<T> {
  data: T | null
  error: PostgrestError | null
}

/**
 * Generic function to handle Supabase queries with error handling
 */
export async function query<T>(
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>
): Promise<DbResult<T>> {
  try {
    const result = await queryFn()
    return {
      data: result.data,
      error: result.error,
    }
  } catch (error) {
    return {
      data: null,
      error: error as PostgrestError,
    }
  }
}

/**
 * Execute a select query
 */
export async function select<T>(
  table: string,
  columns: string = '*',
  filters?: Record<string, any>
) {
  let query = supabase.from(table).select(columns)

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value)
    })
  }

  return query()
}

/**
 * Execute an insert query
 */
export async function insert<T>(
  table: string,
  data: T | T[],
  useAdmin: boolean = false
) {
  const client = useAdmin && supabaseAdmin ? supabaseAdmin : supabase
  return client.from(table).insert(data).select()
}

/**
 * Execute an update query
 */
export async function update<T>(
  table: string,
  data: Partial<T>,
  filters: Record<string, any>,
  useAdmin: boolean = false
) {
  const client = useAdmin && supabaseAdmin ? supabaseAdmin : supabase
  let query = client.from(table).update(data)

  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value)
  })

  return query.select()
}

/**
 * Execute a delete query
 */
export async function remove(
  table: string,
  filters: Record<string, any>,
  useAdmin: boolean = false
) {
  const client = useAdmin && supabaseAdmin ? supabaseAdmin : supabase
  let query = client.from(table).delete()

  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value)
  })

  return query
}

