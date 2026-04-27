import{At as e,Ct as t,Et as n,K as r,Kt as i,Nt as a,Ot as o,Ut as s,Wt as c,an as l,in as u,j as d,jt as f,kt as p}from"./index-BrMLh57h.js";import{t as m}from"./chunk-4BX2VUAB-DZazPAm6.js";import{t as h}from"./mermaid-parser.core-2R1JViJw.js";var g=o.packet,_=class{constructor(){this.packet=[],this.setAccTitle=c,this.getAccTitle=e,this.setDiagramTitle=i,this.getDiagramTitle=a,this.getAccDescription=p,this.setAccDescription=s}static{u(this,`PacketDB`)}getConfig(){let e=d({...g,...f().packet});return e.showBits&&(e.paddingY+=10),e}getPacket(){return this.packet}pushWord(e){e.length>0&&this.packet.push(e)}clear(){t(),this.packet=[]}},v=1e4,y=u((e,t)=>{m(e,t);let n=-1,r=[],i=1,{bitsPerRow:a}=t.getConfig();for(let{start:o,end:s,bits:c,label:u}of e.blocks){if(o!==void 0&&s!==void 0&&s<o)throw Error(`Packet block ${o} - ${s} is invalid. End must be greater than start.`);if(o??=n+1,o!==n+1)throw Error(`Packet block ${o} - ${s??o} is not contiguous. It should start from ${n+1}.`);if(c===0)throw Error(`Packet block ${o} is invalid. Cannot have a zero bit field.`);for(s??=o+(c??1)-1,c??=s-o+1,n=s,l.debug(`Packet block ${o} - ${n} with label ${u}`);r.length<=a+1&&t.getPacket().length<v;){let[e,n]=b({start:o,end:s,bits:c,label:u},i,a);if(r.push(e),e.end+1===i*a&&(t.pushWord(r),r=[],i++),!n)break;({start:o,end:s,bits:c,label:u}=n)}}t.pushWord(r)},`populate`),b=u((e,t,n)=>{if(e.start===void 0)throw Error(`start should have been set during first phase`);if(e.end===void 0)throw Error(`end should have been set during first phase`);if(e.start>e.end)throw Error(`Block start ${e.start} is greater than block end ${e.end}.`);if(e.end+1<=t*n)return[e,void 0];let r=t*n-1,i=t*n;return[{start:e.start,end:r,label:e.label,bits:r-e.start},{start:i,end:e.end,label:e.label,bits:e.end-i}]},`getNextFittingBlock`),x={parser:{yy:void 0},parse:u(async e=>{let t=await h(`packet`,e),n=x.parser?.yy;if(!(n instanceof _))throw Error(`parser.parser?.yy was not a PacketDB. This is due to a bug within Mermaid, please report this issue at https://github.com/mermaid-js/mermaid/issues.`);l.debug(t),y(t,n)},`parse`)},S=u((e,t,i,a)=>{let o=a.db,s=o.getConfig(),{rowHeight:c,paddingY:l,bitWidth:u,bitsPerRow:d}=s,f=o.getPacket(),p=o.getDiagramTitle(),m=c+l,h=m*(f.length+1)-(p?0:c),g=u*d+2,_=r(t);_.attr(`viewBox`,`0 0 ${g} ${h}`),n(_,h,g,s.useMaxWidth);for(let[e,t]of f.entries())C(_,t,e,s);_.append(`text`).text(p).attr(`x`,g/2).attr(`y`,h-m/2).attr(`dominant-baseline`,`middle`).attr(`text-anchor`,`middle`).attr(`class`,`packetTitle`)},`draw`),C=u((e,t,n,{rowHeight:r,paddingX:i,paddingY:a,bitWidth:o,bitsPerRow:s,showBits:c})=>{let l=e.append(`g`),u=n*(r+a)+a;for(let e of t){let t=e.start%s*o+1,n=(e.end-e.start+1)*o-i;if(l.append(`rect`).attr(`x`,t).attr(`y`,u).attr(`width`,n).attr(`height`,r).attr(`class`,`packetBlock`),l.append(`text`).attr(`x`,t+n/2).attr(`y`,u+r/2).attr(`class`,`packetLabel`).attr(`dominant-baseline`,`middle`).attr(`text-anchor`,`middle`).text(e.label),!c)continue;let a=e.end===e.start,d=u-2;l.append(`text`).attr(`x`,t+(a?n/2:0)).attr(`y`,d).attr(`class`,`packetByte start`).attr(`dominant-baseline`,`auto`).attr(`text-anchor`,a?`middle`:`start`).text(e.start),a||l.append(`text`).attr(`x`,t+n).attr(`y`,d).attr(`class`,`packetByte end`).attr(`dominant-baseline`,`auto`).attr(`text-anchor`,`end`).text(e.end)}},`drawWord`),w={draw:S},T={byteFontSize:`10px`,startByteColor:`black`,endByteColor:`black`,labelColor:`black`,labelFontSize:`12px`,titleColor:`black`,titleFontSize:`14px`,blockStrokeColor:`black`,blockStrokeWidth:`1`,blockFillColor:`#efefef`},E={parser:x,get db(){return new _},renderer:w,styles:u(({packet:e}={})=>{let t=d(T,e);return`
	.packetByte {
		font-size: ${t.byteFontSize};
	}
	.packetByte.start {
		fill: ${t.startByteColor};
	}
	.packetByte.end {
		fill: ${t.endByteColor};
	}
	.packetLabel {
		fill: ${t.labelColor};
		font-size: ${t.labelFontSize};
	}
	.packetTitle {
		fill: ${t.titleColor};
		font-size: ${t.titleFontSize};
	}
	.packetBlock {
		stroke: ${t.blockStrokeColor};
		stroke-width: ${t.blockStrokeWidth};
		fill: ${t.blockFillColor};
	}
	`},`styles`)};export{E as diagram};