/// <reference path="../pb_data/types.d.ts" />

// ═══════════════════════════════════════════════════════════════════
// SHA-1  (pure JS, RFC 3174)
// ═══════════════════════════════════════════════════════════════════
function rotl32(n, b) { return ((n << b) | (n >>> (32 - b))) >>> 0; }

function sha1(data) {
    var msg = Array.from(data);
    var origLen = msg.length;
    msg.push(0x80);
    while (msg.length % 64 !== 56) msg.push(0);
    var bits = origLen * 8;
    msg.push(0, 0, 0, 0,
        (bits >>> 24) & 0xff, (bits >>> 16) & 0xff,
        (bits >>>  8) & 0xff,  bits & 0xff);

    var h0 = 0x67452301, h1 = 0xEFCDAB89, h2 = 0x98BADCFE,
        h3 = 0x10325476, h4 = 0xC3D2E1F0;

    for (var i = 0; i < msg.length; i += 64) {
        var w = new Array(80);
        for (var j = 0; j < 16; j++) {
            w[j] = ((msg[i+j*4]<<24)|(msg[i+j*4+1]<<16)|
                    (msg[i+j*4+2]<<8)|msg[i+j*4+3]) >>> 0;
        }
        for (var j = 16; j < 80; j++) {
            w[j] = rotl32(w[j-3]^w[j-8]^w[j-14]^w[j-16], 1);
        }
        var a=h0, b=h1, c=h2, d=h3, e=h4;
        for (var j = 0; j < 80; j++) {
            var f, k;
            if      (j < 20) { f=(b&c)|(~b&d);          k=0x5A827999; }
            else if (j < 40) { f=b^c^d;                 k=0x6ED9EBA1; }
            else if (j < 60) { f=(b&c)|(b&d)|(c&d);    k=0x8F1BBCDC; }
            else             { f=b^c^d;                 k=0xCA62C1D6; }
            var t=(rotl32(a,5)+f+e+k+w[j])>>>0;
            e=d; d=c; c=rotl32(b,30); b=a; a=t;
        }
        h0=(h0+a)>>>0; h1=(h1+b)>>>0; h2=(h2+c)>>>0;
        h3=(h3+d)>>>0; h4=(h4+e)>>>0;
    }
    var r=[];
    for (var idx=0; idx<[h0,h1,h2,h3,h4].length; idx++) {
        var h=[h0,h1,h2,h3,h4][idx];
        r.push((h>>>24)&0xff,(h>>>16)&0xff,(h>>>8)&0xff,h&0xff);
    }
    return r;
}

// ═══════════════════════════════════════════════════════════════════
// HMAC-SHA1
// ═══════════════════════════════════════════════════════════════════
function hmacSha1(key, data) {
    var k = Array.from(key);
    if (k.length > 64) k = sha1(k);
    while (k.length < 64) k.push(0);
    var opad = k.map(function(b) { return b ^ 0x5c; });
    var ipad = k.map(function(b) { return b ^ 0x36; });
    return sha1(opad.concat(sha1(ipad.concat(data))));
}

// ═══════════════════════════════════════════════════════════════════
// Base32  (RFC 4648)
// ═══════════════════════════════════════════════════════════════════
var B32_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(str) {
    str = str.toUpperCase().replace(/=+$/, '').replace(/\s/g, '');
    var bytes = [], bits = 0, val = 0;
    for (var i = 0; i < str.length; i++) {
        var idx = B32_ALPHA.indexOf(str[i]);
        if (idx < 0) continue;
        val = (val << 5) | idx;
        bits += 5;
        if (bits >= 8) { bits -= 8; bytes.push((val >>> bits) & 0xff); }
    }
    return bytes;
}

function base32Encode(bytes) {
    var result = '', bits = 0, val = 0;
    for (var i = 0; i < bytes.length; i++) {
        val = (val << 8) | bytes[i];
        bits += 8;
        while (bits >= 5) { bits -= 5; result += B32_ALPHA[(val >>> bits) & 0x1f]; }
    }
    if (bits > 0) result += B32_ALPHA[(val << (5 - bits)) & 0x1f];
    return result;
}

