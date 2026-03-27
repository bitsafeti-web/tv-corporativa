/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("Usuarios");

  // Desativa verificação de e-mail obrigatória
  unmarshal({ "requireEmailVerification": false }, collection);

  app.save(collection);

  // Marca todos os usuários existentes como verificados
  const records = app.findRecordsByFilter("Usuarios", "verified = false", "", 0, 0);
  for (const record of records) {
    record.set("verified", true);
    app.save(record);
  }
}, (app) => {
  const collection = app.findCollectionByNameOrId("Usuarios");
  unmarshal({ "requireEmailVerification": true }, collection);
  return app.save(collection);
});
