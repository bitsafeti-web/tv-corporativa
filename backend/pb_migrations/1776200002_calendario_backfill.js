/// <reference path="../pb_data/types.d.ts" />

// Backfill: cria entradas no calendário para registros existentes em
// Campanha, Destaque e Boletins que ainda não têm entrada correspondente.

migrate((app) => {
    var colecoes = [
        { nome: "Campanha", cor: "#1d4ed8",  label: "Campanha" },
        { nome: "Destaque", cor: "#b45309",  label: "Destaque" },
        { nome: "Boletins", cor: "#15803d",  label: "Boletim"  }
    ];

    var calCol = app.findCollectionByNameOrId("DatasComemorativas");

    for (var i = 0; i < colecoes.length; i++) {
        var cfg = colecoes[i];

        var registros;
        try {
            // filtro vazio = todos os registros; limit 0 = sem limite
            registros = app.findRecordsByFilter(cfg.nome, "", "id", 0, 0);
        } catch (err) {
            console.log("[backfill] Erro ao buscar " + cfg.nome + ": " + String(err));
            continue;
        }

        if (!registros || registros.length === 0) {
            console.log("[backfill] Sem registros em: " + cfg.nome);
            continue;
        }

        for (var j = 0; j < registros.length; j++) {
            var rec = registros[j];
            if (!rec) continue;

            // Verifica se já existe entrada para este registro
            var jaExiste = false;
            try {
                var existentes = app.findRecordsByFilter(
                    "DatasComemorativas",
                    'origem_id = {:oid}',
                    "id", 1, 0,
                    { "oid": rec.id }
                );
                if (existentes && existentes.length > 0) {
                    jaExiste = true;
                }
            } catch (_) {}

            if (jaExiste) continue;

            // Determina data: usa publica_em se preenchido
            var pub = rec.get("publica_em");
            var data;
            if (pub && String(pub).length >= 10) {
                data = String(pub).slice(0, 10) + " 00:00:00.000Z";
            } else {
                data = "2026-01-01 00:00:00.000Z";
            }

            var titulo = rec.get("titulo") || "";
            var ativo  = rec.get("ativo");

            try {
                var novo = new Record(calCol);
                novo.set("titulo",           titulo);
                novo.set("data",             data);
                novo.set("descricao",        "Importado de " + cfg.label + ".");
                novo.set("ativo",            !!ativo);
                novo.set("antecedencia_dias", 1);
                novo.set("cor",              cfg.cor);
                novo.set("origem_id",        rec.id);
                novo.set("origem_colecao",   cfg.nome);
                app.save(novo);
                console.log("[backfill] OK: " + cfg.nome + " / " + titulo);
            } catch (err) {
                console.log("[backfill] Erro ao salvar " + cfg.nome + " / " + titulo + ": " + String(err));
            }
        }
    }
}, (app) => {
    // Rollback: remove entradas do backfill
    try {
        var entradas = app.findRecordsByFilter(
            "DatasComemorativas",
            'origem_colecao != ""',
            "id", 0, 0
        );
        for (var k = 0; k < entradas.length; k++) {
            try { app.delete(entradas[k]); } catch(_) {}
        }
    } catch(_) {}
});
