/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const col = new Collection({
    name: "totp_secrets",
    type: "base",
    fields: [
      { type: "text", name: "user_id",  required: true },
      { type: "text", name: "secret",   required: false },
      { type: "text", name: "pending",  required: false }
    ],
    listRule:   null,
    viewRule:   null,
    createRule: null,
    updateRule: null,
    deleteRule: null
  });
  return app.save(col);
}, (app) => {
  const col = app.findCollectionByNameOrId("totp_secrets");
  return app.delete(col);
});
