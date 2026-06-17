import { MapPinned, Filter, X, ChevronDown, Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Excursion } from '../data';

declare global {
  interface Window {
    ymaps?: any;
  }
}

type Props = {
  objects: Excursion[];
  onOpenDetails: (slug: string) => void;
  onSelect?: (slug: string | null) => void;
  industryFilter: string | null;
  cityFilter: string | null;
};

let scriptLoaded = false;

function loadYandexMaps(): Promise<void> {
  if (scriptLoaded && window.ymaps) {
    return Promise.resolve();
  }

  if (window.ymaps) {
    return Promise.resolve();
  }

  const scriptUrl = `https://api-maps.yandex.ru/2.1/?apikey=${import.meta.env.VITE_YANDEX_MAPS_API_KEY}&lang=ru_RU`;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    script.type = 'text/javascript';
    
    script.onload = () => {
      if (window.ymaps) {
        scriptLoaded = true;
        resolve();
        return;
      }
      reject(new Error('window.ymaps не найден'));
    };
    
    script.onerror = (error) => {
      console.error('[YandexMap] Ошибка загрузки:', error);
      reject(new Error('Failed to load Yandex Maps API'));
    };
    
    document.head.appendChild(script);
  });
}

const INDUSTRY_COLORS: Record<string, string> = {
  'Пищевая промышленность': 'green',
  'Энергетика': 'red',
  'Машиностроение': 'blue',
  'Нефтегазовое машиностроение': 'violet',
  'Мебельное производство': 'orange',
  'Нефтегазовая и химическая промышленность': 'violet',
};

function getIndustryColor(industry: string): string {
  return INDUSTRY_COLORS[industry] || 'gray';
}

export function YandexRegionMap({ 
  objects, 
  onOpenDetails, 
  onSelect, 
  industryFilter, 
  cityFilter 
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const placemarksRef = useRef<Map<string, any>>(new Map());
  const placemarkColorsRef = useRef<Map<string, string>>(new Map());
  const placemarkDataRef = useRef<Map<string, Excursion>>(new Map());
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (!objects || objects.length === 0) {
      console.log('[YandexMap] Объекты ещё не загружены, ждём...');
      return;
    }

    let cancelled = false;

    setStatus('loading');

    loadYandexMaps()
      .then(() => {
        if (!window.ymaps || cancelled) return;

        window.ymaps.ready(() => {
          if (cancelled || !mapRef.current) return;

          try {
            const map = new window.ymaps.Map(mapRef.current, {
              center: [51.5, 46.0],
              zoom: 7,
              controls: ['zoomControl', 'geolocationControl'],
            });

            mapInstanceRef.current = map;
            setStatus('ready');

            addMarkersToMap(map, objects, industryFilter, cityFilter);
          } catch (error) {
            console.error('[YandexMap] Ошибка создания карты:', error);
            if (!cancelled) setStatus('error');
          }
        });
      })
      .catch((error) => {
        console.error('[YandexMap] Ошибка загрузки API:', error);
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
      placemarksRef.current.clear();
      placemarkColorsRef.current.clear();
      placemarkDataRef.current.clear();
    };
  }, [objects]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !objects || objects.length === 0) return;
    
    addMarkersToMap(map, objects, industryFilter, cityFilter);
  }, [industryFilter, cityFilter]);

  function addMarkersToMap(map: any, objects: Excursion[], industryFilter: string | null, cityFilter: string | null) {
    map.geoObjects.removeAll();
    placemarksRef.current.clear();
    placemarkColorsRef.current.clear();
    placemarkDataRef.current.clear();

    const filtered = objects.filter((point) => {
      if (industryFilter && point.industry !== industryFilter) return false;
      if (cityFilter && point.city !== cityFilter) return false;
      return true;
    });

    console.log('[YandexMap] Добавлено маркеров:', filtered.length, 'из', objects.length);

    filtered.forEach((point) => {
      const color = getIndustryColor(point.industry);
      placemarkColorsRef.current.set(point.slug, color);
      placemarkDataRef.current.set(point.slug, point);
      
      const placemark = new window.ymaps.Placemark(
        [point.coordinates[1], point.coordinates[0]],
        {
          hintContent: point.name,
        },
        {
          preset: `islands#${color}CircleIcon`,
          hasBalloon: false,
        }
      );

      map.geoObjects.add(placemark);
      placemarksRef.current.set(point.slug, placemark);

      placemark.events.add('click', () => {
        placemarksRef.current.forEach((pm, slug) => {
          const originalColor = placemarkColorsRef.current.get(slug) || 'gray';
          pm.options.set({
            preset: `islands#${originalColor}CircleIcon`,
            hasBalloon: false,
          });
          pm.properties.set('iconCaption', '');
        });
        
        placemark.options.set({
          preset: 'islands#yellowFactoryIcon',
          hasBalloon: false,
        });
        
        placemark.properties.set('iconCaption', `${point.name}\n${point.city}`);
        
        onSelectRef.current?.(point.slug);
      });
    });

    if (filtered.length > 0) {
      const bounds = map.geoObjects.getBounds();
      if (bounds) {
        map.setBounds(bounds, {
          checkZoomRange: true,
          zoomMargin: 50,
        });
      }
    }
  }

  return (
    <div className="relative min-h-[420px] overflow-hidden rounded-[32px] border border-white/12 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),rgba(255,255,255,0.04)),linear-gradient(160deg,rgba(1,165,166,0.24),rgba(10,16,42,0.9))] p-3 sm:p-5">
      <div 
        ref={mapRef} 
        className="yandex-map-host h-[500px] w-full rounded-[24px] overflow-hidden" 
        aria-label="Карта объектов Саратовской области" 
      />

      {status === 'error' && (
        <div className="absolute inset-3 flex items-end sm:inset-5">
          <div className="max-w-sm rounded-3xl border border-white/12 bg-ink/90 p-4 shadow-glass">
            <div className="flex items-center gap-2 text-lemon">
              <MapPinned className="h-5 w-5" />
              <p className="font-display text-lg uppercase">Ошибка загрузки карты</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-mist">
              Не удалось загрузить Яндекс.Карты. Проверьте подключение к интернету.
            </p>
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