/* Tribble — browser game studio */
const $ = (id) => document.getElementById(id);
const state = { projectId: crypto.randomUUID(), title: "Untitled game", blocks:[], sprites: [{id:crypto.randomUUID(),name:"Player",x:320,y:200,size:48,color:"#8b7cff"}], selected:0, workspace:null, running:false, projects:[] };
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
  const btn=document.createElement("button");btn.className="palette-block "+def.color;btn.textContent=def.label;btn.draggable=true;btn.title="Drag into the script workspace";btn.ondragstart=e=>{e.dataTransfer.effectAllowed="copy";e.dataTransfer.setData("application/x-tribble-block",def.type);btn.classList.add("dragging")};btn.ondragend=()=>btn.classList.remove("dragging");btn.onclick=()=>insertNewBlock(def.type,state.blocks.length);items.appendChild(btn);
 });
}
function insertNewBlock(type,index){
 const block=createBlock(type);state.blocks.splice(Math.max(0,Math.min(index,state.blocks.length)),0,block);
 renderBlocks();renderPesc();setSaved("● Unsaved changes");
}
function blockDropIndex(event){
 const card=event.target.closest(".script-block");
 if(!card)return state.blocks.length;
 const rect=card.getBoundingClientRect();
 return Number(card.dataset.index)+(event.clientY>rect.top+rect.height/2?1:0);
}
function renderBlocks(){
 const host=$("script-blocks");host.innerHTML="";
 host.ondragover=e=>{if(e.dataTransfer.types.includes("application/x-tribble-block")||e.dataTransfer.types.includes("text/plain")){e.preventDefault();e.dataTransfer.dropEffect="copy"}};
 host.ondrop=e=>{
  e.preventDefault();
  const type=e.dataTransfer.getData("application/x-tribble-block");
  if(type&&PESC_BLOCKS.some(def=>def.type===type)){insertNewBlock(type,blockDropIndex(e));return}
  const raw=e.dataTransfer.getData("text/plain");
  if(raw!==""){const from=Number(raw);if(Number.isInteger(from)&&from>=0&&from<state.blocks.length){const to=blockDropIndex(e);const [moved]=state.blocks.splice(from,1);state.blocks.splice(Math.max(0,Math.min(to>from?to-1:to,state.blocks.length)),0,moved);renderBlocks();renderPesc();setSaved("● Unsaved changes")}}
 };
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
  card.ondragstart=e=>{e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",String(index));card.classList.add("dragging")};card.ondragend=()=>card.classList.remove("dragging");card.ondragover=e=>e.preventDefault();
  host.appendChild(card);
 });
}
$("clear-blocks").onclick=()=>{state.blocks=[];renderBlocks();renderPesc();setSaved("● Unsaved changes")};
function renderPesc(){
 const lines=state.blocks.map(block=>{
  const target=state.sprites.find(s=>s.id===block.spriteId);
  const name=target?JSON.stringify(target.name):'"Player"';
  switch(block.type){
   case "event_when_run":return "when green flag clicked";
   case "event_when_key":return "when "+(block.key||"SPACE").toLowerCase()+" key pressed";
   case "move_sprite":return "move "+name+" by "+block.value+" pixels";
   case "set_position":return "set "+name+" position to x: "+block.value+" y: "+block.value2;
   case "change_x":return "change x by "+block.value;
   case "change_y":return "change y by "+block.value;
   case "turn_sprite":return "turn "+block.value+" degrees";
   case "go_to_position":return "go to x: "+block.value+" y: "+block.value2;
   case "say_text":return "say "+JSON.stringify(block.value);
   case "change_color":return "change color of "+name;
   case "show_sprite":return "show "+name;
   case "hide_sprite":return "hide "+name;
   case "controls_wait":return "wait "+block.value+" seconds";
   case "repeat":return "repeat "+block.value+" times";
   case "key_pressed":return "key "+(block.key||"SPACE").toLowerCase()+" pressed?";
   default:return block.type;
  }
 });
 $("pesc-output").textContent="// PESC · Partial Eclipse Script\n// Tribble native visual blocks\n\n"+(lines.join("\n")||"// Add blocks to start creating your game.");
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

function projectData(){return {id:state.projectId,title:state.title,sprites:state.sprites,blocks:state.blocks,updatedAt:new Date().toISOString()}}
async function saveProject(){
 const data=projectData();setSaved("● Saving…");localStorage.setItem("tribble:"+state.projectId,JSON.stringify(data));
 try{const response=await fetch("/api/projects",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});if(!response.ok)throw new Error("API unavailable");setSaved("● Saved to Tribble cloud")}catch(e){setSaved("● Saved on this device")}
 const list=JSON.parse(localStorage.getItem("tribble-projects")||"[]");if(!list.includes(state.projectId))list.unshift(state.projectId);localStorage.setItem("tribble-projects",JSON.stringify(list));
}
async function loadProject(id){
 let data=null;try{const response=await fetch("/api/projects?id="+encodeURIComponent(id));if(response.ok)data=await response.json()}catch{}
 if(!data)data=JSON.parse(localStorage.getItem("tribble:"+id)||"null");if(!data)return;
 state.projectId=data.id;state.title=data.title||"Untitled game";state.sprites=data.sprites||[];state.blocks=Array.isArray(data.blocks)?data.blocks:[];state.selected=0;
 $("project-title").textContent=state.title;$("heading-title").textContent=state.title;
 renderBlocks();renderPesc();renderSprites();drawStage();showView("editor");
}
function newProject(){
 state.projectId=crypto.randomUUID();state.title="Untitled game";state.sprites=[{id:crypto.randomUUID(),name:"Player",x:320,y:200,size:48,color:"#8b7cff"}];state.blocks=[];state.selected=0;
 $("project-title").textContent=state.title;$("heading-title").textContent=state.title;renderBlocks();renderPesc();renderSprites();drawStage();showView("editor");setSaved("● New project");
}
function showView(view){
 $("hub-view").classList.toggle("hidden",view!=="hub");$("editor-view").classList.toggle("hidden",view!=="editor");$("projects-view").classList.toggle("hidden",view!=="projects");
 document.querySelectorAll(".side-link[data-view]").forEach(button=>button.classList.toggle("active",button.dataset.view===view));if(view==="projects")renderProjects();if(view==="hub")renderHub();
}
function renderHub(){
 const holder=$("hub-project-cards");if(!holder)return;holder.innerHTML="";const ids=JSON.parse(localStorage.getItem("tribble-projects")||"[]").slice(0,4);
 if(!ids.length){holder.innerHTML='<div class="empty-projects">No projects yet. Click New project to start making your first game.</div>';return}
 ids.forEach(id=>{let data;try{data=JSON.parse(localStorage.getItem("tribble:"+id))}catch{}if(!data)return;const card=document.createElement("article");card.className="project-card";card.innerHTML='<div class="project-thumb">✦</div><strong></strong><small></small>';card.querySelector("strong").textContent=data.title;card.querySelector("small").textContent="Open project · "+new Date(data.updatedAt).toLocaleDateString();card.onclick=()=>loadProject(id);holder.appendChild(card)});
}
function renderProjects(){
 const holder=$("project-cards");holder.innerHTML="";const ids=JSON.parse(localStorage.getItem("tribble-projects")||"[]");
 if(!ids.length){holder.innerHTML='<div class="empty-projects">No saved projects yet. Create your first game to see it here.</div>';return}
 ids.forEach(id=>{let data;try{data=JSON.parse(localStorage.getItem("tribble:"+id))}catch{}if(!data)return;const card=document.createElement("article");card.className="project-card";card.innerHTML='<div class="project-thumb">✦</div><strong></strong><small></small>';card.querySelector("strong").textContent=data.title;card.querySelector("small").textContent="Updated "+new Date(data.updatedAt).toLocaleDateString();card.onclick=()=>loadProject(id);holder.appendChild(card)});
}
$("upload-sprite").onclick=()=>$("sprite-upload").click();
$("sprite-upload").onchange=event=>{const file=event.target.files[0];if(!file)return;if(!file.type.startsWith("image/")||file.size>1500000){alert("Choose an image smaller than 1.5 MB.");return}const reader=new FileReader();reader.onload=()=>{const current=sprite();current.image=reader.result;imageCache.delete(current.id);drawStage();setSaved("● Unsaved changes")};reader.readAsDataURL(file);event.target.value=""};
$("add-sprite").onclick=()=>{state.sprites.push({id:crypto.randomUUID(),name:"Sprite "+(state.sprites.length+1),x:320,y:200,size:42,color:"#55d6a4"});state.selected=state.sprites.length-1;renderSprites();drawStage();renderPalette();setSaved("● Unsaved changes")};
$("delete-sprite").onclick=()=>{if(state.sprites.length<2){alert("A game needs at least one sprite.");return}state.sprites.splice(state.selected,1);state.selected=0;renderSprites();drawStage();renderPalette();renderBlocks()};
$("run-button").onclick=runGame;$("save-button").onclick=saveProject;$("reset-stage").onclick=drawStage;
$("rename-button").onclick=()=>{const name=prompt("Name your game",state.title);if(name&&name.trim()){state.title=name.trim();$("project-title").textContent=state.title;$("heading-title").textContent=state.title;setSaved("● Unsaved changes")}};
$("new-project").onclick=$("projects-new").onclick=newProject;
document.querySelectorAll(".side-link[data-view]").forEach(button=>button.onclick=()=>showView(button.dataset.view));
$("hub-new").onclick=newProject;$("hub-open-all").onclick=()=>showView("projects");
document.querySelectorAll(".tab").forEach(button=>button.onclick=()=>{document.querySelectorAll(".tab").forEach(tab=>tab.classList.toggle("active",tab===button));$("block-editor").classList.toggle("hidden",button.dataset.tab!=="blocks");$("pesc-output").classList.toggle("hidden",button.dataset.tab!=="pesc");renderPesc()});
initBlockEditor();renderSprites();drawStage();showView("hub");
async function createShare(mode){
 await saveProject();const response=await fetch("/api/share",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode,project:projectData()})});const result=await response.json();if(!response.ok)throw new Error(result.error||"Could not create share link.");
 const url=new URL(mode==="game"?"/play.html":"/?import=",location.origin);if(mode==="game")url.searchParams.set("id",result.id);else url.searchParams.set("import",result.id);
 await navigator.clipboard.writeText(url.href);alert((mode==="game"?"Game link":"Project copy link")+" copied!\n\n"+url.href);
}
$("share-game").onclick=()=>createShare("game").catch(error=>alert(error.message));
$("share-project").onclick=()=>createShare("project").catch(error=>alert(error.message));
$("export-pesc").onclick=()=>{
 renderPesc();const spriteLines=state.sprites.map(s=>"  sprite "+JSON.stringify(s.name)+" { x = "+s.x+"; y = "+s.y+"; size = "+s.size+"; color = "+JSON.stringify(s.color)+" }").join("\n");
 const code='game '+JSON.stringify(state.title)+' {\n'+spriteLines+'\n\n  // Visual blocks translated to PESC (.pesc)\n'+$("pesc-output").textContent.split("\n").map(line=>"  "+line).join("\n")+'\n}\n';
 const blob=new Blob([code],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=(state.title||"game").replace(/[^a-z0-9_-]+/gi,"-")+".pesc";a.click();URL.revokeObjectURL(url);
};
async function importSharedProject(){
 const id=new URLSearchParams(location.search).get("import");if(!id)return;
 try{const response=await fetch("/api/share?id="+encodeURIComponent(id));const data=await response.json();if(!response.ok)throw new Error(data.error||"Share not found.");
 state.projectId=crypto.randomUUID();state.title=data.title||"Imported game";state.sprites=data.sprites||[];state.blocks=Array.isArray(data.blocks)?data.blocks:[];state.selected=0;
 renderBlocks();renderPesc();$("project-title").textContent=state.title;$("heading-title").textContent=state.title;renderSprites();drawStage();history.replaceState({},"",location.pathname);showView("editor");setSaved("● Imported shared project — save to keep your copy");
 }catch(error){alert("Could not import project: "+error.message)}
}
importSharedProject();
