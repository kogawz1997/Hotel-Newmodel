import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';

export function useProfile() {
  const { session, setProfile } = useAuthStore();

  useEffect(() => {
    if (!session?.user?.id) return;
    supabase
      .from('user_profiles')
      .select('id, full_name, role, hotel_id, avatar_url, hotels(name)')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfile({
            id: data.id,
            full_name: data.full_name ?? '',
            role: data.role,
            hotel_id: data.hotel_id,
            hotel_name: (data as any).hotels?.name,
            avatar_url: data.avatar_url,
          });
        }
      });
  }, [session?.user?.id]);
}
