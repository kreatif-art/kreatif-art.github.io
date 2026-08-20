import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const MAX_AUDIO_SIZE = 15 * 1024 * 1024; // 15MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_COVER_SIZE = 5 * 1024 * 1024; // 5MB

const AUDIO_TYPES = ['audio/mpeg', 'audio/mp3'];
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formData = await req.formData();
    const type = formData.get('type') as string;
    const file = formData.get('file') as File;
    const coverImage = formData.get('cover') as File | null;

    if (!type || !['music', 'art'].includes(type)) {
      return new Response(JSON.stringify({ error: 'Invalid content type. Must be "music" or "art".' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate media file
    if (type === 'music') {
      if (!AUDIO_TYPES.includes(file.type)) {
        return new Response(JSON.stringify({ error: 'Audio file must be MP3 format.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (file.size > MAX_AUDIO_SIZE) {
        return new Response(JSON.stringify({ error: 'Audio file must be under 15MB.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      if (!IMAGE_TYPES.includes(file.type)) {
        return new Response(JSON.stringify({ error: 'Art file must be JPG, PNG, or WebP.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return new Response(JSON.stringify({ error: 'Art file must be under 10MB.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Validate cover image if provided
    if (coverImage && type === 'music') {
      if (!IMAGE_TYPES.includes(coverImage.type)) {
        return new Response(JSON.stringify({ error: 'Cover image must be JPG, PNG, or WebP.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (coverImage.size > MAX_COVER_SIZE) {
        return new Response(JSON.stringify({ error: 'Cover image must be under 5MB.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Upload media file
    const mediaExt = file.name.split('.').pop() || (type === 'music' ? 'mp3' : 'jpg');
    const mediaPath = `${user.id}/${type}-${Date.now()}.${mediaExt}`;
    const { error: mediaUploadError } = await supabase.storage
      .from('content-media')
      .upload(mediaPath, file, { upsert: false });

    if (mediaUploadError) {
      return new Response(JSON.stringify({ error: 'Failed to upload file: ' + mediaUploadError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: mediaUrlData } = supabase.storage.from('content-media').getPublicUrl(mediaPath);

    // Upload cover image if provided
    let coverUrl: string | null = null;
    if (coverImage && type === 'music') {
      const coverExt = coverImage.name.split('.').pop() || 'jpg';
      const coverPath = `${user.id}/cover-${Date.now()}.${coverExt}`;
      const { error: coverUploadError } = await supabase.storage
        .from('cover-images')
        .upload(coverPath, coverImage);

      if (coverUploadError) {
        return new Response(JSON.stringify({ error: 'Failed to upload cover image: ' + coverUploadError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: coverUrlData } = supabase.storage.from('cover-images').getPublicUrl(coverPath);
      coverUrl = coverUrlData.publicUrl;
    }

    return new Response(JSON.stringify({
      mediaUrl: mediaUrlData.publicUrl,
      coverUrl,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
