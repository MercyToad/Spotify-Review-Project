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
