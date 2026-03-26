/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("Usuarios");

  collection.fields.addAt(collection.fields.length, new Field({
    "type": "text",
    "name": "whatsapp_numero",
    "required": false,
    "system": false,
    "hidden": false,
    "presentable": false,
    "primaryKey": false,
    "autogeneratePattern": "",
    "pattern": "",
    "min": 0,
    "max": 20
  }));

  collection.fields.addAt(collection.fields.length, new Field({
    "type": "bool",
    "name": "whatsapp_notificar",
    "required": false,
    "system": false,
    "hidden": false,
    "presentable": false
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("Usuarios");
  for (const f of collection.fields) {
    if (f.name === "whatsapp_numero" || f.name === "whatsapp_notificar") {
      try { collection.fields.removeById(f.id); } catch(_) {}
    }
  }
  return app.save(collection);
});
