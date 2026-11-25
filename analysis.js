// Analisis de trazas en formato APK (bins de 10 m: [dist, t, kmh, thr, brk]). Matematicas puras.
(function(){
function binAt(tr,m,ds){return tr[Math.min(tr.length-1,Math.max(0,Math.round(m/ds)))];}
function brakePoint(tr,entryM,ds,minM){ // ultimo bin con freno>0.15 antes de la entrada de curva
  var a=Math.round((entryM+30)/ds),n=tr.length,steps=Math.round(400/ds),i,j;
  for(i=0;i<steps;i++){j=((a-i)%n+n)%n;
    if(minM!=null&&tr[j][0]<minM)return null;
    if(tr[j][4]>0.15)return tr[j][0];}
  return null;}
function throttlePoint(tr,apexM,ds,lookfw){ // primer bin a fondo tras el vertice
  var a=Math.round(apexM/ds),n=tr.length,steps=Math.round((lookfw||300)/ds),i,j;
  for(i=0;i<steps;i++){j=(a+i)%n;if(tr[j][3]>=1.0)return tr[j][0];}
  return null;}
function cornerStats(tr,c,ds,prevExit){
  return {brake:brakePoint(tr,c.entry,ds,prevExit),
          throttle:throttlePoint(tr,c.apex,ds,300),
          apexKmh:binAt(tr,c.apex,ds)[2],
          exitKmh:binAt(tr,c.exit,ds)[2]};}
function deltaAt(tA,tB,m,ds){return binAt(tB,m,ds)[1]-binAt(tA,m,ds)[1];} // >0: A llega antes (A mas rapido)
function cornerDelta(tA,tB,c,ds){return deltaAt(tA,tB,c.exit,ds)-deltaAt(tA,tB,c.entry,ds);} // >0: A gana en la curva
function deltaSegments(tA,tB,ds,segLen){
  var L=tA.length*ds,out=[],seg;
  for(seg=0;seg<L;seg+=segLen){
    var i=Math.min(tA.length-1,Math.round(seg/ds));
    out.push({m:seg,delta:tB[i][1]-tA[i][1]});}
  return out;}
function fmtM(v){return v==null?'-':Math.round(v)+' m';}
function fmtD(ms){var s=ms>=0?'+':'-';return s+Math.abs(Math.round(ms))+' ms';}
window.AN={binAt:binAt,brakePoint:brakePoint,throttlePoint:throttlePoint,cornerStats:cornerStats,
  deltaAt:deltaAt,cornerDelta:cornerDelta,deltaSegments:deltaSegments,fmtM:fmtM,fmtD:fmtD};
})();
