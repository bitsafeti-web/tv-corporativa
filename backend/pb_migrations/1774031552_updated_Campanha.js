/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1295211807")

  // remove field
  collection.fields.removeById("file3139117636")

  // add field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "file3328639846",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif"
    ],
    "name": "imagem_1568x876px",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [
      "1568x876",
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

  // remove field
  collection.fields.removeById("file3328639846")

  return app.save(collection)
})
