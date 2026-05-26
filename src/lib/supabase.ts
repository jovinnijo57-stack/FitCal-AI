import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://mksbyfunazogjjyvuqjk.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_WCZGTHbYRJLcErKgR8zMEQ_TyBurC2N";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
