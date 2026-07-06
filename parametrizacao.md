# Parametrizacao da Plataforma Ponto Digital

Este documento define os padroes que devem ser seguidos na criação de novas telas, fluxos, APIs e componentes da plataforma.

Use este arquivo junto com `design.md`. O `design.md` descreve a identidade visual; este arquivo descreve a aplicação pratica dentro do projeto.

## 1. Stack e Estrutura

- Framework: Next.js App Router.
- Linguagem: TypeScript.
- Estilizacao: Tailwind CSS com classes utilitarias.
- Autenticacao: Auth.js/NextAuth em `src/lib/auth.ts`.
- Banco: PostgreSQL com Prisma.
- ORM/schema: `prisma/schema.prisma`.
- Componentes base: `src/components/ui`.
- Layout autenticado: `src/components/layout/DashboardShell.tsx`.
- Layout mobile/webview Android: mesmas telas web, servidas pelo Next.js.
- App Android: Capacitor.

Novas telas internas devem ficar em `src/app/dashboard/...`.

Novas telas do painel da plataforma devem ficar em `src/app/admin/(protected)/...`.

Novas APIs do tenant devem ficar em `src/app/api/...`.

Novas APIs exclusivas do painel da plataforma devem ficar em `src/app/admin/api/...`.

## 2. Ambientes e Endereços

O desenvolvimento local usa porta fixa `3000`.

Scripts principais:

```json
{
  "dev": "next dev --webpack --hostname 0.0.0.0 --port 3000",
  "dev:local": "next dev --webpack --port 3000",
  "build": "next build",
  "android:sync": "cap sync android",
  "android:build:debug": "cd android && gradlew.bat assembleDebug"
}
```

Variáveis esperadas:

```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="..."
NEXTAUTH_URL="http://IP_DA_MAQUINA:3000"
AUTH_URL="http://IP_DA_MAQUINA:3000"
AUTH_TRUST_HOST=true
NEXT_PUBLIC_BITSAFE_TENANT_DOMAIN=ponto.bitsafeti.com.br
NEXT_PUBLIC_DEV_TENANT_BASE_DOMAIN=localhost:3000
NEXT_PUBLIC_TENANT_DNS_RECORD_TYPE=CNAME
NEXT_PUBLIC_TENANT_DNS_TARGET=ponto.bitsafeti.com.br
NEXT_PUBLIC_TENANT_DNS_FALLBACK_IP=177.104.160.100
```

Para teste no telefone, `AUTH_URL`, `NEXTAUTH_URL` e `.env.android` devem apontar para o IP atual da maquina na rede.

Para teste local de tenants no navegador, cada empresa deve ser acessada pelo slug em `http://<slug>.localhost:3000/login`.

O `next.config.ts` deve liberar o host de desenvolvimento em `allowedDevOrigins`.

## 3. Perfis de Acesso

Existem quatro contextos de acesso:

| Contexto | Uso |
| --- | --- |
| PlatformAdmin | Admin da plataforma, acessa `/admin` |
| ADMIN | Admin da empresa, acessa todas as áreas do tenant |
| MANAGER | Gestor, acessa apenas dados da própria equipe |
| EMPLOYEE | Funcionário, acessa ponto, histórico e dados pessoais |

Labels padrão:

```ts
const roleLabels = {
  ADMIN: "Administrador",
  MANAGER: "Gestor",
  EMPLOYEE: "Funcionario",
}
```

Regras:

- `PlatformAdmin` não e usuário de tenant.
- `ADMIN` cria equipes, funcionários, gestores e admins da própria empresa.
- `MANAGER` visualiza e gerencia apenas a equipe vinculada.
- `EMPLOYEE` bate ponto e visualiza seus proprios dados.
- Toda API protegida deve validar sessão e perfil antes de consultar ou alterar dados.
- Sempre filtrar dados por `companyId` do usuário logado.

## 4. Regras de Equipe

Equipes pertencem a uma empresa.

Modelo principal: `Team`.

Regras:

- Apenas `ADMIN` cria, edita e remove equipes.
- Toda equipe pode ter um gestor responsavel.
- O select de gestor deve listar apenas usuários com perfil `MANAGER`.
- O vínculo de funcionários deve listar apenas usuários com perfil `EMPLOYEE`.
- Um gestor deve enxergar somente relatórios e dados da equipe vinculada.
- Usuário com perfil `MANAGER` sem equipe vinculada deve ter acesso restrito.
- No cadastro de usuário, o campo equipe é obrigatório.

