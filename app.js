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
  state.sprites.forEach((s,i)=>{ctx.save();if(s.image){let img=imageCache.get(s.id);if(!img){img=new Image();img.onload=drawStage;img.src=s.image;imageCache.set(s.id,img)}if(img.complete&&img.naturalWidth){ctx.drawImage(img,s.x-s.size/2,s.y-s.size/2,s.size,s.size)}}else{ctx.fillStyle=s.color;ctx.shadowColor=s.color;ctx.shadowBlur=i===state.selected?18:8;ctx.beginPath();ctx.arc(s.x,s.y,s.size/2,0,Math.PI*2);ctx.fill()}ctx.shadowBlur=0;ctx.fillStyle="#fff";ctx.font="12px DM Sans";ctx.textAlign="center";ctx.fillText(s.name,s.x,s.y+s.size/2+17);if(i===state.selected&&!state.running){ctx.strokeStyle="#b9afff";ctx.setLineDash([4,4]);ctx.beginPath();ctx.arc(s.x,s.y,s.size/2+7,0,Math.PI*2);ctx.stroke()}ctx.restore()});
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
function spriteDropdownOptions(){const options=state.sprites.map(s=>[s.name,s.id]);return options.length?options:[["No sprites",""]];}
function selectedBlockSprite(block){return JSON.stringify(block.getFieldValue("SPRITE")||"");}
function addBlockDefinitions(){
  Blockly.Blocks.event_when_run={init(){this.appendDummyInput().appendField("when game starts");this.setNextStatement(true);this.setStyle("logic_blocks");this.setTooltip("Runs when the game starts.")}};
  Blockly.Blocks.move_sprite={init(){this.appendDummyInput().appendField("move sprite").appendField(new Blockly.FieldDropdown(spriteDropdownOptions),"SPRITE");this.appendValueInput("STEPS").setCheck("Number").appendField("by");this.appendDummyInput().appendField("pixels");this.setPreviousStatement(true);this.setNextStatement(true);this.setStyle("motion_blocks")}};
  Blockly.Blocks.set_position={init(){this.appendDummyInput().appendField("set position of").appendField(new Blockly.FieldDropdown(spriteDropdownOptions),"SPRITE");this.appendValueInput("X").setCheck("Number").appendField("X");this.appendValueInput("Y").setCheck("Number").appendField("Y");this.setPreviousStatement(true);this.setNextStatement(true);this.setStyle("motion_blocks")}};
  Blockly.Blocks.say_text={init(){this.appendValueInput("TEXT").appendField("show message");this.setPreviousStatement(true);this.setNextStatement(true);this.setStyle("colour_blocks")}};
  Blockly.Blocks.change_color={init(){this.appendDummyInput().appendField("change color of").appendField(new Blockly.FieldDropdown(spriteDropdownOptions),"SPRITE");this.setPreviousStatement(true);this.setNextStatement(true);this.setStyle("colour_blocks")}};
  Blockly.Blocks.key_pressed={init(){this.appendDummyInput().appendField("key pressed");this.setOutput(true,"Boolean");this.setStyle("variable_blocks")}};
  const js=javascript.javascriptGenerator;
  js.forBlock.event_when_run=()=> "/* when game starts */\n";
  js.forBlock.move_sprite=(b,g)=>"moveSprite("+selectedBlockSprite(b)+","+g(b,"STEPS",js.ORDER_NONE)+");\n";
  js.forBlock.set_position=(b,g)=>"setPosition("+selectedBlockSprite(b)+","+g(b,"X",js.ORDER_NONE)+","+g(b,"Y",js.ORDER_NONE)+");\n";
  js.forBlock.say_text=(b,g)=>"say("+g(b,"TEXT",js.ORDER_NONE)+");\n";
  js.forBlock.change_color=(b)=>"changeColor("+selectedBlockSprite(b)+");\n";
  js.forBlock.key_pressed=()=>"false";
}
function initBlockly(){
  if(!window.Blockly||!window.javascript)return;
  addBlockDefinitions();
  state.workspace=Blockly.inject("blockly-workspace",{toolbox:$("toolbox"),theme:Blockly.Theme.defineTheme("tribble",{base:Blockly.Themes.Dark,componentStyles:{workspaceBackgroundColour:"#171b28",toolboxBackgroundColour:"#151927",toolboxForegroundColour:"#e7e8f4",flyoutBackgroundColour:"#20263a",flyoutForegroundColour:"#e7e8f4",flyoutOpacity:1,scrollbarColour:"#515978",insertionMarkerColour:"#9a8dff",insertionMarkerOpacity:.3,markerColour:"#c5bbff",cursorColour:"#c5bbff"}}),grid:{spacing:24,length:3,colour:"#343b52",snap:true},zoom:{controls:true,wheel:true,startScale:.9,maxScale:1.4,minScale:.55}});
  state.workspace.addChangeListener(()=>{renderEclipse();setSaved("● Unsaved changes")});
  renderEclipse();
}
function renderEclipse(){
  if(!state.workspace)return;
  const code=javascript.javascriptGenerator.workspaceToCode(state.workspace);
  const eclipse=code.replace(/\/\* when game starts \*\//g,"when game starts").replace(/moveSprite\(/g,"move(").replace(/setPosition\(/g,"position(").replace(/say\(/g,"say(").replace(/changeColor\(\)/g,"sprite.color = randomColor()");
  $("eclipse-output").textContent="// Eclipse visual script\n// Generated from your Tribble blocks\n\n"+(eclipse.trim()||"// Add blocks to start creating your game.");
}
function runGame(){
  if(!state.workspace){$("stage-status").textContent="Block editor is loading";return}
  state.running=true;const code=javascript.javascriptGenerator.workspaceToCode(state.workspace);let message="";
  const findSprite=(id)=>state.sprites.find(s=>s.id===id);
  const safe={moveSprite(id,n){const s=findSprite(id);if(s)s.x=Math.max(0,Math.min(640,s.x+(Number(n)||0)))},setPosition(id,x,y){const s=findSprite(id);if(s){s.x=Number(x)||0;s.y=Number(y)||0}},say(t){message=String(t).replace(/^["']|["']$/g,"")},changeColor(id){const s=findSprite(id);if(s)s.color="#"+Math.floor(Math.random()*16777215).toString(16).padStart(6,"0")}};
  try{new Function("moveSprite","setPosition","say","changeColor",code)(safe.moveSprite,safe.setPosition,safe.say,safe.changeColor);drawStage();$("stage-status").textContent=message||"Game ran successfully";if(message)alert(message)}catch(e){$("stage-status").textContent="Script error: "+e.message}
  state.running=false;renderSprites();
}
function projectData(){return {id:state.projectId,title:state.title,sprites:state.sprites,blocks:state.workspace?Blockly.serialization.workspaces.save(state.workspace):null,updatedAt:new Date().toISOString()}}
async function saveProject(){
  const data=projectData();setSaved("● Saving…");
  localStorage.setItem("tribble:"+state.projectId,JSON.stringify(data));
  try{const r=await fetch("/api/projects",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});if(!r.ok)throw new Error("API unavailable");setSaved("● Saved to Tribble cloud")}catch(e){setSaved("● Saved on this device")}
  const list=JSON.parse(localStorage.getItem("tribble-projects")||"[]");if(!list.includes(state.projectId))list.unshift(state.projectId);localStorage.setItem("tribble-projects",JSON.stringify(list));
}
async function loadProject(id){
  let data=null;try{const r=await fetch("/api/projects?id="+encodeURIComponent(id));if(r.ok)data=await r.json()}catch{}
  if(!data)data=JSON.parse(localStorage.getItem("tribble:"+id)||"null");if(!data)return;
  state.projectId=data.id;state.title=data.title||"Untitled game";state.sprites=data.sprites||[];state.selected=0;
  $("project-title").textContent=state.title;$("heading-title").textContent=state.title;
  if(state.workspace&&data.blocks)Blockly.serialization.workspaces.load(data.blocks,state.workspace);
  renderSprites();drawStage();showView("editor");
}
function newProject(){state.projectId=crypto.randomUUID();state.title="Untitled game";state.sprites=[{id:crypto.randomUUID(),name:"Player",x:320,y:200,size:48,color:"#8b7cff"}];state.selected=0;if(state.workspace)state.workspace.clear();$("project-title").textContent=state.title;$("heading-title").textContent=state.title;renderSprites();drawStage();showView("editor");setSaved("● New project")}
function showView(view){$("editor-view").classList.toggle("hidden",view!=="editor");$("projects-view").classList.toggle("hidden",view!=="projects");document.querySelectorAll(".side-link[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));if(view==="projects")renderProjects()}
function renderProjects(){const holder=$("project-cards");holder.innerHTML="";const ids=JSON.parse(localStorage.getItem("tribble-projects")||"[]");if(!ids.length){holder.innerHTML='<div class="empty-projects">No saved projects yet. Create your first game to see it here.</div>';return}ids.forEach(id=>{let d;try{d=JSON.parse(localStorage.getItem("tribble:"+id))}catch{}if(!d)return;const card=document.createElement("article");card.className="project-card";card.innerHTML='<div class="project-thumb">✦</div><strong></strong><small></small>';card.querySelector("strong").textContent=d.title;card.querySelector("small").textContent="Updated "+new Date(d.updatedAt).toLocaleDateString();card.onclick=()=>loadProject(id);holder.appendChild(card)})}
$("upload-sprite").onclick=()=>$("sprite-upload").click();$("sprite-upload").onchange=(event)=>{const file=event.target.files[0];if(!file)return;if(!file.type.startsWith("image/")||file.size>1500000){alert("Choose an image smaller than 1.5 MB.");return}const reader=new FileReader();reader.onload=()=>{const s=sprite();s.image=reader.result;imageCache.delete(s.id);drawStage();setSaved("● Unsaved changes")};reader.readAsDataURL(file);event.target.value=""};
$("add-sprite").onclick=()=>{state.sprites.push({id:crypto.randomUUID(),name:"Sprite "+(state.sprites.length+1),x:320,y:200,size:42,color:"#55d6a4"});state.selected=state.sprites.length-1;renderSprites();drawStage();setSaved("● Unsaved changes")};
$("delete-sprite").onclick=()=>{if(state.sprites.length<2){alert("A game needs at least one sprite.");return}state.sprites.splice(state.selected,1);state.selected=0;renderSprites();drawStage()};
$("run-button").onclick=runGame;$("save-button").onclick=saveProject;$("reset-stage").onclick=drawStage;
$("rename-button").onclick=()=>{const name=prompt("Name your game",state.title);if(name&&name.trim()){state.title=name.trim();$("project-title").textContent=state.title;$("heading-title").textContent=state.title;setSaved("● Unsaved changes")}};
$("new-project").onclick=$("projects-new").onclick=newProject;
document.querySelectorAll(".side-link[data-view]").forEach(b=>b.onclick=()=>showView(b.dataset.view));
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t===b));$("blockly-workspace").classList.toggle("hidden",b.dataset.tab!=="blocks");$("eclipse-output").classList.toggle("hidden",b.dataset.tab!=="eclipse");renderEclipse()});
initBlockly();renderSprites();drawStage();
async function createShare(mode){
  await saveProject();
  const response=await fetch("/api/share",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode,project:projectData()})});
  const result=await response.json();if(!response.ok)throw new Error(result.error||"Could not create share link.");
  const url=new URL(mode==="game"?"/play.html":"/?import=",location.origin);
  if(mode==="game")url.searchParams.set("id",result.id);else url.searchParams.set("import",result.id);
  await navigator.clipboard.writeText(url.href);
  alert((mode==="game"?"Game link":"Project copy link")+" copied!\n\n"+url.href);
}
$("share-game").onclick=()=>createShare("game").catch(e=>alert(e.message));
$("share-project").onclick=()=>createShare("project").catch(e=>alert(e.message));
$("export-esc").onclick=()=>{
  renderEclipse();
  const spriteLines=state.sprites.map(s=>"  sprite "+JSON.stringify(s.name)+" { x = "+s.x+"; y = "+s.y+"; size = "+s.size+"; color = "+JSON.stringify(s.color)+" }").join("\n");
  const code='game '+JSON.stringify(state.title)+' {\n'+spriteLines+'\n\n  // Visual blocks translated to Eclipse Script (.esc)\n'+($("eclipse-output").textContent||"").split("\n").map(line=>"  "+line).join("\n")+'\n}\n';
  const blob=new Blob([code],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=(state.title||"game").replace(/[^a-z0-9_-]+/gi,"-")+".esc";a.click();URL.revokeObjectURL(url);
};
async function importSharedProject(){
 const id=new URLSearchParams(location.search).get("import");if(!id)return;
 try{const r=await fetch("/api/share?id="+encodeURIComponent(id));const d=await r.json();if(!r.ok)throw new Error(d.error||"Share not found.");state.projectId=crypto.randomUUID();state.title=d.title||"Imported game";state.sprites=d.sprites||[];state.selected=0;if(state.workspace&&d.blocks)Blockly.serialization.workspaces.load(d.blocks,state.workspace);$("project-title").textContent=state.title;$("heading-title").textContent=state.title;renderSprites();drawStage();history.replaceState({},"",location.pathname);setSaved("● Imported shared project — save to keep your copy");}catch(e){alert("Could not import project: "+e.message)}
}

importSharedProject();
