/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3980889162")

  // update collection data
  unmarshal({
    "name": "boletins_digital"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3980889162")

  // update collection data
  unmarshal({
    "name": "boletim_items"
  }, collection)

  return app.save(collection)
})
