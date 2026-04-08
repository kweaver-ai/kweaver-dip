# OpenClaw WebSocket device 参数要求

Client 在和 OpenClaw Gateway 建立 WebSocket 握手时，需要构造并发送 params.device 参数。params.device 是 Gateway 的设备身份与配对基础。

## 数据结构

params.device 的结构示例：

```json
"device": {
  "id": "non-empty-string",
  "publicKey": "non-empty-string",
  "signature": "non-empty-string",
  "signedAt": 1737264000000,
  "nonce": "non-empty-string"
}
```

## 参数要求

握手阶段的实际要求是：

1. device.id 必须和 device.publicKey 推导出的设备 ID 完全一致。
OpenClaw 的服务端会用 deriveDeviceIdFromPublicKey(device.publicKey) 校验；不一致直接拒绝，报 device identity mismatch。

2. device.signedAt 必须是最近时间
允许误差只有 2 分钟，超过会报 device signature expired。

3. device.nonce 必须带上，而且必须等于服务端在 connect.challenge 里发来的那个 nonce
不带会报 device nonce required，不匹配会报 device nonce mismatch。

4. device.signature 必须对签名载荷验签成功
签名内容不是随便签一段字符串，而是 Gateway 定义的 v2/v3 payload。
当前优先校验 v3，内容包括：
- deviceId
- clientId
- clientMode
- role
- scopes
- signedAtMs
- token 或 deviceToken / bootstrapToken
- nonce
- platform
- deviceFamily

5. 要点：
- device.id 必须从公钥稳定派生，必须是 sha256(public_key_raw).hexdigest()
- device.publicKey 不是 PEM，应该是原始 Ed25519 公钥 32 字节的 base64url
- device.signature 是对 challenge nonce 绑定的 payload 原文的 Ed25519 签名，再 base64url
- payload 里 client.id、client.mode、role、scopes、platform 变了，签名就必须重算
- client.id、client.mode、role、scopes 变了，签名内容也要跟着变
- 正式客户端要持久化私钥，否则每次连接都会变成新设备，需要重新 pairing

## 示例代码

```typescript
import crypto from "node:crypto";
import WebSocket from "ws";

const GATEWAY_URL = "ws://127.0.0.1:18789";
const GATEWAY_TOKEN = "YOUR_TOKEN";

const CLIENT_ID = "gateway-client";
const CLIENT_MODE = "backend";
const ROLE = "operator";
const SCOPES = ["operator.read"];
const PLATFORM = "linux";
const DEVICE_FAMILY = "";

function base64UrlEncode(buf: Buffer): string {
  return buf.toString("base64").replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

function derivePublicKeyRaw(publicKeyPem: string): Buffer {
  const key = crypto.createPublicKey(publicKeyPem);
  const spki = key.export({ type: "spki", format: "der" }) as Buffer;
  if (
    spki.length === ED25519_SPKI_PREFIX.length + 32 &&
    spki.subarray(0, ED25519_SPKI_PREFIX.length).equals(ED25519_SPKI_PREFIX)
  ) {
    return spki.subarray(ED25519_SPKI_PREFIX.length);
  }
  return spki;
}

function deriveDeviceIdFromPublicKeyPem(publicKeyPem: string): string {
  const raw = derivePublicKeyRaw(publicKeyPem);
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function publicKeyRawBase64UrlFromPem(publicKeyPem: string): string {
  return base64UrlEncode(derivePublicKeyRaw(publicKeyPem));
}

function buildDeviceAuthPayloadV3(params: {
  deviceId: string;
  clientId: string;
  clientMode: string;
  role: string;
  scopes: string[];
  signedAtMs: number;
  token?: string | null;
  nonce: string;
  platform?: string | null;
  deviceFamily?: string | null;
}): string {
  const scopes = params.scopes.join(",");
  const token = params.token ?? "";
  const platform = (params.platform ?? "").trim().toLowerCase();
  const deviceFamily = (params.deviceFamily ?? "").trim().toLowerCase();
  return [
    "v3",
    params.deviceId,
    params.clientId,
    params.clientMode,
    params.role,
    scopes,
    String(params.signedAtMs),
    token,
    params.nonce,
    platform,
    deviceFamily,
  ].join("|");
}

function signDevicePayload(privateKeyPem: string, payload: string): string {
  const key = crypto.createPrivateKey(privateKeyPem);
  const sig = crypto.sign(null, Buffer.from(payload, "utf8"), key);
  return base64UrlEncode(sig);
}

async function main() {
  // 正式客户端应持久化保存这对密钥，不要每次都重新生成
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" }).toString();
  const privateKeyPem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();

  const deviceId = deriveDeviceIdFromPublicKeyPem(publicKeyPem);
  const publicKeyBase64Url = publicKeyRawBase64UrlFromPem(publicKeyPem);

  const ws = new WebSocket(GATEWAY_URL);

  ws.on("message", (data) => {
    const msg = JSON.parse(String(data));

    if (msg.type === "event" && msg.event === "connect.challenge") {
      const nonce = String(msg.payload?.nonce ?? "");
      const signedAtMs = Date.now();

      const payload = buildDeviceAuthPayloadV3({
        deviceId,
        clientId: CLIENT_ID,
        clientMode: CLIENT_MODE,
        role: ROLE,
        scopes: SCOPES,
        signedAtMs,
        token: GATEWAY_TOKEN,
        nonce,
        platform: PLATFORM,
        deviceFamily: DEVICE_FAMILY,
      });

      const signature = signDevicePayload(privateKeyPem, payload);

      ws.send(
        JSON.stringify({
          type: "req",
          id: crypto.randomUUID(),
          method: "connect",
          params: {
            minProtocol: 3,
            maxProtocol: 3,
            client: {
              id: CLIENT_ID,
              version: "1.0.0",
              platform: PLATFORM,
              mode: CLIENT_MODE,
            },
            role: ROLE,
            scopes: SCOPES,
            caps: [],
            commands: [],
            permissions: {},
            auth: {
              token: GATEWAY_TOKEN,
            },
            device: {
              id: deviceId,
              publicKey: publicKeyBase64Url,
              signature,
              signedAt: signedAtMs,
              nonce,
            },
          },
        }),
      );
      return;
    }

    console.log(JSON.stringify(msg, null, 2));
  });

  ws.on("open", () => {
    console.log("ws connected");
  });

  ws.on("close", (code, reason) => {
    console.log("ws closed", code, String(reason));
  });

  ws.on("error", (err) => {
    console.error("ws error", err);
  });
}

void main();

```