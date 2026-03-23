/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {

  const FUSOS = [
    // Brasil
    "America/Araguaina","America/Bahia","America/Belem","America/Boa_Vista",
    "America/Campo_Grande","America/Cuiaba","America/Fortaleza","America/Maceio",
    "America/Manaus","America/Noronha","America/Porto_Velho","America/Recife",
    "America/Rio_Branco","America/Santarem","America/Sao_Paulo",
    // América do Sul
    "America/Argentina/Buenos_Aires","America/Asuncion","America/Bogota",
    "America/Caracas","America/Guayaquil","America/La_Paz","America/Lima",
    "America/Montevideo","America/Paramaribo","America/Santiago",
    // América do Norte
    "America/Anchorage","America/Chicago","America/Denver","America/Halifax",
    "America/Los_Angeles","America/Mexico_City","America/Montreal",
    "America/New_York","America/Phoenix","America/Toronto","America/Vancouver",
    "Pacific/Honolulu",
    // Europa
    "Europe/Amsterdam","Europe/Athens","Europe/Berlin","Europe/Brussels",
    "Europe/Budapest","Europe/Copenhagen","Europe/Dublin","Europe/Helsinki",
    "Europe/Istanbul","Europe/Lisbon","Europe/London","Europe/Madrid",
    "Europe/Moscow","Europe/Oslo","Europe/Paris","Europe/Prague","Europe/Rome",
    "Europe/Stockholm","Europe/Vienna","Europe/Warsaw","Europe/Zurich",
    // Ásia / Oceania
    "Asia/Bangkok","Asia/Delhi","Asia/Dubai","Asia/Hong_Kong","Asia/Jakarta",
    "Asia/Jerusalem","Asia/Kolkata","Asia/Kuala_Lumpur","Asia/Seoul",
    "Asia/Shanghai","Asia/Singapore","Asia/Taipei","Asia/Tehran","Asia/Tokyo",
    "Australia/Melbourne","Australia/Sydney","Pacific/Auckland",
    // África
    "Africa/Cairo","Africa/Johannesburg","Africa/Lagos","Africa/Nairobi",
    // UTC
    "UTC"
  ];

  const PAISES = [
    "AE","AR","AT","AU","BE","BO","BR","CA","CH","CL","CN","CO","CZ","DE","DK",
    "DZ","EC","EG","ES","FI","FR","GB","GR","GY","HU","ID","IL","IN","IT","JP",
    "KR","MA","MX","MY","NG","NL","NO","NZ","PA","PE","PH","PL","PT","PY","RO",
    "RU","SA","SE","SG","SR","TH","TR","TW","US","UY","VE","VN","ZA"
  ];

  const CIDADES = [
    // A
    "Alagoinhas","Americana","Amsterdam","Anapolis","Ankara",
    "Aparecida de Goiania","Aracaju","Arapiraca","Araraquara","Araras",
    "Araucaria","Asuncion","Athens","Auckland",
    // B
    "Bangkok","Barcelona","Beijing","Belem","Belo Horizonte","Berlin",
    "Boa Vista","Bogota","Botucatu","Brasilia","Brussels","Budapest",
    "Buenos Aires",
    // C
    "Cachoeiro de Itapemirim","Cairo","Campina Grande","Campinas",
    "Campo Grande","Campo Largo","Cape Town","Caracas","Caruaru","Cascavel",
    "Caucaia","Caxias do Sul","Chicago","Contagem","Copenhagen","Criciuma",
    "Cuiaba","Curitiba",
    // D
    "Delhi","Denver","Diadema","Dubai","Dublin","Duque de Caxias",
    // E
    "Eunapolis",
    // F
    "Feira de Santana","Florianopolis","Fortaleza","Foz do Iguacu","Franca",
    "Frankfurt",
    // G
    "Goiania","Governador Valadares","Guarulhos","Guayaquil",
    // H
    "Helsinki","Hong Kong","Houston",
    // I
    "Ilheus","Imperatriz","Istanbul","Itabuna","Itajai","Itapetininga",
    "Itaquaquecetuba",
    // J
    "Jakarta","Jerusalem","Joao Pessoa","Johannesburg","Joinville",
    "Juazeiro do Norte","Jundiai","Juiz de Fora",
    // K
    "Kuala Lumpur",
    // L
    "La Paz","Lagos","Lima","Lisbon","London","Londrina","Los Angeles",
    "Luziania",
    // M
    "Macapa","Maceio","Madrid","Manaus","Manila","Marilia","Maua",
    "Maringa","Melbourne","Mexico City","Miami","Milan","Mogi das Cruzes",
    "Mogi Guacu","Montes Claros","Montevideo","Montreal","Moscow",
    "Mossoro","Mumbai","Munich",
    // N
    "Nairobi","Natal","New York","Niteroi","Nova Friburgo","Nova Iguacu",
    "Novo Hamburgo",
    // O
    "Olinda","Oslo","Osasco","Ottawa",
    // P
    "Palmas","Panama City","Paramaribo","Parauapebas","Paris","Passo Fundo",
    "Paulista","Petropolis","Piracicaba","Porto Alegre","Porto Velho","Prague",
    "Presidente Prudente",
    // Q
    "Quito",
    // R
    "Recife","Ribeirao Preto","Rio Branco","Rio de Janeiro","Rome",
    "Rondonopolis",
    // S
    "Salvador","Santa Maria","Santarem","Santiago","Santo Andre","Santos",
    "Sao Bernardo do Campo","Sao Carlos","Sao Goncalo","Sao Jose do Rio Preto",
    "Sao Jose dos Campos","Sao Luis","Sao Paulo","Sao Vicente","Seattle",
    "Seoul","Singapore","Sorocaba","Stockholm","Sumare","Sydney",
    // T
    "Taipei","Taubate","Tehran","Tel Aviv","Teresina","Tokyo","Toronto",
    // U
    "Uberaba","Uberlandia","Urucu",
    // V
    "Vancouver","Varzea Grande","Vienna","Vitoria","Vitoria da Conquista",
    // W
    "Warsaw","Wellington",
    // Z
    "Zurich"
  ];

  const configuracoes = new Collection({
    name: "configuracoes",
    type: "base",
    fields: [
      { type: "text",   name: "nome_empresa",        required: true,  max: 100 },
      { type: "select", name: "cidade",               required: false, maxSelect: 1, values: CIDADES },
      { type: "select", name: "pais",                 required: false, maxSelect: 1, values: PAISES },
      { type: "select", name: "fuso_horario",         required: false, maxSelect: 1, values: FUSOS },
      { type: "text",   name: "weather_api_key",      required: false, max: 200 },
      { type: "text",   name: "google_api_key",       required: false, max: 200 },
      { type: "text",   name: "google_calendar_id",   required: false, max: 300 },
      { type: "bool",   name: "modo_manutencao" },
      { type: "text",   name: "mensagem_manutencao",  required: false, max: 500 },
      { type: "bool",   name: "ticker_ativo" },
      { type: "text",   name: "ticker_texto",         required: false, max: 2000 }
    ],
    listRule:   "",
    viewRule:   "",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''"
  });

  return db.save(configuracoes);
}, (db) => {
  const col = db.findCollectionByNameOrId("configuracoes");
  return db.delete(col);
});
