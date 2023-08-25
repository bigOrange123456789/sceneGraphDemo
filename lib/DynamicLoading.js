//config.loading；加载数据包
//window.param.projectName: 用于获取config.json的地址
//window.c : 判断视点的位置和相机是否移动
import {
    Frustum,//用于视锥剔除
    Matrix4,//用于视锥剔除
    Mesh,//用于测试
    MeshBasicMaterial,//用于测试
    SphereGeometry,//用于测试
    Vector3,Geometry,PointsMaterial,Points
} from "./three/build/three";
export {DynamicLoading}
class DynamicLoading{
    //最好再加入遮挡剔除
    constructor(config) {//new DynamicLoading({"loading":loading,"camera":camera})
        if(!window.param)window.param={}
        if(!window.param.projectName)window.param.projectName="KaiLiNan"
        this.meshes=config.meshes
        this.loading=config.loading
        this.camera=config.camera
        var scope=this
        this.loadJson("./assets/models/"+window.param.projectName+".log/bounding_sph.json",data=>{
            scope.bounding_sph={}
            for(var i in data){
                scope.bounding_sph[i]={r:data[i][0],c:[]}
                var group_number=(data[i].length-1)/3
                for(var j=0;j<group_number;j++){
                    scope.bounding_sph[i].c.push({
                        x:data[i][1+j*3],
                        y:data[i][2+j*3],
                        z:data[i][3+j*3]
                    })
                }
            }
            window.bounding_sph2=scope.bounding_sph
        })
        this.loadJson("./assets/models/"+window.param.projectName+".log/config.json",data=>{
            scope.areaInf=data
            const camera=scope.getCamera()
            scope.prePoint=camera.position.x+","+camera.position.y+","+camera.position.z
            scope.prePoint2=camera.position.x+","+camera.position.y+","+camera.position.z
            scope.initLists()
            scope.start()//加载和预加载
            scope.start2()//遮挡剔除和视锥剔除
        })
    }
    getCamera(){
        if(!this.m){
            const m1 = new Matrix4(); 
            m1.set( 
                0.017926,0,0,0,
                0, 0.017926,0,0,
                0,0,0.017926,0,
                22026.806641,2149.515381,224.10112,1
                );
            m1.transpose ()
            m1.invert()
            const m2 = new Matrix4(); 
            m2.set( 
                0.0004002784336784668, 0, 0, 0, 
                0, 8.88796666661455e-20, -0.0004002784336784668, 0, 
                0, 0.0004002784336784668, 8.88796666661455e-20, 0, 
                24.35273726404087, 24.35274977274192, 24.35274977274192, 1
                );
            m2.transpose ()
             
            this.m=m2.multiply(m1) 
            window.m1=m1
            window.m2=m2
            window.m=this.m
        }
        const camera=this.camera.clone()
        camera.applyMatrix4(this.m)
        window.camera2=camera
        // console.log(camera.position.x,this.camera.position.x)
        return camera
    }
    initLists(){
        var scope=this
        this.lists={}
        for(var iii=0;iii<scope.areaInf.length;iii++){
            var path0=scope.areaInf[iii].path
            this.loadJson(path0,(data,path)=>{
                scope.lists[path]=data
                scope.prePoint=""//如果视点不改变不会加载资源，所以这里让视点判断为改变
                console.log("资源列表加载成功:",path)
            })
        }
        
    }
    start(){//用于加载和预加载
        var scope=this
		var first=true
		setInterval(()=>{
                    const camera=scope.getCamera()
                    const point0=camera.position.x+","+camera.position.y+","+camera.position.z
                    //console.log(scope.prePoint===point0,scope.prePoint,point0)
					if(scope.prePoint===point0){//如果视点没有移动
						if(first){//如果是第一次
                            for(var iii=0;iii<scope.areaInf.length;iii++){
                                var areaInf0=scope.areaInf[iii]
                                scope.updateSource(
                                    areaInf0.min,
                                    areaInf0.step,
                                    areaInf0.max,
                                    areaInf0.path,
                                    areaInf0.preload)
                            }
							first=false
						}
					}else {//如果视点发生了移动
						scope.prePoint=point0
						first=true
					}
		},200)
		console.log("开始动态加载资源")
    }
    start2(){//用于渲染的遮挡剔除
        var scope=this
        var prePoint2=""
        var prePoint2_rot=""
		function setInterval0(){
            requestAnimationFrame(setInterval0)
            const camera=scope.getCamera()
            const point0=camera.position.x+","+camera.position.y+","+camera.position.z
            const point0_rot=camera.rotation.x+","+camera.rotation.y+","+camera.rotation.z
            if(Object.keys(scope.lists).length<2)//还没有加载完可见性列表
                return
            if(prePoint2!==point0){//如果视点位置变化就进行遮挡剔除判断
                if(scope.meshes)
                    for(let i in scope.meshes){
                        scope.meshes[i].visible=false
                        scope.meshes[i].Obscured=true//被遮挡，不可见
                    }
                for(var iii=0;iii<scope.areaInf.length;iii++){
                    var areaInf0=scope.areaInf[iii]
                        scope.updateSource2(//判断Obscured
                            areaInf0.min,
                            areaInf0.step,
                            areaInf0.max,
                            areaInf0.path,
                            areaInf0.preload)
                        }
                scope.displayShell()//判断遮挡剔除是否排除外壳
            }
            if(prePoint2!==point0||prePoint2_rot!=point0_rot){//如果视点位置或方向变化就进行视锥剔除判断
                // scope.cullingFrustum()
            }
            prePoint2=point0 
            prePoint2_rot=point0_rot
		}setInterval0()
		console.log("开始进行遮挡剔除")  
    }
    updateSource(min,step,max,path,preload) {//用于加载和预加载
        var lists=this.getList(min,step,max,path)
        var scope=this
        if(!preload){//加载
            for(var j=0;j<lists.length;j++){
                var list=lists[j]
                for(var i=0;i<Math.floor(list.length/3);i++)
                    scope.loading(list[i],false)
                setTimeout(()=>{
                    for(var i=Math.floor(list.length/3);i<Math.floor(2*list.length/3);i++)
                        scope.loading(list[i],false)
                },200)
                setTimeout(()=>{
                    for(var i=Math.floor(2*list.length/3);i<list.length;i++)
                        scope.loading(list[i],false)
                },400)
            }
        }else{//预加载
            for(var j=0;j<lists.length;j++){
                var list=lists[j]
                setTimeout(()=>{
                    var conunt=0;
                    for(var i=0;i<list.length/3;i++)
                        if(scope.cullingFrustum1(list[i])){
                            scope.loading(list[i],false)
                            conunt++
                        }    
                    
                    // console.log("预加载数量:"+list.length/3,"在视锥体内的数量:"+conunt)
                        
                },600)
            }
        }
        
    }
    displayShell(){
        if(!this.meshes)return
        const camera=this.getCamera()
        var x=camera.position.x
        var y=camera.position.y
        var z=camera.position.z
        var needDisplayShell=false
        for(var j in this.areaInf){
            var inf=this.areaInf[j]
            var max=inf.max
            var min=inf.min
            if(x>max[0]||y>max[1]||z>max[2]
                ||x<min[0]||y<min[1]||z<min[2]){
                    needDisplayShell=true//需要显示外壳
                }
        }
        if(needDisplayShell)//需要显示外壳
            for(var i in this.meshes){
                var mesh=this.meshes[i]
                if(mesh.isShell)//mesh.visible=true
                    mesh.Obscured=false//此时认为外壳没有被遮挡
                    mesh.visible=true
            }
    }
    updateSource2(min,step,max,path,preload) {//用于渲染
        const scope=this
        if(preload||!scope.meshes)return
        var lists=this.getList(min,step,max,path)
        for(var i in lists)
            if(lists[i].length>0)
                for(var j in lists[i])
                    if(scope.meshes[""+lists[i][j]]){
                        scope.meshes[""+lists[i][j]].visible=true
                        scope.meshes[""+lists[i][j]].Obscured=false//没有被遮挡（可见）
                    }
                        
    }
    getList(min,step,max,path) {//用于渲染
        var result=[]
        var scope=this
        const camera=scope.getCamera()
        var x=camera.position.x
        var y=camera.position.y
        var z=camera.position.z
        if(x>max[0])x=max[0]
        if(y>max[1])y=max[1]
        if(z>max[2])z=max[2]
        if(x<min[0])x=min[0]
        if(y<min[1])y=min[1]
        if(z<min[2])z=min[2]
        if(!scope.lists[path])
                return result
        var dl=[]
        for(var i=0;i<3;i++)
            dl.push(
                (max[i]-min[i])/step[i]
            )

        var x1=Math.round((x-min[0])/dl[0])*dl[0]+min[0]
        var y1=Math.round((y-min[1])/dl[1])*dl[1]+min[1]
        var z1=Math.round((z-min[2])/dl[2])*dl[2]+min[2]
        var x2=x>x1?x1+dl[0]:x1-dl[0]
        var y2=y>y1?y1+dl[1]:y1-dl[1]
        var z2=z>z1?z1+dl[2]:z1-dl[2]
        var points=[]
        var xs=[x1,x2]
        var ys=[y1,y2]
        var zs=[z1,z2]

        for(var i1 in xs)
            for(var i2 in ys)
                for(var i3 in zs)
                    points.push([xs[i1],ys[i2],zs[i3]])

        for(var i0 in points){
            var point=points[i0][0]+","+points[i0][1]+","+points[i0][2]
            var list=scope.lists[path][point]
            if(list){
                if(typeof(list) == "string")//如果只是记录了一个索引
                    list=scope.lists[path][list]
                result.push(list)
            }
        }
        return result
    }
    loadJson(path,cb) {
        var request = new XMLHttpRequest();
        request.open("get", path);//请求方法,路径
        request.send(null);//不发送数据到服务器
        request.onload = function () {//XHR对象获取后
            if (request.status === 200) {//获取成功的状态码
                var str=request.responseText
                cb(JSON.parse(str),path)
            }
        }
    }
    cullingFrustum(){//视锥剔除
        if(!this.meshes)return
        if(!this.cullingFrustumNotFirstFlag){
            this.cullingFrustumNotFirstFlag=true
            return//跳过第一次的视锥剔除
        }//第一次的视锥剔除会出错，出错的原因现在还不清楚//出错原因可能是一帧无法完成全部包围球遮挡判断的计算 //出错的原因可能是初始数据包的解析问题
        const camera=this.getCamera()
        var frustum = getFrustum(camera)
        for(let i in this.meshes){//for(let i=0; i<window.meshes.length; i++){
            var m=this.meshes[i]
            if(!m.Obscured)
                m.visible=intersectSpheres(m.bounding_sph, frustum)
        }
        function getFrustum(camera){
            var frustum = new Frustum();
            frustum.setFromProjectionMatrix( new Matrix4().multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse ) );
            return frustum;
        }
        function intersectSpheres(spheres, frustum){
            if(spheres)
            for(let i=0; i<spheres.length; i++)
                if(intersectSphere(spheres[i].center, spheres[i].radius, frustum))
                    return true
            return false
            function intersectSphere(center, radius, frustum) {
                const planes = frustum.planes;
                const negRadius = - radius;
                for(let i=0; i<planes.length; i++){
                    const distance = planes[ i ].distanceToPoint( center );//平面到点的距离，
                    if ( distance < negRadius ) //内正外负
                        return false;//不相交
                }
                return true;//相交
            }
        }
    }
    cullingFrustum1(mesh_id){//用于预加载的视锥剔除判断
        if(!this.meshes)return
        if(!this.bounding_sph)return
        const camera=this.getCamera()
        var frustum = getFrustum(camera)
        // frustum.applyMatrix4(this.m)
        for(let i=0;i<6;i++)
            frustum.planes[i].applyMatrix4(this.m)
        window.frustum=frustum
        var bounding=this.bounding_sph[mesh_id]
        //console.log(frustum)
        //console.log(bounding)
        for(var i=0;i<bounding.c.length;i++){
            if(intersectSphere(bounding.c[i], bounding.r, frustum))
                return true//相交
        }
        return false//不相交

        function getFrustum(camera){
            var frustum = new Frustum();
            frustum.setFromProjectionMatrix( new Matrix4().multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse ) );
            return frustum;
        }
        function intersectSphere(center, radius, frustum) {
            const planes = frustum.planes;
            const negRadius = - radius;
            for(let i=0; i<planes.length; i++){
                const distance = planes[ i ].distanceToPoint( center );//平面到点的距离，
                if ( distance < negRadius ) //内正外负
                    return false;//不相交
            }
            return true;//相交
        }
    }
    cullingFrustum1_2(mesh_id){//用于预加载的视锥剔除判断
        if(!scope.meshes)return
        console.log(this.bounding_sph)
        if(!this.bounding_sph)return
        const camera=scope.getCamera()
        var frustum = getFrustum(camera)
        var bounding=this.bounding_sph[mesh_id]
        //console.log(frustum)
        //console.log(bounding)
        for(var i=0;i<bounding.c.length;i++){
            if(intersectSphere(bounding.c[i], bounding.r, frustum))
                return true//相交
        }
        return false//不相交

        function getFrustum(camera){
            var frustum = new Frustum();
            frustum.setFromProjectionMatrix( new Matrix4().multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse ) );
            return frustum;
        }
        function intersectSphere(center, radius, frustum) {//上下左右前(远)后(近)
            getSpace(frustum,1,1)
            function getSpace(frustum,a1,a2){
                return [
                    [1,1,1,1],
                    [1,1,1,1],
                    [1,1,1,1],
                    [1,1,1,1],
                    [1,1,1,1],
                    1
                ]
            }
            const camera=scope.getCamera()
            var position=camera.position
            if(center.x*position.x+center.y*position.y+center.z*position.z>Math.pow(frustum[4].constant-frustum[5].constant,2))
                return false
            const planes = frustum.planes;
            if ( planes[5].distanceToPoint( center ) < - radius ) //内正外负
                    return false;//不相交
            
            return true;//相交
        }
    }
}
window.test00=function(){
    var frustum = new Frustum();
    const camera=scope.getCamera()
    frustum.setFromProjectionMatrix( new Matrix4().multiplyMatrices( 
        camera.projectionMatrix, 
        camera.matrixWorldInverse ) );
    var planes = frustum.planes;
    console.log(planes)
    {
        //planes   法向量向外   上下左右前(远)后(近)
        for(var ii=0;ii<6;ii++){//for(var ii=0;ii<planes.length;ii++){
            var direction = new Vector3(
                -1*camera.matrixWorld.elements[8],
                -1*camera.matrixWorld.elements[9],
                -1*camera.matrixWorld.elements[10]
            )
            var x=camera.position.x
            var y=camera.position.y
            var z=camera.position.z
            var normal=planes[ii].normal
            console.log(
                normal.x*direction.x+normal.y*direction.y+normal.z*direction.z,
                normal.x*x+normal.y*y+normal.z*z,
                planes[ii].constant
                )
        }
    }
    if(false){//
        //[右侧，左侧，后侧？，上侧，后侧，]
        for(var ii=5;ii<6;ii++){//for(var ii=0;ii<planes.length;ii++){
            var direction = new Vector3(
                -0.1*camera.matrixWorld.elements[8]
                ,-0.1*camera.matrixWorld.elements[9]
                ,-0.1*camera.matrixWorld.elements[10]
            )
            var normal=planes[ii].normal
            console.log(
                normal.x,direction.x,

                normal.x*direction.x+
                normal.y*direction.y+
                normal.z*direction.z
                )
            continue

            var m = new Mesh( 
                new SphereGeometry( 1, 8, 8 ), 
                new MeshBasicMaterial( { color: 0x0faf0f } ) 
            );
            m.position.set(1,1,planes[0].constant/planes[0].normal.z)
            m.position.set(-475.24272280677326,  46.93998388878436,  -16.85695032137270)
            window.instanceRoot.parent.parent.parent.add(m)

            function getPoint(p,x,y){
                var a=p.normal.x
                var b=p.normal.y
                var c=p.normal.z
                var d=p.constant
                var z=(-d-a*x-b*y)/c
                //console.log(a,b,c,d ,-d-a*x-b*y)
                var m = new Mesh( 
                    new SphereGeometry( 1, 8, 8 ), 
                    new MeshBasicMaterial( { color: 0x0faf0f } ) 
                    )
                m.position.set(x,y,z)
                //console.log(x,y,z)
                instanceRoot.parent.parent.parent.add(m)
            }
            var step=0.05
            console.log("flag")
            for(var i0=0;i0<=1;i0=i0+step){
                for(var j0=0;j0<=1;j0=j0+step){
                    console.log(i0,j0)
                    var k0=1-i0-j0
                    // var point1=[-475,47]
                    // var point2=[-391,32]
                    // var point3=[-555,4]
                    var point1=[-475,100]
                    var point2=[-91,32]
                    var point3=[-655,-14]
                    var point=[
                        i0*point1[0]+j0*point2[0]+k0*point3[0],
                        i0*point1[1]+j0*point2[1]+k0*point3[1]
                    ]
                    getPoint(planes[ii],point[0],point[1])
                }
            }

        }
        
    }

}
//window.bounding_sph 正确的
//this.bounding_sph