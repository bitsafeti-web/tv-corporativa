/// <reference path="../pb_data/types.d.ts" />

// Sincroniza Campanha, Destaque e Boletins com DatasComemorativas.
// Importante: neste runtime do PocketBase, callbacks de hooks nao enxergam
// helpers definidos fora da propria callback. Por isso a logica fica inline.

onRecordAfterCreateSuccess(function(e) {
    try {
        var nomeColecao = "Campanha";
        var label = "Campanha";
        var cor = "#1d4ed8";
        var record = e.record;
        var pub = record.get("publica_em");
        var created = record.get("created");
        var data = pub && String(pub).length >= 10
            ? String(pub).slice(0, 10) + " 00:00:00.000Z"
            : (created && String(created).length >= 10 ? String(created).slice(0, 10) + " 00:00:00.000Z" : "2026-01-01 00:00:00.000Z");
        var titulo = record.get("titulo") || "";
        var existente = null;
        var encontrados = $app.findRecordsByFilter("DatasComemorativas", "origem_id = {:origemId}", "id", 1, 0, { origemId: record.id });
        if (encontrados && encontrados.length > 0) existente = encontrados[0];
        if (existente) {
            existente.set("titulo", titulo);
            existente.set("data", data);
            existente.set("ativo", !!record.get("ativo"));
            existente.set("cor", cor);
            existente.set("origem_colecao", nomeColecao);
            $app.save(existente);
        } else {
            var col = $app.findCollectionByNameOrId("DatasComemorativas");
            var novo = new Record(col);
            novo.set("titulo", titulo);
            novo.set("data", data);
            novo.set("descricao", "Criado automaticamente a partir de " + label + ".");
            novo.set("ativo", !!record.get("ativo"));
            novo.set("antecedencia_dias", 1);
            novo.set("cor", cor);
            novo.set("origem_id", record.id);
            novo.set("origem_colecao", nomeColecao);
            $app.save(novo);
        }
        console.log("[calendario_sync] Sincronizado: " + titulo + " (" + nomeColecao + ")");
    } catch (err) {
        console.log("[calendario_sync] hook create Campanha: " + String(err));
    }
}, "Campanha");

onRecordAfterUpdateSuccess(function(e) {
    try {
        var nomeColecao = "Campanha";
        var label = "Campanha";
        var cor = "#1d4ed8";
        var record = e.record;
        var pub = record.get("publica_em");
        var created = record.get("created");
        var data = pub && String(pub).length >= 10
            ? String(pub).slice(0, 10) + " 00:00:00.000Z"
            : (created && String(created).length >= 10 ? String(created).slice(0, 10) + " 00:00:00.000Z" : "2026-01-01 00:00:00.000Z");
        var titulo = record.get("titulo") || "";
        var existente = null;
        var encontrados = $app.findRecordsByFilter("DatasComemorativas", "origem_id = {:origemId}", "id", 1, 0, { origemId: record.id });
        if (encontrados && encontrados.length > 0) existente = encontrados[0];
        if (existente) {
            existente.set("titulo", titulo);
            existente.set("data", data);
            existente.set("ativo", !!record.get("ativo"));
            existente.set("cor", cor);
            existente.set("origem_colecao", nomeColecao);
            $app.save(existente);
        } else {
            var col = $app.findCollectionByNameOrId("DatasComemorativas");
            var novo = new Record(col);
            novo.set("titulo", titulo);
            novo.set("data", data);
            novo.set("descricao", "Criado automaticamente a partir de " + label + ".");
            novo.set("ativo", !!record.get("ativo"));
            novo.set("antecedencia_dias", 1);
            novo.set("cor", cor);
            novo.set("origem_id", record.id);
            novo.set("origem_colecao", nomeColecao);
            $app.save(novo);
        }
        console.log("[calendario_sync] Sincronizado: " + titulo + " (" + nomeColecao + ")");
    } catch (err) {
        console.log("[calendario_sync] hook update Campanha: " + String(err));
    }
}, "Campanha");

onRecordAfterDeleteSuccess(function(e) {
    try {
        var encontrados = $app.findRecordsByFilter("DatasComemorativas", "origem_id = {:origemId}", "id", 1, 0, { origemId: e.record.id });
        if (encontrados && encontrados.length > 0) {
            $app.delete(encontrados[0]);
            console.log("[calendario_sync] Removido do calendario: origem_id=" + e.record.id);
        }
    } catch (err) {
        console.log("[calendario_sync] hook delete Campanha: " + String(err));
    }
}, "Campanha");

