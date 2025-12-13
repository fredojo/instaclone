
//utilisateur connecté (null si personne)
let currentUser = null;

//id de la photo actuellement ouverte dans la modale
let currentPhotoId = null;

//toutes les photos récupérées depuis /api/photos
let allPhotos = [];

//récupération des éléments

//navBar
const btnLogin = document.getElementById("btn-login");
const btnSignup = document.getElementById("btn-signup");
const navUser = document.getElementById("nav-user");

//modales auth
const modalLogin = document.getElementById("modal-login");
const modalSignup = document.getElementById("modal-signup");
const closeLogin = document.getElementById("close-login");
const closeSignup = document.getElementById("close-signup");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const signupEmail = document.getElementById("signup-email");
const signupPassword = document.getElementById("signup-password");

//modale image
const modal = document.getElementById("modal");
const modalClose = document.getElementById("modal-close");
const modalImg = document.getElementById("modal-img");
const likeBtn = document.getElementById("btn-like");
const likeCount = document.getElementById("like-count");
const commentsList = document.getElementById("comments-list");
const commentForm = document.getElementById("comment-form");
const commentInput = document.getElementById("comment-input");

//grille et recherche
const photoGrid = document.getElementById("photo-grid");
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");

//ouvrir et fermer les modales

function openModal(element) {
  element.classList.remove("hidden");
}

function closeModal(element) {
  element.classList.add("hidden");
}

//ouvrir les modales d'auth quand on clique sur les boutons de la navbar
btnLogin.addEventListener("click", () => {
  openModal(modalLogin);
});

btnSignup.addEventListener("click", () => {
  openModal(modalSignup);
});

//fermer les modales d'auth avec le X
closeLogin.addEventListener("click", () => {
  closeModal(modalLogin);
});

closeSignup.addEventListener("click", () => {
  closeModal(modalSignup);
});

//fermer la modale image avec le X
modalClose.addEventListener("click", () => {
  closeModal(modal);
});

//gestion navbar

// Cette fonction met à jour la barre du haut
// si quelqu'un est connecté ou non.
function updateNavBar() {
  // on vide tout
  navUser.innerHTML = "";

  if (!currentUser) {
    //pas connecté, on remet les 2 boutons connexion et inscription
    const btnLoginEl = document.createElement("button");
    btnLoginEl.id = "btn-login";
    btnLoginEl.className = "nav-btn";
    btnLoginEl.textContent = "Connexion";

    const btnSignupEl = document.createElement("button");
    btnSignupEl.id = "btn-signup";
    btnSignupEl.className = "nav-btn";
    btnSignupEl.textContent = "Inscription";

    navUser.appendChild(btnLoginEl);
    navUser.appendChild(btnSignupEl);

    //on rebranche les événements sur les nouveaux boutons
    btnLoginEl.addEventListener("click", () => openModal(modalLogin));
    btnSignupEl.addEventListener("click", () => openModal(modalSignup));
  } else {
    //connecté, on affiche un message + bouton Déconnexion
    const spanUser = document.createElement("span");
    spanUser.textContent = "Connecté : " + currentUser.username;

    const btnLogout = document.createElement("button");
    btnLogout.className = "nav-btn";
    btnLogout.textContent = "Déconnexion";

    navUser.appendChild(spanUser);
    navUser.appendChild(btnLogout);

    btnLogout.addEventListener("click", handleLogout);
  }
}


//inscription
// on prend les champs du formulaire et on les envoie à /api/auth/register
signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = signupEmail.value.trim();    //on utilise l'email comme username
  const password = signupPassword.value.trim();

  if (!username || !password) {
    alert("Les champs sont obligatoires.");
    return;
  }

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      //le serveur attend username, password 
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      //si le serveur renvoie une erreur, on l'affiche
      alert(data.error || "Erreur lors de l'inscription");
      return;
    }

    //inscription OK, on considère l'utilisateur comme connecté
    currentUser = data;
    updateNavBar();
    closeModal(modalSignup);
    signupForm.reset();
  } catch (err) {
    console.error("Erreur register:", err);
    alert("Erreur serveur lors de l'inscription");
  }
});

//connexion 
// on récupère username + password et on les envoie à la route /api/auth/login
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = loginEmail.value.trim();
  const password = loginPassword.value.trim();

  if (!username || !password) {
    alert("Les champs sont obligatoires.");
    return;
  }

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      //même format que pour register
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Erreur lors de la connexion");
      return;
    }

    //login OK, on garde l'utilisateur en mémoire
    currentUser = data;
    updateNavBar();
    closeModal(modalLogin);
    loginForm.reset();
  } catch (err) {
    console.error("Erreur login:", err);
    alert("Erreur serveur lors de la connexion");
  }
});

//déconnexion
async function handleLogout() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
    });
  } catch (err) {
    console.error("Erreur logout:", err);
  }

  //de toute façon, côté client on oublie le user
  currentUser = null;
  updateNavBar();
  closeModal(modal); //au cas où il était dans la modale image
}

//récupération des photos

