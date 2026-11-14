const fs = require('fs');

// 1. render-path.DcLB9IHv.js
{
  const p = 'public/_astro/render-path.DcLB9IHv.js';
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace('dpr:Math.min(window.devicePixelRatio,2)', 'dpr:Math.min(window.devicePixelRatio,1)');
  fs.writeFileSync(p, c, 'utf8');
  console.log('✓ render-path.DcLB9IHv.js updated');
}

// 2. render-app-CvdNAhmF.js
{
  const p = 'public/_astro/render-app-CvdNAhmF.js';
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(
    'C0={high:{pixelRatioMax:1,desktopPixelRatioMax:1.6,phonePixelRatioMax:2,pixelRatioMin:.8,pixelRatioInsideProject:1.7,isCityShadowed:!0,cityColumnsAbove:kf.columnsAbove,cityColumnsBelow:kf.columnsBelow,cityLevels:kf.levels,voxelLayers:or.defaultLayers,voxelSegments:or.segments,portraitAreaMax:4,corridorPairs:tv}',
    'C0={high:{pixelRatioMax:1,desktopPixelRatioMax:1.0,phonePixelRatioMax:1.0,pixelRatioMin:.7,pixelRatioInsideProject:1.0,isCityShadowed:!1,cityColumnsAbove:11,cityColumnsBelow:13,cityLevels:16,voxelLayers:2,voxelSegments:or.segments,portraitAreaMax:2,corridorPairs:tv}'
  );
  c = c.replace('slowFps=25;', 'slowFps=50;');
  c = c.replace('Ft.pauseOnDocumentHidden=!1;', 'Ft.pauseOnDocumentHidden=!0;');
  c = c.replace(
    'new NI({antialias:!1,canvas:e,forceWebGL:r.isWebGLForced??!1})',
    'new NI({antialias:!1,powerPreference:"high-performance",canvas:e,forceWebGL:r.isWebGLForced??!1})'
  );
  fs.writeFileSync(p, c, 'utf8');
  console.log('✓ render-app-CvdNAhmF.js updated');
}

// 3. render-app.C2JM9TBK.js
{
  const p = 'public/_astro/render-app.C2JM9TBK.js';
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(
    'zt={high:{pixelRatioMax:1,desktopPixelRatioMax:1.6,phonePixelRatioMax:2,pixelRatioMin:.8,pixelRatioInsideProject:1.7,isCityShadowed:!0,cityColumnsAbove:lt.columnsAbove,cityColumnsBelow:lt.columnsBelow,cityLevels:lt.levels,voxelLayers:T.defaultLayers,voxelSegments:T.segments,portraitAreaMax:4,corridorPairs:pe}',
    'zt={high:{pixelRatioMax:1,desktopPixelRatioMax:1.0,phonePixelRatioMax:1.0,pixelRatioMin:.7,pixelRatioInsideProject:1.0,isCityShadowed:!1,cityColumnsAbove:11,cityColumnsBelow:13,cityLevels:16,voxelLayers:2,voxelSegments:T.segments,portraitAreaMax:2,corridorPairs:pe}'
  );
  c = c.replace('slowFps=25;', 'slowFps=50;');
  c = c.replace('b.pauseOnDocumentHidden=!1;', 'b.pauseOnDocumentHidden=!0;');
  c = c.replace(
    'new Ee({antialias:!1,canvas:e,forceWebGL:t.isWebGLForced??!1})',
    'new Ee({antialias:!1,powerPreference:"high-performance",canvas:e,forceWebGL:t.isWebGLForced??!1})'
  );
  fs.writeFileSync(p, c, 'utf8');
  console.log('✓ render-app.C2JM9TBK.js updated');
}
