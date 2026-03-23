/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {

  // Collection: campanha
  const campanha = new Collection({
    name: "campanha",
    type: "base",
    fields: [
      { type: "text",   name: "titulo",    required: true, min: 1, max: 200 },
      { type: "editor", name: "conteudo",  required: false },
      { type: "file",   name: "imagem",    required: false, maxSelect: 1, mimeTypes: ["image/jpeg","image/png","image/webp","image/gif"] },
      { type: "bool",   name: "ativo" },
      { type: "date",   name: "expira_em" },
      { type: "date",   name: "publica_em" }
    ],
    listRule:   "",
    viewRule:   "",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''"
  });

  // Collection: destaques
  const destaques = new Collection({
    name: "destaques",
    type: "base",
    fields: [
      { type: "text", name: "titulo", required: true, min: 1, max: 200 },
      { type: "bool", name: "ativo" },
      { type: "date", name: "expira_em" },
      { type: "date", name: "publica_em" }
    ],
    listRule:   "",
    viewRule:   "",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''"
  });

  // Collection: boletim_items
  const boletim = new Collection({
    name: "boletim_items",
    type: "base",
    fields: [
      { type: "text",   name: "titulo", required: true, min: 1, max: 500 },
      { type: "bool",   name: "ativo" },
      { type: "number", name: "ordem",  required: false }
    ],
    listRule:   "",
    viewRule:   "",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''"
  });

  db.save(campanha);
  db.save(destaques);
  db.save(boletim);

}, (db) => {
  db.delete(db.findCollectionByNameOrId("campanha"));
  db.delete(db.findCollectionByNameOrId("destaques"));
  db.delete(db.findCollectionByNameOrId("boletim_items"));
});
