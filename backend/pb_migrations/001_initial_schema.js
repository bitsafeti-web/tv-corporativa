/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const posts = new Collection({
    name: "posts",
    type: "base",
    fields: [
      { type: "text",   name: "titulo",        required: true,  min: 1, max: 200 },
      { type: "editor", name: "conteudo",       required: true },
      {
        type: "select", name: "tipo", required: true,
        maxSelect: 1,
        values: ["aviso", "comunicado", "evento", "urgente", "campanha", "boletim"]
      },
      { type: "file",   name: "imagem",         required: false, maxSelect: 1, mimeTypes: ["image/jpeg","image/png","image/webp","image/gif"] },
      { type: "bool",   name: "ativo" },
      { type: "bool",   name: "destaque" },
      { type: "date",   name: "expira_em" },
      { type: "date",   name: "publica_em" },
      { type: "text",   name: "somente_telas",  required: false, max: 500 }
    ],
    listRule:   "",
    viewRule:   "",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''"
  });

  return db.save(posts);
}, (db) => {
  const posts = db.findCollectionByNameOrId("posts");
  return db.delete(posts);
});
