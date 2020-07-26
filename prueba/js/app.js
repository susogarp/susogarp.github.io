// Responsive nav

const page = document.querySelector('body');
const nav = document.querySelector('.nav--main .nav__links');
const navToggle = document.querySelector('#nav-toggle');

navToggle.addEventListener('click', () => {
   nav.classList.toggle('nav--mobile');

   if (nav.classList.contains('nav--mobile')) {
      navToggle.innerHTML = '<i class="fas fa-times"></i>';
   } else {
      navToggle.innerHTML = '<i class="fas fa-bars"></i>';
   }
});