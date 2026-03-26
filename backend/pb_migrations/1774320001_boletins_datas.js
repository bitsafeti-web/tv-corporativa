/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("Boletins");

  collection.fields.addAt(collection.fields.length, new Field({
    "type": "date",
    "name": "publica_em",
    "required": false,
    "system": false,
    "hidden": false,
    "presentable": false
  }));

  collection.fields.addAt(collection.fields.length, new Field({
    "type": "date",
    "name": "expira_em",
    "required": false,
    "system": false,
    "hidden": false,
    "presentable": false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("Boletins");
  for (const f of collection.fields) {
    if (f.name === "publica_em" || f.name === "expira_em") {
      try { collection.fields.removeById(f.id); } catch(_) {}
    }
  }
  return app.save(collection);
});
