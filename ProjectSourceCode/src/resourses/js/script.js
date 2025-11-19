// Profile Menu Accordion Toggle
document.addEventListener('DOMContentLoaded', function() {
  const profileBtn = document.getElementById('profileBtn');
  const profileMenu = document.getElementById('profileMenu');

  if (profileBtn && profileMenu) {
    // Toggle menu when clicking profile button
    profileBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      profileMenu.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      if (!profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
        profileMenu.classList.remove('active');
      }
    });

    // Close menu when clicking on a menu item
    const menuItems = profileMenu.querySelectorAll('.profile-menu-item');
    menuItems.forEach(item => {
      item.addEventListener('click', function() {
        profileMenu.classList.remove('active');
      });
    });
  }
});

// My Reviews: toggle form and submit review
document.addEventListener('DOMContentLoaded', function() {
  const addBtn = document.getElementById('addReviewBtn');
  const formContainer = document.getElementById('reviewFormContainer');
  const cancelBtn = document.getElementById('cancelReviewBtn');
  const reviewForm = document.getElementById('reviewForm');
  const reviewsList = document.getElementById('reviewsList');
  const reviewTemplate = document.getElementById('review-template');

  if (addBtn && formContainer) {
    addBtn.addEventListener('click', function() {
      formContainer.style.display = formContainer.style.display === 'none' ? 'block' : 'none';
      const firstInput = formContainer.querySelector('input, textarea');
      if (firstInput) firstInput.focus();
    });
  }

  if (cancelBtn && formContainer) {
    cancelBtn.addEventListener('click', function() {
      formContainer.style.display = 'none';
      reviewForm.reset();
    });
  }

  if (reviewForm && reviewsList && reviewTemplate) {
    const templateSource = reviewTemplate.innerHTML;
    const tpl = Handlebars.compile(templateSource);

    reviewForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const formData = new FormData(reviewForm);
      const songTitle = formData.get('songTitle');
      const reviewText = formData.get('reviewText');

      // Create review object locally (frontend-only)
      const section = document.getElementById('myReviewsSection');
      const username = section ? section.dataset.username || 'Guest' : 'Guest';
      const createdAt = new Date().toLocaleString();
      const usernameChar = username.charAt(0).toUpperCase();

      const created = { id: Date.now(), songTitle, reviewText, username, createdAt, usernameChar };

      // Render the created review and prepend to list
      const html = tpl(created);
      const div = document.createElement('div');
      div.innerHTML = html;
      reviewsList.insertBefore(div.firstElementChild, reviewsList.firstChild);

      // Reset and hide form
      reviewForm.reset();
      formContainer.style.display = 'none';
    });
  }
});