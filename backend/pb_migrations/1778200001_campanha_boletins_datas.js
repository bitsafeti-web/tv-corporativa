/// <reference path="../pb_data/types.d.ts" />

// Adiciona campos publica_em e expira_em nas coleções Campanha e Boletins.
migrate((app) => {
    var colecoes = ["Campanha", "Boletins"];

    for (var i = 0; i < colecoes.length; i++) {
        try {
            var col = app.findCollectionByNameOrId(colecoes[i]);

            var temPublica = false;
            var temExpira  = false;
            for (var j = 0; j < col.fields.length; j++) {
                if (col.fields[j].name === "publica_em") temPublica = true;
                if (col.fields[j].name === "expira_em")  temExpira  = true;
            }

            if (!temPublica) {
                col.fields.addAt(col.fields.length, new Field({
                    type: "date",
                    name: "publica_em",
                    required: false,
                    system: false,
                    hidden: false
                }));
            }
            if (!temExpira) {
                col.fields.addAt(col.fields.length, new Field({
                    type: "date",
                    name: "expira_em",
                    required: false,
                    system: false,
                    hidden: false
                }));
            }

            if (!temPublica || !temExpira) {
                app.save(col);
                console.log("[migration] Campos de data adicionados em: " + colecoes[i]);
            } else {
                console.log("[migration] " + colecoes[i] + " já tem os campos de data.");
            }
        } catch (err) {
            console.log("[migration] Erro em " + colecoes[i] + ": " + String(err));
        }
    }
}, (app) => {
    var colecoes = ["Campanha", "Boletins"];
    for (var i = 0; i < colecoes.length; i++) {
        try {
            var col = app.findCollectionByNameOrId(colecoes[i]);
            for (var j = col.fields.length - 1; j >= 0; j--) {
                if (col.fields[j].name === "publica_em" || col.fields[j].name === "expira_em") {
                    try { col.fields.removeById(col.fields[j].id); } catch(_) {}
                }
            }
            app.save(col);
        } catch (_) {}
    }
});
