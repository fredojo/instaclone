const express = require("express");
const path = require("path");
const {db, createTables} = require("./db");

const app = express();
app.use(express.json());

//servir les fichiers du dossier CLIENT
app.use(express.static(path.join(__dirname, "../client")));

//=======================
//api photos picsum
//=======================

//liste de photos depuis l'API Picsum
app.get("/api/photos", async (req, res)=>{
  try{
    const url = "https://picsum.photos/v2/list?limit=30";

    const response = await fetch(url);

    if (!response.ok){
      console.error("erreur api picsum:", response.status);
      return res.status(500).json({error: "erreur api d'images"});
    }

    const data = await response.json();

    const photos = data.map((p) =>({
      id: String(p.id),
      url: p.download_url,
      author: p.author
    }));

    res.json(photos);

  }catch (err){
    console.error("erreur /api/photos picsum:", err);
    res.status(500).json({error: "erreur serveur"});
  }
});

//inscription d'un nouveau utilisateur
app.post("/api/auth/register", async (req, res) =>{
  try{
    const {username, password} = req.body;

    //validation minimale: les deux champs doivent être la
    if (!username || !password){
      return res
        .status(400)
        .json({error: "les champs username et password sont obligatoires"});
    }

    //verifier si le username existe deja
    const existingUser = await db("users").where({username}).first();

    if (existingUser){
      return res
        .status(400)
        .json({error: "ce nom d'utilisateur est deja utilisé"});
    }

    const ids = await db("users").insert({
      username,
      password,
    });

    const newUser = await db("users").where({id: ids[0]}).first();

    if (newUser){
      delete newUser.password;
    }

    res.status(201).json(newUser);
  }catch (err){
    console.error("erreur dans /api/auth/register:", err);
    res.status(500).json({error: "erreur serveur"});
  }
});


//connexion d'un utilisateur
app.post("/api/auth/login", async (req, res) => {
  try {
    //on recupere ce que le client a envoyé dans un json
    const {username, password} = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({error: "vesoin du nom de l'utilisateur et du mdp"});
    }

    //on va dans sqlite table users pour trouver l'utilisateur
    const user = await db("users").where({ username }).first();

    if (!user){
      return res.status(400).json({error: "utilisateur introuvable"});
    }

    //on verifie le mdp et on le compare pour savoir si il est bon
    if (user.password !== password){
      return res.status(400).json({error: "le mdp n'est pas bon"});
    }
    //on renvoie l'utilisateur sans son mdp
    delete user.password;

    //on repond au coté client pour qu'il sache qu'il est connecté
    res.json(user);
  }catch (err){
    console.error("erreur dans /api/auth/login:", err);
    res.status(500).json({error: "erreur serveur"});
  }
});

//deconnexion = coté client supprime l'utilisateur gardé
app.post("/api/auth/logout", (req, res) =>{
  res.json({message: "deconnecte"});
});

//=======================
//likes
//=======================

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
      //on cherche dans la bd si la personne à deja liké
      .where({user_id, photo_id: photoId})
      .first();

    //si oui erreur
    if (existingLike){
      return res.status(400).json({error: "vous avez déjà liké cette photo"});
    }
    //on ajoute un nouveau like dans la bd
    const ids = await db("likes").insert({
      user_id,
      photo_id: photoId,
    });
    //on récupère l’enregistrement créé
    const newLike = await db("likes").where({id: ids[0]}).first();

    //on envoie cet objet avec un statut 201
    res.status(201).json(newLike);
  }catch (err){
    console.error("erreur dans post /api/likes:", err);
    res.status(500).json({error: "erreur serveur"});
  }
});

// Retirer un like
app.delete("/api/likes/:photoId", async (req, res) => {
  try{
    const {photoId} = req.params;
    const {user_id} = req.body;

    if (!user_id){
      return res.status(400).json({error: "le champ 'user_id' est obligatoire"});
    }

    const deleted = await db("likes")
      .where({user_id, photo_id: photoId})
      .del();

    if (deleted === 0){
      return res
        .status(404)
        .json({error: "aucun like trouvé pour cet utilisateur sur cette photo"});
    }

    res.json({message: "like supprimé"});
  }catch (err){
    console.error("erreur dans delete /api/likes:", err);
    res.status(500).json({error: "erreur serveur"});
  }
});

// =======================
//  COMMENTS
// =======================

//ajouter un commentaire
app.post("/api/comments/:photoId", async (req, res) =>{
  try{
    const {photoId} = req.params;
    const {user_id, content} = req.body;

    if (!user_id || !content){
      return res
        .status(400)
        .json({error: "les champs user_id et content sont obligatoires"});
    }

    const ids = await db("comments").insert({
      user_id,
      photo_id: photoId,
      content,
    });

    const newComment = await db("comments").where({id: ids[0]}).first();

    res.status(201).json(newComment);
  }catch (err){
    console.error("erreur dans post /api/comments:", err);
    res.status(500).json({error: "erreur serveur"});
  }
});

// Récupérer les commentaires d'une photo
app.get("/api/comments/:photoId", async (req, res) => {
  try {
    const {photoId} = req.params;

    const comments = await db("comments")
      .where({photo_id: photoId})
      .orderBy("created_at", "asc");

    res.json(comments);
  }catch (err){
    console.error("erreur dans get /api/comments:", err);
    res.status(500).json({error: "erreur serveur"});
  }
});

// =======================
//  Démarrage du serveur
// =======================

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