// ═══════════════════════════════════════════════════════════════════
// TOTP  (RFC 6238)
// ═══════════════════════════════════════════════════════════════════
function computeTOTP(secret, counter) {
    var key = base32Decode(secret);
    var msg = [0, 0, 0, 0,
        (counter >>> 24) & 0xff, (counter >>> 16) & 0xff,
        (counter >>>  8) & 0xff,  counter & 0xff];
    var h   = hmacSha1(key, msg);
    var off  = h[19] & 0xf;
    var code = ((h[off]&0x7f)<<24)|((h[off+1]&0xff)<<16)|
                 ((h[off+2]&0xff)<<8)|(h[off+3]&0xff);
    return (code % 1000000).toString().padStart(6, '0');
}

function verifyTOTP(secret, code) {
    var counter = Math.floor(Date.now() / 1000 / 30);
    var input   = String(code).replace(/\s/g, '');
    for (var i = -1; i <= 1; i++) {
        if (computeTOTP(secret, counter + i) === input) return true;
    }
    return false;
}
globalThis._verifyTOTP = verifyTOTP;

function newTOTPSecret() {
    var rand  = $security.randomString(25);
    var bytes = [];
    for (var i = 0; i < 20; i++) bytes.push(rand.charCodeAt(i) & 0xff);
    return base32Encode(bytes);
}
globalThis._newTOTPSecret = newTOTPSecret;

// ═══════════════════════════════════════════════════════════════════
// Helpers de persistência
// ═══════════════════════════════════════════════════════════════════
function getTotpData(userId) {
    try {
        var rec = $app.findFirstRecordByFilter(
            "totp_secrets", "user_id = {:u}", { u: userId }
        );
        return {
            id:      rec.id,
            secret:  rec.get("secret")  || "",
            pending: rec.get("pending") || ""
        };
    } catch (_) {
        return { id: null, secret: "", pending: "" };
    }
}

function saveTotpData(userId, secret, pending, existingId) {
    var rec;
    if (existingId) {
        rec = $app.findRecordById("totp_secrets", existingId);
    } else {
        var col = $app.findCollectionByNameOrId("totp_secrets");
        rec = new Record(col);
        rec.set("user_id", userId);
    }
    rec.set("secret",  secret  || "");
    rec.set("pending", pending || "");
    $app.save(rec);
}

// ═══════════════════════════════════════════════════════════════════
// Rota: GET /api/totp/setup
// ═══════════════════════════════════════════════════════════════════
routerAdd("GET", "/api/totp/setup", function(e) {
    try {
        console.log("[totp/setup] start");
        var info = e.requestInfo();
        console.log("[totp/setup] info ok");
        var authRecord = info.auth;
        console.log("[totp/setup] auth=" + (authRecord ? authRecord.id : "null"));
        if (!authRecord) return e.json(401, { message: "Autenticação necessária." });

        // inline getTotpData
        var _setupSecret = "", _setupPending = "", _setupId = null;
        try {
            var _setupRec = $app.findFirstRecordByFilter("totp_secrets", "user_id = {:u}", { u: authRecord.id });
            _setupSecret  = _setupRec.get("secret")  || "";
            _setupPending = _setupRec.get("pending") || "";
            _setupId      = _setupRec.id;
            console.log("[totp/setup] totp_secrets found id=" + _setupId);
        } catch (e2) {
            console.log("[totp/setup] totp_secrets not found: " + String(e2));
        }

        if (_setupSecret) {
            return e.json(200, { configured: true });
        }

        var newSecret = globalThis._newTOTPSecret();
        // inline saveTotpData
        var _setupSaveRec;
        if (_setupId) {
            _setupSaveRec = $app.findRecordById("totp_secrets", _setupId);
        } else {
            console.log("[totp/setup] finding collection totp_secrets");
            var _setupCol = $app.findCollectionByNameOrId("totp_secrets");
            console.log("[totp/setup] collection ok");
            _setupSaveRec = new Record(_setupCol);
            _setupSaveRec.set("user_id", authRecord.id);
        }
        _setupSaveRec.set("secret",  "");
        _setupSaveRec.set("pending", newSecret);
        $app.save(_setupSaveRec);

        var email  = authRecord.get("email");
        var issuer = "Bitsafe TV";
        var uri    =
            "otpauth://totp/" +
            encodeURIComponent(issuer) + ":" + encodeURIComponent(email) +
            "?secret="  + newSecret +
            "&issuer="  + encodeURIComponent(issuer) +
            "&algorithm=SHA1&digits=6&period=30";

        return e.json(200, { configured: false, uri: uri, secret: newSecret });
    } catch (outerErr) {
        console.log("[totp/setup] outer error: " + String(outerErr));
        return e.json(500, { message: "Erro: " + String(outerErr) });
    }
});

