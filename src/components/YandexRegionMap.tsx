import { MapPinned } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Excursion } from '../data';

declare global {
  interface Window {
    ymaps3?: YandexMapsApi;
  }
}

type YandexMapsApi = {
  ready: Promise<void>;
  YMap: new (element: HTMLElement, props: unknown) => {
    addChild: (child: unknown) => unknown;
    destroy?: () => void;
  };
  YMapDefaultSchemeLayer: new () => unknown;
  YMapDefaultFeaturesLayer: new () => unknown;
  YMapMarker: new (props: unknown, element: HTMLElement) => unknown;
};

type Props = {
  objects: Excursion[];
  onOpenDetails: (slug: string) => void;
};

let scriptPromise: Promise<YandexMapsApi> | null = null;

function loadYandexMaps(apiKey: string) {
  if (window.ymaps3) {
    return Promise.resolve(window.ymaps3);
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/v3/?apikey=${apiKey}&lang=ru_RU`;
    script.async = true;
    script.onload = () => {
      if (window.ymaps3) {
        resolve(window.ymaps3);
        return;
      }

      reject(new Error('Yandex Maps API did not initialize.'));
    };
    script.onerror = () => reject(new Error('Failed to load Yandex Maps API.'));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export function YandexRegionMap({ objects, onOpenDetails }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error' | 'missing_key'>('idle');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(objects[0]?.slug ?? null);
  const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY;

  const selectedObject = objects.find((item) => item.slug === selectedSlug) ?? null;

  useEffect(() => {
    if (!selectedSlug && objects[0]?.slug) {
      setSelectedSlug(objects[0].slug);
    }
  }, [objects, selectedSlug]);

  useEffect(() => {
    if (!apiKey) {
      setStatus('missing_key');
      return;
    }

    if (!mapRef.current) {
      return;
    }

    let cancelled = false;
    let mapInstance: { destroy?: () => void } | null = null;

    setStatus('loading');

    loadYandexMaps(apiKey)
      .then(async (ymaps3) => {
        await ymaps3.ready;

        if (cancelled || !mapRef.current) {
          return;
        }

        const map = new ymaps3.YMap(mapRef.current, {
          location: {
            center: [46.85, 51.72],
            zoom: 7,
          },
          behaviors: ['drag', 'pinchZoom', 'dblClick', 'mouseWheel'],
        });

        map.addChild(new ymaps3.YMapDefaultSchemeLayer());
        map.addChild(new ymaps3.YMapDefaultFeaturesLayer());

        objects.forEach((point) => {
          const markerElement = document.createElement('button');
          markerElement.type = 'button';
          markerElement.className = 'yandex-marker';
          markerElement.innerHTML = `
            <span class="yandex-marker__city">${point.name}</span>
            <span class="yandex-marker__count">${point.city}</span>
          `;
          markerElement.setAttribute('aria-label', `${point.name}, ${point.city}`);
          markerElement.onclick = () => setSelectedSlug(point.slug);

          map.addChild(new ymaps3.YMapMarker({ coordinates: point.coordinates }, markerElement));
        });

        mapInstance = map;
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('error');
        }
      });

    return () => {
      cancelled = true;
      mapInstance?.destroy?.();
    };
  }, [apiKey, objects]);

  return (
    <div className="relative min-h-[420px] overflow-hidden rounded-[32px] border border-white/12 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),rgba(255,255,255,0.04)),linear-gradient(160deg,rgba(1,165,166,0.24),rgba(10,16,42,0.9))] p-3 sm:p-5">
      <div ref={mapRef} className="yandex-map-host h-[392px] w-full rounded-[24px]" aria-label="Карта объектов Саратовской области" />

      {(status === 'missing_key' || status === 'error') && (
        <div className="absolute inset-3 flex items-end sm:inset-5">
          <div className="max-w-sm rounded-3xl border border-white/12 bg-ink/90 p-4 shadow-glass">
            <div className="flex items-center gap-2 text-lemon">
              <MapPinned className="h-5 w-5" />
              <p className="font-display text-lg uppercase">Карта требует ключ Яндекс API</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-mist">
              Добавьте `VITE_YANDEX_MAPS_API_KEY` в локальное окружение, чтобы включить реальную карту Саратовской
              области с объектными маркерами.
            </p>
          </div>
        </div>
      )}

      {selectedObject && (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 sm:inset-x-auto sm:bottom-5 sm:left-5">
          <div className="pointer-events-auto max-w-sm rounded-3xl border border-white/12 bg-ink/90 p-4 shadow-glass">
            <p className="text-sm text-aqua">{selectedObject.industry}</p>
            <h3 className="mt-2 break-words font-display text-2xl uppercase text-snow">{selectedObject.name}</h3>
            <p className="mt-2 text-sm text-mist">{selectedObject.city}</p>
            <p className="mt-3 text-sm leading-6 text-mist">{selectedObject.blurb}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="chip">{selectedObject.price}</span>
              <span className="chip">{selectedObject.duration}</span>
              <span className="chip">{selectedObject.audience}</span>
            </div>
            <button
              type="button"
              onClick={() => onOpenDetails(selectedObject.slug)}
              className="mt-5 inline-flex items-center rounded-full bg-lemon px-4 py-3 text-sm font-semibold text-ink transition hover:bg-yellow-300"
            >
              Подробнее из каталога
            </button>
          </div>
        </div>
      )}

      {status === 'loading' && (
        <div className="absolute inset-3 flex items-end sm:inset-5">
          <div className="max-w-xs rounded-3xl border border-white/12 bg-ink/80 p-4 text-sm text-mist">
            Загружаем карту Яндекс и точки маршрутов…
          </div>
        </div>
      )}
    </div>
  );
}
