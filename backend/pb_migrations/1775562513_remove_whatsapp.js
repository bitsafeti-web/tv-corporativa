/// <reference path="../pb_data/types.d.ts" />

// Remove todos os campos relacionados ao WhatsApp/ZAPI do banco de dados.
// O hook whatsapp_calendario.pb.js também foi removido do diretório pb_hooks.
migrate((app) => {
    // 1. Remove campos whatsapp_numero e whatsapp_notificar de Usuarios
    try {
        const usuarios = app.findCollectionByNameOrId("Usuarios");
        const toRemove = ["whatsapp_numero", "whatsapp_notificar"];
        for (const fieldName of toRemove) {
            const field = usuarios.fields.getByName(fieldName);
            if (field) {
                usuarios.fields.removeById(field.id);
            }
        }
        app.save(usuarios);
    } catch (_) {}

    // 2. Remove campo api_token de Configuracoes
    try {
        const configuracoes = app.findCollectionByNameOrId("Configuracoes");
        const field = configuracoes.fields.getByName("api_token");
        if (field) {
            configuracoes.fields.removeById(field.id);
            app.save(configuracoes);
        }
    } catch (_) {}
}, (app) => {
    // rollback — recria os campos (sem os dados)
    const usuarios = app.findCollectionByNameOrId("Usuarios");
    usuarios.fields.add(new Field({ type: "text",  name: "whatsapp_numero",   required: false }));
    usuarios.fields.add(new Field({ type: "bool",  name: "whatsapp_notificar", required: false }));
    app.save(usuarios);

    const configuracoes = app.findCollectionByNameOrId("Configuracoes");
    configuracoes.fields.add(new Field({ type: "text", name: "api_token", required: false }));
    app.save(configuracoes);
});
