/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("DatasComemorativas");

  collection.fields.addAt(collection.fields.length, new Field({
    "type": "text",
    "name": "origem_id",
    "required": false,
    "system": false,
    "hidden": false,
    "presentable": false,
    "max": 15,
    "min": 0
  }));

  collection.fields.addAt(collection.fields.length, new Field({
    "type": "text",
    "name": "origem_colecao",
    "required": false,
    "system": false,
    "hidden": false,
    "presentable": false,
    "max": 50,
    "min": 0
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("DatasComemorativas");
  for (const f of collection.fields) {
    if (f.name === "origem_id" || f.name === "origem_colecao") {
      try { collection.fields.removeById(f.id); } catch(_) {}
    }
  }
  return app.save(collection);
});
