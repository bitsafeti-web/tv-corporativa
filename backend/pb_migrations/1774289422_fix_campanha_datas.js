/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("Campanha")

  // remove campos com IDs inválidos da migration anterior (se existirem)
  try { collection.fields.removeById("date_publica_em") } catch(_) {}
  try { collection.fields.removeById("date_expira_em") } catch(_) {}

  // remove por nome caso o ID não bata
  const toRemove = [];
  for (const f of collection.fields) {
    if (f.name === "publica_em" || f.name === "expira_em") {
      toRemove.push(f.id);
    }
  }
  for (const id of toRemove) {
    try { collection.fields.removeById(id) } catch(_) {}
  }

  app.save(collection)

  // re-adiciona com IDs gerados pelo PocketBase
  const fresh = app.findCollectionByNameOrId("Campanha")

  fresh.fields.addAt(fresh.fields.length, new Field({
    "type": "date",
    "name": "publica_em",
    "required": false,
    "system": false,
    "hidden": false,
    "presentable": false,
    "min": "",
    "max": ""
  }))

  fresh.fields.addAt(fresh.fields.length, new Field({
    "type": "date",
    "name": "expira_em",
    "required": false,
    "system": false,
    "hidden": false,
    "presentable": false,
    "min": "",
    "max": ""
  }))

  return app.save(fresh)
}, (app) => {
  const collection = app.findCollectionByNameOrId("Campanha")
  for (const f of collection.fields) {
    if (f.name === "publica_em" || f.name === "expira_em") {
      try { collection.fields.removeById(f.id) } catch(_) {}
    }
  }
  return app.save(collection)
})
