import React from 'react'
import {createRoot} from 'react-dom/client'
import './game-id'
import './style.css'
import ArtCreator from './art-creator'
import OriginalScenePreview from './original-scene-preview'
// Explicit authoring entry. It never creates or imports a player Story Session.
const root=createRoot(document.getElementById('root')!)
root.render(new URLSearchParams(location.search).get('scene_preview')==='north-cape'?<OriginalScenePreview/>:<ArtCreator/>)
