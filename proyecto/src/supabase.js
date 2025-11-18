// src/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xzexriheuqrrugjjycwb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6ZXhyaWhldXFycnVnamp5Y3diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5ODM3OTksImV4cCI6MjA3ODU1OTc5OX0.o8z11hQUOeCyuAZmVdpwCrDTplCvmZkUktOug1xec6w';
export const supabase = createClient(supabaseUrl, supabaseKey);