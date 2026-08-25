/*
  CONFIGURAÇÃO DAS CÂMERAS

  O navegador não abre RTSP diretamente.
  Informe abaixo a URL HLS (.m3u8) publicada pelo MediaMTX, FFmpeg ou outro gateway.

  Exemplo RTSP Hikvision (entrada no gateway):
  rtsp://usuario:senha@192.168.1.100:554/Streaming/Channels/101

  Canal 101 = stream principal
  Canal 102 = substream

  Exemplo HLS do MediaMTX:
  http://IP_DO_SERVIDOR:8888/cam01/index.m3u8
*/

window.CAMERAS = [
  {
    id: "cam01",
    name: "Câmera 01",
    location: "Entrada Principal",
    hls: "http://127.0.0.1:8888/cam01/index.m3u8"
  },
  {
    id: "cam02",
    name: "Câmera 02",
    location: "Pátio",
    hls: "http://127.0.0.1:8888/cam02/index.m3u8"
  },
  {
    id: "cam03",
    name: "Câmera 03",
    location: "Terraço",
    hls: "http://127.0.0.1:8888/cam03/index.m3u8"
  },
  {
    id: "cam04",
    name: "Câmera 04",
    location: "Viatura C2",
    hls: "http://127.0.0.1:8888/cam04/index.m3u8"
  }
];
