import{t as e}from"./ordinal-3qmO7xdp.js";import{t}from"./arc-Cd0-sDDu.js";import{Fn as n,Ft as r,Jn as i,L as a,M as o,Mn as s,Mt as c,Nn as l,Sn as u,Xt as d,Yt as f,_n as p,fn as m,hn as h,qn as g,vn as _,xn as v,yn as y}from"./index-CP8bnDgx.js";import{t as b}from"./mermaid-parser.core-A6k0iXLg.js";import{t as x}from"./chunk-4BX2VUAB-EfqXldqp.js";function S(e,t){return t<e?-1:t>e?1:t>=e?0:NaN}function C(e){return e}function w(){var e=C,t=S,n=null,i=d(0),a=d(f),o=d(0);function s(s){var c,l=(s=r(s)).length,u,d,p=0,m=Array(l),h=Array(l),g=+i.apply(this,arguments),_=Math.min(f,Math.max(-f,a.apply(this,arguments)-g)),v,y=Math.min(Math.abs(_)/l,o.apply(this,arguments)),b=y*(_<0?-1:1),x;for(c=0;c<l;++c)(x=h[m[c]=c]=+e(s[c],c,s))>0&&(p+=x);for(t==null?n!=null&&m.sort(function(e,t){return n(s[e],s[t])}):m.sort(function(e,n){return t(h[e],h[n])}),c=0,d=p?(_-l*b)/p:0;c<l;++c,g=v)u=m[c],x=h[u],v=g+(x>0?x*d:0)+b,h[u]={data:s[u],index:c,value:x,startAngle:g,endAngle:v,padAngle:y};return h}return s.value=function(t){return arguments.length?(e=typeof t==`function`?t:d(+t),s):e},s.sortValues=function(e){return arguments.length?(t=e,n=null,s):t},s.sort=function(e){return arguments.length?(n=e,t=null,s):n},s.startAngle=function(e){return arguments.length?(i=typeof e==`function`?e:d(+e),s):i},s.endAngle=function(e){return arguments.length?(a=typeof e==`function`?e:d(+e),s):a},s.padAngle=function(e){return arguments.length?(o=typeof e==`function`?e:d(+e),s):o},s}var T=p.pie,E={sections:new Map,showData:!1,config:T},D=E.sections,O=E.showData,k=structuredClone(T),A={getConfig:g(()=>structuredClone(k),`getConfig`),clear:g(()=>{D=new Map,O=E.showData,m()},`clear`),setDiagramTitle:n,getDiagramTitle:u,setAccTitle:l,getAccTitle:y,setAccDescription:s,getAccDescription:_,addSection:g(({label:e,value:t})=>{if(t<0)throw Error(`"${e}" has invalid value: ${t}. Negative values are not allowed in pie charts. All slice values must be >= 0.`);D.has(e)||(D.set(e,t),i.debug(`added new section: ${e}, with value: ${t}`))},`addSection`),getSections:g(()=>D,`getSections`),setShowData:g(e=>{O=e},`setShowData`),getShowData:g(()=>O,`getShowData`)},j=g((e,t)=>{x(e,t),t.setShowData(e.showData),e.sections.map(t.addSection)},`populateDb`),M={parse:g(async e=>{let t=await b(`pie`,e);i.debug(t),j(t,A)},`parse`)},N=g(e=>`
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
`,`getStyles`),P=g(e=>{let t=[...e.values()].reduce((e,t)=>e+t,0),n=[...e.entries()].map(([e,t])=>({label:e,value:t})).filter(e=>e.value/t*100>=1);return w().value(e=>e.value).sort(null)(n)},`createPieArcs`),F={parser:M,db:A,renderer:{draw:g((n,r,s,l)=>{i.debug(`rendering pie chart
`+n);let u=l.db,d=v(),f=o(u.getConfig(),d.pie),p=c(r),m=p.append(`g`);m.attr(`transform`,`translate(225,225)`);let{themeVariables:g}=d,[_]=a(g.pieOuterStrokeWidth);_??=2;let y=f.textPosition,b=t().innerRadius(0).outerRadius(185),x=t().innerRadius(185*y).outerRadius(185*y);m.append(`circle`).attr(`cx`,0).attr(`cy`,0).attr(`r`,185+_/2).attr(`class`,`pieOuterCircle`);let S=u.getSections(),C=P(S),w=[g.pie1,g.pie2,g.pie3,g.pie4,g.pie5,g.pie6,g.pie7,g.pie8,g.pie9,g.pie10,g.pie11,g.pie12],T=0;S.forEach(e=>{T+=e});let E=C.filter(e=>(e.data.value/T*100).toFixed(0)!==`0`),D=e(w).domain([...S.keys()]);m.selectAll(`mySlices`).data(E).enter().append(`path`).attr(`d`,b).attr(`fill`,e=>D(e.data.label)).attr(`class`,`pieCircle`),m.selectAll(`mySlices`).data(E).enter().append(`text`).text(e=>(e.data.value/T*100).toFixed(0)+`%`).attr(`transform`,e=>`translate(`+x.centroid(e)+`)`).style(`text-anchor`,`middle`).attr(`class`,`slice`);let O=m.append(`text`).text(u.getDiagramTitle()).attr(`x`,0).attr(`y`,-400/2).attr(`class`,`pieTitleText`),k=[...S.entries()].map(([e,t])=>({label:e,value:t})),A=m.selectAll(`.legend`).data(k).enter().append(`g`).attr(`class`,`legend`).attr(`transform`,(e,t)=>{let n=22*k.length/2;return`translate(216,`+(t*22-n)+`)`});A.append(`rect`).attr(`width`,18).attr(`height`,18).style(`fill`,e=>D(e.label)).style(`stroke`,e=>D(e.label)),A.append(`text`).attr(`x`,22).attr(`y`,14).text(e=>u.getShowData()?`${e.label} [${e.value}]`:e.label);let j=512+Math.max(...A.selectAll(`text`).nodes().map(e=>e?.getBoundingClientRect().width??0)),M=O.node()?.getBoundingClientRect().width??0,N=450/2-M/2,F=450/2+M/2,I=Math.min(0,N),L=Math.max(j,F)-I;p.attr(`viewBox`,`${I} 0 ${L} 450`),h(p,450,L,f.useMaxWidth)},`draw`)},styles:N};export{F as diagram};