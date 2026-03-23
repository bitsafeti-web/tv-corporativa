/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const telas = new Collection({
    name: "telas",
    type: "base",
    fields: [
      { type: "text",   name: "nome",        required: true,  max: 100 },
      { type: "text",   name: "slug",        required: true,  max: 50 },
      { type: "text",   name: "descricao",   required: false, max: 500 },
      { type: "bool",   name: "ativa" },
      { type: "select", name: "filtro_tipo", required: false, maxSelect: 4, values: ["aviso", "comunicado", "evento", "urgente"] }
    ],
    listRule:   "",
    viewRule:   "",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''"
  });

  return db.save(telas);
}, (db) => {
  const col = db.findCollectionByNameOrId("telas");
  return db.delete(col);
});
