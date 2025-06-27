import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://teevifyvudoafrqtjjel.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZXZpZnl2dWRvYWZycXRqamVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNTQ4ODIsImV4cCI6MjA2MzczMDg4Mn0.CYqPH7s8lp7-EmR5an-89eizIMa6UuYWzkSAhCkYleE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 