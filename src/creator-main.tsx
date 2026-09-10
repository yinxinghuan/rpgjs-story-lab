import React from 'react'
import {createRoot} from 'react-dom/client'
import './game-id'
import './style.css'
import ArtCreator from './art-creator'
import SpriteCreator from './sprite-creator'
import OriginalScenePreview from './original-scene-preview'
// Explicit authoring entry. It never creates or imports a player Story Session.
const root=createRoot(document.getElementById('root')!)
const query=new URLSearchParams(location.search)
root.render(query.get('create_art')==='sprite'?<SpriteCreator/>:query.get('scene_preview')==='north-cape'?<OriginalScenePreview/>:<ArtCreator/>)
