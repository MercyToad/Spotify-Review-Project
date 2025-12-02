/*
  script.js
  - UI behaviors for the site.
  - Contains: profile menu toggle and "My Reviews" client-side interactions.
  - All handlers are attached on DOMContentLoaded to ensure elements exist.
*/

document.addEventListener('DOMContentLoaded', function() {
  // ------------------------------
  // Profile menu: toggle + outside click
  // ------------------------------
  const profileBtn = document.getElementById('profileBtn');
  const profileMenu = document.getElementById('profileMenu');

  // If we're on the public homepage, force navbar/profile links to point to root
  if (window.location.pathname === '/') {
    // site nav links should not navigate away — keep users on public homepage
    const navLinks = document.querySelectorAll('.site-nav a');
    navLinks.forEach(a => { a.setAttribute('href', '/'); });

    // header logo: point to root
    const logoLink = document.querySelector('.header-logo');
    if (logoLink) logoLink.setAttribute('href', '/');

    // profile-menu anchors should also point to root (public behaviour)
    const profileAnchors = document.querySelectorAll('.profile-menu a');
    profileAnchors.forEach(a => { a.setAttribute('href', '/'); });
  }

  if (profileBtn && profileMenu) {
    // Toggle menu when clicking the profile button
    profileBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      const expanded = profileBtn.getAttribute('aria-expanded') === 'true';
      profileBtn.setAttribute('aria-expanded', String(!expanded));
      profileMenu.classList.toggle('active');
      profileMenu.setAttribute('aria-hidden', String(!profileMenu.classList.contains('active')));
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      if (!profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
        profileMenu.classList.remove('active');
        profileBtn.setAttribute('aria-expanded', 'false');
        profileMenu.setAttribute('aria-hidden', 'true');
      }
    });

    // Close menu when clicking any menu item
    const menuItems = profileMenu.querySelectorAll('.profile-menu-item');
    menuItems.forEach(item => item.addEventListener('click', function() {
      profileMenu.classList.remove('active');
      profileBtn.setAttribute('aria-expanded', 'false');
      profileMenu.setAttribute('aria-hidden', 'true');
    }));
  }

  // ------------------------------
  // My Reviews: form toggle & client-side render
  // ------------------------------
  const addBtn = document.getElementById('addReviewBtn');
  const formContainer = document.getElementById('reviewFormContainer');
  const cancelBtn = document.getElementById('cancelReviewBtn');
  const reviewForm = document.getElementById('reviewForm');
  const reviewsList = document.getElementById('reviewsList');
  const reviewTemplate = document.getElementById('review-template');

  if (addBtn && formContainer) {
    // Toggle the review form visibility and focus the first field
    addBtn.addEventListener('click', function() {
      const isHidden = formContainer.style.display === 'none' || getComputedStyle(formContainer).display === 'none';
      formContainer.style.display = isHidden ? 'block' : 'none';
      const firstInput = formContainer.querySelector('input, textarea');
      if (firstInput) firstInput.focus();
    });
  }

  if (cancelBtn && formContainer) {
    // Hide the form and reset it
    cancelBtn.addEventListener('click', function() {
      formContainer.style.display = 'none';
      if (reviewForm) reviewForm.reset();
    });
  }

  if (reviewForm && reviewsList && reviewTemplate) {
    // Compile the Handlebars template once for performance
    const tpl = Handlebars.compile(reviewTemplate.innerHTML);

    reviewForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const formData = new FormData(reviewForm);
      const songTitle = formData.get('songTitle') || '';
      const reviewText = formData.get('reviewText') || '';

      // Build a small review object for client-side rendering
      const section = document.getElementById('myReviewsSection');
      const username = section ? (section.dataset.username || 'Guest') : 'Guest';
      const createdAt = new Date().toLocaleString();
      const usernameChar = username.charAt(0).toUpperCase();

      const created = { id: Date.now(), songTitle, reviewText, username, createdAt, usernameChar };

      // Render and prepend the new review into the reviews list
      const html = tpl(created);
      const div = document.createElement('div');
      div.innerHTML = html;
      reviewsList.insertBefore(div.firstElementChild, reviewsList.firstChild);

      // Reset form and hide it
      reviewForm.reset();
      formContainer.style.display = 'none';
    });
  }

  // search function
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const dropdown = document.getElementById('search-results-dropdown');

  searchForm.addEventListener('submit', async (e) => {
      e.preventDefault(); // STOP page reload
      
      const query = searchInput.value.trim();
      if (!query) return;
      console.log("query" + query);

      try {
          console.log("hello");
          const response = await fetch(`/searchResults?song_name=${encodeURIComponent(query)}`);
          console.log("goodbye");
          const results = await response.json();
          console.log(results);
          const songs = results.tracks.items;
          console.log("songs items: " + songs);

          dropdown.innerHTML = '';
          dropdown.style.display = null;

          if (results.length === 0) {
              dropdown.innerHTML = '<div class="profile-menu-item">No results found</div>';
              return;
          }

          songs.forEach(item => {
              const div = document.createElement('div');
              div.classList.add('profile-menu-item');
            
              div.textContent = item.name; 
              
              // div.addEventListener('click', () => {
              //     window.location.href = `/details/${item.id}`; // Example navigation
              // });

              dropdown.appendChild(div);
          });

      } catch (error) {
          console.error('Error fetching search results:', error);
      }
  });

  document.addEventListener('click', (e) => {
      if (!searchForm.contains(e.target)) {
          dropdown.style.display = "none";
      }
  });

    // ------------------------------
    // Auth modal: open, close, switch views
    // ------------------------------
    const openAuthBtn = document.getElementById('openAuthModal');
    const authOverlay = document.getElementById('authModalOverlay');
    const closeAuthBtn = document.getElementById('closeAuthModal');
    const loginView = document.getElementById('authLoginView');
    const registerView = document.getElementById('authRegisterView');
    const toRegisterLink = document.getElementById('toRegisterLink');
    const toLoginLink = document.getElementById('toLoginLink');

    function showAuthModal(view = 'login') {
      if (!authOverlay) return;
      document.body.style.overflow = 'hidden';
      authOverlay.classList.add('active');
      authOverlay.setAttribute('aria-hidden', 'false');
      if (view === 'register') {
        if (loginView) loginView.hidden = true;
        if (registerView) registerView.hidden = false;
      } else {
        if (loginView) loginView.hidden = false;
        if (registerView) registerView.hidden = true;
      }
      // focus first input
      const first = authOverlay.querySelector('input');
      if (first) first.focus();
    }

    function hideAuthModal() {
      if (!authOverlay) return;
      authOverlay.classList.remove('active');
      authOverlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    if (openAuthBtn) {
      openAuthBtn.addEventListener('click', function(e) {
        e.preventDefault();
        showAuthModal('login');
      });
    }

    // Bind any CTA elements that should open the auth modal (public hero uses this)
    const openAuthCTAs = document.querySelectorAll('.open-auth-cta');
    if (openAuthCTAs && openAuthCTAs.length) {
      openAuthCTAs.forEach(el => {
        el.addEventListener('click', function(e) {
          e.preventDefault();
          const view = el.dataset.authView || el.getAttribute('data-auth-view') || 'register';
          showAuthModal(view);
        });
      });
    }

    if (closeAuthBtn) {
      closeAuthBtn.addEventListener('click', function() {
        hideAuthModal();
      });
    }

    if (authOverlay) {
      // clicking on overlay (outside modal) closes it
      authOverlay.addEventListener('click', function(e) {
        if (e.target === authOverlay) hideAuthModal();
      });

      // ESC key closes modal
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') hideAuthModal();
      });
    }

    if (toRegisterLink) {
      toRegisterLink.addEventListener('click', function(e) {
        e.preventDefault();
        showAuthModal('register');
      });
    }

    if (toLoginLink) {
      toLoginLink.addEventListener('click', function(e) {
        e.preventDefault();
        showAuthModal('login');
      });
    }

    // ------------------------------
    // FRONTEND-ONLY MOCK AUTH (no backend changes)
    // - Stores a mock user in localStorage and updates header/menu on the client
    // - Useful for frontend development when backend auth is not available
    // ------------------------------
    const MOCK_AUTH_KEY = 'mock_authenticated_user';

    function applyMockLoggedInState(username) {
      const container = document.querySelector('.header-profile-container');
      if (!container) return;

      // remove any existing greeting
      const existingGreeting = container.querySelector('.mock-greeting');
      if (existingGreeting) existingGreeting.remove();

      // insert greeting
      const span = document.createElement('div');
      span.className = 'mock-greeting';
      span.style.color = 'var(--muted-foreground)';
      span.style.fontSize = '0.95rem';
      span.style.marginRight = '0.6rem';
      span.innerHTML = `Welcome <strong style="color:var(--foreground);">${username}</strong>`;
      container.insertBefore(span, container.firstChild);

      // update profile menu items to show logout
      const menu = document.getElementById('profileMenu');
      if (menu) {
        menu.innerHTML = `
          <a href="/profile" class="profile-menu-item" role="menuitem"><span>Profile</span></a>
          <a href="/my-reviews" class="profile-menu-item" role="menuitem"><span>My Reviews</span></a>
          <a href="/settings" class="profile-menu-item" role="menuitem"><span>Settings</span></a>
          <hr class="profile-menu-divider" />
          <button id="mockLogout" class="profile-menu-item logout" role="menuitem"><span>Logout</span></button>
        `;

        // rebind click to close menu on items
        const items = menu.querySelectorAll('.profile-menu-item');
        items.forEach(item => item.addEventListener('click', function() {
          menu.classList.remove('active');
          const btn = document.getElementById('profileBtn');
          if (btn) btn.setAttribute('aria-expanded', 'false');
          menu.setAttribute('aria-hidden', 'true');
        }));

        // bind logout
        const logoutBtn = document.getElementById('mockLogout');
        if (logoutBtn) {
          logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem(MOCK_AUTH_KEY);
            // reload to simulate server-side logout — go to public landing page
            window.location.href = '/';
          });
        }
      }

      // need to get highly rated songs from user
    }

    function clearMockLoggedInState() {
      const existingGreeting = document.querySelector('.mock-greeting');
      if (existingGreeting) existingGreeting.remove();
      const menu = document.getElementById('profileMenu');
      if (!menu) return;
      // restore original login button if present in template
      const hasLoginButton = menu.querySelector('#openAuthModal');
      if (!hasLoginButton) {
        // crude restore: replace last item with login button
        menu.innerHTML = menu.innerHTML + '<hr class="profile-menu-divider" /><button type="button" id="openAuthModal" class="profile-menu-item logout" role="menuitem"><span>Login</span></button>';
        const openBtn = document.getElementById('openAuthModal');
        if (openBtn) openBtn.addEventListener('click', function(e){ e.preventDefault(); showAuthModal('login'); });
      }

      const songCards = document.querySelectorAll('.my-class');
    }

    // If a mock user is stored, apply logged-in state on load
    const storedMock = localStorage.getItem(MOCK_AUTH_KEY);
    if (storedMock) {
      try {
        const parsed = JSON.parse(storedMock);
        if (parsed && parsed.username) applyMockLoggedInState(parsed.username);
      } catch (e) {
        // ignore parse errors
      }
    }

    // Intercept modal forms and perform frontend-only auth (mock)
    const modalLoginForm = loginView ? loginView.querySelector('form') : null;
    const modalRegisterForm = registerView ? registerView.querySelector('form') : null;

    function handleMockAuthSubmit(formEl) {
      if (!formEl) return;
      const fd = new FormData(formEl);
      const uname = fd.get('username') || fd.get('login-username') || '';
      if (!uname || uname.trim().length < 1) {
        // show a small inline error
        let err = formEl.querySelector('.auth-error');
        if (!err) { err = document.createElement('div'); err.className = 'auth-error error-message'; formEl.insertBefore(err, formEl.firstChild); }
        err.textContent = 'Please provide a username.';
        return;
      }
      // store mock user
      localStorage.setItem(MOCK_AUTH_KEY, JSON.stringify({ username: uname.trim() }));
      // apply and redirect to /home to simulate private home
      applyMockLoggedInState(uname.trim());
      hideAuthModal();
      window.location.href = '/home';
    }

    if (modalLoginForm) {
      modalLoginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleMockAuthSubmit(modalLoginForm);
      });
    }
    if (modalRegisterForm) {
      modalRegisterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleMockAuthSubmit(modalRegisterForm);
      });
    }

  });