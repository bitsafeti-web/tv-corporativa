/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2734196219")

  // update collection data
  unmarshal({
    "name": "destaque"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2734196219")

  // update collection data
  unmarshal({
    "name": "destaques"
  }, collection)

  return app.save(collection)
})
