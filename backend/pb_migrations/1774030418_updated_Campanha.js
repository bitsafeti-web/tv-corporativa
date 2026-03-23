/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1295211807")

  // remove field
  collection.fields.removeById("editor4199158776")

  // remove field
  collection.fields.removeById("date3808410")

  // remove field
  collection.fields.removeById("date1337311936")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1295211807")

  // add field
  collection.fields.addAt(2, new Field({
    "convertURLs": false,
    "hidden": false,
    "id": "editor4199158776",
    "maxSize": 0,
    "name": "conteudo",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "editor"
  }))

  // add field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "date3808410",
    "max": "",
    "min": "",
    "name": "expira_em",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "date1337311936",
    "max": "",
    "min": "",
    "name": "publica_em",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
})
