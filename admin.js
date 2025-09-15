// admin.js — يعتمد على window.supabase
function escapeHtml(s = '') { return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'); }

document.addEventListener('DOMContentLoaded', () => {
    if (!window.supabase) { console.error('supabase client missing'); return; }
    console.log('Supabase client initialized', !!window.supabase);

    const loginForm = document.getElementById('login-form');
    const loginMsg = document.getElementById('login-msg');
    const authCard = document.getElementById('auth-card');
    const bookingsSection = document.getElementById('bookings-list');
    const listEl = document.getElementById('list');
    const signoutBtn = document.getElementById('signout');

    const postsSection = document.getElementById('posts-admin');
    const postForm = document.getElementById('post-form');
    const postsList = document.getElementById('posts-admin-list');
    const postMsg = document.getElementById('post-msg');

    function info(el, txt, t = 3000) { if (el) { el.textContent = txt; setTimeout(() => el.textContent = '', t); } }

    // show bookings
    async function showBookings() {
        if (authCard) authCard.hidden = true;
        if (bookingsSection) bookingsSection.hidden = false;
        if (postsSection) postsSection.hidden = false;

        const { data, error } = await window.supabase
            .from('bookings').select('*').order('created_at', { ascending: false }).limit(100);

        if (error) {
            listEl.innerHTML = `<p class="muted">Error loading bookings.</p>`;
            console.error('bookings load error', error);
            return;
        }

        if (!data || data.length === 0) {
            listEl.innerHTML = `<p class="muted">No bookings yet.</p>`;
        } else {
            listEl.innerHTML = data.map(b => `
        <div class="booking-item">
          <strong>${escapeHtml(b.name)}</strong> • ${escapeHtml(b.email)} <br/>
          <small>${escapeHtml(b.booking_date || '')} ${escapeHtml(b.booking_time || '')} • Guests: ${escapeHtml(String(b.guests || ''))}</small>
          <p>${escapeHtml(b.notes || '')}</p>
          <div style="margin-top:6px"><button class="btn delete-booking" data-id="${b.id}">Delete</button></div>
        </div>
      `).join('');
            // attach delete handlers
            document.querySelectorAll('.delete-booking').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (!confirm('Delete this booking?')) return;
                    const id = btn.dataset.id;
                    const { error } = await window.supabase.from('bookings').delete().eq('id', id);
                    if (error) { alert('Delete failed'); console.error(error); } else { showBookings(); }
                });
            });
        }
        loadAdminPosts();
    }

    // POSTS: load
    async function loadAdminPosts() {
        if (!postsList) return;
        postsList.innerHTML = '<p class="muted">Loading posts…</p>';
        const { data, error } = await window.supabase.from('posts').select('*').order('created_at', { ascending: false });
        if (error) { postsList.innerHTML = '<p class="muted">Error loading posts.</p>'; console.error('posts load error', error); return; }
        if (!data || data.length === 0) { postsList.innerHTML = '<p class="muted">No posts yet.</p>'; return; }
        postsList.innerHTML = data.map(p => `
      <div class="post-admin-item">
        <strong>${escapeHtml(p.title)}</strong>
        <p>${escapeHtml(p.content)}</p>
        <small class="muted">${p.created_at ? new Date(p.created_at).toLocaleString() : ''}</small>
        <div style="margin-top:6px">
          <button class="btn delete-post" data-id="${p.id}">Delete</button>
        </div>
      </div>
    `).join('');
        document.querySelectorAll('.delete-post').forEach(b => {
            b.addEventListener('click', async () => {
                if (!confirm('Delete this post?')) return;
                const id = b.dataset.id;
                const { error } = await window.supabase.from('posts').delete().eq('id', id);
                if (error) { alert('Delete failed'); console.error(error); } else { loadAdminPosts(); }
            });
        });
    }

    // Login handler
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fm = new FormData(loginForm);
            const email = fm.get('email'), password = fm.get('password');
            info(loginMsg, 'Signing in…');
            const { data, error } = await window.supabase.auth.signInWithPassword({ email, password });
            if (error) {
                console.error('signIn error', error);
                // show detailed error message so you can debug (will disappear after 5s)
                info(loginMsg, `Login failed: ${error.message}`, 5000);
                return;
            }
            info(loginMsg, 'Signed in — loading...');
            await showBookings();
        });
    }

    if (signoutBtn) {
        signoutBtn.addEventListener('click', async () => {
            await window.supabase.auth.signOut();
            if (bookingsSection) bookingsSection.hidden = true;
            if (postsSection) postsSection.hidden = true;
            if (authCard) authCard.hidden = false;
        });
    }

    // Create post handler
    if (postForm) {
        postForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fm = new FormData(postForm);
            const title = fm.get('title').trim(), content = fm.get('content').trim();
            if (!title || !content) { info(postMsg, 'Fill both fields', 2000); return; }
            const { error } = await window.supabase.from('posts').insert([{ title, content }]);
            if (error) { console.error('create post error', error); info(postMsg, 'Create failed', 2000); } else {
                postForm.reset();
                info(postMsg, 'Post created');
                loadAdminPosts();
            }
        });
    }

});
