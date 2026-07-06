/// <reference path="../pb_data/types.d.ts" />

// Regras mais explicitas para evitar que qualquer auth collection futura
// ganhe permissao de escrita por acidente.
migrate((app) => {
    var editorRule = "@request.auth.collectionName = '_superusers' || @request.auth.collectionName = 'Usuarios'";
    var superuserRule = "@request.auth.collectionName = '_superusers'";

    var colecoesConteudo = ["posts", "telas", "midia", "Campanha", "Destaque", "DatasComemorativas"];
    for (var i = 0; i < colecoesConteudo.length; i++) {
        try {
            var col = app.findCollectionByNameOrId(colecoesConteudo[i]);
            unmarshal({
                listRule: "",
                viewRule: "",
                createRule: editorRule,
                updateRule: editorRule,
                deleteRule: editorRule
            }, col);
            app.save(col);
        } catch (err) {
            console.log("[harden_rules] ignorando " + colecoesConteudo[i] + ": " + String(err));
        }
    }

    try {
        var cfg = app.findCollectionByNameOrId("Configuracoes");
        unmarshal({
            listRule: "@request.auth.id != ''",
            viewRule: "@request.auth.id != ''",
            createRule: superuserRule,
            updateRule: superuserRule,
            deleteRule: superuserRule
        }, cfg);
        app.save(cfg);
    } catch (err2) {
        console.log("[harden_rules] Configuracoes: " + String(err2));
    }
}, (app) => {
    var editorRule = "@request.auth.id != ''";

    var colecoesConteudo = ["posts", "telas", "midia", "Campanha", "Destaque", "DatasComemorativas"];
    for (var i = 0; i < colecoesConteudo.length; i++) {
        try {
            var col = app.findCollectionByNameOrId(colecoesConteudo[i]);
            unmarshal({
                listRule: "",
                viewRule: "",
                createRule: editorRule,
                updateRule: editorRule,
                deleteRule: editorRule
            }, col);
            app.save(col);
        } catch (_) {}
    }
});
