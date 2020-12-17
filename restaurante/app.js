const input = document.querySelector('.search__input');
// const ratingButton = document.querySelectorAll('.btn--search')[0];
const resNames = document.querySelectorAll('.card__title');
// const resRatings = document.querySelectorAll('.card__rating');
const resLocations = document.querySelectorAll('.card__location');
const detailsButtons = document.querySelectorAll('.card__button');
const modal = document.querySelector('#modal');
const closeModalBtn = document.querySelector('#close-modal');
const rateModalBtn = document.querySelector('#rateBtn');
const rateModalBtnSvg = rateModalBtn.children[0];
const rateModalBtnText = rateModalBtn.innerText;

let query = '';

// When the user starts to search
input.addEventListener('input', () => {
   query = input.value.toLowerCase();

   // Loop over the titles, if the query is not the same then is not showed
   for (let i = 0; i < resNames.length; i++) {
      if (resNames[i].textContent.toLowerCase().indexOf(query) > -1) {
         resNames[i].parentElement.parentElement.style.display = "block";
      } else {
         resNames[i].parentElement.parentElement.style.display = "none";
      }
   }

   for (let i = 0; i < resLocations.length; i++) {
      if (resLocations[i].textContent.toLocaleLowerCase().indexOf(query) > -1) {
         resLocations[i].parentElement.parentElement.parentElement.style.display = "block";
      } else {
         resLocations[i].parentElement.parentElement.parentElement.style.display = "none";
      }
   }
});

document.querySelector('form').addEventListener('submit', (e) => {
   e.preventDefault();
});

// When arrow button is clicked of each restaurant
for (let button of detailsButtons) {
   button.addEventListener('click', () => {
      // Change modal's image
      modal.children[0].children[1].setAttribute('src', 
      button.parentElement.parentElement.children[0].getAttribute('src'));

      // Change modal's title
      modal.children[0].children[2].children[0].innerText = 
      button.parentElement.parentElement.children[1].children[0].innerText;

      // Change modal's rating
      const ratingCopy = button.parentElement.children[0].children[0].cloneNode(true);
      modal.children[0].children[2].children[3].children[0].remove();
      modal.children[0].children[2].children[3].prepend(ratingCopy);

      // Change modal's status
      const statusCopy = button.parentElement.children[0].children[1].cloneNode(true);
      modal.children[0].children[2].children[3].children[1].remove();
      modal.children[0].children[2].children[3].append(statusCopy);

      // Change modal's location
      modal.children[0].children[2].children[5].children[1].innerText =
      button.parentElement.parentElement.children[2].children[0].children[2].innerText;

      modal.style.display = 'block';
   });
}

// When user clicks the rate button
rateModalBtn.addEventListener('click', (e) => {
   rateModalBtn.disabled = true;
   const ratingCopy = modal.children[0].children[2].children[3].children[0].cloneNode(true);
   rateModalBtn.innerHTML = '';
   rateModalBtn.append(ratingCopy);
});

// Close the modal when X button is clicked or when user clicks outside of the modal
modal.addEventListener('click', (e) => {
   if (e.target == modal) {
      modal.style.display = 'none';
      resetModal();
   }
});
closeModalBtn.addEventListener('click', () => {
   modal.style.display = 'none';
   resetModal();
});

function resetModal() {
   rateModalBtn.disabled = false;
   rateModalBtn.innerHTML = '';
   rateModalBtn.append(rateModalBtnSvg);
   rateModalBtn.innerText = rateModalBtnText;
}