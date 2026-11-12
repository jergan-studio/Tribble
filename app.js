/* Tribble — browser game studio */
const $ = (id) => document.getElementById(id);
const state = { projectId: crypto.randomUUID(), title: "Untitled game", sprites: [{id:crypto.randomUUID(),name:"Player",x:320,y:200,size:48,color:"#8b7cff"}], selected:0, workspace:null, running:false, projects:[] };
const canvas=$("game-canvas"),ctx=canvas.getContext("2d"),imageCache=new Map();
const sprite=()=>state.sprites[state.selected];
function setSaved(message="● All changes saved"){ $("save-state").textContent=message; }
function drawStage(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle="#20283a";ctx.fillRect(0,0,640,400);
  ctx.strokeStyle="#ffffff0a";ctx.lineWidth=1;
  for(let x=0;x<=640;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,400);ctx.stroke()}
  for(let y=0;y<=400;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(640,y);ctx.stroke()}
  state.sprites.forEach((s,i)=>{ctx.save();if(s.hidden){ctx.restore();return}if(s.image){let img=imageCache.get(s.id);if(!img){img=new Image();img.onload=drawStage;img.src=s.image;imageCache.set(s.id,img)}if(img.complete&&img.naturalWidth){ctx.drawImage(img,s.x-s.size/2,s.y-s.size/2,s.size,s.size)}}else{ctx.fillStyle=s.color;ctx.shadowColor=s.color;ctx.shadowBlur=i===state.selected?18:8;ctx.beginPath();ctx.arc(s.x,s.y,s.size/2,0,Math.PI*2);ctx.fill()}ctx.shadowBlur=0;ctx.fillStyle="#fff";ctx.font="12px DM Sans";ctx.textAlign="center";ctx.fillText(s.name,s.x,s.y+s.size/2+17);if(i===state.selected&&!state.running){ctx.strokeStyle="#b9afff";ctx.setLineDash([4,4]);ctx.beginPath();ctx.arc(s.x,s.y,s.size/2+7,0,Math.PI*2);ctx.stroke()}ctx.restore()});
  $("stage-empty").classList.toggle("hidden",state.sprites.length>0);
}
function renderSprites(){
  $("sprite-list").innerHTML="";
  state.sprites.forEach((s,i)=>{const b=document.createElement("button");b.className="sprite-card"+(i===state.selected?" selected":"");b.innerHTML='<span class="sprite-preview" style="color:'+s.color+'">●</span><span><strong></strong><small>Sprite</small></span><span class="selected-check">'+(i===state.selected?"✓":"")+'</span>';b.querySelector("strong").textContent=s.name;b.onclick=()=>{state.selected=i;renderSprites();fillInspector();drawStage()};$("sprite-list").appendChild(b)});
  fillInspector();
}
function fillInspector(){const s=sprite();if(!s)return;$("sprite-name").value=s.name;$("sprite-x").value=s.x;$("sprite-y").value=s.y;$("sprite-size").value=s.size;$("sprite-color").value=s.color}
function updateSprite(){const s=sprite();if(!s)return;s.name=$("sprite-name").value||"Sprite";s.x=Number($("sprite-x").value)||0;s.y=Number($("sprite-y").value)||0;s.size=Math.max(8,Math.min(200,Number($("sprite-size").value)||48));s.color=$("sprite-color").value;renderSprites();drawStage();setSaved("● Unsaved changes")}
["sprite-name","sprite-x","sprite-y","sprite-size","sprite-color"].forEach(id=>$(id).addEventListener("input",updateSprite));
const PESC_BLOCKS=[
 {type:"event_when_run",category:"Events",label:"when green flag clicked",color:"event"},
 {type:"event_when_key",category:"Events",label:"when key pressed",color:"event",key:true},
 {type:"move_sprite",category:"Motion",label:"move sprite",color:"motion",sprite:true,field:"steps",value:10,suffix:"pixels"},
 {type:"set_position",category:"Motion",label:"set sprite position",color:"motion",sprite:true,field:"x",value:320,field2:"y",value2:200},
 {type:"change_x",category:"Motion",label:"change X by",color:"motion",field:"amount",value:10},
 {type:"change_y",category:"Motion",label:"change Y by",color:"motion",field:"amount",value:10},
 {type:"turn_sprite",category:"Motion",label:"turn degrees",color:"motion",field:"degrees",value:15},
 {type:"go_to_position",category:"Motion",label:"go to position",color:"motion",field:"x",value:320,field2:"y",value2:200},
 {type:"say_text",category:"Looks",label:"say",color:"looks",field:"text",value:"Hello!"},
 {type:"change_color",category:"Looks",label:"change sprite color",color:"looks",sprite:true},
 {type:"show_sprite",category:"Looks",label:"show sprite",color:"looks",sprite:true},
 {type:"hide_sprite",category:"Looks",label:"hide sprite",color:"looks",sprite:true},
 {type:"controls_wait",category:"Control",label:"wait seconds",color:"control",field:"seconds",value:1},
 {type:"repeat",category:"Control",label:"repeat",color:"control",field:"times",value:10},
 {type:"key_pressed",category:"Input",label:"key is pressed",color:"input",key:true}
];
const BLOCK_CATEGORIES=["Events","Motion","Looks","Control","Input"];
state.blocks=[];
let activeBlockCategory="Events";
function createBlock(type,values={}){const def=PESC_BLOCKS.find(b=>b.type===type);return {id:crypto.randomUUID(),type, spriteId:values.spriteId??state.sprites[0]?.id??"", key:values.key??"SPACE", value:values.value??def.value, value2:values.value2??def.value2};}
function initBlockEditor(){
 const cats=$("palette-categories"),items=$("palette-items");
 cats.innerHTML=BLOCK_CATEGORIES.map(c=>'<button class="palette-category" data-category="'+c+'">'+c+'</button>').join("");
 cats.querySelectorAll("button").forEach(b=>b.onclick=()=>{activeBlockCategory=b.dataset.category;renderPalette()});
 renderPalette();renderBlocks();
}
function renderPalette(){
 $("palette-categories").querySelectorAll("button").forEach(b=>b.classList.toggle("active",b.dataset.category===activeBlockCategory));
 const items=$("palette-items");items.innerHTML="";
 PESC_BLOCKS.filter(b=>b.category===activeBlockCategory).forEach(def=>{
  const btn=document.createElement("button");btn.className="palette-block "+def.color;btn.textContent=def.label;btn.onclick=()=>{state.blocks.push(createBlock(def.type));renderBlocks();renderPesc();setSaved("● Unsaved changes")};items.appendChild(btn);
 });
}
function renderBlocks(){
 const host=$("script-blocks");host.innerHTML="";
 if(!state.blocks.length){host.innerHTML='<div class="script-empty"><span>＋</span><strong>Your script is empty</strong><small>Choose a block from the left to start building.</small></div>';return}
 state.blocks.forEach((block,index)=>{
  const def=PESC_BLOCKS.find(b=>b.type===block.type);if(!def)return;
  const card=document.createElement("div");card.className="script-block "+def.color;card.draggable=true;card.dataset.index=index;
  const title=document.createElement("strong");title.textContent=def.label;card.appendChild(title);
  if(def.sprite){const select=document.createElement("select");state.sprites.forEach(s=>{const o=document.createElement("option");o.value=s.id;o.textContent=s.name;select.appendChild(o)});select.value=block.spriteId;select.onchange=()=>{block.spriteId=select.value;renderPesc();setSaved("● Unsaved changes")};card.appendChild(select)}
  if(def.key){const select=document.createElement("select");["SPACE","ARROWUP","ARROWDOWN","ARROWLEFT","ARROWRIGHT","A","D","W","S"].forEach(k=>{const o=document.createElement("option");o.value=k;o.textContent=k;select.appendChild(o)});select.value=block.key||"SPACE";select.onchange=()=>{block.key=select.value;renderPesc();setSaved("● Unsaved changes")};card.appendChild(select)}
  if(def.field){const input=document.createElement("input");input.type=def.field==="text"?"text":"number";input.value=block.value??"";input.setAttribute("aria-label",def.field);input.oninput=()=>{block.value=input.type==="number"?Number(input.value):input.value;renderPesc();setSaved("● Unsaved changes")};card.appendChild(input)}
  if(def.field2){const second=document.createElement("label");second.textContent="Y";const input=document.createElement("input");input.type="number";input.value=block.value2??200;input.oninput=()=>{block.value2=Number(input.value);renderPesc();setSaved("● Unsaved changes")};second.appendChild(input);card.appendChild(second)}
  const remove=document.createElement("button");remove.className="block-remove";remove.textContent="×";remove.title="Remove block";remove.onclick=()=>{state.blocks.splice(index,1);renderBlocks();renderPesc();setSaved("● Unsaved changes")};card.appendChild(remove);
  card.ondragstart=e=>{e.dataTransfer.setData("text/plain",String(index));card.classList.add("dragging")};card.ondragend=()=>card.classList.remove("dragging");card.ondragover=e=>e.preventDefault();card.ondrop=e=>{e.preventDefault();const from=Number(e.dataTransfer.getData("text/plain"));const [moved]=state.blocks.splice(from,1);state.blocks.splice(index,0,moved);renderBlocks();renderPesc();setSaved("● Unsaved changes")};
  host.appendChild(card);
 });
}
$("clear-blocks").onclick=()=>{state.blocks=[];renderBlocks();renderPesc();setSaved("● Unsaved changes")};
function renderPesc(){
  if(!state.workspace)return;
  
  const pesc=code.replace(/\/\* when game starts \*\//g,"when green flag clicked")
    .replace(/moveSprite\(/g,"move(").replace(/setPosition\(/g,"set position(")
    .replace(/say\(/g,"say(").replace(/changeColor\(/g,"change color(")
    .replace(/turn\(/g,"turn ").replace(/goTo\(/g,"go to ")
    .replace(/changeX\(/g,"change x by ").replace(/changeY\(/g,"change y by ")
    .replace(/showSprite\(/g,"show sprite ").replace(/hideSprite\(/g,"hide sprite ")
    .replace(/wait\(/g,"wait ");
  $("pesc-output").textContent="// PESC · Partial Eclipse Script\n// Scratch-inspired game commands\n\n"+(pesc.trim()||"// Add blocks to start creating your game.");
}
function runGame(){
 state.running=true;let message="";
 const findSprite=id=>state.sprites.find(s=>s.id===id);
 for(const b of state.blocks){
  const s=findSprite(b.spriteId)||sprite();const n=Number(b.value)||0;
  if(b.type==="move_sprite"&&s)s.x=Math.max(0,Math.min(640,s.x+n));
  else if(b.type==="set_position"&&s){s.x=Number(b.value)||0;s.y=Number(b.value2)||0}
  else if(b.type==="change_x"&&sprite())sprite().x+=n;
  else if(b.type==="change_y"&&sprite())sprite().y+=n;
  else if(b.type==="go_to_position"&&sprite()){sprite().x=Number(b.value)||0;sprite().y=Number(b.value2)||0}
  else if(b.type==="say_text")message=String(b.value??"");
  else if(b.type==="change_color"&&s)s.color="#"+Math.floor(Math.random()*16777215).toString(16).padStart(6,"0");
  else if(b.type==="show_sprite"&&s)s.hidden=false;
  else if(b.type==="hide_sprite"&&s)s.hidden=true;
  else if(b.type==="turn_sprite"&&s)s.rotation=(s.rotation||0)+n;
 }
 drawStage();$("stage-status").textContent=message||"Game ran successfully";if(message)alert(message);
 state.running=false;renderSprites();
}
