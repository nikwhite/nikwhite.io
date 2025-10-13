import React, { useState, useEffect } from 'react';

const BUCKET_API = 'https://storage.googleapis.com/storage/v1/b/nikwhite.io/o';

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

const buttonStyle = { 
  background: 'none', 
  border: 'none', 
  padding: '8px 16px', 
  cursor: 'pointer',
  marginBottom: '16px',
  fontSize: '18px',
}

const listItemStyle = {
  marginBottom: '8px',
}

interface Item {
  type: 'folder' | 'photo';
  name: string;
}

interface StorageItem {
  name: string;
}

interface StorageResponse {
  items?: StorageItem[];
  prefixes?: string[];
}

function getCurrentPath(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get('path') || '/';
}

export const PhotoBrowser: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string>(getCurrentPath());

  // Update path when URL changes
  useEffect(() => {
    window.history.pushState({path: currentPath}, '',  window.location.href);
    window.addEventListener('popstate', (ev) => {
      const newPath = ev.state.path;
      if (newPath !== currentPath) {
        setCurrentPath(newPath);
      }
    });
  }, []);
  
  const navigateTo = (newPath: string) => {
    const url = new URL(window.location.href);
    if (newPath) {
      url.searchParams.set('path', newPath);
    } else {
      url.searchParams.delete('path');
    }
    window.history.pushState({path: newPath}, '', url.toString());
    setCurrentPath(newPath);
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

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // Build API URL using BUCKET_PARAMS as base
    const params = new URLSearchParams(BUCKET_PARAMS);
    const fullPrefix = currentPath ? `${BUCKET_PARAMS.prefix}${currentPath}` : BUCKET_PARAMS.prefix;
    params.set('prefix', fullPrefix);
    
    const apiUrl = `${BUCKET_API}?${params.toString()}`;
    
    fetch(apiUrl)
      .then(res => res.json())
      .then((data: StorageResponse) => {
        const folders: string[] = [];
        const photos: string[] = [];
        
        // Handle folders from prefixes
        if (data.prefixes) {
          for (const prefix of data.prefixes) {
            const folderPath = prefix.replace(fullPrefix, '');
            if (folderPath) {
              folders.push(folderPath);
            }
          }
        }
        
        // Handle photos from items
        if (data.items) {
          for (const item of data.items) {
            const photoPath = item.name.replace(fullPrefix, '');
            if (photoPath && !photoPath.endsWith('/')) {
              photos.push(photoPath);
            }
          }
        }
        
        setItems([
          ...folders.map(f => ({ type: 'folder' as const, name: f })),
          ...photos.map(p => ({ type: 'photo' as const, name: p }))
        ]);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load photos');
        setLoading(false);
      });
  }, [currentPath]);

  // If viewing a photo, show the photo
  if (currentPath && !currentPath.endsWith('/')) {
    const photoUrl = `https://storage.googleapis.com/nikwhite.io/static/photos/${currentPath}`;
    return (
      <section>
        <div>
          <button 
            style={buttonStyle}
            onClick={() => window.history.back()}>
            ← Back
          </button>
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
        {items.map((item, i) => {
          if (item.type === 'folder') {
            return (
              <li key={i} style={listItemStyle}>
                <button
                  style={clickableItemStyle}
                  onClick={() => navigateTo(currentPath ? `${currentPath}${item.name}` : item.name)}>
                  ➳ {item.name}
                </button>
              </li>
            );
          } else {
            return (
              <li key={i} style={listItemStyle}>
                <button
                  style={clickableItemStyle}
                  onClick={() => navigateTo(currentPath ? `${currentPath}${item.name}` : item.name)}>
                  {item.name}
                </button>
              </li>
            );
          }
        })}
      </ul>
      {currentPath && (
        <div>
          <button
            style={buttonStyle}
            onClick={() => navigateTo(getParentPath())}>
            ← Back
          </button>
        </div>
      )}
    </section>
  );
}
