/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_477892449")

  // update collection data
  unmarshal({
    "name": "Configuracoes"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_477892449")

  // update collection data
  unmarshal({
    "name": "configuracoes"
  }, collection)

  return app.save(collection)
})
