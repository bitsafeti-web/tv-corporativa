/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const posts = db.findCollectionByNameOrId("posts");

  // Atualiza o campo tipo para incluir "destaque"
  for (const field of posts.fields) {
    if (field.name === "tipo") {
      field.values = ["aviso", "comunicado", "evento", "urgente", "campanha", "destaque", "boletim"];
    }
  }

  return db.save(posts);
}, (db) => {
  const posts = db.findCollectionByNameOrId("posts");

  for (const field of posts.fields) {
    if (field.name === "tipo") {
      field.values = ["aviso", "comunicado", "evento", "urgente", "campanha", "boletim"];
    }
  }

  return db.save(posts);
});
