import logo from './logo.svg';
import './App.css';
// import * as tf from '@tensorflow/tfjs'
import * as facemesh from '@tensorflow-models/facemesh'
import * as posedetection from '@tensorflow-models/pose-detection';
import Webcam from 'react-webcam';
import { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs-core';
// Register WebGL backend.
import '@tensorflow/tfjs-backend-webgl';
import { Container, Grid, Table, TableBody, TableHead, TableRow, TableCell, Typography, Button } from '@mui/material';
import PictureList from './PictureList';
import videokata from './video/kata1.mp4'
import {downloadFile} from './utils/downloadFile'
import { CSVLink } from "react-csv"

function App() {

  const webcamRef = useRef(null)
  const canvasRef = useRef(null)
  const canvasSnapRef = useRef(null)
  const imgRef = useRef([])
  
  const [dataPose, setDataPose] = useState([])
  const [angleSikuKiri, setAngleSikuKiri] = useState(0)
  const [angleSikuKanan, setAngleSikuKanan] = useState(0)
  const [angleSikuKiriScreenShoot, setAngleSikuKiriScreenShoot] = useState(0)
  const [angleSikuKananScreenShoot, setAngleSikuKananScreenShoot] = useState(0)


  const runPose = async()=>{
    const model = posedetection.SupportedModels.BlazePose;
    const detectorConfig = {
      runtime: 'tfjs',
      enableSmoothing: true,
      modelType: 'full'
    };
    const detector = await posedetection.createDetector(model, detectorConfig)
    setInterval(async()=>{
      let dataPose = await detectPose(detector)
      setDataPose(dataPose)
      if(dataPose !== null && dataPose !== undefined){
        console.log('dataPose', dataPose)
        if(dataPose.length>0){
          let sudutSikuKiri = 0; 
          let sudutSikuKanan = 0; 
          if(dataPose[0].keypoints[11].score >0.9 && dataPose[0].keypoints[13].score >0.9 && dataPose[0].keypoints[15].score >0.9)
          {
            sudutSikuKiri = calculateAgle(dataPose[0].keypoints[11],dataPose[0].keypoints[13],dataPose[0].keypoints[15])
            setAngleSikuKiri(sudutSikuKiri)
          }

          if(dataPose[0].keypoints[12].score >0.9 && dataPose[0].keypoints[14].score >0.9 && dataPose[0].keypoints[16].score >0.9)
          {
            sudutSikuKanan = calculateAgle(dataPose[0].keypoints[12],dataPose[0].keypoints[14],dataPose[0].keypoints[16])
            setAngleSikuKanan(sudutSikuKanan)
          }
        }
      }
      
    },10)
  }

  // useEffect(()=>{
  //   runPose()
  // },[])

  const detectPose = async (detector)=>{
    if(typeof webcamRef.current !== "undefined" &&
    webcamRef.current !== null &&
    webcamRef.current.readyState === 4){
      const video = webcamRef.current
      const videoWidth = webcamRef.current.videoWidth
      const videoHeight = webcamRef.current.videoHeight

      webcamRef.current.width = videoWidth
      webcamRef.current.height= videoHeight

      canvasRef.current.width = videoWidth
      canvasRef.current.height = videoHeight

      const poses = await detector.estimatePoses(video,{maxPoses: 1, flipHorizontal: false});
      drawResults(poses)
      return poses
    }
  }

  function drawResults(poses) {
    for (const pose of poses) {
      drawResult(pose);
    }
  }

  function drawResult(pose) {
    // console.log('draw Result', pose)
    if (pose.keypoints != null) {

      const ctx = canvasRef.current.getContext("2d")
       drawKeypoints(pose.keypoints, ctx);
       drawSkeleton(pose.keypoints, pose.id, ctx);
    }
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
    const scoreThreshold = 0.4;
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

  const calculateAgle = (keypoint1, keypoint2, keypoint3)=>{
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

  const [takeList,setTakeList]=useState([]);
  const [imageScreenShoot,setImageScreenShoot]=useState("");
  const canvasScreenShootRef = useRef([])
  const [dataPoseScreenShoot, setDataPoseScreenShoot] = useState([])

  function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

  const changeData = (e, id)=>{
    const changeData = takeList.map(item=>{
      if(id === item.id){
        return {...item, label: e.target.value}
      }
      else{
        return item
      }
    })
    const changeDataExport = excelExport.map(item=>{
      if(id === item.id){
        return {...item, label: e.target.value}
      }
      else{
        return item
      }
    })
    setTakeList(changeData)
    setExcelExport(changeDataExport)
  }

  const [playStatus, setPlayStatus] = useState(null)

  const deletedata = (id)=>{
    const changeData = takeList.filter(x=>x.id !== id)
    const changeDataExport = excelExport.filter(x=>x.id !== id)
    setTakeList(changeData)
    setExcelExport(changeDataExport)
  }

  const [excelExport, setExcelExport] = useState([])


  return (
    <div>
      <Container maxWidth="xl">
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={12} md={12}>
            <center>
              <Typography>Video</Typography>
              <div style={{position:"relative", border:"1px solid #000", width:1024, height:580, textAlign:'center'}}>
                <video ref={webcamRef} 
                  // src="https://drive.google.com/file/d/1EOq5XhGlA3UCc4aPjIslZW7WmfzJOULi/preview?pli=1" 
                  src={videokata}
                  screenshotFormat="image/jpeg"
                  style={{
                    // border:"1px solid #000",
                    position:'absolute',
                    width:1024, height:580,
                    top:0, left:0,
                    // marginLeft:'auto',
                    // marginRight:'auto',
                    zIndex:9,
                    textAlign:'center'
                  }}
                />
                {/* <Webcam ref={webcamRef} screenshotFormat="image/jpeg" style={{
                  position:'absolute',
                  width:540,
                  // width:'90%',
                  height:480,
                  // marginLeft:'auto',
                  // marginRight:'auto',
                  zIndex:9,
                  textAlign:'center'
                }}
                /> */}
                <canvas ref={canvasRef} style={{
                  position:'absolute',
                  width:1024, height:580,
                  top:0, left:0,
                  // marginLeft:'auto',
                  // marginRight:'auto',
                  zIndex:9,
                  textAlign:'center'
                }}
                />
                <canvas ref={canvasSnapRef} style={{
                  position:'absolute',
                  border:"1px solid #000",
                  width:1024, height:580,
                  top:0, left:0,
                  // marginLeft:'auto',
                  // marginRight:'auto',
                  zIndex:8,
                  textAlign:'center'
                }}
                />
              </div>
              <p>Score Pose Detection : {dataPose && dataPose.length>0 ? JSON.stringify(dataPose[0].score): "-"}</p>
              <p>Siku Kiri : {Math.round(angleSikuKiri)} &nbsp;&nbsp; Siku Kanan : {Math.round(angleSikuKanan)}</p>
              {
                !playStatus ? 
                <Button variant="contained" color="primary" onClick={()=>{
                  const video = webcamRef.current;
                  video.playbackRate = 0.5
                  runPose()
                  video.play()
                  setPlayStatus(true)
                }}>Play</Button>
                :
                <Button variant="contained" color="primary" onClick={()=>{
                  const video = webcamRef.current;
                  // runPose()
                  video.pause()
                  setPlayStatus(false)
                }}>Pause</Button>
              }

              <Button variant="contained" color="primary" style={{marginLeft:5, marginRight:5}} onClick={()=>{
                // const imageSrc = webcamRef.current.getScreenshot();
                // console.log('imagesrc', imageSrc)

                const video = webcamRef.current
                const videoWidth = video.videoWidth
                const videoHeight = video.videoHeight

                video.width = videoWidth
                video.height= videoHeight

                canvasSnapRef.current.width = videoWidth
                canvasSnapRef.current.height = videoHeight
                var ctxSnap = canvasSnapRef.current.getContext("2d");
                ctxSnap.drawImage(video, 0, 0, canvasSnapRef.current.width, canvasSnapRef.current.height);

                //convert to desired file format
                var dataURI = canvasSnapRef.current.toDataURL('image/jpeg'); // can also use 'image/png'
                console.log('dataURI', dataURI)

                setImageScreenShoot(dataURI)
                
                let _dataPose = dataPose
                setDataPoseScreenShoot(dataPose)

                let sudutSikuKiri = 0;                
                let sudutSikuKanan = 0;
                if(_dataPose[0].keypoints[11].score >0.9 && _dataPose[0].keypoints[13].score >0.9 && _dataPose[0].keypoints[15].score >0.9)
                {
                  sudutSikuKiri = calculateAgle(_dataPose[0].keypoints[11],_dataPose[0].keypoints[13],_dataPose[0].keypoints[15])
                  setAngleSikuKiriScreenShoot(sudutSikuKiri)
                }

                if(_dataPose[0].keypoints[12].score >0.9 && _dataPose[0].keypoints[14].score >0.9 && _dataPose[0].keypoints[16].score >0.9)
                {
                  sudutSikuKanan = calculateAgle(_dataPose[0].keypoints[12],_dataPose[0].keypoints[14],_dataPose[0].keypoints[16])
                  setAngleSikuKananScreenShoot(sudutSikuKanan)
                }

                let dataTake = {id: makeid(10), img: dataURI, sudutSikuKiri, sudutSikuKanan, pose : _dataPose}
                let dataConcat = [...takeList, dataTake]

                let poseField = {}
                _dataPose[0].keypoints.forEach(itemkey=>{
                  poseField[itemkey.name+"_x"] = itemkey.x.toFixed(0)
                  poseField[itemkey.name+"_y"] = itemkey.y.toFixed(0)
                  poseField[itemkey.name+"_z"] = itemkey.z.toFixed(0)
                  poseField[itemkey.name+"_score"] = (itemkey.score*100).toFixed(2)  
                })
                let dataItem = Object.assign({}, {id:dataTake.id,label:""},poseField)
                setExcelExport([...excelExport, dataItem])

                setTakeList(dataConcat)
                
                
              }}>Take Screenshot</Button>


              <Button variant="contained" color="secondary" style={{marginRight:5}} onClick={()=>{
                downloadFile({
                  data: JSON.stringify(takeList),
                  fileName: 'dataset.json',
                  fileType: 'text/json',
                })
              }}>
                Export to JSON
              </Button>
              <CSVLink data={excelExport} filename={`karatepose.csv`} separator=";">
                <Button variant="contained" color="success"style={{marginRight:5}}>
                    Export to csv
                </Button>
              </CSVLink>
              <Button variant="contained" color="secondary" onClick={()=>{setImageScreenShoot("");setTakeList([]); setExcelExport([])}}>Reset</Button>
                  
            </center>
            
          </Grid>
        </Grid>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={12} md={12}>
          {/* <img src={imageScreenShoot} style={{position:'absolute', width:200, height:190, zIndex:10}} /> */}
            {
              takeList.map((itemTake,index)=>{
                return <PictureList deletedata={()=>deletedata(itemTake.id)} change={e=>changeData(e, itemTake.id)} label={itemTake.label} video={webcamRef.current} data={itemTake} index={index}/>
                  // <div style={{display:"inline-block", margin:2}}>
                  //   <p>Take : {index+1}</p>
                  //   <div style={{position:'relative',width:200, height:190}}>
                  //     <img src={itemTake.img} ref={imgRef[index]} style={{position:'absolute', width:200, height:190, zIndex:10}} />
                  //     <canvas ref={canvasScreenShootRef[index]} style={{position:'absolute', width:200, height:190, zIndex:10}} />
                  //   </div>
                  //   <p>Score Pose Detection : {itemTake.pose && itemTake.pose.length>0 ? JSON.stringify(itemTake.pose[0].score): "-"}</p>
                  //   <p>Siku Kiri : {Math.round(itemTake.sudutSikuKiri)}</p>
                  //   <p>Siku Kanan : {Math.round(itemTake.sudutSikuKanan)}</p>
                  // </div>
                
              })
            }
            
            {false && <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>No</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>x</TableCell>
                  <TableCell>y</TableCell>
                  <TableCell>z</TableCell>
                  <TableCell>Score</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {
                 dataPoseScreenShoot && dataPoseScreenShoot.length>0 && dataPoseScreenShoot[0]?.keypoints.map((itemPose,index)=>{
                    return(
                      <TableRow>
                        <TableCell>{index+1}</TableCell>
                        <TableCell>{itemPose.name}</TableCell>
                        <TableCell>{Math.round(itemPose.x)}</TableCell>
                        <TableCell>{Math.round(itemPose.y)}</TableCell>
                        <TableCell>{Math.round(itemPose.z)}</TableCell>
                        <TableCell>{itemPose.score*100}</TableCell>
                      </TableRow>
                    )
                  })
                }
              </TableBody>
            </Table>}
          </Grid>

        </Grid>
      </Container>
    </div>
  );
}

export default App;
