function r(n){let e=requestAnimationFrame(function t(a){e=requestAnimationFrame(t),n(a)});return()=>{cancelAnimationFrame(e)}}export{r as o};
