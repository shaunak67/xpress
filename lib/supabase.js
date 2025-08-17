import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database initialization function
export const initializeDatabase = async () => {
  try {
    // Check if users table exists by querying it
    const { data: existingUsers } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    console.log('Database connection successful')
  } catch (error) {
    console.error('Database initialization error:', error)
  }
}