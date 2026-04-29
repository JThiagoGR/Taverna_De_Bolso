const express=require('express');const http=require('http');const {Server}=require('socket.io');const path=require('path');
const app=express();const server=http.createServer(app);const io=new Server(server,{cors:{origin:"*",methods:["GET","POST"]}});
app.use(express.static(path.join(__dirname,'public')));
const rooms={};
function lineIntersect(x1,y1,x2,y2,x3,y3,x4,y4){const d=(x1-x2)*(y3-y4)-(y1-y2)*(x3-x4);if(!d)return null;const t=((x1-x3)*(y3-y4)-(y1-y3)*(x3-x4))/d;const u=-((x1-x2)*(y1-y3)-(y1-y2)*(x1-x3))/d;return t>=0&&t<=1&&u>=0&&u<=1;}
function makeId(n,r){return (n||'p')+'_'+r+'_'+Math.random().toString(36).substr(2,4);}
io.on('connection',s=>{
 s.on('join',d=>{
  const r=rooms[d.room]=rooms[d.room]||{players:[],walls:[],mapData:null,fog:true,globalLight:0,zoom:1,offsetX:0,offsetY:0,ruler:null};
  const pid=d.isMaster?'master_'+d.room:(d.tokenId||makeId(d.name,d.room));
  s.join(d.room);s.pid=pid;
  if(!d.isMaster){const ex=r.players.find(p=>p.id===pid);if(!ex){r.players.push({id:pid,name:d.name,x:400,y:300,hp:10,maxHp:10,ca:10,light:0,ownerId:pid,isNpc:false});}}
  s.emit('joined',{pid:pid});s.emit('zoomUpdated',{zoom:r.zoom,offsetX:r.offsetX,offsetY:r.offsetY});s.emit('rulerUpdated',r.ruler);io.to(d.room).emit('state',r);
 });
 s.on('move',d=>{const r=rooms[d.room];const p=r.players.find(x=>x.id===d.id);if(!p)return;if(!(p.ownerId===s.pid||s.pid.startsWith('master_')))return;p.x=d.x;p.y=d.y;io.to(d.room).emit('playerMoved',p);});
 s.on('addNpc',d=>{const r=rooms[d.room];if(!r)return;const nid='npc_'+Date.now()+'_'+Math.random().toString(36).substr(2,5);const count=r.players.filter(p=>p.isNpc).length;const n={id:nid,name:(d.name||'NPC')+' '+(count+1),x:400+(count%5)*60,y:300+Math.floor(count/5)*60,hp:Math.max(1,parseInt(d.hp)||10),maxHp:Math.max(1,parseInt(d.maxHp)||parseInt(d.hp)||10),ca:Math.max(1,parseInt(d.ca)||10),light:0,ownerId:s.pid,isNpc:true};r.players.push(n);io.to(d.room).emit('playerAdded',n);});
 s.on('updateNpc',d=>{const r=rooms[d.room];const p=r.players.find(x=>x.id===d.id);if(p&&p.isNpc){p.hp=d.hp;p.maxHp=d.maxHp;p.ca=d.ca;io.to(d.room).emit('playerUpdated',p);}});
 s.on('removePlayer',d=>{const r=rooms[d.room];r.players=r.players.filter(p=>p.id!==d.id);io.to(d.room).emit('playerRemoved',d.id);});
 s.on('addWall',d=>{const r=rooms[d.room];r.walls.push(d.wall);io.to(d.room).emit('wallAdded',d.wall);});
 s.on('clearWalls',d=>{const r=rooms[d.room];r.walls=[];io.to(d.room).emit('wallsCleared');});
 s.on('clearAll',d=>{const r=rooms[d.room];if(!r)return;r.walls=[];r.players=r.players.filter(p=>!p.isNpc);r.mapData=null;io.to(d.room).emit('allCleared');});
 s.on('setMap',d=>{const r=rooms[d.room];r.mapData=d.mapData;io.to(d.room).emit('mapUpdated',d.mapData);});
 s.on('setFog',d=>{const r=rooms[d.room];r.fog=d.fog;io.to(d.room).emit('fogUpdated',d.fog);});
 s.on('setLight',d=>{const r=rooms[d.room];r.globalLight=d.light;io.to(d.room).emit('lightUpdated',d.light);});
 s.on('setZoom',d=>{const r=rooms[d.room];if(!r||!s.pid.startsWith('master_'))return;r.zoom=d.zoom;r.offsetX=d.offsetX;r.offsetY=d.offsetY;io.to(d.room).emit('zoomUpdated',{zoom:r.zoom,offsetX:r.offsetX,offsetY:r.offsetY});});
 s.on('setRuler',d=>{const r=rooms[d.room];if(!r)return;r.ruler=d.ruler;io.to(d.room).emit('rulerUpdated',d.ruler);});
 s.on('rollDice',d=>{const m=d.notation.match(/(\d+)d(\d+)([+-]\d+)?/);if(!m)return;const n=parseInt(m[1]),f=parseInt(m[2]),mod=parseInt(m[3]||0);const rolls=Array.from({length:n},()=>1+Math.floor(Math.random()*f));const total=rolls.reduce((a,b)=>a+b,0)+mod;io.to(d.room).emit('diceRolled',{player:d.player,notation:d.notation,rolls,total,mod:d.mod});});
});
const PORT=process.env.PORT||3000;
server.listen(PORT,'0.0.0.0',()=>console.log('Taverna De Bolso ONLINE na porta '+PORT));
