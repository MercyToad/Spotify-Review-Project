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
      console.log("hitting this");
      
      const query = searchInput.value.trim();
      if (!query) return;
      try {
          // console.log("hello");
          const response = await fetch(`/searchResults?song_name=${encodeURIComponent(query)}`);
          // console.log("goodbye");
          const results = await response.json();
          // console.log(results);
          const songs = results.tracks.items;
          // console.log("songs items: " + songs);

        if (!dropdown) return;
        dropdown.innerHTML = '';
        dropdown.style.display = null;

        if (!songs || songs.length === 0) {
        dropdown.innerHTML = '<div class="profile-menu-item">No results found</div>';
        return;
        }

        songs.forEach(item => {
        const div = document.createElement('div');
        div.classList.add('profile-menu-item');
        div.textContent = "'" + item.name + "' by " + (item.artists && item.artists[0] ? item.artists[0].name : 'Unknown');

        div.addEventListener('click', () => {
          window.location.href = `/my-reviews?song_id=${item.id}`;
        });

        dropdown.appendChild(div);
        });
      } catch (error) {
        console.error('Error fetching search results:', error);
      }
  });

    document.addEventListener('click', (e) => {
      if (!searchForm || !dropdown) return;
      if (!searchForm.contains(e.target)) {
        dropdown.style.display = "none";
      }
    });


    //second version for reviews page #lazy
  const searchForm2 = document.getElementById('search-form2');
  const searchInput2 = document.getElementById('search-input2');
  const dropdown2 = document.getElementById('search-results-dropdown2');

  searchForm2.addEventListener('submit', async (e) => {
      e.preventDefault(); // STOP page reload
      console.log("hitting this");
      
      const query = searchInput2.value.trim();
      if (!query) return;
      try {
          // console.log("hello");
          const response = await fetch(`/searchResults?song_name=${encodeURIComponent(query)}`);
          // console.log("goodbye");
          const results = await response.json();
          // console.log(results);
          const songs = results.tracks.items;
          // console.log("songs items: " + songs);

        if (!dropdown2) return;
        dropdown2.innerHTML = '';
        dropdown2.style.display = null;

        if (!songs || songs.length === 0) {
        dropdown2.innerHTML = '<div class="profile-menu-item">No results found</div>';
        return;
        }

        songs.forEach(item => {
        const div = document.createElement('div');
        div.classList.add('profile-menu-item');
        div.textContent = "'" + item.name + "' by " + (item.artists && item.artists[0] ? item.artists[0].name : 'Unknown');

        div.addEventListener('click', () => {
          window.location.href = `/my-reviews?song_id=${item.id}`;
        });

        dropdown2.appendChild(div);
        });
      } catch (error) {
        console.error('Error fetching search results:', error);
      }
  });

    document.addEventListener('click', (e) => {
      if (!searchForm2 || !dropdown2) return;
      if (!searchForm2.contains(e.target)) {
        dropdown2.style.display = "none";
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
    // Client-side UI for authenticated state
    // - The backend is responsible for authentication and rendering a
    //   `data-username` attribute on a page element when the user is logged in.
    // - This client code will read that attribute (if present) and update
    //   the profile accordion to show Logout. The actual logout action
    //   should be implemented server-side at the `/logout` route.
    // ------------------------------
    function applyLoggedInState(username) {
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
          <button id="logoutBtn" class="profile-menu-item logout" role="menuitem"><span>Logout</span></button>
        `;

        // rebind click to close menu on items
        const items = menu.querySelectorAll('.profile-menu-item');
        items.forEach(item => item.addEventListener('click', function() {
          menu.classList.remove('active');
          const btn = document.getElementById('profileBtn');
          if (btn) btn.setAttribute('aria-expanded', 'false');
          menu.setAttribute('aria-hidden', 'true');
        }));

        // bind logout: delegate to server-side logout endpoint
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
          logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Redirect to server-side logout route; backend should clear session/cookie.
            window.location.href = '/logout';
          });
        }
      }

      // need to get highly rated songs from user
    }

    function clearLoggedInState() {
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
    }
    // If the backend rendered a username on the page (e.g., <main data-username="...">),
    // apply the logged-in UI state. This keeps authentication concerns on the backend
    // while the frontend only updates the accordion/menu.
    (function detectServerRenderedUser() {
      const el = document.querySelector('[data-username]');
      if (el && el.dataset && el.dataset.username) {
        applyLoggedInState(el.dataset.username);
      }
    })();
  });