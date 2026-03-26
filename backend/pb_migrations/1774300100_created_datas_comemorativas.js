/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Remove a versão antiga criada pela migration 1774292426
  try {
    const old = app.findCollectionByNameOrId("DatasComemorativas");
    app.delete(old);
  } catch (_) {}

  const collection = new Collection({
    "id": "pbc_datas_comemorativas",
    "name": "DatasComemorativas",
    "type": "base",
    "system": false,
    "listRule": "",
    "viewRule": "",
    "createRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.id != ''",
    "indexes": [],
    "fields": [
      {
        "type": "text",
        "id": "text_dc_titulo",
        "name": "titulo",
        "required": true,
        "system": false,
        "hidden": false,
        "presentable": true,
        "primaryKey": false,
        "autogeneratePattern": "",
        "pattern": "",
        "min": 1,
        "max": 200
      },
      {
        "type": "date",
        "id": "date_dc_data",
        "name": "data",
        "required": true,
        "system": false,
        "hidden": false,
        "presentable": false,
        "min": "",
        "max": ""
      },
      {
        "type": "text",
        "id": "text_dc_descricao",
        "name": "descricao",
        "required": false,
        "system": false,
        "hidden": false,
        "presentable": false,
        "primaryKey": false,
        "autogeneratePattern": "",
        "pattern": "",
        "min": 0,
        "max": 500
      },
      {
        "type": "bool",
        "id": "bool_dc_ativo",
        "name": "ativo",
        "required": false,
        "system": false,
        "hidden": false,
        "presentable": false
      },
      {
        "type": "number",
        "id": "num_dc_antecedencia",
        "name": "antecedencia_dias",
        "required": false,
        "system": false,
        "hidden": false,
        "presentable": false,
        "min": 0,
        "max": 365,
        "onlyInt": true
      },
      {
        "type": "text",
        "id": "text_dc_cor",
        "name": "cor",
        "required": false,
        "system": false,
        "hidden": false,
        "presentable": false,
        "primaryKey": false,
        "autogeneratePattern": "",
        "pattern": "",
        "min": 0,
        "max": 20
      }
    ]
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_datas_comemorativas");
  return app.delete(collection);
});
