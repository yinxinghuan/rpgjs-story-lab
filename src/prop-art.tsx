import React from 'react'
import { isBalancedArt,overheadAsset } from './art-variant'
import {propsArt} from './art-catalog'
export function PropArt({state,className=''}:{state:string;className?:string}){const art=propsArt[isBalancedArt?'balanced':'baseline'],[x,y,w,h]=art.crops[state];return <svg className={className} data-prop-state={state} data-art-variant={isBalancedArt?'balanced':'baseline'} viewBox={`${x} ${y} ${w} ${h}`} aria-hidden="true"><image href={isBalancedArt?overheadAsset('props'):art.path} width={art.width} height={art.height}/></svg>}
