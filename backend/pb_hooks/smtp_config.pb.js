/// <reference path="../pb_data/types.d.ts" />

// ═══════════════════════════════════════════════════════════════════
// Configuração SMTP — Skymail
// ═══════════════════════════════════════════════════════════════════
onBootstrap(function(e) {
    e.next();

    function env(name) {
        try { return $os.getenv(name) || ""; } catch (_) { return ""; }
    }

    // ── SMTP ────────────────────────────────────────────────────────
    try {
        var smtpUser = env("PB_SMTP_USERNAME");
        var smtpPass = env("PB_SMTP_PASSWORD");

        if (!smtpUser || !smtpPass) {
            console.log("[smtp_config] PB_SMTP_USERNAME/PB_SMTP_PASSWORD ausentes; SMTP preservado.");
        } else {
            var s = $app.settings();
            s.smtp.enabled    = true;
            s.smtp.host       = env("PB_SMTP_HOST") || "smtp.skymail.net.br";
            s.smtp.port       = Number(env("PB_SMTP_PORT") || "587");
            s.smtp.username   = smtpUser;
            s.smtp.password   = smtpPass;
            s.smtp.tls        = env("PB_SMTP_TLS") === "true";
            s.smtp.authMethod = env("PB_SMTP_AUTH_METHOD") || "LOGIN";
            s.meta.senderName    = env("PB_SENDER_NAME") || "TV Corporativa Bitsafe";
            s.meta.senderAddress = env("PB_SENDER_ADDRESS") || smtpUser;
            $app.save(s);
            console.log("[smtp_config] SMTP configurado.");
        }
    } catch(err) {
        console.log("[smtp_config] Erro SMTP: " + String(err));
    }

    // ── Templates de E-mail — Layout Bitgroup ───────────────────────
    var LOGO_URL   = "https://tv.bitsafeti.com.br/bitgroup-white.png";
    var COR        = "#7b0000";

    function emailLayout(titulo, corpo, btnTexto) {
        return '<!DOCTYPE html>' +
        '<html lang="pt-BR"><head><meta charset="UTF-8">' +
        '<meta name="viewport" content="width=device-width,initial-scale=1.0">' +
        '<title>' + titulo + '</title></head>' +
        '<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">' +
        '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">' +
        '<tr><td align="center">' +
        '<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">' +

        // Cabeçalho vermelho com logo
        '<tr><td style="background:' + COR + ';padding:28px 40px;text-align:center;">' +
        '<img src="' + LOGO_URL + '" alt="Bitgroup" style="height:56px;max-width:220px;object-fit:contain;" />' +
        '</td></tr>' +

        // Corpo
        '<tr><td style="padding:36px 40px 28px;">' +
        '<h2 style="color:#1f2937;font-size:20px;font-weight:700;margin:0 0 14px;">' + titulo + '</h2>' +
        '<div style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 28px;">' + corpo + '</div>' +
        '<a href="{ACTION_URL}" style="display:inline-block;background:' + COR + ';color:#ffffff;text-decoration:none;' +
        'padding:13px 30px;border-radius:6px;font-weight:700;font-size:15px;">' + btnTexto + '</a>' +
        '</td></tr>' +

        // Rodapé
        '<tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:18px 40px;">' +
        '<p style="color:#9ca3af;font-size:11px;line-height:1.6;margin:0;">' +
        'TV Corporativa Bitsafe &mdash; Este é um e-mail automático, não responda.<br>' +
        'Se você não solicitou esta ação, ignore este e-mail com segurança.' +
        '</p>' +
        '</td></tr>' +

        '</table></td></tr></table></body></html>';
    }

    var tplVerification = emailLayout(
        "Confirme seu endereço de e-mail",
        "Olá!<br><br>Clique no botão abaixo para confirmar seu endereço de e-mail e ativar sua conta no sistema <strong>TV Corporativa Bitsafe</strong>.<br><br>Este link expira em 24 horas.",
        "Confirmar e-mail"
    );

    var tplReset = emailLayout(
        "Redefinição de senha",
        "Olá!<br><br>Recebemos uma solicitação para redefinir a senha da sua conta no sistema <strong>TV Corporativa Bitsafe</strong>.<br><br>Clique no botão abaixo para criar uma nova senha. O link expira em 30 minutos.",
        "Redefinir senha"
    );

    var tplEmailChange = emailLayout(
        "Confirmação de troca de e-mail",
        "Olá!<br><br>Você solicitou a troca do endereço de e-mail da sua conta no sistema <strong>TV Corporativa Bitsafe</strong>.<br><br>Clique no botão abaixo para confirmar o novo endereço.",
        "Confirmar novo e-mail"
    );

    // Aplica nas coleções de autenticação
    var colecoes = ["Usuarios", "_superusers"];
    for (var i = 0; i < colecoes.length; i++) {
        try {
            var col = $app.findCollectionByNameOrId(colecoes[i]);

            // Para Usuarios: preserva explicitamente authRule e requireEmailVerification
            // para evitar que o save() os resete a valores padrão no bootstrap.
            var patch = {
                verificationTemplate: {
                    subject: "Confirme seu e-mail — {APP_NAME}",
                    body: tplVerification
                },
                resetPasswordTemplate: {
                    subject: "Redefinição de senha — {APP_NAME}",
                    body: tplReset
                },
                confirmEmailChangeTemplate: {
                    subject: "Confirme o novo e-mail — {APP_NAME}",
                    body: tplEmailChange
                }
            };
            if (colecoes[i] === "Usuarios") {
                patch.authRule = "";
                patch.requireEmailVerification = false;
            }

            unmarshal(patch, col);
            $app.save(col);
            console.log("[smtp_config] Templates aplicados em: " + colecoes[i]);
        } catch(err2) {
            console.log("[smtp_config] Erro templates " + colecoes[i] + ": " + String(err2));
        }
    }
});
