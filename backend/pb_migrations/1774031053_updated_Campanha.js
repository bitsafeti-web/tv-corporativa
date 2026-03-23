/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1295211807")

  // remove field
  collection.fields.removeById("file437289737")

  // add field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "file3139117636",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif"
    ],
    "name": "imagem_1920x1080",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [
      "1920x1080",
      "400x225"
    ],
    "type": "file"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1295211807")

  // add field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "file437289737",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif"
    ],
    "name": "imagem",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": null,
    "type": "file"
  }))

  // remove field
  collection.fields.removeById("file3139117636")

  return app.save(collection)
})
