/* Tribble — browser game studio */
const $ = (id) => document.getElementById(id);
const state = { projectId: crypto.randomUUID(), title: "Untitled game", blocks:[], sprites: [{id:crypto.randomUUID(),name:"Player",x:320,y:200,size:48,color:"#8b7cff"}], selected:0, workspace:null, running:false, projects:[], pescComments:[] };
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
function createBlock(type,values={}){
 const def=PESC_BLOCKS.find(b=>b.type===type);
 return {id:crypto.randomUUID(),type,spriteId:values.spriteId??state.sprites[0]?.id??"",key:values.key??"SPACE",value:values.value??def.value,value2:values.value2??def.value2,x:values.x??24+(state.blocks.length%4)*24,y:values.y??24+state.blocks.length*62};
}
function initBlockEditor(){
 const cats=$("palette-categories");
 cats.innerHTML=BLOCK_CATEGORIES.map(c=>'<button class="palette-category" data-category="'+c+'">'+c+'</button>').join("");
 cats.querySelectorAll("button").forEach(b=>b.onclick=()=>{activeBlockCategory=b.dataset.category;renderPalette()});
 renderPalette();renderBlocks();
}
function renderPalette(){
 $("palette-categories").querySelectorAll("button").forEach(b=>b.classList.toggle("active",b.dataset.category===activeBlockCategory));
 const items=$("palette-items");items.innerHTML="";
 PESC_BLOCKS.filter(b=>b.category===activeBlockCategory).forEach(def=>{
  const btn=document.createElement("button");btn.className="palette-block "+def.color;btn.textContent=def.label;btn.draggable=true;btn.title="Drag anywhere into the workspace";
  btn.ondragstart=e=>{e.dataTransfer.effectAllowed="copy";e.dataTransfer.setData("application/x-tribble-block",def.type);btn.classList.add("dragging")};
  btn.ondragend=()=>btn.classList.remove("dragging");
  btn.onclick=()=>insertNewBlock(def.type);items.appendChild(btn);
 });
}
function insertNewBlock(type,position){
 const p=position||{x:24+(state.blocks.length%4)*24,y:24+state.blocks.length*62};
 const block=createBlock(type,{x:p.x,y:p.y});state.blocks.push(block);
 renderBlocks();renderPesc();setSaved("● Unsaved changes");
}
function renderBlocks(){
 const host=$("script-blocks");host.innerHTML="";
 host.ondragover=e=>{if(e.dataTransfer.types.includes("application/x-tribble-block")||e.dataTransfer.types.includes("text/plain")){e.preventDefault();e.dataTransfer.dropEffect=e.dataTransfer.types.includes("application/x-tribble-block")?"copy":"move"}};
 host.ondrop=e=>{
  e.preventDefault();const rect=host.getBoundingClientRect();
  const x=Math.max(8,Math.round((e.clientX-rect.left+host.scrollLeft-20)/20)*20);
  const y=Math.max(8,Math.round((e.clientY-rect.top+host.scrollTop-20)/20)*20);
  const type=e.dataTransfer.getData("application/x-tribble-block");
  if(type&&PESC_BLOCKS.some(def=>def.type===type)){insertNewBlock(type,{x,y});return}
  const raw=e.dataTransfer.getData("text/plain"),block=state.blocks.find(b=>b.id===raw);
  if(block){block.x=x;block.y=y;state.blocks.sort((a,b)=>(a.y??0)-(b.y??0)||(a.x??0)-(b.x??0));renderBlocks();renderPesc();setSaved("● Unsaved changes")}
 };
 if(!state.blocks.length){host.style.minHeight="340px";host.innerHTML='<div class="script-empty"><span>＋</span><strong>Your script is empty</strong><small>Drag blocks anywhere into this workspace, or click a block to add it.</small></div>';return}
 host.style.minHeight=Math.max(500,...state.blocks.map(b=>(b.y||0)+70))+"px";
 state.blocks.forEach(block=>{
  const def=PESC_BLOCKS.find(b=>b.type===block.type);if(!def)return;
  const card=document.createElement("div");card.className="script-block "+def.color;card.draggable=true;card.dataset.id=block.id;
  card.style.left=(block.x??20)+"px";card.style.top=(block.y??20)+"px";
  const title=document.createElement("strong");title.textContent=def.label;card.appendChild(title);
  if(def.sprite){const select=document.createElement("select");state.sprites.forEach(s=>{const o=document.createElement("option");o.value=s.id;o.textContent=s.name;select.appendChild(o)});select.value=block.spriteId;select.onchange=()=>{block.spriteId=select.value;renderPesc();setSaved("● Unsaved changes")};card.appendChild(select)}
  if(def.key){const select=document.createElement("select");["SPACE","ARROWUP","ARROWDOWN","ARROWLEFT","ARROWRIGHT","A","D","W","S"].forEach(k=>{const o=document.createElement("option");o.value=k;o.textContent=k;select.appendChild(o)});select.value=block.key||"SPACE";select.onchange=()=>{block.key=select.value;renderPesc();setSaved("● Unsaved changes")};card.appendChild(select)}
  if(def.field){const input=document.createElement("input");input.type=def.field==="text"?"text":"number";input.value=block.value??"";input.setAttribute("aria-label",def.field);input.oninput=()=>{block.value=input.type==="number"?Number(input.value):input.value;renderPesc();setSaved("● Unsaved changes")};card.appendChild(input)}
  if(def.field2){const second=document.createElement("label");second.textContent="Y";const input=document.createElement("input");input.type="number";input.value=block.value2??200;input.oninput=()=>{block.value2=Number(input.value);renderPesc();setSaved("● Unsaved changes")};second.appendChild(input);card.appendChild(second)}
  const remove=document.createElement("button");remove.className="block-remove";remove.textContent="×";remove.title="Remove block";remove.onclick=()=>{state.blocks=state.blocks.filter(b=>b.id!==block.id);renderBlocks();renderPesc();setSaved("● Unsaved changes")};card.appendChild(remove);
  card.ondragstart=e=>{e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",block.id);card.classList.add("dragging")};card.ondragend=()=>card.classList.remove("dragging");
  host.appendChild(card);
 });
}
$("clear-blocks").onclick=()=>{state.blocks=[];renderBlocks();renderPesc();setSaved("● Unsaved changes")};
function renderPesc(){
 const lines=state.blocks.map(block=>{
  const target=state.sprites.find(s=>s.id===block.spriteId),name=target?JSON.stringify(target.name):'"Player"';
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
 $("pesc-output").value="// PESC · Partial Eclipse Script\n// Blocks execute from top to bottom (top-left to bottom-right).\n\n"+(lines.join("\n")||"// Add blocks to start creating your game.")+((state.pescComments||[]).length?"\n\n"+state.pescComments.join("\n"):"");
}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function keyName(event){return event.code==="Space"?"SPACE":event.code.replace("ARROW","ARROW").toUpperCase().replace("KEY","")}
async function executeBlocks(blocks,depth=0){
 if(depth>8)return;
 for(let index=0;index<blocks.length;index++){
  const b=blocks[index],s=state.sprites.find(item=>item.id===b.spriteId)||sprite(),n=Number(b.value)||0;
  if(b.type==="event_when_run"||b.type==="event_when_key"||b.type==="key_pressed")continue;
  if(b.type==="move_sprite"&&s){const angle=(s.rotation||0)*Math.PI/180;s.x=Math.max(0,Math.min(640,s.x+Math.cos(angle)*n));s.y=Math.max(0,Math.min(400,s.y+Math.sin(angle)*n))}
  else if(b.type==="set_position"&&s){s.x=Number(b.value)||0;s.y=Number(b.value2)||0}
  else if(b.type==="change_x"&&s)s.x+=n;
  else if(b.type==="change_y"&&s)s.y+=n;
  else if(b.type==="go_to_position"&&s){s.x=Number(b.value)||0;s.y=Number(b.value2)||0}
  else if(b.type==="say_text"){$("stage-status").textContent=String(b.value??"");}
  else if(b.type==="change_color"&&s)s.color="#"+Math.floor(Math.random()*16777215).toString(16).padStart(6,"0");
  else if(b.type==="show_sprite"&&s)s.hidden=false;
  else if(b.type==="hide_sprite"&&s)s.hidden=true;
  else if(b.type==="turn_sprite"&&s)s.rotation=(s.rotation||0)+n;
  else if(b.type==="controls_wait")await sleep(Math.max(0,Math.min(10,n))*1000);
  else if(b.type==="repeat"){const count=Math.max(0,Math.min(100,Math.floor(n))),next=blocks[index+1];if(next){for(let i=0;i<count;i++)await executeBlocks([next],depth+1);index++}}
  drawStage();
  await sleep(16);
 }
}
async function runGame(){
 if(state.running)return;state.running=true;$("run-button").disabled=true;$("stage-status").textContent="Running…";
 try{
  const ordered=[...state.blocks].sort((a,b)=>(a.y??0)-(b.y??0)||(a.x??0)-(b.x??0));
  const start=ordered.findIndex(b=>b.type==="event_when_run");
  await executeBlocks(start>=0?ordered.slice(start+1):ordered);
  $("stage-status").textContent=$("stage-status").textContent==="Running…"?"Game ran successfully":$("stage-status").textContent;
 }catch(error){$("stage-status").textContent="Script error: "+error.message}
 state.running=false;$("run-button").disabled=false;renderSprites();drawStage();
}
document.addEventListener("keydown",async event=>{
 if(state.running||["INPUT","SELECT","TEXTAREA"].includes(document.activeElement?.tagName))return;
 const key=keyName(event),ordered=[...state.blocks].sort((a,b)=>(a.y??0)-(b.y??0)||(a.x??0)-(b.x??0));
 const hats=ordered.filter(b=>b.type==="event_when_key"&&b.key===key);
 if(hats.length){event.preventDefault();state.running=true;$("run-button").disabled=true;try{for(const hat of hats){const index=ordered.indexOf(hat);await executeBlocks(ordered.slice(index+1))}}finally{state.running=false;$("run-button").disabled=false;renderSprites();drawStage()}}
});
function applyPescCode(){
 const source=$("pesc-output").value;
 state.pescComments=source.split(/\r?\n/).map(line=>line.trim()).filter(line=>line.startsWith("//")&&!line.startsWith("// PESC")&&!line.startsWith("// Generated")&&!line.startsWith("// Blocks execute")&&!line.startsWith("// Add blocks"));
 const lines=source.split(/\r?\n/).map(line=>line.trim()).filter(line=>line&&!line.startsWith("//")&&!line.startsWith("#"));
 const parsed=[];
 const getName=(raw)=>{try{return JSON.parse(raw)}catch{return null}};
 for(const line of lines){
  let m,b=null;
  if(line==="when green flag clicked")b={type:"event_when_run"};
  else if((m=line.match(/^when\s+(space|arrowup|arrowdown|arrowleft|arrowright|[a-z])\s+key pressed$/i)))b={type:"event_when_key",key:m[1].toUpperCase()};
  else if((m=line.match(/^move\s+("(?:[^"\\]|\\.)*")\s+by\s+(-?\d+(?:\.\d+)?)\s+pixels$/i)))b={type:"move_sprite",name:getName(m[1]),value:Number(m[2])};
  else if((m=line.match(/^set\s+("(?:[^"\\]|\\.)*")\s+position to x:\s*(-?\d+(?:\.\d+)?)\s+y:\s*(-?\d+(?:\.\d+)?)$/i)))b={type:"set_position",name:getName(m[1]),value:Number(m[2]),value2:Number(m[3])};
  else if((m=line.match(/^change x by\s*(-?\d+(?:\.\d+)?)$/i)))b={type:"change_x",value:Number(m[1])};
  else if((m=line.match(/^change y by\s*(-?\d+(?:\.\d+)?)$/i)))b={type:"change_y",value:Number(m[1])};
  else if((m=line.match(/^turn\s+(-?\d+(?:\.\d+)?)\s+degrees$/i)))b={type:"turn_sprite",value:Number(m[1])};
  else if((m=line.match(/^go to x:\s*(-?\d+(?:\.\d+)?)\s+y:\s*(-?\d+(?:\.\d+)?)$/i)))b={type:"go_to_position",value:Number(m[1]),value2:Number(m[2])};
  else if((m=line.match(/^say\s+("(?:[^"\\]|\\.)*")$/i)))b={type:"say_text",value:getName(m[1])};
  else if((m=line.match(/^change color of\s+("(?:[^"\\]|\\.)*")$/i)))b={type:"change_color",name:getName(m[1])};
  else if((m=line.match(/^(show|hide)\s+("(?:[^"\\]|\\.)*")$/i)))b={type:m[1].toLowerCase()+"_sprite",name:getName(m[2])};
  else if((m=line.match(/^wait\s+(-?\d+(?:\.\d+)?)\s+seconds$/i)))b={type:"controls_wait",value:Number(m[1])};
  else if((m=line.match(/^repeat\s+(-?\d+(?:\.\d+)?)\s+times$/i)))b={type:"repeat",value:Number(m[1])};
  else { $("pesc-status").textContent="Could not understand this line: "+line;return; }
  if(b.name){const found=state.sprites.find(sp=>sp.name===b.name);if(!found){$("pesc-status").textContent="Sprite not found: "+b.name;return}b.spriteId=found.id}
  parsed.push(createBlock(b.type,{...b,x:24,y:24+parsed.length*62}));
 }
 state.blocks=parsed;renderBlocks();renderPesc();$("pesc-status").textContent="Applied "+parsed.length+" PESC commands to the block editor.";setSaved("● Unsaved changes");
}
$("apply-pesc").onclick=applyPescCode;
function projectData(){return {id:state.projectId,title:state.title,sprites:state.sprites,blocks:state.blocks,updatedAt:new Date().toISOString()}}
async function saveProject(){
 const data=projectData();setSaved("● Saving…");localStorage.setItem("tribble:"+state.projectId,JSON.stringify(data));
 try{const response=await fetch("/api/projects",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});if(!response.ok)throw new Error("API unavailable");setSaved("● Saved to Tribble cloud")}catch(e){setSaved("● Saved on this device")}
 const list=JSON.parse(localStorage.getItem("tribble-projects")||"[]");if(!list.includes(state.projectId))list.unshift(state.projectId);localStorage.setItem("tribble-projects",JSON.stringify(list));
}
async function loadProject(id){
 let data=null,loadError="";
 try{
  const response=await fetch("/api/projects?id="+encodeURIComponent(id));
  const result=await response.json().catch(()=>({}));
  if(response.ok)data=result;
  else loadError=result.error||"Cloud project could not be loaded.";
 }catch(error){loadError=error.message||"Network error while loading project."}
 if(!data){
  try{data=JSON.parse(localStorage.getItem("tribble:"+id)||"null")}catch{}
 }
 if(!data){alert("Could not open this project. "+(loadError||"No saved local copy was found."));return}
 state.projectId=data.id;state.title=data.title||"Untitled game";state.sprites=Array.isArray(data.sprites)?data.sprites:[];state.blocks=Array.isArray(data.blocks)?data.blocks:[];state.selected=0;
 $("project-title").textContent=state.title;$("heading-title").textContent=state.title;
 renderBlocks();renderPesc();renderSprites();drawStage();window.dispatchEvent(new Event("tribble:project-loaded"));showView("editor");
}
function newProject(){
 state.projectId=crypto.randomUUID();state.title="Untitled game";state.sprites=[{id:crypto.randomUUID(),name:"Player",x:320,y:200,size:48,color:"#8b7cff"}];state.blocks=[];state.selected=0;
 $("project-title").textContent=state.title;$("heading-title").textContent=state.title;renderBlocks();renderPesc();renderSprites();drawStage();window.dispatchEvent(new Event("tribble:new-project"));showView("editor");setSaved("● New project");
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
document.querySelectorAll(".tab").forEach(button=>button.onclick=()=>{document.querySelectorAll(".tab").forEach(tab=>tab.classList.toggle("active",tab===button));$("block-editor").classList.toggle("hidden",button.dataset.tab!=="blocks");$("pesc-editor").classList.toggle("hidden",button.dataset.tab!=="pesc");});
initBlockEditor();renderPesc();renderSprites();drawStage();showView("hub");
function openShareModal(url,mode){
 $("share-url").value=url;
 $("share-preview").src=mode==="game"?url:"/?import="+encodeURIComponent(new URL(url).searchParams.get("import"));
 $("share-modal-title").textContent=mode==="game"?"Your game is ready to play":"Your project link is ready";
 $("share-modal-note").textContent=mode==="game"?"Play it here, or copy the link to share it with anyone.":"This link lets someone import their own copy of your project.";
 $("share-modal").classList.remove("hidden");
}
$("close-share-modal").onclick=()=>{$("share-modal").classList.add("hidden");$("share-preview").src="about:blank"};
$("share-modal").onclick=e=>{if(e.target===$("share-modal"))$("close-share-modal").click()};
$("copy-share-url").onclick=async()=>{const value=$("share-url").value;try{await navigator.clipboard.writeText(value);$("copy-share-url").textContent="Copied!"}catch{$("share-url").select();document.execCommand("copy");$("copy-share-url").textContent="Copied!"}};
async function createShare(mode){
 await saveProject();
 const response=await fetch("/api/share",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode,project:projectData()})});
 const result=await response.json();if(!response.ok)throw new Error(result.error||"Could not create share link.");
 const url=new URL(mode==="game"?"/play.html":"/?import=",location.origin);
 if(mode==="game")url.searchParams.set("id",result.id);else url.searchParams.set("import",result.id);
 openShareModal(url.href,mode);
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
 renderBlocks();renderPesc();window.dispatchEvent(new Event("tribble:project-loaded"));$("project-title").textContent=state.title;$("heading-title").textContent=state.title;renderSprites();drawStage();history.replaceState({},"",location.pathname);showView("editor");setSaved("● Imported shared project — save to keep your copy");
 }catch(error){alert("Could not import project: "+error.message)}
}
importSharedProject();