Use helpers de escopo em `src/lib/team-scope.ts` quando uma consulta depender do perfil do gestor.

Padrão:

```ts
import { userTeamScope } from "@/lib/team-scope"

const where = {
  companyId: session.user.companyId,
  ...userTeamScope(session),
}
```

## 5. Navegacao Principal

Menu lateral do tenant:

| Rota | Label | Perfis |
| --- | --- | --- |
| `/dashboard` | Dashboard | Todos |
| `/dashboard/ponto` | Bater Ponto | EMPLOYEE |
| `/dashboard/meu-ponto` | Meu Ponto | EMPLOYEE |
| `/dashboard/funcionarios` | Cadastros | ADMIN, MANAGER |
| `/dashboard/equipes` | Equipes | ADMIN |
| `/dashboard/ajustes` | Ajustes de Ponto | ADMIN, MANAGER |
| `/dashboard/relatorios` | Relatórios | ADMIN, MANAGER |
| `/dashboard/feriados` | Feriados | ADMIN |
| `/dashboard/ferias-licencas` | Férias e Licenças | ADMIN |
| `/dashboard/empresa` | Empresa | ADMIN |

Regras:

- O menu lateral deve ser controlado por perfil.
- O botão de recolher/expandir fica no header.
- O logout fica no footer do side menu no desktop.
- Configurações ficam no dropdown do usuário no header.
- Em mobile, o menu lateral vira drawer.

## 6. Anatomia de Tela

Toda tela interna deve seguir a estrutura:

1. Header visual do sistema já vem do `DashboardShell`.
2. Conteudo limitado por `max-w-6xl mx-auto`.
3. Titulo da pagina com `text-2xl font-bold text-[#1E2026]`.
4. Subtitulo curto com `text-sm text-[#848E9C]`.
5. Acoes principais no topo direito quando houver.
6. Cards, filtros e grids abaixo.

Exemplo:

```tsx
<div className="space-y-6">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 className="text-2xl font-bold text-[#1E2026]">Titulo</h1>
      <p className="mt-1 text-sm text-[#848E9C]">Descricao curta da tela</p>
    </div>
    <Button>Acao principal</Button>
  </div>

  <Card>
    <CardHeader>
      <CardTitle>Secao</CardTitle>
    </CardHeader>
    <CardContent>{/* conteudo */}</CardContent>
  </Card>
</div>
```

Evite landing pages dentro do sistema. Telas administrativas devem ser densas, claras e operacionais.

## 7. Identidade Visual

Paleta padrão:

| Token | Cor | Uso |
| --- | --- | --- |
| Primary | `#BD2124` | CTA, links importantes, icones ativos |
| Primary Hover | `#880F07` | Hover e estados pressionados |
| Primary Active | `#3A0906` | Pressionado e surfaces escuras |
| Ink | `#1E2026` | Titulos e texto principal |
| Body | `#32313A` | Texto comum |
| Muted | `#848E9C` | Texto auxiliar |
| Border | `#E6E8EA` | Bordas |
| Page | `#F5F5F5` | Fundo geral |
| Surface | `#FFFFFF` | Cards, inputs e modais |
| Success | `#0ECB81` | Sucesso e presenca |
| Warning | `#D0980B` | Pendencias |
| Danger | `#BD2124` | Erros e ações destrutivas |

Regras:

- Use vermelho com moderacao em dashboards.
- Verde e apenas sucesso/status positivo.
- Amarelo e apenas alerta real.
- Não usar roxo, laranja ou gradientes decorativos como tema.
- Não usar cards dentro de cards.
- Cards administrativos devem ter raio discreto.

## 8. Componentes Base

Sempre que possível, usar componentes já existentes:

- `Button` em `src/components/ui/button.tsx`.
- `Input` em `src/components/ui/input.tsx`.
- `PasswordInput` em `src/components/ui/password-input.tsx`.
- `Label` em `src/components/ui/label.tsx`.
- `Card`, `CardHeader`, `CardTitle`, `CardContent` em `src/components/ui/card.tsx`.
- `Badge` em `src/components/ui/badge.tsx`.
- `toast` em `src/components/ui/toaster.tsx`.

