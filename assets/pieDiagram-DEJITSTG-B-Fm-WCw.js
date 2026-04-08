import{B as e,C as t,V as n,W as r,_ as i,a,b as o,c as s,d as c,v as l}from"./chunk-ICPOFSXX-CESxJ-AO.js";import{g as u,h as d}from"./src-C47h8eAM.js";import{t as f}from"./ordinal-BDTCIhXR.js";import{n as p}from"./path-CIRGLb_6.js";import{m}from"./dist-BXMOO6xX.js";import{t as h}from"./arc-DnBiFT6Q.js";import{t as g}from"./array-BCJ35G43.js";import{f as _,r as v}from"./chunk-5PVQY5BW-B68Rw995.js";import{t as y}from"./chunk-426QAEUC-DDKKlq6g.js";import{t as b}from"./chunk-4BX2VUAB-BFhb-2wS.js";import{t as x}from"./mermaid-parser.core-CsvaCJIh.js";function S(e,t){return t<e?-1:t>e?1:t>=e?0:NaN}function C(e){return e}function w(){var e=C,t=S,n=null,r=p(0),i=p(m),a=p(0);function o(o){var s,c=(o=g(o)).length,l,u,d=0,f=Array(c),p=Array(c),h=+r.apply(this,arguments),_=Math.min(m,Math.max(-m,i.apply(this,arguments)-h)),v,y=Math.min(Math.abs(_)/c,a.apply(this,arguments)),b=y*(_<0?-1:1),x;for(s=0;s<c;++s)(x=p[f[s]=s]=+e(o[s],s,o))>0&&(d+=x);for(t==null?n!=null&&f.sort(function(e,t){return n(o[e],o[t])}):f.sort(function(e,n){return t(p[e],p[n])}),s=0,u=d?(_-c*b)/d:0;s<c;++s,h=v)l=f[s],x=p[l],v=h+(x>0?x*u:0)+b,p[l]={data:o[l],index:s,value:x,startAngle:h,endAngle:v,padAngle:y};return p}return o.value=function(t){return arguments.length?(e=typeof t==`function`?t:p(+t),o):e},o.sortValues=function(e){return arguments.length?(t=e,n=null,o):t},o.sort=function(e){return arguments.length?(n=e,t=null,o):n},o.startAngle=function(e){return arguments.length?(r=typeof e==`function`?e:p(+e),o):r},o.endAngle=function(e){return arguments.length?(i=typeof e==`function`?e:p(+e),o):i},o.padAngle=function(e){return arguments.length?(a=typeof e==`function`?e:p(+e),o):a},o}var T=c.pie,E={sections:new Map,showData:!1,config:T},D=E.sections,O=E.showData,k=structuredClone(T),A={getConfig:d(()=>structuredClone(k),`getConfig`),clear:d(()=>{D=new Map,O=E.showData,a()},`clear`),setDiagramTitle:r,getDiagramTitle:t,setAccTitle:n,getAccTitle:l,setAccDescription:e,getAccDescription:i,addSection:d(({label:e,value:t})=>{if(t<0)throw Error(`"${e}" has invalid value: ${t}. Negative values are not allowed in pie charts. All slice values must be >= 0.`);D.has(e)||(D.set(e,t),u.debug(`added new section: ${e}, with value: ${t}`))},`addSection`),getSections:d(()=>D,`getSections`),setShowData:d(e=>{O=e},`setShowData`),getShowData:d(()=>O,`getShowData`)},j=d((e,t)=>{b(e,t),t.setShowData(e.showData),e.sections.map(t.addSection)},`populateDb`),M={parse:d(async e=>{let t=await x(`pie`,e);u.debug(t),j(t,A)},`parse`)},N=d(e=>`
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
`,`getStyles`),P=d(e=>{let t=[...e.values()].reduce((e,t)=>e+t,0),n=[...e.entries()].map(([e,t])=>({label:e,value:t})).filter(e=>e.value/t*100>=1);return w().value(e=>e.value).sort(null)(n)},`createPieArcs`),F={parser:M,db:A,renderer:{draw:d((e,t,n,r)=>{u.debug(`rendering pie chart
`+e);let i=r.db,a=o(),c=v(i.getConfig(),a.pie),l=y(t),d=l.append(`g`);d.attr(`transform`,`translate(225,225)`);let{themeVariables:p}=a,[m]=_(p.pieOuterStrokeWidth);m??=2;let g=c.textPosition,b=h().innerRadius(0).outerRadius(185),x=h().innerRadius(185*g).outerRadius(185*g);d.append(`circle`).attr(`cx`,0).attr(`cy`,0).attr(`r`,185+m/2).attr(`class`,`pieOuterCircle`);let S=i.getSections(),C=P(S),w=[p.pie1,p.pie2,p.pie3,p.pie4,p.pie5,p.pie6,p.pie7,p.pie8,p.pie9,p.pie10,p.pie11,p.pie12],T=0;S.forEach(e=>{T+=e});let E=C.filter(e=>(e.data.value/T*100).toFixed(0)!==`0`),D=f(w).domain([...S.keys()]);d.selectAll(`mySlices`).data(E).enter().append(`path`).attr(`d`,b).attr(`fill`,e=>D(e.data.label)).attr(`class`,`pieCircle`),d.selectAll(`mySlices`).data(E).enter().append(`text`).text(e=>(e.data.value/T*100).toFixed(0)+`%`).attr(`transform`,e=>`translate(`+x.centroid(e)+`)`).style(`text-anchor`,`middle`).attr(`class`,`slice`);let O=d.append(`text`).text(i.getDiagramTitle()).attr(`x`,0).attr(`y`,-400/2).attr(`class`,`pieTitleText`),k=[...S.entries()].map(([e,t])=>({label:e,value:t})),A=d.selectAll(`.legend`).data(k).enter().append(`g`).attr(`class`,`legend`).attr(`transform`,(e,t)=>{let n=22*k.length/2;return`translate(216,`+(t*22-n)+`)`});A.append(`rect`).attr(`width`,18).attr(`height`,18).style(`fill`,e=>D(e.label)).style(`stroke`,e=>D(e.label)),A.append(`text`).attr(`x`,22).attr(`y`,14).text(e=>i.getShowData()?`${e.label} [${e.value}]`:e.label);let j=512+Math.max(...A.selectAll(`text`).nodes().map(e=>e?.getBoundingClientRect().width??0)),M=O.node()?.getBoundingClientRect().width??0,N=450/2-M/2,F=450/2+M/2,I=Math.min(0,N),L=Math.max(j,F)-I;l.attr(`viewBox`,`${I} 0 ${L} 450`),s(l,450,L,c.useMaxWidth)},`draw`)},styles:N};export{F as diagram};