import { Button, TextField } from '@mui/material'
import React, {useRef, useState} from 'react'
import * as posedetection from '@tensorflow-models/pose-detection';

export default function PictureList(props) {

    const [sudutSikuKiri, setSudutSikuKiri] = useState(0)
    const [sudutSikuKanan, setSudutSikuKanan] = useState(0)
    const imgRef = useRef()
    const canvasScreenShootRef = useRef()

    // console.log('video width', props.video.videoWidth)
    // console.log('video height', props.video.videoHeight)

    const poseDetect = (pose)=>{
        
        canvasScreenShootRef.current.width = props.video.videoWidth
        canvasScreenShootRef.current.height = props.video.videoHeight

        imgRef.current.width = props.video.videoWidth
        imgRef.current.height = props.video.videoWidth

        const ctx = canvasScreenShootRef.current.getContext("2d")
        console.log('pose data', pose)
        // drawKeypoints(pose?.keypoints, ctx);
        // drawSkeleton(pose?.keypoints, pose?.id, ctx);

        ctx.arc(10, 10, 1, 0, 2 * Math.PI);
        ctx.strokeStyle = "red"
        ctx.stroke();

        ctx.arc(15, 15, 1, 0, 2 * Math.PI);
        ctx.strokeStyle = "red"
        ctx.stroke();
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
          circle.arc(keypoint.x, keypoint.y, 1, 0, 2 * Math.PI);
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
        console.log('poseId', poseId)
        const color = poseId != null ?
            COLOR_PALETTE[poseId % 20] : 'white';
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
    
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

    const runCalculateAngle = async()=>{
        console.log('sudutSiku', props.data.pose[0])
        console.log('sudutSiku11', props.data.pose[0].keypoints[11].score)
        console.log('sudutSiku13', props.data.pose[0].keypoints[13].score)
        console.log('sudutSiku15', props.data.pose[0].keypoints[15].score)
        if(props.data.pose[0].keypoints[11].score >0.6 && props.data.pose[0].keypoints[13].score >0.6 && props.data.pose[0].keypoints[15].score >0.6)
        {
            console.log('sudutSikuKiriInit')
            let sudutSikuKiri = await calculateAgle(props.data.pose[0].keypoints[11],props.data.pose[0].keypoints[13],props.data.pose[0].keypoints[15])
            console.log('sudutSikuKiriResult', sudutSikuKiri)
            setSudutSikuKiri(sudutSikuKiri)
        }

        if(props.data.pose[0].keypoints[12].score >0.6 && props.data.pose[0].keypoints[14].score >0.6 && props.data.pose[0].keypoints[16].score >0.6)
        {
            let sudutSikuKanan = await calculateAgle(props.data.pose[0].keypoints[12],props.data.pose[0].keypoints[14],props.data.pose[0].keypoints[16])
            console.log('sudutSikuKanan', sudutSikuKanan)
            setSudutSikuKanan(sudutSikuKanan)
        }
    }

    const calculateAgle = (keypoint1, keypoint2, keypoint3)=>{
        console.log('sudutKeypoint1', keypoint1)
        console.log('sudutKeypoint2', keypoint2)
        console.log('sudutKeypoint3', keypoint3)
        let x1 = keypoint1.x;let x2 = keypoint2?.x;let x3 = keypoint3?.x
        let y1 = keypoint1?.y;let y2 = keypoint2?.y;let y3 = keypoint3?.y
        
        let x12 = Math.pow((x1-x2),2);let y12 = Math.pow((y1-y2),2)
        let x32 = Math.pow((x3-x2),2); let y32 = Math.pow((y3-y2),2)
        
        let p1 = Math.sqrt(x12 + y12);
        let sudut1 = Math.asin((y1-y2)/p1)*180/Math.PI
    
        let p2 = Math.sqrt(x32 + y32)
        let sudut2 = Math.asin((y2-y3)/p2)*180/Math.PI
    
        let sudut = sudut1+sudut2
        return sudut
    }

    
    return (
        <div style={{display:"inline-block", margin:2}}>
            <p>Take : {props.index+1}</p>
            <TextField value={props.label} onChange={props.change} placeholder="Masukan Nama Label" />
            <div style={{position:'relative',width:200, height:190}}>
                <img src={props.data.img} ref={imgRef} style={{position:'absolute', width:200, height:190, zIndex:10}} />
                <canvas ref={canvasScreenShootRef} style={{position:'absolute', width:200, height:190, zIndex:10}} />
            </div>
            <p>Score Pose Detection : {props.data.pose && props.data.pose.length>0 ? Math.floor((props.data.pose[0].score)*100): "-"}</p>
            <p>Siku Kiri : {Math.round(sudutSikuKiri)}</p>
            <p>Siku Kanan : {Math.round(sudutSikuKanan)}</p>
            <Button variant="contained" color="primary" tooltip={JSON.stringify(props.data.pose)} onClick={()=>{
                poseDetect(props.data.pose)
                runCalculateAngle()
            }} >Pose Detect</Button>
        </div>
    )
}
