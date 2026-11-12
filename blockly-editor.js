/* Tribble v0 Blockly workspace + PESC bridge */
(() => {
 const $=id=>document.getElementById(id);
 if(!window.Blockly||!$("blockly-workspace"))return;
 const spriteOpts=()=>state.sprites.map(s=>[s.name,s.id]);
 const keys=[["Space","SPACE"],["Up","ARROWUP"],["Down","ARROWDOWN"],["Left","ARROWLEFT"],["Right","ARROWRIGHT"],["A","A"],["D","D"],["W","W"],["S","S"]];
 const def=(type,init)=>Blockly.Blocks[type]={init};
 def("tribble_start",function(){this.appendDummyInput().appendField("when game starts");this.setNextStatement(true);this.setStyle("logic_blocks")});
 def("tribble_key",function(){this.appendDummyInput().appendField("when").appendField(new Blockly.FieldDropdown(keys),"KEY").appendField("key pressed");this.setNextStatement(true);this.setStyle("logic_blocks")});
 def("tribble_move",function(){this.appendDummyInput().appendField("move").appendField(new Blockly.FieldDropdown(spriteOpts),"SPRITE").appendField("by").appendField(new Blockly.FieldNumber(10),"N").appendField("pixels");this.setPreviousStatement(true);this.setNextStatement(true);this.setStyle("math_blocks")});
 def("tribble_position",function(){this.appendDummyInput().appendField("set").appendField(new Blockly.FieldDropdown(spriteOpts),"SPRITE").appendField("X").appendField(new Blockly.FieldNumber(320),"X").appendField("Y").appendField(new Blockly.FieldNumber(200),"Y");this.setPreviousStatement(true);this.setNextStatement(true);this.setStyle("math_blocks")});
 def("tribble_dx",function(){this.appendDummyInput().appendField("change X by").appendField(new Blockly.FieldNumber(10),"N");this.setPreviousStatement(true);this.setNextStatement(true);this.setStyle("math_blocks")});
 def("tribble_dy",function(){this.appendDummyInput().appendField("change Y by").appendField(new Blockly.FieldNumber(10),"N");this.setPreviousStatement(true);this.setNextStatement(true);this.setStyle("math_blocks")});
 def("tribble_turn",function(){this.appendDummyInput().appendField("turn").appendField(new Blockly.FieldNumber(15),"N").appendField("degrees");this.setPreviousStatement(true);this.setNextStatement(true);this.setStyle("math_blocks")});
 def("tribble_say",function(){this.appendDummyInput().appendField("say").appendField(new Blockly.FieldTextInput("Hello!"),"TEXT");this.setPreviousStatement(true);this.setNextStatement(true);this.setStyle("colour_blocks")});
 def("tribble_color",function(){this.appendDummyInput().appendField("change color of").appendField(new Blockly.FieldDropdown(spriteOpts),"SPRITE");this.setPreviousStatement(true);this.setNextStatement(true);this.setStyle("colour_blocks")});
 def("tribble_show",function(){this.appendDummyInput().appendField("show").appendField(new Blockly.FieldDropdown(spriteOpts),"SPRITE");this.setPreviousStatement(true);this.setNextStatement(true);this.setStyle("colour_blocks")});
 def("tribble_hide",function(){this.appendDummyInput().appendField("hide").appendField(new Blockly.FieldDropdown(spriteOpts),"SPRITE");this.setPreviousStatement(true);this.setNextStatement(true);this.setStyle("colour_blocks")});
 def("tribble_wait",function(){this.appendDummyInput().appendField("wait").appendField(new Blockly.FieldNumber(1,0,60),"N").appendField("seconds");this.setPreviousStatement(true);this.setNextStatement(true);this.setStyle("loop_blocks")});
 def("tribble_comment",function(){this.appendDummyInput().appendField("comment").appendField(new Blockly.FieldTextInput("Write a note"),"TEXT");this.setPreviousStatement(true);this.setNextStatement(true);this.setStyle("text_blocks")});
 const toolbox=document.createElement("xml");
 toolbox.innerHTML='<category name="Events" categorystyle="logic_category"><block type="tribble_start"></block><block type="tribble_key"></block></category><category name="Motion" categorystyle="motion_category"><block type="tribble_move"></block><block type="tribble_position"></block><block type="tribble_dx"></block><block type="tribble_dy"></block><block type="tribble_turn"></block></category><category name="Looks" categorystyle="colour_category"><block type="tribble_say"></block><block type="tribble_color"></block><block type="tribble_show"></block><block type="tribble_hide"></block></category><category name="Control" categorystyle="loop_category"><block type="tribble_wait"></block></category><category name="Comments"><block type="tribble_comment"></block></category>';
 document.body.appendChild(toolbox);
 const theme=Blockly.Theme.defineTheme("tribbleV0",{base:Blockly.Themes.Dark,componentStyles:{workspaceBackgroundColour:"#171b28",toolboxBackgroundColour:"#151927",toolboxForegroundColour:"#e7e8f4",flyoutBackgroundColour:"#20263a",flyoutForegroundColour:"#e7e8f4",scrollbarColour:"#515978",insertionMarkerColour:"#9a8dff",markerColour:"#c5bbff",cursorColour:"#c5bbff"}});
 const ws=Blockly.inject("blockly-workspace",{toolbox,theme,grid:{spacing:24,length:3,colour:"#343b52",snap:true},zoom:{controls:true,wheel:true,startScale:.9,maxScale:1.5,minScale:.45},trashcan:true});
 const q=v=>JSON.stringify(String(v??""));
 const gen=new Blockly.Generator("PESC");
 gen.scrub_=function(b,code){const n=b.nextConnection?.targetBlock();return code+(n?this.blockToCode(n):"")};
 const target=b=>q(state.sprites.find(s=>s.id===b.getFieldValue("SPRITE"))?.name||"Player");
 gen.forBlock.tribble_start=()=>"when green flag clicked\n";
 gen.forBlock.tribble_key=b=>"when "+b.getFieldValue("KEY").toLowerCase()+" key pressed\n";
 gen.forBlock.tribble_move=b=>"move "+target(b)+" by "+b.getFieldValue("N")+" pixels\n";
 gen.forBlock.tribble_position=b=>"set "+target(b)+" position to x: "+b.getFieldValue("X")+" y: "+b.getFieldValue("Y")+"\n";
 gen.forBlock.tribble_dx=b=>"change x by "+b.getFieldValue("N")+"\n";
 gen.forBlock.tribble_dy=b=>"change y by "+b.getFieldValue("N")+"\n";
 gen.forBlock.tribble_turn=b=>"turn "+b.getFieldValue("N")+" degrees\n";
 gen.forBlock.tribble_say=b=>"say "+q(b.getFieldValue("TEXT"))+"\n";
 gen.forBlock.tribble_color=b=>"change color of "+target(b)+"\n";
 gen.forBlock.tribble_show=b=>"show "+target(b)+"\n";
 gen.forBlock.tribble_hide=b=>"hide "+target(b)+"\n";
 gen.forBlock.tribble_wait=b=>"wait "+b.getFieldValue("N")+" seconds\n";
 gen.forBlock.tribble_comment=b=>"// "+b.getFieldValue("TEXT").replace(/[\r\n]/g," ")+"\n";
 let busy=false;
 function syncCode(){if(busy)return;const code=gen.workspaceToCode(ws);$("pesc-output").value="// PESC · Partial Eclipse Script\n// Generated from the Tribble visual editor.\n\n"+(code.trim()||"// Add blocks to start.");applyPescCode()}
 function reload(){busy=true;ws.clear();let prev=null,y=28;const map={event_when_run:"tribble_start",event_when_key:"tribble_key",move_sprite:"tribble_move",set_position:"tribble_position",change_x:"tribble_dx",change_y:"tribble_dy",turn_sprite:"tribble_turn",say_text:"tribble_say",change_color:"tribble_color",show_sprite:"tribble_show",hide_sprite:"tribble_hide",controls_wait:"tribble_wait"};
  for(const item of [...state.blocks].sort((a,b)=>(a.y||0)-(b.y||0))){const type=map[item.type];if(!type)continue;const b=ws.newBlock(type);b.initSvg();const values={KEY:item.key||"SPACE",SPRITE:item.spriteId||state.sprites[0]?.id||"",N:item.value??10,X:item.value??320,Y:item.value2??200,TEXT:item.value??"Hello!"};for(const [f,v] of Object.entries(values))if(b.getField(f))b.setFieldValue(String(v),f);b.render();b.moveBy(32,y);y+=82;if(prev&&prev.nextConnection&&b.previousConnection)prev.nextConnection.connect(b.previousConnection);prev=b.nextConnection?b:null;}
  busy=false;syncCode();
 }
 ws.addChangeListener(e=>{if(!busy&&!e.isUiEvent&&e.type!==Blockly.Events.FINISHED_LOADING)syncCode()});
 $("show-native-blocks").onclick=()=> $("native-block-editor").classList.toggle("hidden");
 window.addEventListener("tribble:project-loaded",reload);
 window.addEventListener("tribble:new-project",()=>{busy=true;ws.clear();busy=false});
 window.tribbleBlockly={workspace:ws,refresh:reload};
 reload();
})();