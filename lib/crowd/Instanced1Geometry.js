import * as THREE from "three";
class Instanced1Geometry extends THREE.InstancedBufferGeometry {
    constructor( parameters ) {
        super();
        this.oldGeometry=parameters.oldGeometry
        if(this.oldGeometry.index!==null){
            // this.oldGeometry=this.oldGeometry.toNonIndexed();
            this.index=this.oldGeometry.index
        }
        for(var i in this.oldGeometry.attributes)
            this.setAttribute(i, this.oldGeometry.attributes[i])
        const lodLevel=parameters.lodLevel
        const self=this
        // setTimeout(()=>{
        //     self.setScale([
        //         0.1,0.1,0.1// (21-lodLevel)/21,
        //         // (21-lodLevel)/21,
        //         // (21-lodLevel)/21
        //     ])
        //     // self.applyMatrix4 (new THREE.Matrix4().set([
        //     //     1,0,0,0,
        //     //     0,0.1,0,0,
        //     //     0,0,1,0,
        //     //     0,0,0,1
        //     // ]))

        // },1000)
        
        
    }
    clone() {
		return new this.constructor({
            oldGeometry:this.oldGeometry
        }).copy( this );
	}
    setScale(scale){//输入一个三维数组
        const pos0=this.attributes.position
        // this.computeBoundingBox()
        // const max=this.boundingBox.max
        // const min=this.boundingBox.min
        // const center=[
        //     max.x-min.x,
        //     max.y-min.y,
        //     max.z-min.z,
        // ]
        const center=[
            0,0,0
        ]
        for(let i=0;i<pos0.count;i++){
            for(let j=0;j<pos0.itemSize;j++){
                const p0=pos0.array[i*pos0.itemSize+j]//=
                const c0=center[j]
                // console.log(j,scale[j],c0+scale[j]*(p0-c0))
                pos0.array[i*pos0.itemSize+j]=c0+scale[j]*(p0-c0)
            }
        }
        pos0.needsUpdate =true
    }
    bindGeometry(geometry){
        var attributes=geometry.attributes
        var tags=[
            'position','uv','skinIndex','skinWeight',//'normal'
        ]
        for(var i=0;i<tags.length;i++ ){
            var name=tags[i]
            if(attributes[name])
                this.setAttribute(name, attributes[name]);
        }
        this.index=geometry.index//geometry.index==null?
        delete this.attributes.normal
        this.computeVertexNormals()
    }
    static getLod(data){
        var result={}
        for(var meshName in data){
            result[meshName]=new LodGeometry(data[meshName])
        }
        return result
    }
    static getLod2(data){
        var result={}
        for(var meshName in data){
            result[meshName]=new TetrahedronGeometry(data[meshName])
        }
        return result
    }
}


class LodGeometry extends THREE.BufferGeometry{
    constructor(data){
        super();
        // if(data instanceof THREE.BufferGeometry){
        //     this.init2(data)//从glb/gltf文件中读取的 (将所需数据提取出来，再使用init() )
        // }else this.init(data)//从json文件中读取的
        this.init(data)
    }
    init(data){
        let attributes=this.attributes//var attributes={}
        // console.log("attributes",attributes)
        // console.log("data",data)
        attributes.position=
            new THREE.BufferAttribute(
                new Float32Array(data.position), 3
            );
        attributes.uv = 
            new THREE.BufferAttribute(
                new Float32Array(data.uv), 2
            );
        attributes.skinIndex = 
            new THREE.BufferAttribute(
                new Uint8Array(data.skinIndex), 4
            );
        attributes.skinWeight = 
            new THREE.BufferAttribute(
                new Float32Array(data.skinWeight), 4
            );
        // attributes.normal = 
        //     new THREE.BufferAttribute(
        //         new Float32Array(data.normal), 3
        //     );
        this.attributes=attributes
        if(data.index){
            this.index=
                new THREE.BufferAttribute(
                    new Uint16Array(data.index), 1
                );
        }
    }
}
class TetrahedronGeometry extends THREE.BufferGeometry{//生成四面体几何对象
    constructor(data){//
        super();
        this.init2(data)
    }
    init2(geometry1){
        let position1=geometry1.attributes.position
        let max=[-999999,-999999,-999999]
        let min=[999999,999999,999999]

        for(let i=0;i<position1.count;i++){
            for(let j=0;j<3;j++){
                let d=position1.array[3*i+j]
                if(d>max[j])max[j]=d
                if(d<min[j])min[j]=d
            }
        }
        
        for(let i of [0,1,2]){
            const step=max[i]-min[i]
            max[i]-=(step*0.25)
            min[i]+=(step*0.25)
        }
        
        const geometry2={
            attributes:{
                position:{
                    array:[
                        -1,-1,-1,
                        -1,1,-1,
                        1,1,-1,
                        1,-1,-1,
                        -1,-1,1,
                        -1,1,1,
                        1,1,1,
                        1,-1,1,
                    ],
                    count:8
                }
            },
            index:{
                array:[
                    0,1,2,//前面
                    0,2,3,

                    4,6,5,//后面
                    4,7,6,

                    // 0,3,7,//下面
                    // 0,7,4,

                    3,2,6,
                    3,6,7,

                    2,1,5,
                    2,5,6,

                    1,0,4,
                    1,4,5,
                ],
                array2:[
                    0,2,1,
                    0,5,2,
                    0,1,5,
                    1,5,2//上
                ]
            }
        }
        const count2=geometry2.attributes.position.count
        
        let data={
            position:geometry2.attributes.position.array,
            uv:[],
            skinIndex:[],
            skinWeight:[]
        }
        for(let i=0;i<count2;i++){
            for(let j=0;j<3;j++)
                data.position[i*3+j]=
                    (geometry2.attributes.position.array[i*3+j]>0)?max[j]:min[j]
            for(let j=0;j<2;j++)
                data.uv.push(
                    geometry1.attributes.uv.array[i*2+j]
                )
            for(let j=0;j<4;j++)
                data.skinIndex.push(
                    geometry1.attributes.skinIndex.array[i*4+j]
                )
            for(let j=0;j<4;j++)
                data.skinWeight.push(
                    geometry1.attributes.skinWeight.array[i*4+j]
                )
        }
        data.index=geometry2.index.array2
        this.init(data)
    }
    init(data){
        let attributes=this.attributes//var attributes={}
        attributes.position=
            new THREE.BufferAttribute(
                new Float32Array(data.position), 3
            );
        attributes.uv = 
            new THREE.BufferAttribute(
                new Float32Array(data.uv), 2
            );
        attributes.skinIndex = 
            new THREE.BufferAttribute(
                new Uint8Array(data.skinIndex), 4
            );
        attributes.skinWeight = 
            new THREE.BufferAttribute(
                new Float32Array(data.skinWeight), 4
            );
        this.attributes=attributes
        if(data.index){
            this.index=
                new THREE.BufferAttribute(
                    new Uint16Array(data.index), 1
                );
        }
    }
}
export { Instanced1Geometry,LodGeometry };