// ═══════════════════════════════════════════════════════════════════
// Rota: POST /api/totp/confirm
// ═══════════════════════════════════════════════════════════════════
routerAdd("POST", "/api/totp/confirm", function(e) {
    var authRecord = e.requestInfo().auth;
    if (!authRecord) throw new UnauthorizedError();

    var body = JSON.parse(toString(e.request.body) || '{}');
    var code = String(body["code"] || "").trim();

    // inline getTotpData
    var _confPending = "", _confSecret = "", _confId = null;
    try {
        var _confRec = $app.findFirstRecordByFilter("totp_secrets", "user_id = {:u}", { u: authRecord.id });
        _confPending = _confRec.get("pending") || "";
        _confSecret  = _confRec.get("secret")  || "";
        _confId      = _confRec.id;
    } catch (_) {}

    if (!_confPending) {
        throw new BadRequestError("Nenhum setup pendente. Acesse /api/totp/setup primeiro.");
    }
    if (!globalThis._verifyTOTP(_confPending, code)) {
        throw new BadRequestError("Código inválido. Verifique o app autenticador.");
    }

    // inline saveTotpData
    var _confSaveRec;
    if (_confId) {
        _confSaveRec = $app.findRecordById("totp_secrets", _confId);
    } else {
        var _confCol = $app.findCollectionByNameOrId("totp_secrets");
        _confSaveRec = new Record(_confCol);
        _confSaveRec.set("user_id", authRecord.id);
    }
    _confSaveRec.set("secret",  _confPending);
    _confSaveRec.set("pending", "");
    $app.save(_confSaveRec);

    return e.json(200, { success: true });
});

// ═══════════════════════════════════════════════════════════════════
// Rota: DELETE /api/totp/remove
// ═══════════════════════════════════════════════════════════════════
routerAdd("DELETE", "/api/totp/remove", function(e) {
    var authRecord = e.requestInfo().auth;
    if (!authRecord) throw new UnauthorizedError();

    var body = JSON.parse(toString(e.request.body) || '{}');
    var code = String(body["code"] || "").trim();

    // inline getTotpData
    var _remSecret = "", _remId = null;
    try {
        var _remRec = $app.findFirstRecordByFilter("totp_secrets", "user_id = {:u}", { u: authRecord.id });
        _remSecret  = _remRec.get("secret") || "";
        _remId      = _remRec.id;
    } catch (_) {}

    if (!_remSecret) return e.json(200, { success: true });

    if (!globalThis._verifyTOTP(_remSecret, code)) {
        throw new BadRequestError("Código inválido.");
    }

    // inline saveTotpData
    var _remSaveRec = $app.findRecordById("totp_secrets", _remId);
    _remSaveRec.set("secret",  "");
    _remSaveRec.set("pending", "");
    $app.save(_remSaveRec);

    return e.json(200, { success: true });
});

