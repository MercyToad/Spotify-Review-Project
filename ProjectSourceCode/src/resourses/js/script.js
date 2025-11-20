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
});