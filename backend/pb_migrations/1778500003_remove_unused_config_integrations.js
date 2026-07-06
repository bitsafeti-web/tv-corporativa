/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
    try {
        var configuracoes = app.findCollectionByNameOrId("Configuracoes");
        var campos = [
            "cidade",
            "pais",
            "fuso_horario",
            "weather_api_key",
            "google_api_key",
            "google_calendar_id",
            "ticker_ativo",
            "ticker_texto"
        ];

        for (var i = 0; i < campos.length; i++) {
            var field = configuracoes.fields.getByName(campos[i]);
            if (field) {
                configuracoes.fields.removeById(field.id);
            }
        }
        app.save(configuracoes);
    } catch (err) {
        console.log("[remove_config_integrations] Configuracoes: " + String(err));
    }
}, (app) => {
    // Campos removidos porque as integracoes correspondentes nao serao usadas.
});
