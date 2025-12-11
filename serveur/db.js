const knex = require("knex");

const db = knex({
  client: "sqlite3",
  connection: {
    filename: "./instagram.sqlite3",
  },
  useNullAsDefault: true,
});

//fonction qui va créer les tables si elles n'existent pas encore
async function createTables() {
  //table users
  const hasUsersTable = await db.schema.hasTable("users");

  if (!hasUsersTable) {
    await db.schema.createTable("users", (table) => {
      table.increments("id").primary();       //id int pk autoincremment
      table.string("username").notNullable().unique(); //nom d'utilisateur unique
      table.string("password").notNullable();          //mot de passe hashé
      table.datetime("created_at").defaultTo(db.fn.now()); //date de création
    });
    console.log("Table 'users' creee..");

  }

    //table likes
  const hasLikesTable = await db.schema.hasTable("likes");

  if (!hasLikesTable) {
    await db.schema.createTable("likes", (table) => {
      table.increments("id").primary();  // id du like
      table.integer("user_id").notNullable();  // qui like
      table.string("photo_id").notNullable();  // quelle photo est likée
      table.datetime("created_at").defaultTo(db.fn.now()); // date du like
    });
    console.log("Table 'likes' creee..");

  }

    // 3) Table comments
  const hasCommentsTable = await db.schema.hasTable("comments");

  if (!hasCommentsTable) {
    await db.schema.createTable("comments", (table) => {
      table.increments("id").primary();      // id du commentaire
      table.integer("user_id").notNullable(); // qui a commenté
      table.string("photo_id").notNullable(); // sur quelle photo
      table.string("content").notNullable();  // texte du commentaire
      table.datetime("created_at").defaultTo(db.fn.now()); // date du commentaire
    });
    console.log("Table 'comments' creee..");

  }

}

module.exports = {db, createTables};