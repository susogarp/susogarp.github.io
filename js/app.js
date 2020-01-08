// Responsive nav

const page = document.querySelector('body');
const nav = document.querySelector('.nav__menu');
const navToggle = document.querySelector('.nav__menu-btn');
const navClose = document.querySelector('.nav__menu-close');

function closeNavMobile() {
  nav.classList.remove('nav--mobile');
  navClose.style.display = 'none';
  page.classList.remove('body-shadow');
}

navToggle.addEventListener('click', () => {
  nav.classList.add('nav--mobile');
  navClose.style.display = 'block';
  page.classList.add('body-shadow');
});

navClose.addEventListener('click', closeNavMobile);

for (let i = 0; i < nav.querySelectorAll('a').length; i++) {
  nav.querySelectorAll('a')[i].addEventListener('click', closeNavMobile);
}

// Smooth nav

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();

    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
  });
});

// DARK MODE

// Dark mode controller
let isDarkMode = false;

// Select all the elements involved in dark mode
const darkBtn = document.querySelector('.nav__dark-btn');
const logo = document.querySelector('.nav__logo img');
const navLinks = document.querySelectorAll('.nav__menu a');
const h1 = document.querySelector('h1');
const h2 = document.querySelector('h2');
const h3 = document.querySelectorAll('h3');
const h4 = document.querySelectorAll('h4');
const btns = document.querySelectorAll('.btn');
const btnHightlight = document.querySelectorAll('.btn--hightlight');
const icons = document.querySelectorAll('i');

// When user clicks dark mode button
darkBtn.addEventListener('click', () => {
  if (isDarkMode) {
    isDarkMode = false;
    // Change icon for moon and text
    darkBtn.children[0].classList.replace('fa-sun', 'fa-moon');
    darkBtn.children[1].textContent = 'Dark mode';

    // Elements alone
    darkBtn.classList.remove('dark-link');
    page.classList.remove('dark-mode');
    logo.setAttribute('src', 'img/logo.svg');
    h1.classList.remove('dark-h1');
    h2.classList.remove('dark-h2');
    nav.classList.remove('dark-mobile');
    navClose.classList.remove('dark-icon');

    // All icons
    for (let i = 0; i < icons.length; i++) {
      icons[i].classList.remove('dark-icon');
    }

    // All nav links
    for (let i = 0; i < navLinks.length; i++) {
      navLinks[i].classList.remove('dark-link');
    }

    // All H3
    for (let i = 0; i < h3.length; i++) {
      h3[i].classList.remove('dark-h3');
    }

    // All H4
    for (let i = 0; i < h4.length; i++) {
      h4[i].classList.remove('dark-h4');
    }

    // All buttons with btn
    for (let i = 0; i < btns.length; i++) {
      btns[i].classList.remove('dark-btn');
    }

    // All buttons with btn--hightlight
    for (let i = 0; i < btnHightlight.length; i++) {
      btnHightlight[i].classList.remove('dark-btn--hightlight');
    }
  } else {
    isDarkMode = true;
    // Change icon for sun
    darkBtn.children[0].classList.replace('fa-moon', 'fa-sun');
    darkBtn.children[1].textContent = 'Light mode';

    // Elements alone
    darkBtn.classList.add('dark-link');
    page.classList.add('dark-mode');
    logo.setAttribute('src', 'img/logo-alt.svg');
    h1.classList.add('dark-h1');
    h2.classList.add('dark-h2');
    nav.classList.add('dark-mobile');
    navClose.classList.add('dark-icon');

    // All icons
    for (let i = 0; i < icons.length; i++) {
      icons[i].classList.add('dark-icon');
    }

    // All nav links
    for (let i = 0; i < navLinks.length; i++) {
      navLinks[i].classList.add('dark-link');
    }

    // All H3
    for (let i = 0; i < h3.length; i++) {
      h3[i].classList.add('dark-h3');
    }

    // All H4
    for (let i = 0; i < h4.length; i++) {
      h4[i].classList.add('dark-h4');
    }

    // All buttons with btn
    for (let i = 0; i < btns.length; i++) {
      btns[i].classList.add('dark-btn');
    }

    // All buttons with btn--hightlight
    for (let i = 0; i < btnHightlight.length; i++) {
      btnHightlight[i].classList.add('dark-btn--hightlight');
    }
  }
});