// ═══════════════════════════════════════════════════════════════════
// Rota: POST /api/totp/auth
// ═══════════════════════════════════════════════════════════════════
routerAdd("POST", "/api/totp/auth", function(e) {
    try {
        var body           = JSON.parse(toString(e.request.body) || '{}');
        var email          = String(body["email"]           || "").trim();
        var password       = String(body["password"]        || "").trim();
        var totpCode       = String(body["totp_code"]       || "").trim();
        var recaptchaToken = String(body["recaptcha_token"] || "").trim();
        var recaptchaSecret = "";
        var recaptchaBypass = false;
        try {
            recaptchaSecret = $os.getenv("RECAPTCHA_SECRET_KEY") || "";
            recaptchaBypass = $os.getenv("RECAPTCHA_BYPASS") === "true";
        } catch (_) {}

        if (!email || !password) {
            return e.json(400, { message: "E-mail e senha são obrigatórios." });
        }

        // inline reCAPTCHA v3 — evita problemas de escopo no runtime goja
        var _rcOk = false;
        if (recaptchaBypass) {
            _rcOk = true;
        } else if (recaptchaSecret && recaptchaToken && recaptchaToken.length >= 10) {
            try {
                var _rcResp = $http.send({
                    url: "https://www.google.com/recaptcha/api/siteverify",
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: "secret=" + encodeURIComponent(recaptchaSecret) + "&response=" + encodeURIComponent(recaptchaToken)
                });
                if (_rcResp.statusCode === 200) {
                    var _rcData = JSON.parse(_rcResp.raw);
                    if (!_rcData.success) {
                        _rcOk = false;
                    } else {
                        var _rcScore = typeof _rcData.score === 'number' ? _rcData.score : 1.0;
                        _rcOk = _rcScore >= 0.5;
                    }
                }
            } catch (_rcErr) {
                console.log("[recaptcha] excecao: " + String(_rcErr) + " - bloqueando");
            }
        } else {
            _rcOk = false;
        }
        if (!_rcOk) {
            return e.json(400, { message: "Verificação de segurança falhou. Recarregue a página e tente novamente." });
        }

        var record;
        try {
            record = $app.findAuthRecordByEmail("_superusers", email);
        } catch (_) {
            return e.json(401, { message: "Credenciais inválidas." });
        }

        if (!record.validatePassword(password)) {
            return e.json(401, { message: "Credenciais inválidas." });
        }

        var totpSecret = "";
        try {
            var totpRec = $app.findFirstRecordByFilter(
                "totp_secrets", "user_id = {:u}", { u: record.id }
            );
            totpSecret = totpRec.get("secret") || "";
        } catch (_) { /* sem TOTP configurado */ }

        if (totpSecret) {
            if (!totpCode) {
                return e.json(400, {
                    message: "Codigo 2FA obrigatorio.",
                    requires_totp: true
                });
            }
            if (!globalThis._verifyTOTP(totpSecret, totpCode)) {
                return e.json(401, {
                    message: "Codigo 2FA invalido.",
                    requires_totp: true
                });
            }
        }

        var token = record.newAuthToken();

        return e.json(200, {
            token: token,
            record: {
                id:             record.id,
                collectionId:   record.collection().id,
                collectionName: record.collection().name,
                email:          record.get("email") || "",
                verified:       record.get("verified") || false,
                created:        record.get("created") || "",
                updated:        record.get("updated") || ""
            }
        });
    } catch (err) {
        return e.json(500, { message: "Erro: " + String(err) });
    }
});

// ═══════════════════════════════════════════════════════════════════
// Hook: bloqueia login padrão de superusers com TOTP ativo
// ═══════════════════════════════════════════════════════════════════
onRecordAuthWithPasswordRequest(function(e) {
    e.next();
    if (!e.record) return;

    var secret = "";
    try {
        var rec = $app.findFirstRecordByFilter(
            "totp_secrets", "user_id = {:u}", { u: e.record.id }
        );
        secret = rec.get("secret") || "";
    } catch (_) { /* sem TOTP */ }

    if (secret) {
        throw new UnauthorizedError(
            "Esta conta tem 2FA ativo. Use /api/totp/auth para autenticar."
        );
    }
}, "_superusers");
