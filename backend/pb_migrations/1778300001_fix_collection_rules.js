/// <reference path="../pb_data/types.d.ts" />

// Garante que as regras de acesso das coleções de conteúdo permitem
// qualquer usuário autenticado criar, editar e deletar registros.
// Também garante que Usuarios pode fazer autenticação normalmente.

migrate((app) => {
    // Coleções de conteúdo: qualquer usuário autenticado pode escrever
    var colecoes = ["Boletins", "Campanha", "Destaque", "DatasComemorativas"];
    for (var i = 0; i < colecoes.length; i++) {
        try {
            var col = app.findCollectionByNameOrId(colecoes[i]);
            unmarshal({
                listRule:   "",
                viewRule:   "",
                createRule: "@request.auth.id != ''",
                updateRule: "@request.auth.id != ''",
                deleteRule: "@request.auth.id != ''"
            }, col);
            app.save(col);
            console.log("[fix_rules] Regras corrigidas em: " + colecoes[i]);
        } catch (err) {
            console.log("[fix_rules] Erro em " + colecoes[i] + ": " + String(err));
        }
    }

    // Configuracoes: qualquer autenticado pode ler e atualizar; delete só superuser
    try {
        var cfg = app.findCollectionByNameOrId("Configuracoes");
        unmarshal({
            listRule:   "@request.auth.id != ''",
            viewRule:   "@request.auth.id != ''",
            createRule: "@request.auth.id != ''",
            updateRule: "@request.auth.id != ''",
            deleteRule: "@request.auth.collectionName = '_superusers'"
        }, cfg);
        app.save(cfg);
        console.log("[fix_rules] Regras corrigidas em: Configuracoes");
    } catch (err) {
        console.log("[fix_rules] Erro em Configuracoes: " + String(err));
    }

    // Usuarios (auth collection): garante que todos podem se autenticar
    try {
        var usuarios = app.findCollectionByNameOrId("Usuarios");
        unmarshal({
            authRule: "",
            requireEmailVerification: false
        }, usuarios);
        app.save(usuarios);
        console.log("[fix_rules] authRule e requireEmailVerification corrigidos em: Usuarios");
    } catch (err) {
        console.log("[fix_rules] Erro em Usuarios: " + String(err));
    }
}, (app) => {
    // rollback não restaura regras anteriores (migration segura para manter)
});
