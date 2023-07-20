import * as THREE from "three";
import { CrowdModel } from './CrowdModel.js'
import { CrowdLod } from './CrowdLod.js'
import { Vector3 } from "../three/build/three.js";
export class Crowd extends THREE.Object3D {
    constructor(opt) {
        super()
        // alert(opt.pathTexture)
        this.camera=opt.camera
        this.dummy = new THREE.Object3D();
        this.bvh=null;
        this.count=opt.count
        this.clock=new THREE.Clock()
        this.instanceMatrix=new THREE.InstancedBufferAttribute(new Float32Array(this.count*16), 16);
        this.textureType = new THREE.InstancedBufferAttribute(new Uint8Array(this.count * 4), 4);
        this.animationType = new THREE.InstancedBufferAttribute(new Uint8Array(this.count), 1);
        this.speed = new THREE.InstancedBufferAttribute(new Float32Array(this.count), 1);
        this.obesity = new THREE.InstancedBufferAttribute(new Float32Array(this.count), 1);
        this.moveMaxLength = new THREE.InstancedBufferAttribute(new Float32Array(this.count), 1);
        this.animationStartTime = new THREE.InstancedBufferAttribute(new Float32Array(this.count), 1);
        this.bodyScale = new THREE.InstancedBufferAttribute(new Float32Array(this.count * 4), 4);

        this.useColorTag=opt.useColorTag//["CloW_A_kuzi_geo","CloW_A_waitao_geo1","CloW_A_xiezi_geo","hair"]
        // console.log("useColorTag",opt.useColorTag)
        this.instanceColorIn_All={}
        for(let i=0;i<this.useColorTag.length;i++){
            let meshName=this.useColorTag[i]
            this.instanceColorIn_All[meshName]=
                new THREE.InstancedBufferAttribute(new Float32Array(this.count*3), 3);
        }

        this.lodCount=21//几何lod层级的个数
        // this.lodLevel=20//this.lodCount-1//当前的lod层级编号 //
        this.lodList=new Int8Array(this.count)
        var e=[1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]
        for(let i=0;i<this.count;i++){
            this.lodList[i]=-1
            for(let j=0;j<16;j++)
                this.instanceMatrix.array[16*i+j]=e[j]
        }

        this.lod_distance=opt.lod_distance//[15,25,50,75,100]
        this.lod_geometry=opt.lod_geometry
        this.opt=opt
        this.myLodController=new CrowdLod(this)
        
        this.meshType=opt.meshType

        this.meshTypeList={}
        this.meshTypeListElem={}
        for(let i=0;i<this.meshType.length;i++){
            let arr=Object.values(this.meshType[i])
            for(let j=0;j<arr.length;j++){
                this.meshTypeList[arr[j]]=[]
                this.meshTypeListElem[arr[j]]={}//[]
            }
        }

        
        for(let i=0;i<this.meshType.length;i++){
            let arr=Object.values(this.meshType[i])
            // let data={}
            for(let j=0;j<arr.length;j++){
                this.meshTypeListElem[arr[j]][i]=true//.push(i)
            }
            // this.meshTypeListElem[arr[j]]=Object.keys(data)
        }
        // console.log("meshTypeListElem",this.meshTypeListElem)
        for(let i in this.meshTypeListElem){
            let data=this.meshTypeListElem[i]
            let arr=Object.keys(data)
            for(let j=0;j<arr.length;j++){
                arr[j]=parseInt(arr[j])
            }
            this.meshTypeListElem[i]=arr
        }


        for(let type in this.meshTypeList){
            let list=this.meshTypeList[type]
            for(let i=0;i<this.count;i++){
                const arr=this.meshTypeListElem[type]
                const index=Math.floor(Math.random()*arr.length)
                const k=arr[index]//Math.floor(Math.random()*2)//i%2//
                list.push(k)
            }
        }
        // console.log("this.meshTypeList",this.meshTypeList)
        
        this.CrowdPoints=new THREE.Object3D()
        this.CrowdPoints.position.y=0.2
    }
    init(groups){
        for(let i=0;i<groups.length;i++){
            let groupOld=groups[i]
            // const child=new CrowdModel(this.opt,this)
            const child=new CrowdModel({
                camera:this.opt.camera,
                count: this.opt.count,//self.modelManager.modelList[modelType].ModelCount,
                animPathPre: this.opt.animPathPre,//self.modelManager.modelList[modelType].pathAnima,

                pathLodGeo:  this.opt.pathLodGeo[i],
                pathTextureConfig: this.opt.pathTextureConfig[i],
                useColorTag: this.opt.useColorTag,
                meshType:    this.opt.meshType[i],
                meshTypeList:this.meshTypeList,
                meshTypeListElem:this.meshTypeListElem,
                
                assets:      this.opt.assets,
                lod_distance:this.opt.lod_distance,
                lod_geometry:this.opt.lod_geometry,
                lod_avatarCount:this.opt.lod_avatarCount,
                lod_visible: this.opt.lod_visible[i],

                pathTexture:this.opt.pathTexture[i]
            },this)
            child.meshTypeId=this.children.length
            child.init(groupOld)
            this.add(child)
        }
    }
    getMatrixAt( index, matrix ) {
		matrix.fromArray( this.instanceMatrix.array, index * 16 );
	}
    setMatrixAt( index, matrix ) {
		matrix.toArray( this.instanceMatrix.array, index * 16 );
        this.instanceMatrix.needsUpdate0=true
	}
    getPosition(avatarIndex) {
        var mat4 = new THREE.Matrix4();
        this.getMatrixAt(avatarIndex,mat4)
        var e=mat4.elements
        return [e[12],e[13],e[14]];
    }
    getRotation(avatarIndex) {
        var mat4 = new THREE.Matrix4();
        this.getMatrixAt(avatarIndex,mat4)

        let position = new THREE.Vector3();
        let quaternion = new THREE.Quaternion();
        let scale = new THREE.Vector3();
        mat4.decompose(position, quaternion, scale);

        let euler = new THREE.Euler(0, 0, 0, 'XYZ');
        euler.setFromQuaternion(quaternion);
        return [euler.x, euler.y, euler.z];
    }
    getScale(avatarIndex) {
        var mat4 = new THREE.Matrix4();
        this.getMatrixAt(avatarIndex,mat4)

        let position = new THREE.Vector3();
        let quaternion = new THREE.Quaternion();
        let scale = new THREE.Vector3();
        mat4.decompose(position, quaternion, scale);
        return [scale.x, scale.y, scale.z];

    }
    setPosition(avatarIndex, pos) {
        var mat4 = new THREE.Matrix4();
        this.getMatrixAt(avatarIndex,mat4)
        if(this.bvh != null){
            let trans = new THREE.Vector3(pos[0]-mat4.elements[12],pos[1]-mat4.elements[13],pos[2]-mat4.elements[14])
            this.bvh.AABBArray[avatarIndex].translate(trans)
        }
        mat4.elements[12]=pos[0]
        mat4.elements[13]=pos[1]
        mat4.elements[14]=pos[2]
        this.setMatrixAt(avatarIndex,mat4)
    }
    setScale(avatarIndex, size) {
        var mat4 = new THREE.Matrix4();
        this.getMatrixAt(avatarIndex,mat4)

        let position = new THREE.Vector3();
        let quaternion = new THREE.Quaternion();
        let scale = new THREE.Vector3();

        mat4.decompose(position, quaternion, scale);
        let euler = new THREE.Euler(0, 0, 0, 'XYZ');
        euler.setFromQuaternion(quaternion);

        this.dummy.scale.set(size[0], size[1], size[2]);
        this.dummy.rotation.set(euler.x, euler.y, euler.z);
        this.dummy.position.set(position.x, position.y, position.z);
        this.dummy.updateMatrix();

        this.setMatrixAt(avatarIndex,this.dummy.matrix)        
    }
    setRotation(avatarIndex, rot) {
        var mat4 = new THREE.Matrix4();
        this.getMatrixAt(avatarIndex,mat4)

        let position = new THREE.Vector3();
        let quaternion = new THREE.Quaternion();
        let scale = new THREE.Vector3();
        mat4.decompose(position, quaternion, scale);

        this.dummy.scale.set(scale.x, scale.y, scale.z);
        this.dummy.rotation.set(rot[0], rot[1], rot[2]);
        this.dummy.position.set(position.x, position.y, position.z);
        this.dummy.updateMatrix();

        this.setMatrixAt(avatarIndex, this.dummy.matrix);
    }
    move(avatarIndex, dPos) {
        let pos = this.getPosition(avatarIndex);
        this.setPosition(avatarIndex, [pos[0] + dPos[0], pos[1] + dPos[1], pos[2] + dPos[2]]);
    }
    rotation(avatarIndex, dRot) {
        let rot = this.getRotation(avatarIndex);
        this.setRotation(avatarIndex, [rot[0] + dRot[0], rot[1] + dRot[1], rot[2] + dRot[2]]);
    }

