import { Button, Table, TableCell, TableRow, TextField } from '@mui/material'
import React, {useRef, useState, useContext} from 'react'
import * as posedetection from '@tensorflow-models/pose-detection';
import * as scatter from 'scatter-gl';
import * as mpPose from '@mediapipe/pose';
import { PoseContext } from "./Context/index"

export default function PictureList(props) {

  const { dataPoses, addPose, deletePose } = useContext(PoseContext)
  const [dataPosePicture3D, setDataPosePicture3D] = useState([])
  const [dataPosePicture, setDataPosePicture] = useState([])

    const [sudutSikuKiri, setSudutSikuKiri] = useState(0)
    const [sudutSikuKanan, setSudutSikuKanan] = useState(0)
    const [sudutKakiKiri, setSudutKakiKiri] = useState(0)
    const [sudutKakiKanan, setSudutKakiKanan] = useState(0)
    const [orientasiPose, setOrientasiPose] = useState(0)
    const imgRef = useRef()
    const canvasScreenShootRef = useRef()
    const scatter_gl = useRef()

    const ANCHOR_POINTS = [[0, 0, 0], [0, 1, 0], [-1, 0, 0], [-1, -1, 0]];

    // console.log('video width', props.video.videoWidth)
    // console.log('video height', props.video.videoHeight)

    function makeid(length) {
      var result           = '';
      var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      var charactersLength = characters.length;
      for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
     }
     return result;
  }

    const detectPose = async ()=>{
        alert('Detect Pose')
        const model = posedetection.SupportedModels.BlazePose;
        const detectorConfig = {
        runtime: 'tfjs',
        //runtime:'mediapipe',
        enableSmoothing: true,
        //solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${mpPose.VERSION}`,
        modelType: 'full'
        };
        const detector = await posedetection.createDetector(model, detectorConfig)
        console.log('poses detector', detector)
        console.log('poses imgRef', imgRef)
        console.log('poses canvasScreenShootRef', canvasScreenShootRef)

        const poses = await detector.estimatePoses(imgRef.current,{maxPoses: 1, flipHorizontal: false});
        console.log('poses', poses)
        let dataTake = {id: props.data.id, index: props.index, img: props.data.img, pose : poses[0]}

        runCalculateAngle(poses[0])

        
        const videoWidth = imgRef.current.width
        const videoHeight = imgRef.current.height

        imgRef.current.width = videoWidth
        imgRef.current.height= videoHeight

        canvasScreenShootRef.current.width = videoWidth
        canvasScreenShootRef.current.height = videoHeight

        for (const pose of poses) {
            if (pose.keypoints != null) {
              console.log('pose keypoint', pose.keypoints)
                const ctx = canvasScreenShootRef.current.getContext("2d")
                drawKeypoints(pose.keypoints, ctx);
                drawSkeleton(pose.keypoints, pose.id, ctx);
                setDataPosePicture(pose.keypoints)
            }
            if (pose.keypoints3D != null) {
                detect_scatter(pose.keypoints3D)
                setDataPosePicture3D(pose.keypoints3D)
            }
            
        }

       addPose(dataTake)

       
    }

    const [scatterGLHasInitialized, setScatterGLHasInitialized] = useState(false)
    const [scatterGLState, setScatterGLState] = useState(null)

    const detect_scatter = async(keypoints)=>{
        const videoWidth = imgRef.current.width
        const videoHeight = imgRef.current.height
        console.log('setScatterGLHasInitialized', scatterGLHasInitialized)
        let _scatterGL = null
        if(!scatterGLHasInitialized)
        {
            _scatterGL = new scatter.ScatterGL(scatter_gl.current, {
                'rotateOnStart': true,
                'selectEnabled': true,
                'styles': {polyline: {defaultOpacity: 1, deselectedOpacity: 1}}
              })
            setScatterGLState(_scatterGL)
            scatter_gl.current.style = `width: ${videoWidth}px; height: ${videoHeight}px;`;
            _scatterGL.resize();
            scatter_gl.current.style.display = 'inline-block'
        }
        else{
            _scatterGL = scatterGLState
        }
        
        drawKeypoints3D(keypoints, _scatterGL)
        //drawSkatter(scatterGL)

    }

    function drawKeypoints3D(keypoints, scatterGL) {
        const scoreThreshold = 0.6;
        const pointsData = keypoints.map(keypoint => ([keypoint.x*1000, -keypoint.y*1000, -keypoint.z*1000]));
        console.log('pointData', pointsData)
        console.log('keypoints', keypoints.map(keypoint=>({x:keypoint.x*1000,y:keypoint.y*1000,z:keypoint.z*1000})))
        const dataset = new scatter.ScatterGL.Dataset(pointsData);
    
        const keypointInd = posedetection.util.getKeypointIndexBySide(posedetection.SupportedModels.BlazePose);
        scatterGL.setPointColorer((i) => {
          if (keypoints[i] == null || keypoints[i].score < scoreThreshold) {
            // hide anchor points and low-confident points.
            return '#ffffff';
          }
          if (i === 0) {
            return '#ff0000' /* Red */;
          }
          if (keypointInd.left.indexOf(i) > -1) {
            return '#00ff00' /* Green */;
          }
          if (keypointInd.right.indexOf(i) > -1) {
            return '#ffa500' /* Orange */;
          }
        });
        if (scatterGLHasInitialized) {
            console.log('update scatter')
            scatterGL.updateDataset(dataset);
        } else {
            console.log('new scatter')
            scatterGL.render(dataset);
        }
        const connections = posedetection.util.getAdjacentPairs(posedetection.SupportedModels.BlazePose);
        console.log('connections', connections)
        const sequences = connections.map(pair => ({indices: pair}));
        console.log('sequences', sequences)
        scatterGL.setSequences(sequences);
        setScatterGLHasInitialized(true)
      }

    function drawKeypoints(keypoints, ctx) {
        // const ctx = canvasRef.current.getContext("2d")
        const keypointInd = posedetection.util.getKeypointIndexBySide(posedetection.SupportedModels.BlazePose);
        
        // console.log('keypointInd', keypointInd)
        for (const i of keypointInd.middle) {
          ctx.fillStyle = 'red';
          ctx.strokeStyle = 'red';
          ctx.lineWidth = 2;
          drawKeypoint(keypoints[i], ctx);
        }
    
        for (const i of keypointInd.left) {
          ctx.fillStyle = 'green';
          ctx.strokeStyle = 'green';
          ctx.lineWidth = 2;
          drawKeypoint(keypoints[i], ctx);
        }
    
        for (const i of keypointInd.right) {
          ctx.fillStyle = 'orange';
          ctx.strokeStyle = 'orange';
          ctx.lineWidth = 2;
          drawKeypoint(keypoints[i], ctx);
        }
    }

    function drawKeypoint(keypoint, ctx) {
        // If score is null, just show the keypoint.
        const score = keypoint.score != null ? keypoint.score : 1;
        const scoreThreshold = 0.6;
        // const ctx = canvasRef.current.getContext("2d")
        if (score >= scoreThreshold) {
          const circle = new Path2D();
          circle.arc(keypoint.x, keypoint.y, 2, 0, 2 * Math.PI);
          ctx.fill(circle);
          ctx.stroke(circle);
        }
    }

    const COLOR_PALETTE = [
        '#ffffff', '#800000', '#469990', '#e6194b', '#42d4f4', '#fabed4', '#aaffc3',
        '#9a6324', '#000075', '#f58231', '#4363d8', '#ffd8b1', '#dcbeff', '#808000',
        '#ffe119', '#911eb4', '#bfef45', '#f032e6', '#3cb44b', '#a9a9a9'
      ];

    function drawSkeleton(keypoints, poseId, ctx) {
        // Each poseId is mapped to a color in the color palette.
        // const ctx = canvasRef.current.getContext("2d")
        const color = poseId != null ?
            COLOR_PALETTE[poseId % 20] : 'white';
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 5;
    
        posedetection.util.getAdjacentPairs(posedetection.SupportedModels.BlazePose).forEach(([i, j]) => {
          const kp1 = keypoints[i];
          const kp2 = keypoints[j];
    
          // If score is null, just show the keypoint.
          const score1 = kp1.score != null ? kp1.score : 1;
          const score2 = kp2.score != null ? kp2.score : 1;
          const scoreThreshold = 0.1;
    
          if (score1 >= scoreThreshold && score2 >= scoreThreshold) {
            ctx.beginPath();
            ctx.moveTo(kp1.x, kp1.y);
            ctx.lineTo(kp2.x, kp2.y);
            ctx.stroke();
          }
        });
    }

    const runCalculateAngle = async(pose)=>{
        if(pose.keypoints[11].score >0.6 && pose.keypoints[13].score >0.6 && pose.keypoints[15].score >0.6)
         {
            console.log('sudutSikuKiriInit')
            let sudutSikuKiri = await calculateAgle(pose.keypoints[11],pose.keypoints[13],pose.keypoints[15])
            console.log('sudutSikuKiriResult', sudutSikuKiri)
            setSudutSikuKiri(sudutSikuKiri.sudut)
        }

         if(pose.keypoints[12].score >0.6 && pose.keypoints[14].score >0.6 && pose.keypoints[16].score >0.6)
         {
            let sudutSikuKanan = await calculateAgle(pose.keypoints[12],pose.keypoints[14],pose.keypoints[16])
            console.log('sudutSikuKanan', sudutSikuKanan)
            setSudutSikuKanan(sudutSikuKanan.sudut)
         }


         if(pose.keypoints[24].score >0.6 && pose.keypoints[26].score >0.6 && pose.keypoints[28].score >0.6)
         {
            console.log('sudutKakiKiriInit')
            let sudutKakiKiri = await calculateAgle(pose.keypoints[24],pose.keypoints[26],pose.keypoints[28])
            console.log('sudutKakiKiriResult', sudutKakiKiri)
            setSudutKakiKiri(sudutKakiKiri.sudut)
        }

        if(pose.keypoints[23].score >0.6 && pose.keypoints[25].score >0.6 && pose.keypoints[27].score >0.6)
        {
            let sudutKakiKanan = await calculateAgle(pose.keypoints[23],pose.keypoints[25],pose.keypoints[27])
            console.log('sudutKakiKanan', sudutKakiKanan)
            setSudutKakiKanan(sudutKakiKanan.sudut)
        }

        
        console.log('orientation cek', dataPoses)
        if(props.index>0){
            let pose1 = {
                keypoint1 : pose.keypoints3D[23],
                keypoint2 : pose.keypoints3D[24]
            }
            let pose2 = {
                keypoint1 : dataPoses[props.index-1]?.pose?.keypoints3D[23],
                keypoint2 : dataPoses[props.index-1]?.pose?.keypoints3D[24]
            }
            let orientation  = calculateOrientation(pose1,pose2)
            console.log('orientation', orientation)
            setOrientasiPose(orientation)
        }
            
        
        
    }

    const calculateAgle = (keypoint1, keypoint2, keypoint3)=>{
        console.log('sudutKeypoint1', keypoint1)
        console.log('sudutKeypoint2', keypoint2)
        console.log('sudutKeypoint3', keypoint3)
        let x1 = Math.round(keypoint1.x);let x2 = Math.round(keypoint2?.x);let x3 = Math.round(keypoint3?.x)
        let y1 = Math.round(keypoint1?.y);let y2 = Math.round(keypoint2?.y);let y3 = Math.round(keypoint3?.y)
        
        let x12 = Math.pow((x1-x2),2);let y12 = Math.pow((y1-y2),2)
        let x32 = Math.pow((x3-x2),2); let y32 = Math.pow((y3-y2),2)
        
        let p1 = Math.sqrt(x12 + y12);
        let sudut1 = 0;
        if(y1<y2){
            sudut1 = Math.asin((y2-y1)/p1)*180/Math.PI
        }
        else{
            sudut1 = Math.asin((y1-y2)/p1)*180/Math.PI
        }
        
        if((x1<x2)){
            sudut1 = Math.asin((x2-x1)/p1)*180/Math.PI + 90
        }
    
        let p2 = Math.sqrt(x32 + y32)
        let sudut2 = 0;
        if(y3<y2){
            sudut2 = Math.asin((y2-y3)/p2)*180/Math.PI
        }
        else{
            sudut2 = Math.asin((y3-y2)/p2)*180/Math.PI
        }

        if(x3<x2){
            sudut2 = Math.asin((x2-x3)/p2)*180/Math.PI + 90
        }
        
        let sudut = sudut1+sudut2
        if(sudut>180){
            sudut = (sudut - 180)*-1
        }
        return {sudut, sudut1, sudut2, p1,p2, x1,x2,x3, y1,y2,y3}
    }

    const calculateOrientation = (pose1, pose2)=>{
        let p_pose1 = Math.sqrt(Math.pow(((pose1.keypoint1.x*1000) - (pose1.keypoint2.x*1000)),2) + Math.pow(((-1*pose1.keypoint1.z*1000) - (-1*((pose1.keypoint2.z*1000)))),2)) //sqrt((x1-x2)^2+(z1-z2)^2) 
        let p_center1 = p_pose1 / 2 // Pose 1 poin center
        let z1 = ((-1*pose1.keypoint1.z*1000) - (-1*((pose1.keypoint2.z*1000))))/2

        let p_pose2 = Math.sqrt(Math.pow(((pose2.keypoint1.x*1000) - (pose2.keypoint2.x*1000)),2) + Math.pow(((-1*pose2.keypoint1.z*1000) - (-1*((pose2.keypoint2.z*1000)))),2)) //sqrt((x1-x2)^2+(z1-z2)^2) 
        let p_center2 = p_pose2 / 2 // Pose 1 poin center
        let z2 = ((-1*pose2.keypoint1.z*1000) - (-1*pose2.keypoint2.z*1000))/2

        let sudut1 = Math.asin((z1)/p_center1)*180/Math.PI
        let sudut2 = Math.asin((z2)/p_center2)*180/Math.PI
    
        let sudut = sudut1+sudut2
        return sudut
    }
    
    return (
        <div style={{display:"inline-block", margin:2}}>
            <p>Take : {props.index+1}</p>
            <TextField value={props.label} onChange={props.change} placeholder="Masukan Nama Label" />
            <div style={{position:'relative',width:360, height:250}}>
                {
                    props.displayImage ? 
                    <>
                        <img src={props.data.img} ref={imgRef} style={{position:'absolute', width:360, height:250, zIndex:9}} />
                        <canvas ref={canvasScreenShootRef} style={{position:'absolute', width:360, height:250, zIndex:11}} />
                    </>:
                    <>
                        <img src={props.data.img} ref={imgRef} style={{position:'absolute', display:'none', width:360, height:250, zIndex:9}} />
                        <canvas ref={canvasScreenShootRef} style={{position:'absolute', width:360, backgroundColor:'black', height:250, zIndex:11}} />
                    </>
                }
                
            </div>
            <p>Score Pose Detection : {props.data.pose && props.data.pose.length>0 ? Math.floor((props.data.pose[0].score)*100): "-"}</p>
            <p>Siku ... Kiri : {Math.round(sudutSikuKiri)} &nbsp; - Kanan : {Math.round(sudutSikuKanan)}</p>
            <p>Kaki ... Kiri : {Math.round(sudutKakiKiri)} &nbsp; - Kanan : {Math.round(sudutKakiKanan)}</p>
            <p>Rotasi Badan : {Math.round(orientasiPose)}</p>
            <Button variant="contained" color="primary" tooltip={JSON.stringify(props.data.pose)} onClick={()=>{
                detectPose()
            }} >Pose Detect</Button>
            <Button variant="contained" color="secondary" onClick={props.deletedata} >Hapus</Button>
            <br/>
            <div style={{border:"1px solid #000"}}>
                <div ref={scatter_gl}></div>
            </div>
            <div>
                <Table style={{marginBottom:5}}>
                    <TableRow style={{backgroundColor:"#CFCFCF"}}>
                        <TableCell>Name</TableCell>
                        <TableCell>x</TableCell>
                        <TableCell>y</TableCell>
                    </TableRow>
                    <TableRow></TableRow>
                    {
                        dataPosePicture.map((item,index)=>{
                            let display = false
                            if(index === 11 || index === 13 || index === 15){
                                display = true
                            }
                            return(
                                <>
                                    {display ? 
                                    <TableRow>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell>{(item.x ).toFixed(0)}</TableCell>
                                        <TableCell>{(item.y*-1).toFixed(0)}</TableCell>
                                    </TableRow>: null
                                }
                                </>
                                
                            )
                        })
                    }
                </Table>
                <Table style={{marginBottom:5}}>
                    <TableRow style={{backgroundColor:"#CFCFCF"}}>
                        <TableCell>Name</TableCell>
                        <TableCell>x</TableCell>
                        <TableCell>y</TableCell>
                    </TableRow>
                    <TableRow></TableRow>
                    {
                        dataPosePicture.map((item,index)=>{
                            let display = false
                            if(index === 12 || index === 14 || index === 16){
                                display = true
                            }
                            return(
                                <>
                                    {display ? 
                                    <TableRow>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell>{(item.x ).toFixed(0)}</TableCell>
                                        <TableCell>{(item.y*-1).toFixed(0)}</TableCell>
                                    </TableRow>: null
                                }
                                </>
                                
                            )
                        })
                    }
                </Table>
                <Table>
                    <TableRow style={{backgroundColor:"#CFCFCF"}}>
                        <TableCell>Name</TableCell>
                        <TableCell>x</TableCell>
                        <TableCell>z</TableCell>
                    </TableRow>
                    {
                        dataPosePicture3D.map((item,index)=>{
                            let display = false
                            if(index === 11 || index === 12 || index === 23 || index === 24){
                                display = true
                            }
                            return(
                                <>
                                    {display ? 
                                    <TableRow>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell>{(item.x * 1000).toFixed(0)}</TableCell>
                                        <TableCell>{(item.z * 1000 * -1).toFixed(0)}</TableCell>
                                    </TableRow>: null
                                }
                                </>
                                
                            )
                        })
                    }
                </Table>
            </div>
        </div>
    )
}
