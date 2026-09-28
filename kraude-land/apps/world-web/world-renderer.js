const VERT=`#version 300 es
in vec3 aPosition;
uniform mat4 uMVP;
void main(){gl_Position=uMVP*vec4(aPosition,1.0);}`;
const FRAG=`#version 300 es
precision highp float;
uniform vec3 uColor;
out vec4 outColor;
void main(){outColor=vec4(uColor,1.0);}`;

function shader(gl,type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s}
function program(gl){const p=gl.createProgram();gl.attachShader(p,shader(gl,gl.VERTEX_SHADER,VERT));gl.attachShader(p,shader(gl,gl.FRAGMENT_SHADER,FRAG));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p}
const cube=new Float32Array([
-1,-1,-1, 1,-1,-1, 1,1,-1,-1,-1,-1,1,1,-1,-1,1,-1,
-1,-1,1, 1,1,1, 1,-1,1,-1,-1,1,-1,1,1,1,1,1,
-1,-1,-1,-1,1,-1,-1,1,1,-1,-1,-1,-1,1,1,-1,-1,1,
1,-1,-1,1,-1,1,1,1,1,1,-1,-1,1,1,1,1,1,-1,
-1,-1,-1,-1,-1,1,1,-1,1,-1,-1,-1,1,-1,1,1,-1,-1,
-1,1,-1,1,1,1,-1,1,1,-1,1,-1,1,1,-1,1,1,1
]);
const I=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
function mul(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[0*4+r]*b[c*4+0]+a[1*4+r]*b[c*4+1]+a[2*4+r]*b[c*4+2]+a[3*4+r]*b[c*4+3];return o}
function perspective(fovy,aspect,n,f){const t=1/Math.tan(fovy/2),o=new Float32Array(16);o[0]=t/aspect;o[5]=t;o[10]=(f+n)/(n-f);o[11]=-1;o[14]=2*f*n/(n-f);return o}
function norm(v){const l=Math.hypot(...v)||1;return v.map(x=>x/l)}
const sub=(a,b)=>a.map((x,i)=>x-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
function lookAt(e,c,up=[0,1,0]){const z=norm(sub(e,c)),x=norm(cross(up,z)),y=cross(z,x),o=I();o[0]=x[0];o[1]=y[0];o[2]=z[0];o[4]=x[1];o[5]=y[1];o[6]=z[1];o[8]=x[2];o[9]=y[2];o[10]=z[2];o[12]=-dot(x,e);o[13]=-dot(y,e);o[14]=-dot(z,e);return o}
function trs(x,y,z,sx,sy,sz,ry=0){const c=Math.cos(ry),s=Math.sin(ry),o=I();o[0]=c*sx;o[2]=-s*sx;o[5]=sy;o[8]=s*sz;o[10]=c*sz;o[12]=x;o[13]=y;o[14]=z;return o}
function transformPoint(m,p){const [x,y,z]=p,w=m[3]*x+m[7]*y+m[11]*z+m[15];return [(m[0]*x+m[4]*y+m[8]*z+m[12])/w,(m[1]*x+m[5]*y+m[9]*z+m[13])/w,(m[2]*x+m[6]*y+m[10]*z+m[14])/w]}
const colors={ground:[.035,.095,.085],wall:[.12,.18,.22],rift:[.25,.45,.95],synthesis:[.48,.22,.6],workshop:[.65,.38,.18],armory:[.35,.42,.5],plaza:[.55,.5,.27],alchemy:[.2,.55,.42],dorm:[.28,.35,.48],training:[.5,.25,.2],airship:[.18,.45,.55],agent:[.12,.9,.95],construction:[.05,.95,1]};

export function createWorldRenderer(canvas,{onPick}={}){
 const gl=canvas.getContext('webgl2',{antialias:true});if(!gl)throw new Error('webgl2 required');const p=program(gl),locPos=gl.getAttribLocation(p,'aPosition'),locM=gl.getUniformLocation(p,'uMVP'),locC=gl.getUniformLocation(p,'uColor');const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,cube,gl.STATIC_DRAW);gl.enableVertexAttribArray(locPos);gl.vertexAttribPointer(locPos,3,gl.FLOAT,false,0,0);gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);
 let snapshot={facilities:[],agents:[]},camera='MASTER',selected='workshop',yaw=.72,pitch=.72,radius=30,walk=[0,2.1,12],lastVP=I();
 function resize(){const d=Math.min(devicePixelRatio,2);const w=Math.floor(canvas.clientWidth*d),h=Math.floor(canvas.clientHeight*d);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}gl.viewport(0,0,w,h)}
 function cameraMatrices(){const aspect=Math.max(1,canvas.width)/Math.max(1,canvas.height);let eye,center=[0,0.8,0];if(camera==='MASTER'){eye=[Math.sin(yaw)*Math.cos(pitch)*radius,Math.sin(pitch)*radius,Math.cos(yaw)*Math.cos(pitch)*radius]}else if(camera==='WALK'){eye=walk;center=[walk[0],walk[1]-.3,walk[2]-6]}else{const f=snapshot.facilities.find(x=>x.id===selected)||{x:-3,z:-5};eye=[f.x+5,4,f.z+6];center=[f.x,1.3,f.z]}const view=lookAt(eye,center),proj=perspective(Math.PI/4,aspect,.1,100);lastVP=mul(proj,view);return lastVP}
 function draw(model,color){const mvp=mul(lastVP,model);gl.uniformMatrix4fv(locM,false,mvp);gl.uniform3fv(locC,color);gl.drawArrays(gl.TRIANGLES,0,36)}
 function render(){resize();gl.clearColor(.01,.025,.045,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(p);cameraMatrices();draw(trs(0,-.6,0,12,.4,12),colors.ground);for(let i=0;i<32;i++){const a=i/32*Math.PI*2,x=Math.sin(a)*11.5,z=Math.cos(a)*11.5;draw(trs(x,.6,z,1.25,1.2,.32,a),colors.wall)}for(const f of snapshot.facilities||[]){const tier=f.tier||1,h=1+.35*tier;draw(trs(f.x,h/2-.15,f.z,1.25+tier*.08,h,1.25+tier*.08),f.construction==='CYAN_HOLOGRAPHIC'?colors.construction:(colors[f.id]||[.35,.45,.5]))}for(const a of snapshot.agents||[]){draw(trs(a.x,.38,a.z,.22,.45,.22),colors.agent)}requestAnimationFrame(render)}
 let drag=false,lx=0,ly=0;canvas.addEventListener('pointerdown',e=>{drag=true;lx=e.clientX;ly=e.clientY;canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(!drag||camera!=='MASTER')return;const dx=e.clientX-lx,dy=e.clientY-ly;lx=e.clientX;ly=e.clientY;yaw-=dx*.006;pitch=Math.max(.2,Math.min(1.25,pitch-dy*.006))});canvas.addEventListener('pointerup',()=>drag=false);canvas.addEventListener('wheel',e=>{if(camera==='MASTER')radius=Math.max(14,Math.min(55,radius+e.deltaY*.02))},{passive:true});
 addEventListener('keydown',e=>{if(camera!=='WALK')return;const k=e.key.toLowerCase(),step=.55;if(k==='w')walk[2]-=step;if(k==='s')walk[2]+=step;if(k==='a')walk[0]-=step;if(k==='d')walk[0]+=step});
 canvas.addEventListener('click',e=>{if(drag)return;const rect=canvas.getBoundingClientRect(),mx=(e.clientX-rect.left)/rect.width*2-1,my=1-(e.clientY-rect.top)/rect.height*2;let best=null;for(const f of snapshot.facilities||[]){const q=transformPoint(lastVP,[f.x,1,f.z]),dist=Math.hypot(q[0]-mx,q[1]-my);if(!best||dist<best.dist)best={dist,f}}if(best&&best.dist<.14){selected=best.f.id;onPick?.({kind:'facility',data:best.f});if(camera==='BUILDING')camera='BUILDING'}});
 requestAnimationFrame(render);return {setSnapshot(s){snapshot=s||snapshot},setCamera(c){camera=c},getCamera(){return camera},selectFacility(id){selected=id;camera='BUILDING'},destroy(){}};
}
