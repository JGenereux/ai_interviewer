import { createClient } from "@supabase/supabase-js";

const dbClient = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLIC_KEY);

export default dbClient