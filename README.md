# Hikvision Camera Viewer

Painel estático para câmeras Hikvision. O MediaMTX lê RTSP e entrega HLS ao navegador; o Nginx Proxy Manager (NPM) publica site e HLS no mesmo domínio HTTPS.

## Arquitetura prevista

- Servidor Docker: `82.25.70.30`
- Única entrada pública recomendada: NPM em `443/TCP` (e `80/TCP` somente para redirecionamento/certificado)
- `cameras-web:80`, `mediamtx:8888` e `mediamtx:8554` são internos à rede Docker
- O navegador usa URLs relativas como `/hls/cam01/index.m3u8`, evitando mixed content

## 1. Preparar

Edite `mediamtx.yml` e substitua usuário, senha e IP de cada câmera. Se a senha contiver caracteres especiais, aplique URL encoding (por exemplo, `@` vira `%40`). O canal Hikvision `101` é normalmente o stream principal; `102`, o substream.

Edite `site/config/cameras.js` para ajustar nomes, locais ou quantidade de câmeras. O identificador deve coincidir com o caminho em `mediamtx.yml`.

## 2. Rede Docker compartilhada

Crie uma vez a rede usada pelo projeto e conecte a ela o contêiner do Nginx Proxy Manager:

```bash
docker network create npm_proxy
docker network connect npm_proxy NOME_DO_CONTAINER_NPM
```

Descubra o nome com `docker ps` se necessário. Se o NPM já usa uma rede externa compartilhada, altere `name: npm_proxy` no final de `docker-compose.yml` para o nome dela; não é necessário criar outra.

Suba o painel:

```bash
docker compose up -d
```

O Compose não contém `ports:`. Assim, `8554` e `8888` não são publicados no servidor nem na internet.

## 3. Proxy Host no Nginx Proxy Manager

Em **Hosts > Proxy Hosts > Add Proxy Host**:

- Domain Names: o domínio escolhido, por exemplo `cameras.exemplo.com`
- Scheme: `http`
- Forward Hostname / IP: `cameras-web`
- Forward Port: `80`
- Block Common Exploits: habilitado
- Websockets Support: pode ficar habilitado

Na aba **SSL**, selecione/solicite o certificado, habilite **Force SSL** e, se apropriado ao domínio, **HTTP/2 Support** e **HSTS**.

### Custom Location (opção preferida)

Na aba **Custom locations**, adicione:

- Location: `/hls/`
- Scheme: `http`
- Forward Hostname / IP: `mediamtx`
- Forward Port: `8888`

Se essa versão do NPM não encaminhar corretamente o sufixo do caminho, use a configuração avançada abaixo em vez da Custom Location.

### Advanced (alternativa)

Na aba **Advanced** do Proxy Host, adicione:

```nginx
location /hls/ {
    proxy_pass http://mediamtx:8888/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_buffering off;
    proxy_cache off;
    add_header Cache-Control "no-store" always;
}
```

A barra final em `proxy_pass http://mediamtx:8888/;` é intencional: remove o prefixo `/hls/`, fazendo `/hls/cam01/index.m3u8` chegar ao MediaMTX como `/cam01/index.m3u8`.

## 4. Firewall

Não libere `8554/TCP` nem `8888/TCP` publicamente. Confirme no servidor que o Compose não publica essas portas. O servidor `82.25.70.30` precisa, contudo, alcançar as câmeras na porta RTSP `554/TCP` pela rede privada, rota ou VPN.

## Verificação

```bash
docker compose config
docker compose ps
docker compose logs --tail=100 mediamtx
```

Abra `https://SEU_DOMINIO/`. Para testar um stream diretamente pelo proxy, use `https://SEU_DOMINIO/hls/cam01/index.m3u8`.

## Atualização e parada

```bash
docker compose pull
docker compose up -d
docker compose down
```

Credenciais RTSP permanecem apenas em `mediamtx.yml`; não são enviadas ao navegador. Proteja o acesso ao diretório e considere usar um usuário somente de visualização nas câmeras.
