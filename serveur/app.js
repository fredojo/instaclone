//framework qui permet de creer un serveur web
const express = require("express");
//construis des chemins vers les dossiers du projet
const path = require("path");
//ma connexion sqlite + la fonction qui crée les tables si elles n'esixtent pas
const {db, createTables} = require("./db");
//installe serveur express
//permet de gerer les chemins
//et connectent a la base sqlite

const app = express();
//cree l'aplication web  express
app.use(express.json());
//sa dit au serveur que si qqun envoie du json
//dans son body, il peut le lire

//servir les fichiers du dossier client
app.use(express.static(path.join(__dirname, "../client")));
//si qqun va dans localhost:300, envoie lui les fichiers du
//dossier client

app.get("/", (req, res) =>{
  res.sendFile(path.join(__dirname, "../client/index.html"));
});

//api photos picsum

//liste de photos depuis l'api picsum
app.get("/api/photos", async (req, res)=>{
  try{
    const url = "https://picsum.photos/v2/list?limit=30";

    const response = await fetch(url);

    if (!response.ok){
      console.error("erreur api picsum:", response.status);
      return res.status(500).json({error: "erreur api d'images"});
    }
    //avant de donner la reponse
    const data = await response.json();
    //on nettoie les donnee et donne slmt
    //ce que le frontend a besoin
    const photos = data.map((p) =>({
      id: String(p.id),
      url: p.download_url,
      author: p.author
    }));
    //le client recoit un tab d'obj
    //une par photo
    res.json(photos);

  }catch (err){
    console.error("erreur /api/photos picsum:", err);
    res.status(500).json({error: "erreur serveur"});
  }
});

//inscription d'un nouveau utilisateur
app.post("/api/auth/register", async (req, res) =>{
  try {
    const username = req.body.username || req.body.email;
    const password = req.body.password;
    //le frontend envoie un json avec username/email et mdp

    if (!username || !password){
      return res
        .status(400)
        .json({error: "Les champs username/email et password sont obligatoires."});
    }
    //on cherche dans la table users si l'user n'existe pas deja
    const existingUser = await db("users").where({username}).first();

    if (existingUser){
      return res
        .status(400)
        .json({error: "Ce nom d'utilisateur existe deja."});
    }

    //on ajoute un nouveau user dans sqlite
    const ids = await db("users").insert({
      username,
      password
    });
    //on recupere l'user cree
    //pi on le renvoit au client un objet complet
    const newUser = await db("users").where({id: ids[0]}).first();
    if (newUser) delete newUser.password;
    //on supprime le mdp avant d'envoyer la rep
    res.status(201).json(newUser);

  }catch (err){
    console.error("Erreur register:", err);
    res.status(500).json({error: "Erreur serveur."});
  }
});


//connexion d'un utilisateur
app.post("/api/auth/login", async (req, res) =>{
  try {
    const username = req.body.username || req.body.email;
    const password = req.body.password;

    if (!username || !password){
      return res
        .status(400)
        .json({error: "Username/email et password requis."});
    }

    //on va dans sqlite table users pour trouver l'user
    const user = await db("users").where({username}).first();

    if (!user) {
      return res.status(400).json({error: "Utilisateur introuvable."});
    }

    if (user.password !== password){
      return res.status(400).json({error: "Mdp incorrect."});
    }

    delete user.password;
    res.json(user);
    //on renvoie l'user sans son mdp securitaire

  }catch (err){
    console.error("Erreur login:", err);
    res.status(500).json({error: "Erreur serveur."});
  }
});


//deconnexion = cote client supprime l'utilisateur garde
app.post("/api/auth/logout", (req, res) =>{
  res.json({message: "Déconnecté"});
});

//likes
//ajouter un like
app.post("/api/likes/:photoId", async (req, res) =>{
  try {//ma route recupere...
    //l'id de la photo dans l'url et
    const {photoId} = req.params;
    //l'id du user dans le body
    const {user_id} = req.body;

    if (!user_id){
      //on verifie d'abord que l'id du user est present
      return res.status(400).json({error: "le champ user_id est obligatoire"});
    }

    const existingLike = await db("likes")
      //on cherche dans la bd si la personne a deja like
      .where({user_id, photo_id: photoId})
      .first();

    //si oui erreur
    if (existingLike){
      return res.status(400).json({error: "vous avez deja like cette photo"});
    }
    //on ajoute un nouveau like dans la bd
    const ids = await db("likes").insert({
      user_id,
      photo_id: photoId,
    });
    //on recupere l’enregistrement cree
    const newLike = await db("likes").where({id: ids[0]}).first();

    //on envoie cet objet avec un statut 201
    res.status(201).json(newLike);
  }catch (err){
    console.error("erreur dans post /api/likes:", err);
    res.status(500).json({error: "erreur serveur"});
  }
});

//enlever un like
app.delete("/api/likes/:photoId", async (req, res) =>{
  try{
    //photoId vient de l’url (/api/likes/123)
    const {photoId} = req.params;
    //user_id vient du frontend
    const {user_id} = req.body;

    if (!user_id){
      return res.status(400).json({error: "le champ 'user_id' est obligatoire"});
    }

    const deleted = await db("likes")
      .where({user_id, photo_id: photoId})
      //retourne un nombre
      .del();
      //ce nombre = combien de lignes ont été supprimées

    //deleted === 1 le like existait et a ete supprime
    //deleted === 0 aucun like trouve
    if (deleted === 0){
      return res
        .status(404)
        .json({error: "aucun like trouve pour cet utilisateur sur cette photo"});
    }

    res.json({message: "like supprime"});
  }catch (err){
    console.error("erreur dans delete /api/likes:", err);
    res.status(500).json({error: "erreur serveur"});
  }
});

//comments
//ajouter un commentaire
app.post("/api/comments/:photoId", async (req, res) =>{
  try{
    const {photoId} = req.params;
    //quelle photo est commentee
    const {user_id, content} = req.body;
    //qui commente et le txt du comt

    if (!user_id || !content){
      return res
        .status(400)
        .json({error: "les champs user_id et content sont obligatoires"});
    }

    //on ajoute un commentaire dans la table comments
    const ids = await db("comments").insert({
      user_id,
      photo_id: photoId,
      content,
    });

    //on recupere le comt cree
    const newComment = await db("comments").where({id: ids[0]}).first();
    //on renvoie l'objet complet cree
    
    res.status(201).json(newComment);
    //le frontend recoit le commentaire pret a afficher
  }catch (err){
    console.error("erreur dans post /api/comments:", err);
    res.status(500).json({error: "erreur serveur"});
  }
});

//recuperer les commentaires d'une photo
app.get("/api/comments/:photoId", async (req, res) =>{
  try {
    const {photoId} = req.params;
    //on veut tout les comt d'une photo precise

    const comments = await db("comments")
      .where({photo_id: photoId})
      .orderBy("created_at", "asc");

    res.json(comments);
  }catch (err){
    console.error("erreur dans get /api/comments:", err);
    res.status(500).json({error: "erreur serveur"});
  }
});

//demarrage du serveur
createTables()
  .then(() =>{
    console.log("tables verifiees");
    app.listen(3000, () =>{
      console.log("serveur demarre sur http://localhost:3000");
    });
  })
  .catch((err) =>{
    console.error("erreur lors de la creation des tables:", err);
  });
//avant de demarrer, on verifies/crees
//toutes les tables (users, likes, comments)
//apres sa lance app.listen(3000)