onRecordAfterCreateSuccess(function(e) {
    try {
        var nomeColecao = "Destaque";
        var label = "Destaque";
        var cor = "#b45309";
        var record = e.record;
        var pub = record.get("publica_em");
        var created = record.get("created");
        var data = pub && String(pub).length >= 10
            ? String(pub).slice(0, 10) + " 00:00:00.000Z"
            : (created && String(created).length >= 10 ? String(created).slice(0, 10) + " 00:00:00.000Z" : "2026-01-01 00:00:00.000Z");
        var titulo = record.get("titulo") || "";
        var existente = null;
        var encontrados = $app.findRecordsByFilter("DatasComemorativas", "origem_id = {:origemId}", "id", 1, 0, { origemId: record.id });
        if (encontrados && encontrados.length > 0) existente = encontrados[0];
        if (existente) {
            existente.set("titulo", titulo);
            existente.set("data", data);
            existente.set("ativo", !!record.get("ativo"));
            existente.set("cor", cor);
            existente.set("origem_colecao", nomeColecao);
            $app.save(existente);
        } else {
            var col = $app.findCollectionByNameOrId("DatasComemorativas");
            var novo = new Record(col);
            novo.set("titulo", titulo);
            novo.set("data", data);
            novo.set("descricao", "Criado automaticamente a partir de " + label + ".");
            novo.set("ativo", !!record.get("ativo"));
            novo.set("antecedencia_dias", 1);
            novo.set("cor", cor);
            novo.set("origem_id", record.id);
            novo.set("origem_colecao", nomeColecao);
            $app.save(novo);
        }
        console.log("[calendario_sync] Sincronizado: " + titulo + " (" + nomeColecao + ")");
    } catch (err) {
        console.log("[calendario_sync] hook create Destaque: " + String(err));
    }
}, "Destaque");

onRecordAfterUpdateSuccess(function(e) {
    try {
        var nomeColecao = "Destaque";
        var label = "Destaque";
        var cor = "#b45309";
        var record = e.record;
        var pub = record.get("publica_em");
        var created = record.get("created");
        var data = pub && String(pub).length >= 10
            ? String(pub).slice(0, 10) + " 00:00:00.000Z"
            : (created && String(created).length >= 10 ? String(created).slice(0, 10) + " 00:00:00.000Z" : "2026-01-01 00:00:00.000Z");
        var titulo = record.get("titulo") || "";
        var existente = null;
        var encontrados = $app.findRecordsByFilter("DatasComemorativas", "origem_id = {:origemId}", "id", 1, 0, { origemId: record.id });
        if (encontrados && encontrados.length > 0) existente = encontrados[0];
        if (existente) {
            existente.set("titulo", titulo);
            existente.set("data", data);
            existente.set("ativo", !!record.get("ativo"));
            existente.set("cor", cor);
            existente.set("origem_colecao", nomeColecao);
            $app.save(existente);
        } else {
            var col = $app.findCollectionByNameOrId("DatasComemorativas");
            var novo = new Record(col);
            novo.set("titulo", titulo);
            novo.set("data", data);
            novo.set("descricao", "Criado automaticamente a partir de " + label + ".");
            novo.set("ativo", !!record.get("ativo"));
            novo.set("antecedencia_dias", 1);
            novo.set("cor", cor);
            novo.set("origem_id", record.id);
            novo.set("origem_colecao", nomeColecao);
            $app.save(novo);
        }
        console.log("[calendario_sync] Sincronizado: " + titulo + " (" + nomeColecao + ")");
    } catch (err) {
        console.log("[calendario_sync] hook update Destaque: " + String(err));
    }
}, "Destaque");

onRecordAfterDeleteSuccess(function(e) {
    try {
        var encontrados = $app.findRecordsByFilter("DatasComemorativas", "origem_id = {:origemId}", "id", 1, 0, { origemId: e.record.id });
        if (encontrados && encontrados.length > 0) {
            $app.delete(encontrados[0]);
            console.log("[calendario_sync] Removido do calendario: origem_id=" + e.record.id);
        }
    } catch (err) {
        console.log("[calendario_sync] hook delete Destaque: " + String(err));
    }
}, "Destaque");

