# Visualizador estático Hikvision

Este projeto contém um front-end 100% estático para visualizar câmeras Hikvision no navegador.

## Importante: RTSP no navegador

Chrome, Edge, Firefox e Safari não reproduzem uma URL `rtsp://` diretamente.

A câmera Hikvision fornece RTSP, por exemplo:

    rtsp://usuario:senha@192.168.1.100:554/Streaming/Channels/101

Para o navegador, o stream precisa ser publicado como HLS ou WebRTC. O exemplo deste pacote usa MediaMTX e HLS.

## Hikvision

- Stream principal: `/Streaming/Channels/101`
- Substream: `/Streaming/Channels/102`
- Porta RTSP padrão: `554`

## Usando apenas o site

Edite:

    site/config/cameras.js

Troque as URLs HLS de cada câmera.

Depois publique a pasta `site` em qualquer servidor HTTP, como Nginx, Apache ou GitHub Pages (desde que os streams sejam acessíveis pelo navegador).

## Usando Docker + MediaMTX

1. Edite `mediamtx.yml`.
2. Troque `USUARIO`, `SENHA` e os IPs das câmeras.
3. Copie a pasta `hikvision-camera-viewer` para o servidor.
4. Execute:

    docker compose up -d

5. Acesse:

    http://IP_DO_SERVIDOR:8080

Os streams HLS ficarão, por exemplo:

    http://IP_DO_SERVIDOR:8888/cam01/index.m3u8

Atualize `site/config/cameras.js` para usar o IP real do servidor.

## Segurança

Não coloque usuário e senha da câmera diretamente no JavaScript do site.
Mantenha as credenciais somente no gateway MediaMTX, em rede protegida.

Se a página estiver em HTTPS, o stream HLS também deve ser entregue por HTTPS para evitar bloqueio de conteúdo misto.
