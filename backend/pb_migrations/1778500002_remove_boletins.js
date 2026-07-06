/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
    try {
        var eventos = app.findRecordsByFilter(
            "DatasComemorativas",
            "origem_colecao = {:origemColecao}",
            "id",
            500,
            0,
            { origemColecao: "Boletins" }
        );
        for (var i = 0; i < eventos.length; i++) {
            app.delete(eventos[i]);
        }
    } catch (err) {
        console.log("[remove_boletins] DatasComemorativas: " + String(err));
    }

    try {
        var col = app.findCollectionByNameOrId("Boletins");
        app.delete(col);
    } catch (err2) {
        console.log("[remove_boletins] Boletins ja ausente: " + String(err2));
    }
}, (app) => {
    // Colecao removida de proposito. Rollback sem recriacao automatica.
});
