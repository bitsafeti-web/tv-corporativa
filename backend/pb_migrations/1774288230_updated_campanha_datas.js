/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("campanha")

  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "date_publica_em",
    "max": "",
    "min": "",
    "name": "publica_em",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "date_expira_em",
    "max": "",
    "min": "",
    "name": "expira_em",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("campanha")
  collection.fields.removeById("date_publica_em")
  collection.fields.removeById("date_expira_em")
  return app.save(collection)
})
