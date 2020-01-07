const page = document.querySelector('body');
const nav = document.querySelector('.nav__menu');
const navToggle = document.querySelector('.nav__menu-btn');
const navClose = document.querySelector('.nav__menu-close');

navToggle.addEventListener('click', () => {
  nav.classList.add('nav--mobile');
  navClose.style.display = 'block';
  page.style.backgroundColor = 'rgba(0,0,0,.4)';
});

navClose.addEventListener('click', () => {
  nav.classList.remove('nav--mobile');
  navClose.style.display = 'none';
  page.style.backgroundColor = 'rgba(255,255,255,1)';
});

// Smooth nav

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();

    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
  });
});
