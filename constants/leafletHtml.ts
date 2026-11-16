// constants/leafletHtml.ts
export const buildLeafletHtml = (lat: number, lng: number, zoom: number): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: #e5e3df; }
    * { -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
    .leaflet-control-attribution { font-size: 9px; }
  </style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
(function () {
  function post(type, payload) {
    var msg = JSON.stringify({ type: type, payload: payload });
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(msg);
  }

  var map = L.map('map', { zoomControl: false }).setView([${lat}, ${lng}], ${zoom});

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  var markersLayer = L.layerGroup().addTo(map);

  // Нативный long-press в Leaflet: contextmenu (тач) / right-click (десктоп)
  map.on('contextmenu', function (e) {
    post('longPress', { latitude: e.latlng.lat, longitude: e.latlng.lng });
  });

  window.setMarkers = function (markers) {
    markersLayer.clearLayers();
    markers.forEach(function (m) {
      var marker = L.marker([m.latitude, m.longitude]);
      marker.on('click', function () {
        post('markerPress', { id: m.id });
      });
      if (m.title) {
        marker.bindTooltip(m.title, { direction: 'top', offset: [0, -10] });
      }
      markersLayer.addLayer(marker);
    });
  };

  // Сигнал в RN, что карта инициализирована и можно инжектить маркеры
  setTimeout(function () { post('ready', {}); }, 50);
  // В constants/leafletHtml.ts, внутри <script>, после определения window.setMarkers
  // Поддержка веба (iframe)
  if (window.parent !== window) {
    // Отправляем сообщения родителю
    var originalPost = post;
    post = function(type, payload) {
      if (window.ReactNativeWebView) {
        originalPost(type, payload);
      } else {
        window.parent.postMessage(JSON.stringify({ type: type, payload: payload }), '*');
      }
    };
  
    // Слушаем команду установки маркеров от родителя
    window.addEventListener('message', function(event) {
      try {
        var data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.type === 'setMarkers' && typeof window.setMarkers === 'function') {
          window.setMarkers(data.payload);
        }
      } catch (e) {
        // Игнорируем
      }
    });
  
    // Переопределяем post, чтобы ready-сообщение тоже ушло родителю
    setTimeout(function () { post('ready', {}); }, 100);
  } else {
    // Нативный режим (WebView)
    setTimeout(function () { post('ready', {}); }, 50);
}
})();
</script>
</body>
</html>
`;