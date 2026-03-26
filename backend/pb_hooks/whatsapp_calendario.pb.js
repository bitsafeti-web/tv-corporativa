/// <reference path="../pb_data/types.d.ts" />

/**
 * Lógica central de envio de notificações WhatsApp.
 * Retorna um objeto { enviados, ignorados, erros, mensagem } para log/resposta.
 */
function enviarNotificacoesWhatsApp() {
  const resultado = { enviados: [], ignorados: [], erros: [] };

  // 1. Configurações
  const configs = $app.findAllRecords("Configuracoes", $dbx.exp("1=1"), null);
  if (!configs || configs.length === 0) {
    throw new Error("Configurações não encontradas.");
  }
  const cfg = configs[0];
  const apiToken = cfg.get("api_token");
  if (!apiToken) {
    throw new Error("api_token não configurado em Configuracoes.");
  }

  // 2. Datas comemorativas ativas
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const todasDatas = $app.findAllRecords("DatasComemorativas", $dbx.exp("ativo = TRUE"), null);

  const datasProximas = todasDatas.filter(d => {
    const iso = d.get("data");
    if (!iso) return false;
    const dataEvento = new Date(iso.slice(0, 10));
    dataEvento.setHours(0, 0, 0, 0);
    const diffDias = Math.ceil((dataEvento.getTime() - hoje.getTime()) / 86_400_000);
    const ante = d.get("antecedencia_dias") || 7;
    return diffDias >= 0 && diffDias <= ante;
  });

  if (datasProximas.length === 0) {
    resultado.ignorados.push("Nenhuma data comemorativa dentro da janela de antecedência.");
    return resultado;
  }

  // 3. Usuários notificáveis
  const usuarios = $app.findAllRecords("Usuarios", $dbx.exp("whatsapp_notificar = TRUE"), null);
  const usuariosNotificaveis = usuarios.filter(u => {
    const num = u.get("whatsapp_numero");
    return num && String(num).trim().length > 0;
  });

  if (usuariosNotificaveis.length === 0) {
    resultado.ignorados.push("Nenhum usuário com whatsapp_notificar=true e número preenchido.");
    return resultado;
  }

  // 4. Montar mensagem
  const nomeEmpresa = cfg.get("nome_empresa") || "TV Corporativa";
  let blocos = "";

  for (const d of datasProximas) {
    const isoData    = d.get("data").slice(0, 10);
    const dataEvento = new Date(isoData);
    dataEvento.setHours(0, 0, 0, 0);
    const diffDias   = Math.ceil((dataEvento.getTime() - hoje.getTime()) / 86_400_000);
    const titulo     = d.get("titulo");
    const descricao  = d.get("descricao");

    const dataFormatada = dataEvento.toLocaleDateString("pt-BR", {
      day: "2-digit", month: "long", year: "numeric"
    });

    let urgencia;
    if      (diffDias === 0) urgencia = "🔴 *HOJE!*";
    else if (diffDias === 1) urgencia = "🟠 Amanhã";
    else if (diffDias <= 3)  urgencia = `🟡 Em ${diffDias} dias`;
    else                     urgencia = `🟢 Em ${diffDias} dias`;

    blocos += `┌─────────────────────\n`;
    blocos += `│ 🎉 *${titulo}*\n`;
    blocos += `│ 📆 ${dataFormatada}\n`;
    blocos += `│ ⏰ ${urgencia}\n`;
    if (descricao) blocos += `│ 📝 ${descricao}\n`;
    blocos += `└─────────────────────\n\n`;
  }

  const mensagem =
    `🏢 *${nomeEmpresa}*\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `📣 *Lembrete de Datas Comemorativas*\n\n` +
    blocos +
    `_Enviado automaticamente pelo sistema de TV Corporativa_ ✅`;

  resultado.mensagem = mensagem;

  // 5. Enviar para cada usuário
  for (const u of usuariosNotificaveis) {
    let numero = String(u.get("whatsapp_numero")).trim().replace(/\D/g, "");
    if (!numero.startsWith("55") && numero.length <= 11) {
      numero = "55" + numero;
    }
    const nome = u.get("nome") || u.get("name") || numero;

    try {
      const resp = $http.send({
        url:    "https://cloud.apidosistema.com/api/mensagem",
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          numero,
          id_conexao:     20,
          tipo:           "texto",
          conteudo:       mensagem,
          tipo_api:       1,
          historico_chat: false,
        }),
        timeout: 15,
      });

      if (resp.statusCode >= 200 && resp.statusCode < 300) {
        resultado.enviados.push({ nome, numero, status: resp.statusCode });
        console.log(`[WhatsApp] ✅ Enviado para ${nome} (${numero}) — ${resp.statusCode}`);
      } else {
        resultado.erros.push({ nome, numero, status: resp.statusCode, body: resp.raw });
        console.error(`[WhatsApp] ❌ Falha para ${nome} (${numero}) — ${resp.statusCode}: ${resp.raw}`);
      }
    } catch (err) {
      resultado.erros.push({ nome, numero, erro: String(err) });
      console.error(`[WhatsApp] ❌ Erro ao enviar para ${nome} (${numero}):`, err);
    }
  }

  return resultado;
}

// ---------------------------------------------------------------------------
// Cron diário às 08:00
// ---------------------------------------------------------------------------
cronAdd("notificar-whatsapp-calendario", "0 8 * * *", () => {
  try {
    const r = enviarNotificacoesWhatsApp();
    console.log(`[WhatsApp] Cron finalizado — enviados: ${r.enviados.length}, erros: ${r.erros.length}`);
  } catch (err) {
    console.error("[WhatsApp] Erro geral no cron:", err);
  }
});

// ---------------------------------------------------------------------------
// Rota de teste: POST /api/whatsapp/testar  (requer admin autenticado)
// ---------------------------------------------------------------------------
routerAdd("POST", "/api/whatsapp/testar", (e) => {
  // Exige token de admin
  e.app.onServe().bind(null);
  const info = e.requestInfo();
  const auth = info.auth;
  if (!auth || auth.collection().name !== "_superusers") {
    return e.json(403, { error: "Acesso negado. Faça login como admin." });
  }

  try {
    const r = enviarNotificacoesWhatsApp();
    return e.json(200, {
      ok:        true,
      enviados:  r.enviados,
      ignorados: r.ignorados,
      erros:     r.erros,
      mensagem:  r.mensagem || null,
    });
  } catch (err) {
    return e.json(500, { ok: false, error: String(err) });
  }
});
