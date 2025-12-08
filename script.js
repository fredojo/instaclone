let currentUser = null  //infos de l'utilisateur
let currentImage = null //image ouverte 

//récupération des id de NavBar
const btnLogin = document.getElementById('btn-login')
const btnSignup = document.getElementById('btn-signup')
const navUser = document.getElementById('nav-user')

//récupération des id de Modals
const modalLogin = document.getElementById('modal-login')
const modalSignup = document.getElementById('modal-signup')
const closeLogin = document.getElementById('close-login')
const closeSignup = document.getElementById('close-signup')
const loginForm = document.getElementById('login-form')
const signupForm = document.getElementById('signup-form')

//modal image
const modal = document.getElementById('modal')
const modalClose = document.getElementById('modal-close')
const modalImg = document.getElementById('modal-img')
const likeBtn = document.getElementById('btn-like')
const likeCount = document.getElementById('like-count')
const commentsList = document.getElementById('comments-list')
const commentForm = document.getElementById('comment-form')
const commentInput = document.getElementById('comment-input')

//grille et recherche
const photoGrid = document.getElementById('photo-grid')
const searchForm = document.getElementById('search-form')
const searchInput = document.getElementById('search-input')


//fonction pour ouvrir le modale
function openModal(element){
    element.classList.remove('hidden')
}

//fonction pour fermer le modale
function closeModal(element){
    element.classLists.add('hidden')
}

//ouvrir les modales quand on clique sur les boutons de la navbar
btnLogin.addEventListener('click',()=>{
    openModal(modalLogin)
})

btnSignup.addEventListener('click',()=>{
    openModal(modalSignup)
})

//fermer avec le x
closeLogin.addEventListener('click',()=>{
    closeModal(modalLogin)
})

closeSignup.addEventListener('click',()=>{
    closeModal(modalSignup)
})

//fonction pour ouvrir le modal image
function openImageModal(id,url){
    currentImage = id
    modalImg.src = url
    fakeLikes = 0
    likeCount.textContent = fakeLikes
    open(modal)
}

//test pour les likes
let fakeLikes = 0

likeBtn.addEventListener('click',()=>{
    fakeLikes++
    likeCount.textContent = fakeLikes
})


//test génération image
function renderFakePhoto() {
  const fake = {
    id: 'fake-1',
    url: 'https://picsum.photos/600/400'
  };

  const card = document.createElement('div');
  card.className = 'photo-card';
  card.dataset.imageId = fake.id;
  card.dataset.imageUrl = fake.url;

  card.innerHTML = `
    <img src="${fake.url}" alt="fake image" />
  `;

  card.addEventListener('click', () => {
    openImageModal(fake.id, fake.url);
  });

  photoGrid.appendChild(card);
}


// Appeler la fonction au chargement
renderFakePhoto();
