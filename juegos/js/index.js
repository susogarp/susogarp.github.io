const levelsLinkLi = document.querySelector('.nav__menu li:nth-child(2)');
const body = document.querySelector('body');

levelsLinkLi.addEventListener('click', (e) => {
  const ul = levelsLinkLi.querySelector('ul');
  ul.classList.toggle('nav-invisible');
  ul.classList.toggle('nav-visible');
  iconChanger();
  e.stopPropagation();
});

body.addEventListener('click', () => {
  const ul = levelsLinkLi.querySelector('ul');
  if (ul.classList.contains('nav-visible')) {
    ul.classList.remove('nav-visible');
    ul.classList.add('nav-invisible');
    iconChanger();
  }
});

const iconChanger = () => {
  if (levelsLinkLi.querySelector('i').classList.contains('fa-caret-down')) {
    levelsLinkLi.querySelector('i').classList.remove('fa-caret-down');
    levelsLinkLi.querySelector('i').classList.add('fa-caret-up');
  } else {
    levelsLinkLi.querySelector('i').classList.remove('fa-caret-up');
    levelsLinkLi.querySelector('i').classList.add('fa-caret-down');
  }
}

// levelsLinkLi.addEventListener('mouseout', () => {
//   const ul = levelsLinkLi.querySelector('ul');
//   ul.classList.remove('nav-visible');
//   ul.classList.add('nav-invisible');
// });