Botoes:

| Variante | Uso |
| --- | --- |
| `default` | Acao principal |
| `outline` | Acao secundaria |
| `secondary` | Acao neutra |
| `ghost` | Icones e menus |
| `destructive` | Remover, reprovar, cancelar |
| `success` | Aprovar, confirmar |
| `warning` | Pendencia ou alerta |

Use icones de `lucide-react` em botoes de ação, filtros, menus e estados vazios.

## 9. Formulários

Campos obrigatórios para cadastro de usuário:

- Nome.
- Equipe.
- Cargo.
- CPF.
- Email.
- Telefone.
- Data de nascimento.
- Etnia.
- Estado civil.
- Escolaridade.
- Endereço completo.
- Perfil de acesso.
- Status.

Mascaras disponiveis:

- `maskCpf`.
- `maskPis`.
- `maskPhone`.
- `maskDate`.

Arquivo: `src/lib/input-masks.ts`.

Regras:

- Usar `Label` para todo campo.
- Usar `Input` para campos comuns.
- Usar `PasswordInput` para todo campo de senha.
- Select deve usar altura `h-10` ou `h-9`, borda `#E6E8EA`, foco `#BD2124`.
- Campos obrigatórios devem ter validação no front e na API.
- Mensagens de erro devem ser claras e orientadas a correcao.
- Ao salvar, usar estado `saving/loading` e desabilitar o botão.
- Apos sucesso, usar toast ou mensagem visual.

Padrão de select:

```tsx
<select className="flex h-10 w-full rounded-md border border-[#E6E8EA] bg-white px-3 py-2 text-sm text-[#1E2026] focus:outline-none focus:ring-2 focus:ring-[#BD2124]">
  <option value="">Selecione</option>
</select>
```

## 10. Grids e Tabelas

Padrão visual:

- Container com `overflow-x-auto`.
- Tabela com `min-w-[...]` quando necessário.
- Header com fundo `#FAFAFB`.
- Cabecalho em `text-[11px] font-semibold uppercase text-[#848E9C]`.
- Linhas com `border-b border-[#E6E8EA]`.
- Hover discreto `hover:bg-[#FAFAFB]`.
- Dados numericos, horas e IPs devem usar `font-mono`.

Regras:

- Não truncar informações importantes como IP completo.
- Em mobile, permitir scroll horizontal quando a tabela for larga.
- Status deve usar `Badge`.
- Coluna de ações deve ficar no final.
- Acoes destrutivas sempre exigem confirmacao.
- Exclusão de funcionário exige campo obrigatório de motivo.

## 11. Autenticacao

Providers em `src/lib/auth.ts`:

- `credentials`: usuários de tenant.
- `platform`: admins da plataforma.
- `impersonate`: acesso do admin da plataforma a uma empresa.

Padrão de login no cliente:

```tsx
const result = await signIn("credentials", {
  email,
  password,
  redirect: false,
  callbackUrl: "/dashboard",
})
```

Use helpers em `src/lib/client-auth.ts`:

- `signInReturnedError`.
- `signInRedirectUrl`.

Depois de login bem-sucedido, prefira `window.location.assign(...)` com a URL retornada pelo Auth.js para evitar corrida de sessão.

## 12. APIs

Toda rota de API deve seguir:

1. Obter sessão com `auth()`.
2. Validar perfil.
3. Validar payload com `zod`.
4. Filtrar por `companyId`.
5. Aplicar escopo de equipe quando o usuário for `MANAGER`.
6. Retornar JSON com status adequado.
7. Registrar ação administrativa quando alterar dados sensiveis.

Exemplo:

```ts
const session = await auth()
if (!session || !["ADMIN", "MANAGER"].includes(session.user.role)) {
  return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
}
```

Validacao:

```ts
const schema = z.object({
  name: z.string().min(1),
})

const parsed = schema.safeParse(await request.json())
if (!parsed.success) {
  return NextResponse.json({ error: "Dados invalidos" }, { status: 400 })
}
```

## 13. Auditoria e Notificacoes

Acoes administrativas devem ser registradas em `AdminActionLog`.

Usar `src/lib/admin-actions.ts`.

Registrar, no mínimo:

- Criação, edição e exclusão de usuário.
- Criação e edição de equipe.
- Alteracao de perfil.
- Alteracao de status.
- Exclusão com motivo.
- Aprovacao ou recusa de ajuste.