async function loadPhotos() {
  try {
    const res = await fetch("/api/photos");
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Erreur lors du chargement des photos");
      return;
    }

    allPhotos = data; //on garde tout pour la recherche
    renderPhotoGrid(allPhotos);
  } catch (err) {
    console.error("Erreur /api/photos:", err);
    alert("Erreur serveur lors du chargement des photos");
  }
}

//cette fonction affiche toutes les photos dans la grille
function renderPhotoGrid(photos) {
  photoGrid.innerHTML = "";

  photos.forEach((photo) => {
    const card = document.createElement("div");
    card.className = "photo-card";
    card.dataset.id = photo.id;
    card.dataset.url = photo.url;
    card.dataset.author = photo.author;

    card.innerHTML = `
      <img src="${photo.url}" alt="image" />
      <p>${photo.author}</p>
    `;

    //quand on clique sur une carte on ouvre la modale détail
    card.addEventListener("click", () => {
      openImageModal(photo);
    });

    photoGrid.appendChild(card);
  });
}

//ouvrir la modale pour une photo donnée
function openImageModal(photo) {
  currentPhotoId = photo.id;
  modalImg.src = photo.url;
  likeCount.textContent = "0"; //on part de 0 (pas de route pour compter)
  likeBtn.dataset.liked = "false"; //état initial : pas liké visuellement
  commentsList.innerHTML = ""; //on vide les anciens commentaires
  commentInput.value = "";

  //on charge les commentaires de cette photo
  loadComments(photo.id);

  openModal(modal);
}

//likes
// Quand on clique sur le bouton like dans la modale
likeBtn.addEventListener("click", async () => {
  if (!currentUser) {
    alert("Tu dois être connecté pour liker.");
    return;
  }

  if (!currentPhotoId) return;

  const alreadyLiked = likeBtn.dataset.liked === "true";

  try {
    if (!alreadyLiked) {
      //pas encore liké → on envoie un POST /api/likes/:photoId
      const res = await fetch(`/api/likes/${currentPhotoId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        //le serveur attend { user_id }
        body: JSON.stringify({ user_id: currentUser.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Erreur lors du like");
        return;
      }

      //si ça a marché, on met à jour l'UI
      likeBtn.dataset.liked = "true";
      likeBtn.textContent = "💔 Unlike";
      likeCount.textContent = String(
        Number(likeCount.textContent || "0") + 1
      );
    } else {
      //déjà liké, on envoie un DELETE /api/likes/:photoId
      const res = await fetch(`/api/likes/${currentPhotoId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: currentUser.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Erreur lors du retrait du like");
        return;
      }

      likeBtn.dataset.liked = "false";
      likeBtn.textContent = "❤️ Like";
      likeCount.textContent = String(
        Math.max(0, Number(likeCount.textContent || "0") - 1)
      );
    }
  } catch (err) {
    console.error("Erreur like/unlike:", err);
    alert("Erreur serveur pour le like");
  }
});

//commentaires 

//Charger les commentaires d'une photo depuis /api/comments/:photoId
async function loadComments(photoId) {
  try {
    const res = await fetch(`/api/comments/${photoId}`);
    const data = await res.json();

    if (!res.ok) {
      console.error("Erreur commentaires:", data.error);
      return;
    }

    commentsList.innerHTML = "";

    data.forEach((comment) => {
      const li = document.createElement("div");
      li.className = "comment-item";
      //on n'a pas le username, juste user_id dans la table
      li.textContent = `User ${comment.user_id} : ${comment.content}`;
      commentsList.appendChild(li);
    });
  } catch (err) {
    console.error("Erreur loadComments:", err);
  }
}

//quand on envoie le formulaire de commentaire
commentForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser) {
    alert("Tu dois être connecté pour commenter.");
    return;
  }
  if (!currentPhotoId) return;

  const content = commentInput.value.trim();
  if (!content) return;

  try {
    const res = await fetch(`/api/comments/${currentPhotoId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      //le serveur attend { user_id, content }
      body: JSON.stringify({
        user_id: currentUser.id,
        content,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Erreur lors de l'ajout du commentaire");
      return;
    }

    //on ajoute directement le nouveau commentaire à la liste
    const li = document.createElement("div");
    li.className = "comment-item";
    li.textContent = `User ${data.user_id} : ${data.content}`;
    commentsList.appendChild(li);

    commentInput.value = "";
  } catch (err) {
    console.error("Erreur ajout commentaire:", err);
    alert("Erreur serveur lors de l'ajout du commentaire");
  }
});



//recherche des photos

// donc on filtre côté client sur le tableau allPhotos.
searchForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const term = searchInput.value.trim().toLowerCase();

  if (!term) {
    renderPhotoGrid(allPhotos);
    return;
  }

  const filtered = allPhotos.filter((photo) => {
    return (
      photo.author.toLowerCase().includes(term) ||
      photo.id.toLowerCase().includes(term)
    );
  });

  renderPhotoGrid(filtered);
});


//initialisation de la page


//au chargement, on met la navbar en mode "pas connecté"
updateNavBar();

//on charge les photos depuis ton backend (qui lui parle à Picsum)
loadPhotos();
