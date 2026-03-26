/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("Configuracoes");

  collection.fields.addAt(collection.fields.length, new Field({
    "type": "text",
    "name": "api_token",
    "required": false,
    "system": false,
    "hidden": false,
    "presentable": false,
    "primaryKey": false,
    "autogeneratePattern": "",
    "pattern": "",
    "min": 0,
    "max": 300
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("Configuracoes");
  for (const f of collection.fields) {
    if (f.name === "api_token") {
      try { collection.fields.removeById(f.id); } catch(_) {}
    }
  }
  return app.save(collection);
});
