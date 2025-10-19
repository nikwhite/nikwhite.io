import React, { useState, useEffect } from 'react';

import { BackButton } from './backButton';
import './photoBrowser.css';

const BUCKET_API = 'https://storage.googleapis.com/storage/v1/b/nikwhite.io/o';
const PHOTOS_URL_BASE = 'https://storage.googleapis.com/nikwhite.io/static/photos/';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const BUCKET_PARAMS = {
  prefix: 'static/photos/',
  includeFoldersAsPrefixes: 'true',
  delimiter: '/',
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

  const navigateTo = (newPath: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();

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

  // Pathing has a quirk where folders end with a slash, and photos do not.
  // thiis makes working with the storage API easier because it's required
  // to list the contents of a folder.
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
    ? () => window.history.back()
    : () => navigateTo(getParentPath());

  // Update path when URL changes
  useEffect(() => {
    const handlePopState = (ev: PopStateEvent) => {
      const newPath = ev.state?.path || '';
      if (newPath === currentPath) {
        ev.preventDefault();
        return false;
      }
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
    const photoUrl = `${PHOTOS_URL_BASE}${currentPath}`;
    return (
      <section className="photo-view">
        <div>
          <BackButton onClick={backOnClick} />
        </div>
        <img src={photoUrl} alt={currentPath} />
      </section>
    );
  }

  // Otherwise, show list of folders and photos
  return (
    <section className="photo-browser">
      <h2 className="breadcrumb">
        <a href="?" onClick={(e) => navigateTo('', e)}>
          nikwhite.io
        </a>
        {currentPath && currentPath
          .split('/')
          .filter(Boolean)
          .map((segment, index, array) => {
            // Build path up to this segment (including trailing /)
            const pathUpToHere = array.slice(0, index + 1).join('/') + '/';
            const href = `?path=${encodeURIComponent(pathUpToHere)}`;
            return (
              <span key={index}>
                <span className="breadcrumb-separator"> &gt; </span>
                <a href={href} onClick={(e) => navigateTo(pathUpToHere, e)}>
                  {segment}
                </a>
              </span>
            );
          })
        }
      </h2>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul className="item-list">
        {items.map((item, i) => {
          if (item.type === 'folder') {
            const folderPath = currentPath
              ? `${currentPath}${item.name}`
              : item.name;
            const href = `?path=${encodeURIComponent(folderPath)}`;
            return (
              <li key={i} className="item-list-item">
                <a href={href}
                  className="item-link"
                  onClick={(e) => navigateTo(folderPath, e)}>
                  <span className="folder-icon">➳</span>
                  {item.name}
                </a>
              </li>
            );
          } else {
            const photoPath = currentPath ? `${currentPath}${item.name}` : item.name;
            const href = `?path=${encodeURIComponent(photoPath)}`;
            return (
              <li key={i} className="item-list-item">
                <a href={href}
                  className="item-link"
                  onClick={(e) => navigateTo(photoPath, e)}>
                  {item.name}
                </a>
              </li>
            );
          }
        })}
        <li className="item-list-item">
          <BackButton onClick={backOnClick} />
        </li>
      </ul>
    </section>
  );
}
