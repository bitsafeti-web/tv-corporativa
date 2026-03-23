/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const midia = new Collection({
    name: "midia",
    type: "base",
    fields: [
      { type: "text",   name: "titulo",  required: false, max: 200 },
      { type: "file",   name: "arquivo", required: true,  maxSelect: 1, mimeTypes: ["image/jpeg","image/png","image/webp","image/gif","video/mp4","video/webm"] },
      { type: "select", name: "tipo",    required: true,  maxSelect: 1, values: ["imagem", "video"] },
      { type: "number", name: "duracao", required: false, min: 1, max: 300 },
      { type: "bool",   name: "ativo" },
      { type: "number", name: "ordem",   required: false, min: 0 }
    ],
    listRule:   "",
    viewRule:   "",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''"
  });

  return db.save(midia);
}, (db) => {
  const col = db.findCollectionByNameOrId("midia");
  return db.delete(col);
});
