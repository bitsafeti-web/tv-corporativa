/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1295211807")

  // update collection data
  unmarshal({
    "name": "Campanha"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1295211807")

  // update collection data
  unmarshal({
    "name": "campanha"
  }, collection)

  return app.save(collection)
})
