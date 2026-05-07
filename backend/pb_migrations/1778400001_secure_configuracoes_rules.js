/// <reference path="../pb_data/types.d.ts" />

// Reaplica regras seguras para Configuracoes em bancos que ja rodaram
// migrations anteriores com leitura publica.
migrate((app) => {
    var cfg = app.findCollectionByNameOrId("Configuracoes");
    unmarshal({
        listRule:   "@request.auth.id != ''",
        viewRule:   "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.collectionName = '_superusers'"
    }, cfg);
    app.save(cfg);
}, (app) => {
    var cfg = app.findCollectionByNameOrId("Configuracoes");
    unmarshal({
        listRule:   "",
        viewRule:   "",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.collectionName = '_superusers'"
    }, cfg);
    app.save(cfg);
});