O header consome `/api/admin-actions` para notificacoes.

## 14. Ponto, Localizacao e IP

Modelo principal: `TimeRecord`.

Campos importantes:

- `type`.
- `timestamp`.
- `latitude`.
- `longitude`.
- `ipAddress`.
- `address`.
- `isManual`.
- `userId`.
- `companyId`.

Tipos:

| Tipo | Label sugerido |
| --- | --- |
| `CLOCK_IN` | 1a Entrada |
| `BREAK_START` | 1a Saída |
| `BREAK_END` | 2a Entrada |
| `CLOCK_OUT` | 2a Saída |

Regras:

- IP deve ser exibido completo.
- IP deve usar `font-mono` e permitir quebra controlada com `break-all` quando necessário.
- Localizacao deve informar endereço capturado e coordenadas quando for útil.
- O endereço via navegador pode variar conforme GPS, permissão, rede e provedor.
- Para menor margem de erro, o app mobile deve solicitar permissão precisa de localização no Android/iOS.
- Ajustes de ponto podem receber comprovante em arquivo privado de ate 10 MB.
- O comprovante de ajuste só pode ser acessado pelo funcionário solicitante, ADMIN da empresa ou MANAGER da equipe.

## 15. Responsividade

Breakpoints usados:

- Mobile: padrão sem prefixo.
- `sm`: ajustes de cards e filtros.
- `md`: layout com side menu fixo.
- `lg`: grids com mais colunas.

Regras:

- Conteudo deve funcionar primeiro no mobile.
- Cards numericos no dashboard mobile podem ficar em linha, mas precisam preservar leitura.
- Ícone deve ficar a esquerda e dados a direita nos cards compactos.
- Tabelas largas devem rolar horizontalmente.
- Textos dentro de botoes não podem quebrar layout.
- Evitar fontes baseadas em viewport.

## 16. Mobile Android e Capacitor

O app mobile usa a aplicação web via Capacitor.

Regras:

- O endereço do servidor usado pelo mobile fica em `.env.android`.
- Apos mudar IP ou assets do app, rodar `npm run android:sync`.
- Para gerar APK de teste, rodar `npm run android:build:debug`.
- Ícone do app deve seguir o favicon/castelinho da BitSafe.
- Login no mobile deve usar o mesmo fluxo de Auth.js da plataforma web.
- Campos de senha no mobile devem usar `PasswordInput`.
- O reCAPTCHA pode ser dispensado somente em `development`; em produção deve ser validado no cliente e na API.

## 17. Branding de Tenant

Empresas podem ter:

- `logoUrl`.
- `faviconUrl`.
- `loginImageUrl`.
- `loginBackgroundColor`.
- `brandColor`.
- `loginPhrase`.
- `loginSubtitle`.
- `loginPhraseFontSize`.
- `loginSubtitleFontSize`.
- `customDomain`.
- `usesOfficialDomain`.
- `slug`.
- `plan`.
- `active`.

Regras:

- O produto opera com um pacote atual unico. Valores legados de `plan` podem existir no banco, mas nao definem permissao comercial.
- Todo cliente pode acessar pelo dominio da plataforma com slug, por exemplo `ponto.bitsafeti.com.br/cliente`.
- Todo cliente pode configurar dominio personalizado em `customDomain`, alem da personalizacao visual.
- Exemplo de acesso local em desenvolvimento: `http://cliente.localhost:3000/login`.
- Fallback da marca e BitSafe.
- Somente uma empresa, a BitSafe, pode usar `usesOfficialDomain` e o domínio configurado em `NEXT_PUBLIC_BITSAFE_TENANT_DOMAIN`.
- O ADMIN da plataforma pode editar o `slug` do tenant; o valor deve ser único, conter apenas letras minusculas, números e hifens, e pode exigir novo login de sessoes já abertas.
- O host da requisição deve corresponder ao tenant autenticado; credenciais não podem ser usadas em domínio de outra empresa.
- O painel deve informar o registro `A` ou `CNAME` definido por `NEXT_PUBLIC_TENANT_DNS_RECORD_TYPE` e `NEXT_PUBLIC_TENANT_DNS_TARGET` quando houver dominio personalizado.
- Para a publicação atual, orientar `CNAME` para `ponto.bitsafeti.com.br`; se o provedor não aceitar, orientar registro `A` para `177.104.160.100`.
- Domínio próprio exige DNS configurado e publicação HTTPS encaminhando o host para a aplicação.
- Empresa inativa não deve permitir login de seus usuários.

