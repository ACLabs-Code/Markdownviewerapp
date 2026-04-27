import{t as e}from"./ordinal-DCsgWfZW.js";import{n as t}from"./path-yo4Xej8w.js";import{t as n}from"./arc-Cr2Y2xI0.js";import{t as r}from"./array-C0548cPn.js";import{At as i,Ct as a,Et as o,I as s,K as c,Kt as l,Mt as u,Nt as d,Ot as f,Ut as p,Wt as m,an as h,in as g,j as _,kt as v,st as y}from"./index-BrMLh57h.js";import{t as b}from"./chunk-4BX2VUAB-DZazPAm6.js";import{t as x}from"./mermaid-parser.core-2R1JViJw.js";function S(e,t){return t<e?-1:t>e?1:t>=e?0:NaN}function C(e){return e}function w(){var e=C,n=S,i=null,a=t(0),o=t(y),s=t(0);function c(t){var c,l=(t=r(t)).length,u,d,f=0,p=Array(l),m=Array(l),h=+a.apply(this,arguments),g=Math.min(y,Math.max(-y,o.apply(this,arguments)-h)),_,v=Math.min(Math.abs(g)/l,s.apply(this,arguments)),b=v*(g<0?-1:1),x;for(c=0;c<l;++c)(x=m[p[c]=c]=+e(t[c],c,t))>0&&(f+=x);for(n==null?i!=null&&p.sort(function(e,n){return i(t[e],t[n])}):p.sort(function(e,t){return n(m[e],m[t])}),c=0,d=f?(g-l*b)/f:0;c<l;++c,h=_)u=p[c],x=m[u],_=h+(x>0?x*d:0)+b,m[u]={data:t[u],index:c,value:x,startAngle:h,endAngle:_,padAngle:v};return m}return c.value=function(n){return arguments.length?(e=typeof n==`function`?n:t(+n),c):e},c.sortValues=function(e){return arguments.length?(n=e,i=null,c):n},c.sort=function(e){return arguments.length?(i=e,n=null,c):i},c.startAngle=function(e){return arguments.length?(a=typeof e==`function`?e:t(+e),c):a},c.endAngle=function(e){return arguments.length?(o=typeof e==`function`?e:t(+e),c):o},c.padAngle=function(e){return arguments.length?(s=typeof e==`function`?e:t(+e),c):s},c}var T=f.pie,E={sections:new Map,showData:!1,config:T},D=E.sections,O=E.showData,k=structuredClone(T),A={getConfig:g(()=>structuredClone(k),`getConfig`),clear:g(()=>{D=new Map,O=E.showData,a()},`clear`),setDiagramTitle:l,getDiagramTitle:d,setAccTitle:m,getAccTitle:i,setAccDescription:p,getAccDescription:v,addSection:g(({label:e,value:t})=>{if(t<0)throw Error(`"${e}" has invalid value: ${t}. Negative values are not allowed in pie charts. All slice values must be >= 0.`);D.has(e)||(D.set(e,t),h.debug(`added new section: ${e}, with value: ${t}`))},`addSection`),getSections:g(()=>D,`getSections`),setShowData:g(e=>{O=e},`setShowData`),getShowData:g(()=>O,`getShowData`)},j=g((e,t)=>{b(e,t),t.setShowData(e.showData),e.sections.map(t.addSection)},`populateDb`),M={parse:g(async e=>{let t=await x(`pie`,e);h.debug(t),j(t,A)},`parse`)},N=g(e=>`
  .pieCircle{
    stroke: ${e.pieStrokeColor};
    stroke-width : ${e.pieStrokeWidth};
    opacity : ${e.pieOpacity};
  }
  .pieOuterCircle{
    stroke: ${e.pieOuterStrokeColor};
    stroke-width: ${e.pieOuterStrokeWidth};
    fill: none;
  }
  .pieTitleText {
    text-anchor: middle;
    font-size: ${e.pieTitleTextSize};
    fill: ${e.pieTitleTextColor};
    font-family: ${e.fontFamily};
  }
  .slice {
    font-family: ${e.fontFamily};
    fill: ${e.pieSectionTextColor};
    font-size:${e.pieSectionTextSize};
    // fill: white;
  }
  .legend text {
    fill: ${e.pieLegendTextColor};
    font-family: ${e.fontFamily};
    font-size: ${e.pieLegendTextSize};
  }
`,`getStyles`),P=g(e=>{let t=[...e.values()].reduce((e,t)=>e+t,0),n=[...e.entries()].map(([e,t])=>({label:e,value:t})).filter(e=>e.value/t*100>=1);return w().value(e=>e.value).sort(null)(n)},`createPieArcs`),F={parser:M,db:A,renderer:{draw:g((t,r,i,a)=>{h.debug(`rendering pie chart
`+t);let l=a.db,d=u(),f=_(l.getConfig(),d.pie),p=c(r),m=p.append(`g`);m.attr(`transform`,`translate(225,225)`);let{themeVariables:g}=d,[v]=s(g.pieOuterStrokeWidth);v??=2;let y=f.textPosition,b=n().innerRadius(0).outerRadius(185),x=n().innerRadius(185*y).outerRadius(185*y);m.append(`circle`).attr(`cx`,0).attr(`cy`,0).attr(`r`,185+v/2).attr(`class`,`pieOuterCircle`);let S=l.getSections(),C=P(S),w=[g.pie1,g.pie2,g.pie3,g.pie4,g.pie5,g.pie6,g.pie7,g.pie8,g.pie9,g.pie10,g.pie11,g.pie12],T=0;S.forEach(e=>{T+=e});let E=C.filter(e=>(e.data.value/T*100).toFixed(0)!==`0`),D=e(w).domain([...S.keys()]);m.selectAll(`mySlices`).data(E).enter().append(`path`).attr(`d`,b).attr(`fill`,e=>D(e.data.label)).attr(`class`,`pieCircle`),m.selectAll(`mySlices`).data(E).enter().append(`text`).text(e=>(e.data.value/T*100).toFixed(0)+`%`).attr(`transform`,e=>`translate(`+x.centroid(e)+`)`).style(`text-anchor`,`middle`).attr(`class`,`slice`);let O=m.append(`text`).text(l.getDiagramTitle()).attr(`x`,0).attr(`y`,-400/2).attr(`class`,`pieTitleText`),k=[...S.entries()].map(([e,t])=>({label:e,value:t})),A=m.selectAll(`.legend`).data(k).enter().append(`g`).attr(`class`,`legend`).attr(`transform`,(e,t)=>{let n=22*k.length/2;return`translate(216,`+(t*22-n)+`)`});A.append(`rect`).attr(`width`,18).attr(`height`,18).style(`fill`,e=>D(e.label)).style(`stroke`,e=>D(e.label)),A.append(`text`).attr(`x`,22).attr(`y`,14).text(e=>l.getShowData()?`${e.label} [${e.value}]`:e.label);let j=512+Math.max(...A.selectAll(`text`).nodes().map(e=>e?.getBoundingClientRect().width??0)),M=O.node()?.getBoundingClientRect().width??0,N=450/2-M/2,F=450/2+M/2,I=Math.min(0,N),L=Math.max(j,F)-I;p.attr(`viewBox`,`${I} 0 ${L} 450`),o(p,450,L,f.useMaxWidth)},`draw`)},styles:N};export{F as diagram};