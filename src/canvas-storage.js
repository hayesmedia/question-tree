import {storageKey,validCanvasId} from './canvases.js';
export const activeCanvas=new URL(location.href).searchParams.get('canvas')||'main';
if(!validCanvasId(activeCanvas))throw Error('Invalid canvas identifier.');
export const projectStorage={getItem:key=>localStorage.getItem(storageKey(key,activeCanvas)),setItem:(key,value)=>localStorage.setItem(storageKey(key,activeCanvas),value),removeItem:key=>localStorage.removeItem(storageKey(key,activeCanvas))};