    setTexture(avatarIndex, type) { // 设置贴图类型
        this.textureType.array[avatarIndex * 4] = type[0]; // 大部分区域
        this.textureType.array[avatarIndex * 4 + 1] = type[1]; // 头部和手部
        this.textureType.array[avatarIndex * 4 + 2] = type[2]; // 裤子
        this.textureType.array[avatarIndex * 4 + 3] = type[3];
    }
    setBodyScale(avatarIndex, scale) { // 设置身体部位缩放
        this.bodyScale.array[avatarIndex * 4] = scale[0]; 
        this.bodyScale.array[avatarIndex * 4 + 1] = scale[1]; 
        this.bodyScale.array[avatarIndex * 4 + 2] = scale[2]; 
        this.bodyScale.array[avatarIndex * 4 + 3] = scale[3];
    }
    setAnimation(avatarIndex, type, offset) { // 设置动画类型
        this.animationType.array[avatarIndex] = type;
        this.animationStartTime.array[avatarIndex] = offset;
        this.animationType.needsUpdate0=true
        this.animationStartTime.needsUpdate0=true
    }
    setSpeed(avatarIndex, speed) { // 设置动画速度
        this.speed.array[avatarIndex] = speed;
        this.speed.needsUpdate0=true
    }
    setObesity(avatarIndex, obesity) { // 设置动画速度
        this.obesity.array[avatarIndex] = obesity;
        this.obesity.needsUpdate0=true
    }
    setMoveMaxLength(avatarIndex, moveMaxLength) { // 设置动画速度
        this.moveMaxLength.array[avatarIndex] = moveMaxLength;
        this.moveMaxLength.needsUpdate0=true
    }

