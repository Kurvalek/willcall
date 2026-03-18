const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const email = (req.body.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  try {
    const { data: existing } = await supabase
      .from('waitlist')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return res.json({ ok: true, message: 'Already on the list.' });
    }

    const { error } = await supabase.from('waitlist').insert({ email });
    if (error) {
      console.error('Waitlist insert error:', error.message);
      return res.status(500).json({ error: 'Could not save. Try again.' });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Waitlist error:', err.message);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};
