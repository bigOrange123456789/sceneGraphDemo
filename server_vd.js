const usePVD=true
// [-507,24,42],
// [-426,38,101],
// [81,14,59],
const configList=[
  {
    sceneId:"KaiLiNan",
    areaId:0,
    "x": [
      -507,
      -426,
      81
    ],
    "y": [
      24,//2286.5,
      38,//2286.5,
      14
    ],
    "z": [
      42,
      101,
      59
    ],
    // path:"dist/assets/models/KaiLiNan.log/7.ls_d.json"
    path:"dist/assets/models/KaiLiNan.log/7.ls_d0.json"
  }
]
console.log('version:02(node --max_old_space_size=8192 server_vd)')
class VD{
  constructor(areaInf,usePVD){
    this.load(areaInf.path)
  }
  load(path){
    const self=this
    self.databaseEvd={}
    if(this.usePVD)
    self.databasePvd={}
    require('jsonfile').readFile(
        path, 
        (err, jsonData)=>{
          self.jsonData=jsonData
          console.log("初始化完成")
    });
  }
  static getVdList(configList,usePVD){
    const vdList=[]
    for(let i=0;i<configList.length;i++)
      vdList.push(new VD(configList[i],usePVD))
    return vdList
  } 
  static getEvd(info,vdList){
    if(typeof info=="undefined"||typeof info.point=="undefined"){
      console.log("请检查数据格式")
      return null
    }else{
      return vdList[0].jsonData[info.point]
    }
  }
}
const vdList=VD.getVdList(configList,usePVD)
// setTimeout(()=>{
//   console.log(vdList[0].jsonData["-466,31,63"])
// },1000)

////////////////////////////////////////////////////////////
const port=8091
// const fs = require('fs');
// const options = {
//   key: fs.readFileSync('ssl/private.key'),
//   cert: fs.readFileSync('ssl/certificate.crt')
// };
// const server=require('https').createServer(options, function (request, response) {
const server=require('http').createServer(function (request, response) {
    // let index;
    let info;
    response.setHeader("Access-Control-Allow-Origin", "*");
    request.on('data', function (dataFromPage) {//接受请求
      // index=parseInt(String.fromCharCode.apply(null,dataFromPage))
      info=JSON.parse(String.fromCharCode.apply(null,dataFromPage))
    });
    request.on('end', function () {//返回数据
      let data=VD.getEvd(info,vdList)//vd.databaseEvd[index]
      if(data){//有缓存
        // console.log(index)
        response.write(JSON.stringify(data));
        response.end();
      }else{
        console.log("error 没有找到对应数据",info)
        response.write("error");
        response.end();
      }
    });
}).listen(port, '0.0.0.0', function () {
  console.log("listening to client:"+port);
});
server.on('close',()=>{
  console.log('服务关闭')
})
server.on('error',()=>{
  console.log('服务发送错误')
})
server.on('connection',()=>{
  // console.log('服务连接')
})
server.on('timeout',()=>{
  // console.log("监听超时")
})