    useLod(lod0){
        for(var i=0;i<this.children.length;i++)
            this.children[i].useLod(lod0)
    }
    setColor(avatarIndex, color,meshName) { // 设置动画速度
        
        // for(var i=0;i<this.children.length;i++)
        //     this.children[i].setColor(avatarIndex, color,meshName)
        let buffer=this.instanceColorIn_All[meshName]
        // console.log(buffer)
        // console.log(buffer,avatarIndex, color,meshName)
        if(buffer)
        for(let j=0;j<3;j++)
            buffer.array[avatarIndex*3+j]=color[j]
    }
    update() {

        // let startTime = Date.now();
        for(var i=0;i<this.children.length;i++)
            this.children[i].update()
        // let endTime = Date.now();
        // console.log("update时间",endTime - startTime)
        // this.children[0].update()

        for(let i=this.CrowdPoints.children.length-1;i>=0;i--){
            this.CrowdPoints.remove(this.CrowdPoints.children[i])
        }
        // console.log("this.CrowdPoints.children.length",this.CrowdPoints.children.length)
        for(var i=0;i<1;i++){//for(var i=1;i<2;i++){//for(var i=0;i<this.children.length;i++){
            const child=this.children[i]
            this.CrowdPoints.add(child.getCrowdPoints())
        }
        // console.log("this.CrowdPoints.children.length",this.CrowdPoints.children.length)
    }

}
