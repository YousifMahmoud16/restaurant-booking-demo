// script.js — uses global `supabase` (window.supabase)
// helper: escape
function escapeHtml(s = '') {
    return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

document.addEventListener('DOMContentLoaded', () => {
    // ensure supabase client exists
    if (!window.supabase) {
        console.error('Supabase client not found (window.supabase).');
        const listEl = document.getElementById('posts-list');
        if (listEl) listEl.innerHTML = '<p class="muted">Supabase client not found. تأكد من وجود الـ client في رأس الصفحة.</p>';
        return;
    }

    // Booking form handling
    const form = document.getElementById('booking-form');
    const msg = document.getElementById('message');
    const clearBtn = document.getElementById('clear-btn');

    function showMessage(text, ok = true) {
        if (!msg) return;
        msg.textContent = text;
        msg.style.color = ok ? 'green' : 'crimson';
        setTimeout(() => { if (msg) msg.textContent = ''; }, 4000);
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const f = new FormData(form);
            const payload = {
                name: f.get('name').trim(),
                email: f.get('email').trim(),
                booking_date: f.get('date'),
                booking_time: f.get('time'),
                guests: parseInt(f.get('guests')) || 1,
                notes: f.get('notes').trim()
            };

            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';

            const { data, error } = await window.supabase
                .from('bookings')
                .insert([payload]);

            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Booking';

            if (error) {
                console.error(error);
                showMessage('Error sending booking. Try again.', false);
            } else {
                form.reset();
                showMessage('Booking received! (demo)');
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => form.reset());
    }

    // Load posts from 'posts' table and render
    async function loadPosts() {
        const listEl = document.getElementById('posts-list');
        if (!listEl) return;
        listEl.innerHTML = '<p class="muted">Loading posts…</p>';

        const { data, error } = await window.supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase (posts) error:', error);
            listEl.innerHTML = '<p class="muted">Error loading posts (check console).</p>';
            return;
        }

        if (!data || data.length === 0) {
            listEl.innerHTML = '<p class="muted">No posts yet. اذهب إلى Supabase > Table Editor > posts > Insert Row لإضافة بيانات.</p>';
            return;
        }

        listEl.innerHTML = data.map(p => `
      <article class="post">
        <h3>${escapeHtml(p.title || 'Untitled')}</h3>
        <p>${escapeHtml(p.content || '')}</p>
        <small class="muted">${p.created_at ? new Date(p.created_at).toLocaleString() : ''}</small>
      </article>
    `).join('');
    }

    loadPosts();
});