onRecordAfterCreateSuccess(function(e) {
    try {
        var nomeColecao = "Boletins";
        var label = "Boletim";
        var cor = "#15803d";
        var record = e.record;
        var pub = record.get("publica_em");
        var created = record.get("created");
        var data = pub && String(pub).length >= 10
            ? String(pub).slice(0, 10) + " 00:00:00.000Z"
            : (created && String(created).length >= 10 ? String(created).slice(0, 10) + " 00:00:00.000Z" : "2026-01-01 00:00:00.000Z");
        var titulo = record.get("titulo") || "";
        var existente = null;
        var encontrados = $app.findRecordsByFilter("DatasComemorativas", "origem_id = {:origemId}", "id", 1, 0, { origemId: record.id });
        if (encontrados && encontrados.length > 0) existente = encontrados[0];
        if (existente) {
            existente.set("titulo", titulo);
            existente.set("data", data);
            existente.set("ativo", !!record.get("ativo"));
            existente.set("cor", cor);
            existente.set("origem_colecao", nomeColecao);
            $app.save(existente);
        } else {
            var col = $app.findCollectionByNameOrId("DatasComemorativas");
            var novo = new Record(col);
            novo.set("titulo", titulo);
            novo.set("data", data);
            novo.set("descricao", "Criado automaticamente a partir de " + label + ".");
            novo.set("ativo", !!record.get("ativo"));
            novo.set("antecedencia_dias", 1);
            novo.set("cor", cor);
            novo.set("origem_id", record.id);
            novo.set("origem_colecao", nomeColecao);
            $app.save(novo);
        }
        console.log("[calendario_sync] Sincronizado: " + titulo + " (" + nomeColecao + ")");
    } catch (err) {
        console.log("[calendario_sync] hook create Boletins: " + String(err));
    }
}, "Boletins");

onRecordAfterUpdateSuccess(function(e) {
    try {
        var nomeColecao = "Boletins";
        var label = "Boletim";
        var cor = "#15803d";
        var record = e.record;
        var pub = record.get("publica_em");
        var created = record.get("created");
        var data = pub && String(pub).length >= 10
            ? String(pub).slice(0, 10) + " 00:00:00.000Z"
            : (created && String(created).length >= 10 ? String(created).slice(0, 10) + " 00:00:00.000Z" : "2026-01-01 00:00:00.000Z");
        var titulo = record.get("titulo") || "";
        var existente = null;
        var encontrados = $app.findRecordsByFilter("DatasComemorativas", "origem_id = {:origemId}", "id", 1, 0, { origemId: record.id });
        if (encontrados && encontrados.length > 0) existente = encontrados[0];
        if (existente) {
            existente.set("titulo", titulo);
            existente.set("data", data);
            existente.set("ativo", !!record.get("ativo"));
            existente.set("cor", cor);
            existente.set("origem_colecao", nomeColecao);
            $app.save(existente);
        } else {
            var col = $app.findCollectionByNameOrId("DatasComemorativas");
            var novo = new Record(col);
            novo.set("titulo", titulo);
            novo.set("data", data);
            novo.set("descricao", "Criado automaticamente a partir de " + label + ".");
            novo.set("ativo", !!record.get("ativo"));
            novo.set("antecedencia_dias", 1);
            novo.set("cor", cor);
            novo.set("origem_id", record.id);
            novo.set("origem_colecao", nomeColecao);
            $app.save(novo);
        }
        console.log("[calendario_sync] Sincronizado: " + titulo + " (" + nomeColecao + ")");
    } catch (err) {
        console.log("[calendario_sync] hook update Boletins: " + String(err));
    }
}, "Boletins");

onRecordAfterDeleteSuccess(function(e) {
    try {
        var encontrados = $app.findRecordsByFilter("DatasComemorativas", "origem_id = {:origemId}", "id", 1, 0, { origemId: e.record.id });
        if (encontrados && encontrados.length > 0) {
            $app.delete(encontrados[0]);
            console.log("[calendario_sync] Removido do calendario: origem_id=" + e.record.id);
        }
    } catch (err) {
        console.log("[calendario_sync] hook delete Boletins: " + String(err));
    }
}, "Boletins");
