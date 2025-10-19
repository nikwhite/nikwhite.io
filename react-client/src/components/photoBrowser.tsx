import React, { useState, useEffect } from 'react';

import { BackButton } from './backButton';

const BUCKET_API = 'https://storage.googleapis.com/storage/v1/b/nikwhite.io/o';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const BUCKET_PARAMS = {
  prefix: 'static/photos/',
  includeFoldersAsPrefixes: 'true',
  delimiter: '/',
}

const clickableItemStyle = {
  background: 'none',
  border: 'none',
  padding: '8px 16px',
  cursor: 'pointer',
  fontSize: '18px',
}

const listItemStyle = {
  marginBottom: '8px',
}

type FolderItem = {
  type: 'folder';
  name: string;
};

type PhotoItem = {
  type: 'photo';
  name: string;
  downloadUri: string;
};

type Item =
  | FolderItem
  | PhotoItem;

interface StorageItem {
  name: string;
  mediaLink: string;
}

interface StorageResponse {
  items?: StorageItem[];
  prefixes?: string[];
}

interface CacheEntry {
  data: Item[];
  timestamp: number;
}

// Simple in-memory cache with TTL
const dataCache = new Map<string, CacheEntry>();

function getCachedData(key: string): Item[] | null {
  const entry = dataCache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    dataCache.delete(key);
    return null;
  }

  return entry.data;
}

function setCachedData(key: string, data: Item[]): Item[] {
  dataCache.set(key, {
    data,
    timestamp: Date.now(),
  });
  return data;
}

function getCurrentPath(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get('path') || '';
}

function getFullStoragePath(path: string): string {
  return path ? `${BUCKET_PARAMS.prefix}${path}` : BUCKET_PARAMS.prefix;
}

function getStorageApiUri(prefix: string): string {
  const params = new URLSearchParams(BUCKET_PARAMS);
  params.set('prefix', prefix);
  return `${BUCKET_API}?${params.toString()}`;
}

async function fetchStorageData(prefix: string): Promise<Item[]> {
  const cached = getCachedData(prefix);
  return cached ? cached : fetch(getStorageApiUri(prefix))
    .then(res => res.json())
    .then(data => processResponse(prefix, data))
    .then(items => setCachedData(prefix, items));
}

function processResponse(fullPrefix: string, data: StorageResponse): Item[] {
  const folders: FolderItem[] = [];
  const photos: PhotoItem[] = [];

  // Handle prefixes as folders
  if (data.prefixes) {
    for (const prefix of data.prefixes) {
      const name = prefix.replace(fullPrefix, '');
      if (name) {
        folders.push({ type: 'folder', name });
      }
    }
  }

  // Handle items as photos
  if (data.items) {
    for (const item of data.items) {
      const name = item.name.replace(fullPrefix, '');
      if (name && !name.endsWith('/')) {
        photos.push({
          name,
          type: 'photo' as const,
          downloadUri: item.mediaLink
        });
      }
    }
  }
  return [...folders, ...photos];
}

export const PhotoBrowser: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string>(getCurrentPath());
  const storagePath = getFullStoragePath(currentPath);


  const navigateTo = (newPath: string) => {
    const url = new URL(window.location.href);
    if (newPath) {
      url.searchParams.set('path', newPath);
    } else {
      url.searchParams.delete('path');
    }
    if (newPath !== currentPath) {
      window.history.pushState({path: newPath}, '', url.toString());
      setCurrentPath(newPath);
    }
  };

  function getParentPath(): string {
    const endIndex = /\.[a-zA-Z0-9]{2,5}$/.test(currentPath)
      ? -1 // slice only last path component (image)
      : -2 // slice the trailing slash and previous path component (folder)
    return  currentPath
      .split('/')
      .slice(0, endIndex)
      .concat('') // for the trailing /
      .join('/');
  }

  // when we have state in the history, use the browser back button, otherwise
  // otherwise navigate to the parent path by using the url path.
  const backOnClick = window.history.state
    ? window.history.back.bind(window.history)
    : navigateTo.bind(null, getParentPath());

  // Update path when URL changes
  useEffect(() => {
    const handlePopState = (ev: PopStateEvent) => {
      const newPath = ev.state?.path || '';
      setCurrentPath(newPath);
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Fetch data when path changes
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchStorageData(storagePath)
      .then((items: Item[]) => {
        setItems(items);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load photos');
        setLoading(false);
      });
  }, [storagePath]);

  // If viewing a photo, show the photo
  if (currentPath && !currentPath.endsWith('/')) {
    const photoUrl = `https://storage.googleapis.com/nikwhite.io/static/photos/${currentPath}`;
    return (
      <section>
        <div>
          <BackButton onClick={backOnClick} />
        </div>
        <img src={photoUrl} alt={currentPath} style={{ maxWidth: '100%', maxHeight: '80vh' }} />
      </section>
    );
  }

  // Otherwise, show folders/photos
  return (
    <section>
      <h2>{`nikwhite.io > ${currentPath || ''}`}</h2>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li>
          <BackButton onClick={backOnClick} />
        </li>
        {items.map((item, i) => {
          if (item.type === 'folder') {
            return (
              <li key={i} style={listItemStyle}>
                <button style={clickableItemStyle}
                  onClick={() => navigateTo(currentPath ? `${currentPath}${item.name}` : item.name)}>
                  <span style={{
                    display: 'inline-block',
                    fontSize: '2em',
                    marginRight: '0.5em',
                    lineHeight: '0',
                    verticalAlign: 'middle',
                  }}>➳</span> {item.name}
                </button>
              </li>
            );
          } else {
            return (
              <li key={i} style={listItemStyle}>
                <button style={clickableItemStyle}
                  onClick={() => navigateTo(currentPath ? `${currentPath}${item.name}` : item.name)}>
                  {item.name}
                </button>
              </li>
            );
          }
        })}
      </ul>

    </section>
  );
}