Tamanhos indicados para imagens de personalização:

| Campo | Tamanho indicado | Observacao |
| --- | --- | --- |
| `logoUrl` | `500 x 180 px` | Preferir PNG/SVG/WEBP com fundo transparente. |
| `faviconUrl` | `512 x 512 px` | Sempre quadrado para favicon, PWA e app. |
| `loginBackgroundColor` | Cor hexadecimal, ex. `#BD2124` | Preenche o quadro esquerdo do login quando o modo escolhido for cor sólida. |
| `loginImageUrl` | `1152 x 1080 px` | Opcional; cobre o quadro esquerdo do login quando o modo escolhido for imagem. |
| `loginPhraseFontSize` | `24` a `64` px | Controla o tamanho do titulo principal do quadro esquerdo do login. |
| `loginSubtitleFontSize` | `12` a `32` px | Controla o tamanho do texto de apoio do quadro esquerdo do login. |

No login, o quadro visual esquerdo pode usar uma cor estática configuravel ou uma imagem configurada. Não usar gradiente nesse quadro.

## 19. E-mails Transacionais

Regras:

- E-mails de primeira configuração de senha e reenvio de acesso devem usar a identidade visual do tenant.
- Quando houver `logoUrl`, o cabeçalho do e-mail deve exibir a logo da empresa; caso contrário, usar a inicial da empresa com a cor da marca.
- A cor principal do e-mail deve respeitar `brandColor`, com fallback BitSafe.
- Links de configuração de senha devem apontar para o domínio de acesso do tenant em produção.
- Todo novo e-mail transacional deve reutilizar o mesmo padrão visual e texto alternativo.

## 20. Estados de Interface

Toda tela com dados remotos deve tratar:

- Carregando.
- Lista vazia.
- Erro de busca.
- Salvando.
- Sucesso.
- Falha de validação.
- Falha de permissão.

Padroes:

- Loading simples: texto `Carregando...` com cor `#848E9C` ou ícone `Loader2`.
- Empty state: ícone lucide + texto curto.
- Erro: `toast` destrutivo ou bloco vermelho claro.
- Sucesso: `toast` success ou bloco verde claro.

## 19. Datas, Horas e Numeros

Regras:

- Datas visiveis em `pt-BR`.
- Horas em formato `HH:mm`.
- Duracoes em formato legivel, exemplo `08:00`.
- Campos de hora e IP devem usar `font-mono`.
- Evitar cálculos de mês fixos; sempre usar mês atual quando a tela falar de resumo atual.

## 20. Checklist Para Criar Nova Tela

Antes de finalizar qualquer tela nova:

- A rota está no lugar correto?
- A permissão está validada no front e na API?
- Os dados estão filtrados por `companyId`?
- Gestor está limitado a própria equipe?
- Usa componentes base (`Button`, `Input`, `Card`, `Badge`)?
- Usa cores da plataforma?
- Tem loading, empty state e erro?
- Funciona em mobile?
- Tabelas largas tem scroll horizontal?
- Formulários tem validação front e API?
- Acoes destrutivas tem confirmacao?
- Alteracoes sensiveis registram auditoria?
- `npx tsc --noEmit`, `npx eslint` e `npm run build` passam?

## 21. Checklist Para Criar Nova API

- Importar `auth`.
- Validar sessão.
- Validar perfil.
- Validar entrada com `zod`.
- Usar `companyId` da sessão.
- Aplicar escopo de equipe se for rota de gestor.
- Usar Prisma com `select`/`include` consciente.
- Retornar status HTTP correto.
- Não vazar dados de outra empresa.
- Registrar auditoria quando alterar dados.

## 22. Checklist Para Alterar Mobile

- Confirmar `AUTH_URL`, `NEXTAUTH_URL` e `.env.android`.
- Confirmar que o telefone acessa o IP da maquina na porta `3000`.
- Rodar `npm run android:sync` apos alterar assets/config mobile.
- Testar login, senha visivel, dashboard e bater ponto.
- Validar permissão de localização precisa no aparelho.
- Gerar APK debug apenas depois do fluxo web estar funcionando.
